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
echo "Reference: $REFERENCE_GENOME_GZ (BGZF COMPRESSED)"
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "VCF Output: $VCF_OUTPUT_DIR"
echo "Threads: $THREADS"
echo "Test Mode: $TEST_MODE"
echo "Parallel: $PARALLEL"
echo "Use CRAM: $USE_CRAM"
echo "Preload RAM: $PRELOAD_RAM"
echo "=========================================="

# Create output directories
mkdir -p "$OUTPUT_DIR" "$VCF_OUTPUT_DIR" "$LOGS_DIR"

# Check if compressed reference genome exists (BGZF format)
if [ ! -f "${REFERENCE_GENOME_GZ}" ]; then
    echo "⚠️ Compressed reference genome not found at $REFERENCE_GENOME_GZ"
    echo "Please place Homo_sapiens.GRCh38.dna_sm.toplevel.fa.gz in /datasets/reference_genome/"
    echo "Then run: bgzip -@ 8 Homo_sapiens.GRCh38.dna_sm.toplevel.fa"
    echo "And: samtools faidx Homo_sapiens.GRCh38.dna_sm.toplevel.fa.gz"
    exit 1
fi

# Check if input files exist (support both .fastq and .fastq.gz)
if [ ! "$(ls -A $INPUT_DIR 2>/dev/null)" ]; then
    echo "⚠️ No input files found in $INPUT_DIR"
    echo "Please place FASTQ files in /datasets/fastq/"
    exit 1
fi

# ============================================
# OPTIMIZATION 1: BGZF compressed reference (NO gunzip)
# ============================================
REFERENCE_GENOME="$REFERENCE_GENOME_GZ"

# Check for BGZF index (.gzi file)
if [ ! -f "${REFERENCE_GENOME}.gzi" ]; then
    echo "⚠️ BGZF index not found. Converting gzip to BGZF..."
    # Extract, recompress with bgzip
    TEMP_FA=$(mktemp /tmp/reference_XXXXXX.fa)
    gunzip -c "$REFERENCE_GENOME" > "$TEMP_FA"
    bgzip -@ "$THREADS" -c "$TEMP_FA" > "${REFERENCE_GENOME}.bgzf"
    mv "${REFERENCE_GENOME}.bgzf" "$REFERENCE_GENOME"
    rm "$TEMP_FA"
    echo "✅ Converted to BGZF format"
fi

# Index compressed reference with SAMtools (once)
if [ ! -f "${REFERENCE_GENOME}.fai" ]; then
    echo "📇 Indexing BGZF reference genome with SAMtools..."
    samtools faidx "$REFERENCE_GENOME"
    echo "✅ SAMtools index created"
fi

# Index compressed reference with strobealign (creates .sti file)
if [ ! -f "${REFERENCE_GENOME}.sti" ]; then
    echo "📇 Indexing BGZF reference genome with strobealign..."
    strobealign --index "$REFERENCE_GENOME"
    echo "✅ strobealign index created"
fi

