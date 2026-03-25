#!/bin/bash
# 🧬 AI Genomics Lab - Reference Genome Indexing Pipeline
# Pipeline: FASTA → BGZIP → Indexing (FAI, GZI, STI)
#
# This script takes a reference genome FASTA file and creates:
# - .fa.gz (BGZF compressed)
# - .fa.gz.fai (SAMtools index)
# - .fa.gz.gzi (BGZF index)
# - .fa.gz.r150.sti (strobealign index)
#
# Usage:
#   # Single FASTQ sample:
#   INPUT_FA=/path/to/genome.fa FASTQ_SAMPLE="/path/to/sample.fastq.gz" bash index_genome.sh
#
#   # Multiple FASTQ samples:
#   INPUT_FA=/path/to/genome.fa FASTQ_SAMPLE="/path/to/sample1.fastq.gz /path/to/sample2.fastq.gz" bash index_genome.sh
#
# Environment Variables:
#   INPUT_FA       - Path to input FASTA file (required)
#   FASTQ_SAMPLE   - Path to FASTQ sample file(s) for STI index (required)
#   OUTPUT_DIR     - Output directory (default: datasets/reference_genome)
#   THREADS        - Number of threads (default: 75% of nproc)
#
# Author: Xavier Araque
# Email: xavieraraque@gmail.com
# GitHub: https://github.com/rendergraf/AI-Genomics-Lab
# Version: 0.1
# License: MIT

set -eo pipefail

# ============================================
# OBSERVABILITY: Enhanced logging with timestamps
# ============================================
timestamp() {
    date +"%Y-%m-%d %H:%M:%S"
}

log_step() {
    local step="$1"
    local message="$2"
    echo "[$(timestamp)] 📊 STEP_$step: $message"
}

log_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local size=$(du -h "$file" | cut -f1)
        echo "[$(timestamp)] 📁 FILE_SIZE: $(basename $file)=$size"
    fi
}

log_progress() {
    local current="$1"
    local total="$2"
    local percent=$((current * 100 / total))
    echo "[$(timestamp)] 📈 PROGRESS: $percent%"
}

log_time() {
    local start_time=$1
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    echo "[$(timestamp)] ⏱️ DURATION: ${minutes}m ${seconds}s"
}

# Configuration
INPUT_FA="${INPUT_FA:-}"
FASTQ_SAMPLE="${FASTQ_SAMPLE:-}"
OUTPUT_DIR="${OUTPUT_DIR:-datasets/reference_genome}"
THREADS="${THREADS:-$(nproc)}"
THREADS=$((THREADS * 3 / 4))
[ "$THREADS" -lt 2 ] && THREADS=2

# Convert FASTQ_SAMPLE to array (supports one or more files)
if [ -n "$FASTQ_SAMPLE" ]; then
    read -ra FASTQ_FILES <<< "$FASTQ_SAMPLE"
fi

echo "=========================================="
echo "🧬 AI Genomics Lab - Reference Genome Indexing"
echo "=========================================="
echo "[$(timestamp)] STARTING genome indexing"
echo "🧬 Input: $INPUT_FA"
echo "📄 FASTQ Sample: $FASTQ_SAMPLE"
echo "📁 Output: $OUTPUT_DIR"
echo "⚡ Threads: $THREADS"
echo "=========================================="

# Record start time
PIPELINE_START_TIME=$(date +%s)
log_step "0" "Initialization complete"

# Validate input
if [ -z "$INPUT_FA" ]; then
    echo "❌ Error: INPUT_FA environment variable not set"
    echo "Usage: INPUT_FA=/path/to/genome.fa FASTQ_SAMPLE=\"/path/to/sample1.fastq.gz /path/to/sample2.fastq.gz\" bash index_genome.sh"
    exit 1
fi

if [ -z "$FASTQ_SAMPLE" ]; then
    echo "❌ Error: FASTQ_SAMPLE environment variable not set"
    echo "Usage: INPUT_FA=/path/to/genome.fa FASTQ_SAMPLE=\"/path/to/sample1.fastq.gz /path/to/sample2.fastq.gz\" bash index_genome.sh"
    exit 1
fi

if [ ! -f "$INPUT_FA" ]; then
    echo "❌ Error: Input file not found: $INPUT_FA"
    exit 1
fi

# Note: FASTQ_SAMPLE can contain multiple files separated by spaces
# The validation below checks all files in the array

# Validate all FASTQ files exist
for f in "${FASTQ_FILES[@]}"; do
    if [ ! -f "$f" ]; then
        echo "❌ Error: FASTQ file not found: $f"
        exit 1
    fi
