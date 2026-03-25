#!/bin/bash
# 🧬 AI Genomics Lab - Bioinformatics Pipeline (ADVANCED OPTIMIZED)
# Pipeline: FASTQ.gz → Alignment → CRAM → Variant Calling → VCF
#
# Optimizations (Advanced):
# - BGZF compressed reference (better than gzip)
# - Compressed FASTQ files (.fastq.gz)
# - strobealign (5-8x faster than BWA-MEM)
# - Direct BAM output (no samtools view)
# - CRAM output (30-60% less disk space)
# - BCF binary intermediate files
# - Streaming pipeline (no SAM to disk)
# - Parallel sample processing
# - Fast test mode
# - RAM preloading with vmtouch
#
# Author: Xavier Araque
# Email: xavieraraque@gmail.com
# GitHub: https://github.com/rendergraf/AI-Genomics-Lab
# Version: 0.1
# License: MIT

set -e

# ============================================
# OBSERVABILITY: Enhanced logging with timestamps
# ============================================
timestamp() {
    date +"%Y-%m-%d %H:%M:%S"
}

# Log with timestamp and file size
log_step() {
    local step="$1"
    local message="$2"
    echo "[$(timestamp)] 📊 STEP_$step: $message"
}

# Log with file size
log_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local size=$(du -h "$file" | cut -f1)
        echo "[$(timestamp)] 📁 FILE_SIZE: $(basename $file)=$size"
    fi
}

# Log progress percentage
log_progress() {
    local current="$1"
    local total="$2"
    local percent=$((current * 100 / total))
    echo "[$(timestamp)] 📈 PROGRESS: $percent%"
}

# Log timing
log_time() {
    local start_time=$1
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    echo "[$(timestamp)] ⏱️ DURATION: ${minutes}m ${seconds}s"
}

# Configuration - Updated paths for datasets directory
REFERENCE_GENOME_GZ="${REFERENCE_GENOME_GZ:-/datasets/reference_genome/hg38.fa.gz}"
INPUT_DIR="${INPUT_DIR:-/datasets/fastq}"
OUTPUT_DIR="${OUTPUT_DIR:-/datasets/bam}"
VCF_OUTPUT_DIR="${VCF_OUTPUT_DIR:-/datasets/vcf}"
ANNOTATION_DIR="${ANNOTATION_DIR:-/datasets/annotations}"
LOGS_DIR="${LOGS_DIR:-/datasets/logs}"

# Performance settings
THREADS="${THREADS:-8}"
TEST_MODE="${TEST_MODE:-false}"
READ_LIMIT="${READ_LIMIT:-0}"  # 0 = no limit, otherwise limit reads for testing
PARALLEL="${PARALLEL:-false}"
USE_CRAM="${USE_CRAM:-true}"  # Use CRAM instead of BAM (30-60% less space)
PRELOAD_RAM="${PRELOAD_RAM:-false}"  # Preload reference in RAM

echo "=========================================="
echo "🧬 AI Genomics Lab - Bio Pipeline (ADVANCED OPTIMIZED)"
echo "=========================================="
echo "[$(timestamp)] STARTING pipeline execution"
echo "Reference: $REFERENCE_GENOME_GZ (BGZF COMPRESSED)"
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "VCF Output: $VCF_OUTPUT_DIR"
echo "Threads: $THREADS"
echo "Test Mode: $TEST_MODE"
if [ "$TEST_MODE" = "true" ] && [ "$READ_LIMIT" -gt 0 ]; then
    echo "⚡ Running in TEST_MODE: only $READ_LIMIT reads per sample"
fi
echo "Parallel: $PARALLEL"
echo "Use CRAM: $USE_CRAM"
echo "Preload RAM: $PRELOAD_RAM"
echo "=========================================="

# Record overall start time
PIPELINE_START_TIME=$(date +%s)
log_step "0" "Pipeline initialization complete - verifying indices"

# Create output directories
mkdir -p "$OUTPUT_DIR" "$VCF_OUTPUT_DIR" "$LOGS_DIR"

# ============================================
# STEP 0: VERIFY GENOME INDICES (Created by index_genome.sh)
# ============================================

# Check if compressed reference genome exists
if [ ! -f "${REFERENCE_GENOME_GZ}" ]; then
    echo "❌ ERROR: Reference genome not found at $REFERENCE_GENOME_GZ"
    echo "Please run index_genome.sh first to create the reference genome."
    exit 1
fi

# Verify all required indices exist (created by index_genome.sh)
INDEX_ERRORS=0