# ============================================
# OPTIMIZATION 5: Preload reference in RAM
# ============================================
if [ "$PRELOAD_RAM" = "true" ] && command -v vmtouch &> /dev/null; then
    echo "📦 Preloading reference genome in RAM..."
    vmtouch -t "$REFERENCE_GENOME"
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
    local reference_genome="$REFERENCE_GENOME"
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
    
    if [ -f "$r1" ] && [ -f "$r2" ]; then
        # Paired-end alignment with streaming (no samtools view)
        echo "📊 Step 1: Paired-end Alignment with strobealign (direct streaming)..."
        strobealign -t "$threads" "$reference_genome" "$r1" "$r2" 2> "$logs_dir/${basename}_strobealign.log" | \
            samtools sort -@ "$threads" -o "$sorted_bam" 2> "$logs_dir/${basename}_samtools_sort.log"
        output_file="$sorted_bam"
    elif [ -f "$single_end" ]; then
        # Single-end alignment with streaming
        echo "📊 Step 1: Single-end Alignment with strobealign (direct streaming)..."
        strobealign -t "$threads" "$reference_genome" "$single_end" 2> "$logs_dir/${basename}_strobealign.log" | \
            samtools sort -@ "$threads" -o "$sorted_bam" 2> "$logs_dir/${basename}_samtools_sort.log"
        output_file="$sorted_bam"
    elif [ -f "$r1_uncompressed" ] && [ -f "$r2_uncompressed" ]; then
        # Paired-end uncompressed (legacy support)
        echo "📊 Step 1: Paired-end Alignment with strobealign (direct streaming)..."
        strobealign -t "$threads" "$reference_genome" "$r1_uncompressed" "$r2_uncompressed" 2> "$logs_dir/${basename}_strobealign.log" | \
            samtools sort -@ "$threads" -o "$sorted_bam" 2> "$logs_dir/${basename}_samtools_sort.log"
        output_file="$sorted_bam"
    elif [ -f "$single_end_uncompressed" ]; then
        # Single-end uncompressed (legacy support)
        echo "📊 Step 1: Single-end Alignment with strobealign (direct streaming)..."
        strobealign -t "$threads" "$reference_genome" "$single_end_uncompressed" 2> "$logs_dir/${basename}_strobealign.log" | \
            samtools sort -@ "$threads" -o "$sorted_bam" 2> "$logs_dir/${basename}_samtools_sort.log"
        output_file="$sorted_bam"
    else
        echo "⚠️ No input files found for $basename"
        cleanup
        return 1
    fi
    
    # ============================================
    # OPTIMIZATION 3: Convert BAM to CRAM (30-60% less space)
    # ============================================
    if [ "$use_cram" = "true" ]; then
        echo "📊 Step 1b: Converting BAM to CRAM (30-60% space saving)..."
        samtools view -@ "$threads" -C \
            -T "$reference_genome" \
            -o "$sorted_cram" \
            "$sorted_bam" 2> "$logs_dir/${basename}_samtools_cram.log"
        
        # Remove BAM to save space
        rm -f "$sorted_bam"
        output_file="$sorted_cram"
        echo "✅ Converted to CRAM: $(ls -lh "$sorted_cram" | awk '{print $5}')"
    fi
    
    # Step 2: Index CRAM/BAM
    echo "📊 Step 2: Indexing $use_cram..."
    samtools index "$output_file" 2> "$logs_dir/${basename}_samtools_index.log"
    
    # ============================================
    # OPTIMIZATION 4: mpileup with multithreading real
    # ============================================
    # Step 3: Variant Calling (using BCF binary for faster I/O)
    echo "📊 Step 3: Variant Calling with bcftools (BCF binary, multithreaded)..."
    bcftools mpileup \
        -f "$reference_genome" \
        -Ou \
        --threads "$threads" \
        "$output_file" 2> "$logs_dir/${basename}_bcftools_mpileup.log" | \
        bcftools call -mv -Ob -o "$vcf_output_dir/${basename}_variants.bcf" 2>> "$logs_dir/${basename}_bcftools_mpileup.log"
    
    # Convert BCF to VCF for compatibility
    echo "📊 Step 3b: Converting BCF to VCF..."
    bcftools view "$vcf_output_dir/${basename}_variants.bcf" -Ov -o "$vcf_output_dir/${basename}_variants.vcf" 2> "$logs_dir/${basename}_bcftools_view.log"
    
    # Step 4: Filter variants
    echo "📊 Step 4: Filtering variants..."
    bcftools filter -O v -o "$vcf_output_dir/${basename}_filtered.vcf" \
        -s LOWQUAL -g 10 -S 60 "$vcf_output_dir/${basename}_variants.vcf" 2> "$logs_dir/${basename}_bcftools_filter.log"
    
    # Step 5: Annotate with ClinVar if available
    if [ -f "$annotation_dir/clinvar.vcf" ]; then
        echo "📊 Step 5: Annotating with ClinVar..."
        bcftools annotate -a "$annotation_dir/clinvar.vcf" \
            -c CHROM,POS,ID,REF,ALT,QUAL \
            -o "$vcf_output_dir/${basename}_annotated.vcf" \
            "$vcf_output_dir/${basename}_filtered.vcf" 2> "$logs_dir/${basename}_bcftools_annotate.log"
    fi
    
    # Cleanup temp files
    cleanup
    
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
echo "CRAM/BAM files are available in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*.cram 2>/dev/null || ls -lh "$OUTPUT_DIR"/*.bam 2>/dev/null || echo "No files"
echo ""
echo "VCF files are available in: $VCF_OUTPUT_DIR"
ls -lh "$VCF_OUTPUT_DIR"/*.vcf 2>/dev/null || echo "No VCF files"
echo ""
echo "BCF files are available in: $VCF_OUTPUT_DIR"
ls -lh "$VCF_OUTPUT_DIR"/*.bcf 2>/dev/null || echo "No BCF files"