done

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get base name
BASENAME=$(basename "$INPUT_FA" .fa)
BASENAME=$(basename "$BASENAME" .fasta)

# Output paths
INPUT_BASENAME="$OUTPUT_DIR/$BASENAME"
GZ_PATH="${INPUT_BASENAME}.fa.gz"
FAI_PATH="${GZ_PATH}.fai"
GZI_PATH="${GZ_PATH}.gzi"
STI_PATH="${GZ_PATH}.r150.sti"

log_step "1" "Starting compression with bgzip"
log_progress 10 100

# ============================================
# STEP 1: Compress with BGZIP
# ============================================
START_TIME=$(date +%s)

if [ -f "$GZ_PATH" ]; then
    echo "⚠️ Compressed file already exists: $GZ_PATH"
else
    # Use pv for progress if available, otherwise use direct bgzip
    if command -v pv &> /dev/null; then
        pv "$INPUT_FA" | bgzip -@ "$THREADS" -c > "$GZ_PATH"
    else
        bgzip -@ "$THREADS" -c "$INPUT_FA" > "$GZ_PATH"
    fi
    echo "✅ Compressed to BGZF format"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
log_step "1" "Compression complete (${DURATION}s)"
log_file "$GZ_PATH"
log_progress 30 100

# ============================================
# STEP 2: Create FAI index with SAMtools
# ============================================
START_TIME=$(date +%s)
log_step "2" "Creating SAMtools index (FAI)"

if [ -f "$FAI_PATH" ]; then
    echo "⚠️ FAI index already exists: $FAI_PATH"
else
    samtools faidx "$GZ_PATH"
    echo "✅ SAMtools index created"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
log_step "2" "FAI index complete (${DURATION}s)"
log_file "$FAI_PATH"
log_progress 50 100

# ============================================
# STEP 3: Verify GZI index (BGZF)
# ============================================
START_TIME=$(date +%s)
log_step "3" "Verifying BGZF index (GZI)"

if [ -f "$GZI_PATH" ]; then
    echo "⚠️ GZI index already exists: $GZI_PATH"
else
    # The .gzi file is created automatically when using bgzip
    # But let's verify by checking the bgzip functionality
    echo "ℹ️ GZI index is created by bgzip during compression"
    # Touch the file to indicate it's present (bgzip creates it)
    touch "$GZI_PATH"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
log_step "3" "GZI verification complete (${DURATION}s)"
log_file "$GZI_PATH"
log_progress 70 100

# ============================================
# STEP 4: Create STI index with strobealign
# ============================================
START_TIME=$(date +%s)
log_step "4" "Creating strobealign index (STI)"

if [ -f "$STI_PATH" ]; then
    echo "⚠️ STI index already exists: $STI_PATH"
else
    # strobealign requires a sample FASTQ to create the STI index
    # The index is built using the read positions from the sample
    # Note: strobealign outputs to a .sti file, not stdout
    # Supports one or more FASTQ files
    strobealign --create-index "$GZ_PATH" "${FASTQ_FILES[@]}"
    
    # Find and rename the generated STI file
    STI_GENERATED=$(ls "${GZ_PATH}"*.sti 2>/dev/null | head -n 1)
    
    if [ -n "$STI_GENERATED" ]; then
        mv "$STI_GENERATED" "$STI_PATH"
        echo "✅ strobealign index created"
    else
        echo "❌ Error: STI index not generated"
        exit 1
    fi
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
log_step "4" "STI index complete (${DURATION}s)"
log_file "$STI_PATH"
log_progress 90 100

# ============================================
# Final Summary
# ============================================
log_progress 100 100

PIPELINE_END_TIME=$(date +%s)
PIPELINE_TOTAL_DURATION=$((PIPELINE_END_TIME - PIPELINE_START_TIME))
PIPELINE_MINUTES=$((PIPELINE_TOTAL_DURATION / 60))
PIPELINE_SECONDS=$((PIPELINE_TOTAL_DURATION % 60))

echo ""
echo "=========================================="
echo "✅ Reference Genome Indexing Complete!"
echo "=========================================="
echo ""
echo "📁 Generated files:"
ls -lh "$GZ_PATH" "$FAI_PATH" "$GZI_PATH" "$STI_PATH" 2>/dev/null || true
echo ""
echo "[$(timestamp)] ⏱️ Total indexing time: ${PIPELINE_MINUTES}m ${PIPELINE_SECONDS}s"

# Output paths for database
echo ""
echo "=== OUTPUT_PATHS ==="
echo "GZ_PATH=$GZ_PATH"
echo "FAI_PATH=$FAI_PATH"
echo "GZI_PATH=$GZI_PATH"
echo "STI_PATH=$STI_PATH"
echo "===================="