echo "[$(timestamp)] 🔍 Verifying genome indices..."

# Check .fa.gz (BGZF compressed reference)
if [ ! -f "${REFERENCE_GENOME_GZ}" ]; then
    echo "❌ ERROR: ${REFERENCE_GENOME_GZ} (BGZF reference) - NOT FOUND"
    INDEX_ERRORS=$((INDEX_ERRORS + 1))
else
    echo "✅ ${REFERENCE_GENOME_GZ} exists"
fi

# Check .fai (SAMtools index)
if [ ! -f "${REFERENCE_GENOME_GZ}.fai" ]; then
    echo "❌ ERROR: ${REFERENCE_GENOME_GZ}.fai (SAMtools index) - NOT FOUND"
    INDEX_ERRORS=$((INDEX_ERRORS + 1))
else
    echo "✅ ${REFERENCE_GENOME_GZ}.fai exists"
fi

# Check .gzi (BGZF index - required for CRAM)
if [ ! -f "${REFERENCE_GENOME_GZ}.gzi" ]; then
    echo "❌ ERROR: ${REFERENCE_GENOME_GZ}.gzi (BGZF index) - NOT FOUND"
    INDEX_ERRORS=$((INDEX_ERRORS + 1))
else
    echo "✅ ${REFERENCE_GENOME_GZ}.gzi exists"
fi

# Check .sti (strobealign index)
if [ ! -f "${REFERENCE_GENOME_GZ}.r150.sti" ]; then
    echo "❌ ERROR: ${REFERENCE_GENOME_GZ}.r150.sti (strobealign index) - NOT FOUND"
    INDEX_ERRORS=$((INDEX_ERRORS + 1))
else
    echo "✅ ${REFERENCE_GENOME_GZ}.sti exists"
fi

# If any index is missing, exit with error
if [ $INDEX_ERRORS -gt 0 ]; then
    echo ""
    echo "=========================================="
    echo "❌ ERROR: Missing $INDEX_ERRORS required index file(s)"
    echo "=========================================="
    echo "Please run index_genome.sh first to create all required indices:"
    echo ""
    echo "  1. ${REFERENCE_GENOME_GZ}       (BGZF compressed genome)"
    echo "  2. ${REFERENCE_GENOME_GZ}.fai   (SAMtools index)"
    echo "  3. ${REFERENCE_GENOME_GZ}.gzi   (BGZF index)"
    echo "  4. ${REFERENCE_GENOME_GZ}.sti  (strobealign index)"
    echo ""
    echo "Expected location: $(dirname $REFERENCE_GENOME_GZ)"
    exit 1
fi

echo "✅ All genome indices verified successfully!"
log_step "1" "Genome indices validation complete"
log_file "$REFERENCE_GENOME_GZ"

# ============================================
# STEP 1: PREPARE INPUT SAMPLES
# ============================================

# Set reference genome path (used throughout pipeline)
# REFERENCE_GENOME is used internally, REFERENCE_GENOME_GZ is the env var

# Check if input files exist (support both .fastq and .fastq.gz)
if [ ! "$(ls -A $INPUT_DIR 2>/dev/null)" ]; then
    echo "❌ ERROR: No input files found in $INPUT_DIR"
    echo "Please place FASTQ files in /datasets/fastq/"
    exit 1
fi

echo "[$(timestamp)] 📂 Found input files in $INPUT_DIR"
ls -lh "$INPUT_DIR"/*.fastq.gz 2>/dev/null | head -5 || true
ls -lh "$INPUT_DIR"/*.fastq 2>/dev/null | head -5 || true

log_step "2" "Input samples validation complete"

# ============================================
# OPTIMIZATION 5: Preload reference in RAM
# ============================================
if [ "$PRELOAD_RAM" = "true" ] && command -v vmtouch &> /dev/null; then
    echo "📦 Preloading reference genome in RAM..."
    vmtouch -t "$REFERENCE_GENOME_GZ"
    echo "✅ Reference preloaded in page cache"
elif [ "$PRELOAD_RAM" = "true" ]; then
    echo "⚠️ vmtouch not installed, skipping RAM preload"
fi

# Function to process a single sample
process_sample() {
    local sample="$1"
    local basename=$(basename "$sample")
    local input_dir="$INPUT_DIR"
    local output_dir="$OUTPUT_DIR"
    local vcf_output_dir="$VCF_OUTPUT_DIR"
    local logs_dir="$LOGS_DIR"
    local threads="$THREADS"
    local reference_genome="$REFERENCE_GENOME_GZ"
    local test_mode="$TEST_MODE"
    local read_limit="$READ_LIMIT"
    local annotation_dir="$ANNOTATION_DIR"
    local use_cram="$USE_CRAM"
    
    echo ""
    echo "----------------------------------------"
    echo "Processing: $basename"
    echo "----------------------------------------"
    
    # Check if paired-end or single-end (support both .fastq and .fastq.gz)
    local r1="${sample}_1.fastq.gz"
    local r2="${sample}_2.fastq.gz"
    local r1_uncompressed="${sample}_1.fastq"
    local r2_uncompressed="${sample}_2.fastq"
    local single_end="${sample}.fastq.gz"
    local single_end_uncompressed="${sample}.fastq"
    
    # Test mode: limit reads for faster testing
    local temp_r1=""
    local temp_r2=""
    local temp_single=""
    local use_temp=false
    
    if [ "$test_mode" = "true" ] && [ "$read_limit" -gt 0 ]; then
        echo "⚡ Test mode: limiting to $read_limit reads"
        use_temp=true
        
        if [ -f "$r1" ] && [ -f "$r2" ]; then
            # Paired-end compressed
            temp_r1=$(mktemp /tmp/${basename}_R1_XXXXXX.fastq.gz)
            temp_r2=$(mktemp /tmp/${basename}_R2_XXXXXX.fastq.gz)
            zcat "$r1" | head -n $((read_limit * 4)) | gzip > "$temp_r1"
            zcat "$r2" | head -n $((read_limit * 4)) | gzip > "$temp_r2"
            r1="$temp_r1"
            r2="$temp_r2"
        elif [ -f "$single_end" ]; then
            # Single-end compressed
            temp_single=$(mktemp /tmp/${basename}_SE_XXXXXX.fastq.gz)
            zcat "$single_end" | head -n $((read_limit * 4)) | gzip > "$temp_single"
            single_end="$temp_single"
        elif [ -f "$r1_uncompressed" ] && [ -f "$r2_uncompressed" ]; then
            # Paired-end uncompressed
            temp_r1=$(mktemp /tmp/${basename}_R1_XXXXXX.fastq)
            temp_r2=$(mktemp /tmp/${basename}_R2_XXXXXX.fastq)
            head -n $((read_limit * 4)) "$r1_uncompressed" > "$temp_r1"
            head -n $((read_limit * 4)) "$r2_uncompressed" > "$temp_r2"
            r1="$temp_r1"
            r2="$temp_r2"
        elif [ -f "$single_end_uncompressed" ]; then
            # Single-end uncompressed
            temp_single=$(mktemp /tmp/${basename}_SE_XXXXXX.fastq)
            head -n $((read_limit * 4)) "$single_end_uncompressed" > "$temp_single"
            single_end="$temp_single"
        fi
    fi
    
    # Cleanup function for temp files
    cleanup() {
        if [ "$use_temp" = "true" ]; then
            [ -n "$temp_r1" ] && rm -f "$temp_r1"
            [ -n "$temp_r2" ] && rm -f "$temp_r2"
            [ -n "$temp_single" ] && rm -f "$temp_single"
        fi
    }
    
    # ============================================
    # OPTIMIZATION 2: Direct BAM output (no samtools view)
    # strobealign outputs SAM by default, but we pipe directly to samtools sort
    # ============================================
    local sorted_bam="$output_dir/${basename}_sorted.bam"
    local sorted_cram="$output_dir/${basename}_sorted.cram"
    local output_file=""
    
    # Track step timing
    local alignment_start=$(date +%s)
    log_step "3" "Starting alignment for $basename"
    log_progress 30 100
    
    if [ -f "$r1" ] && [ -f "$r2" ]; then
        # Paired-end alignment with streaming (no samtools view)
        echo "[$(timestamp)] 📊 Step 1: Paired-end Alignment with strobealign (direct streaming)..."
        strobealign -t "$threads" "$reference_genome" "$r1" "$r2" 2> "$logs_dir/${basename}_strobealign.log" | \
            samtools sort -@ "$threads" -o "$sorted_bam" 2> "$logs_dir/${basename}_samtools_sort.log"
        output_file="$sorted_bam"
    elif [ -f "$single_end" ]; then
        # Single-end alignment with streaming
        echo "[$(timestamp)] 📊 Step 1: Single-end Alignment with strobealign (direct streaming)..."
        strobealign -t "$threads" "$reference_genome" "$single_end" 2> "$logs_dir/${basename}_strobealign.log" | \
            samtools sort -@ "$threads" -o "$sorted_bam" 2> "$logs_dir/${basename}_samtools_sort.log"
        output_file="$sorted_bam"
    elif [ -f "$r1_uncompressed" ] && [ -f "$r2_uncompressed" ]; then
        # Paired-end uncompressed (legacy support)
        echo "[$(timestamp)] 📊 Step 1: Paired-end Alignment with strobealign (direct streaming)..."
        strobealign -t "$threads" "$reference_genome" "$r1_uncompressed" "$r2_uncompressed" 2> "$logs_dir/${basename}_strobealign.log" | \
            samtools sort -@ "$threads" -o "$sorted_bam" 2> "$logs_dir/${basename}_samtools_sort.log"
        output_file="$sorted_bam"
    elif [ -f "$single_end_uncompressed" ]; then
        # Single-end uncompressed (legacy support)
        echo "[$(timestamp)] 📊 Step 1: Single-end Alignment with strobealign (direct streaming)..."
        strobealign -t "$threads" "$reference_genome" "$single_end_uncompressed" 2> "$logs_dir/${basename}_strobealign.log" | \
            samtools sort -@ "$threads" -o "$sorted_bam" 2> "$logs_dir/${basename}_samtools_sort.log"
        output_file="$sorted_bam"
    else
        echo "⚠️ No input files found for $basename"
        cleanup
        return 1
    fi
    
    # Log alignment timing and file size
    local alignment_end=$(date +%s)
    local alignment_duration=$((alignment_end - alignment_start))
    log_step "3" "Alignment complete for $basename (${alignment_duration}s)"
    log_file "$sorted_bam"
    log_progress 60 100
    
    # ============================================
    # OPTIMIZATION 3: Convert BAM to CRAM (30-60% less space)
    # ============================================
    local cram_start=$(date +%s)
    if [ "$use_cram" = "true" ]; then
        echo "[$(timestamp)] 📊 Step 1b: Converting BAM to CRAM (30-60% space saving)..."
        samtools view -@ "$threads" -C \
            -T "$reference_genome" \
            -o "$sorted_cram" \
            "$sorted_bam" 2> "$logs_dir/${basename}_samtools_cram.log"
        
        # Remove BAM to save space
        rm -f "$sorted_bam"
        output_file="$sorted_cram"
        local cram_end=$(date +%s)
        local cram_duration=$((cram_end - cram_start))
        log_step "4" "CRAM conversion complete (${cram_duration}s)"
        log_file "$sorted_cram"
    fi
    
    # Step 2: Index CRAM/BAM
    local index_start=$(date +%s)
    echo "[$(timestamp)] 📊 Step 2: Indexing $output_file..."
    samtools index "$output_file" 2> "$logs_dir/${basename}_samtools_index.log"
    local index_end=$(date +%s)
    local index_duration=$((index_end - index_start))
    log_step "5" "Indexing complete (${index_duration}s)"
    log_progress 70 100
    
    # ============================================
    # OPTIMIZATION 4: mpileup with multithreading real
    # ============================================
    # Step 3: Variant Calling (using BCF binary for faster I/O)
    local variant_start=$(date +%s)
    echo "[$(timestamp)] 📊 Step 3: Variant Calling with bcftools (BCF binary, multithreaded)..."
    bcftools mpileup \
        -f "$reference_genome" \
        -Ou \
        --threads "$threads" \
        "$output_file" 2> "$logs_dir/${basename}_bcftools_mpileup.log" | \
    bcftools call -mv -Ob -o "$vcf_output_dir/${basename}_variants.bcf" 2>> "$logs_dir/${basename}_bcftools_mpileup.log"
    
    # Convert BCF to VCF for compatibility
    echo "[$(timestamp)] 📊 Step 3b: Converting BCF to VCF..."
    bcftools view "$vcf_output_dir/${basename}_variants.bcf" -Ov -o "$vcf_output_dir/${basename}_variants.vcf" 2> "$logs_dir/${basename}_bcftools_view.log"
    
    local variant_end=$(date +%s)
    local variant_duration=$((variant_end - variant_start))
    log_step "6" "Variant calling complete (${variant_duration}s)"
    log_file "$vcf_output_dir/${basename}_variants.vcf"
    log_progress 90 100
    
    # Step 4: Filter variants
    local filter_start=$(date +%s)
    echo "[$(timestamp)] 📊 Step 4: Filtering variants..."
    bcftools filter -O v -o "$vcf_output_dir/${basename}_filtered.vcf" \
        -s LOWQUAL -g 10 -S 60 "$vcf_output_dir/${basename}_variants.vcf" 2> "$logs_dir/${basename}_bcftools_filter.log"
    
    local filter_end=$(date +%s)
    local filter_duration=$((filter_end - filter_start))
    log_step "7" "Variant filtering complete (${filter_duration}s)"
    log_file "$vcf_output_dir/${basename}_filtered.vcf"
    log_progress 95 100
    
    # Step 5: Annotate with ClinVar if available
    local annotate_start=$(date +%s)
    if [ -f "$annotation_dir/clinvar.vcf" ]; then
        echo "[$(timestamp)] 📊 Step 5: Annotating with ClinVar..."
        bcftools annotate -a "$annotation_dir/clinvar.vcf" \
            -c CHROM,POS,ID,REF,ALT,QUAL \
            -o "$vcf_output_dir/${basename}_annotated.vcf" \
            "$vcf_output_dir/${basename}_filtered.vcf" 2> "$logs_dir/${basename}_bcftools_annotate.log"
        local annotate_end=$(date +%s)
        local annotate_duration=$((annotate_end - annotate_start))
        log_step "8" "ClinVar annotation complete (${annotate_duration}s)"
        log_file "$vcf_output_dir/${basename}_annotated.vcf"
    fi
    
    # Cleanup temp files
    cleanup
    
    # Final timing
    local sample_end=$(date +%s)
    local sample_duration=$((sample_end - alignment_start))
    log_step "100" "Sample $basename completed (total: ${sample_duration}s)"
    echo "✅ Completed: $basename"
    echo "   Output CRAM/BAM: $output_file"
    echo "   Output VCF: $vcf_output_dir/${basename}_filtered.vcf"
}

# Get unique sample names (remove _1/_2 suffix for paired-end, support both .fastq and .fastq.gz)
SAMPLES=$(ls "$INPUT_DIR"/*.fastq.gz 2>/dev/null | sed 's/_[12]\.fastq\.gz$//' | sort -u)
SAMPLES_UNCOMPRESSED=$(ls "$INPUT_DIR"/*.fastq 2>/dev/null | sed 's/_[12]\.fastq$//' | sort -u)

# Merge both lists
ALL_SAMPLES=""
for s in $SAMPLES $SAMPLES_UNCOMPRESSED; do
    if [ -n "$s" ]; then
        ALL_SAMPLES="$ALL_SAMPLES $s"
    fi
done
SAMPLES=$(echo "$ALL_SAMPLES" | tr ' ' '\n' | sort -u | tr '\n' ' ')

# ============================================
# OPTIMIZATION: Parallel sample processing
# ============================================
if [ "$PARALLEL" = "true" ] && command -v parallel &> /dev/null; then
    echo ""
    echo "🚀 Running samples in parallel with GNU Parallel..."
    echo "$SAMPLES" | tr ' ' '\n' | parallel -j "$THREADS" process_sample {}
else
    # Sequential processing
    for sample in $SAMPLES; do
        process_sample "$sample"
    done
fi

echo ""
echo "=========================================="
echo "✅ Pipeline completed successfully!"
echo "=========================================="

# Calculate total pipeline time
PIPELINE_END_TIME=$(date +%s)
PIPELINE_TOTAL_DURATION=$((PIPELINE_END_TIME - PIPELINE_START_TIME))
PIPELINE_MINUTES=$((PIPELINE_TOTAL_DURATION / 60))
PIPELINE_SECONDS=$((PIPELINE_TOTAL_DURATION % 60))

log_step "FINAL" "Pipeline complete. Total time: ${PIPELINE_MINUTES}m ${PIPELINE_SECONDS}s"
log_progress 100 100

echo "CRAM/BAM files are available in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*.cram 2>/dev/null || ls -lh "$OUTPUT_DIR"/*.bam 2>/dev/null || echo "No files"
echo ""
echo "VCF files are available in: $VCF_OUTPUT_DIR"
ls -lh "$VCF_OUTPUT_DIR"/*.vcf 2>/dev/null || echo "No VCF files"
echo ""
echo "BCF files are available in: $VCF_OUTPUT_DIR"
ls -lh "$VCF_OUTPUT_DIR"/*.bcf 2>/dev/null || echo "No BCF files"
echo ""
echo "[$(timestamp)] ⏱️ Total pipeline execution time: ${PIPELINE_MINUTES}m ${PIPELINE_SECONDS}s"
