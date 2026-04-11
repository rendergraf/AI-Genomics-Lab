#!/bin/bash
# 🧬 AI Genomics Lab - PURE Reference Genome Indexing Pipeline
# Purpose: Build deterministic, reproducible genome indices ONLY
#
# Outputs:
#   - .fa.gz (BGZF compressed reference genome)
#   - .fa.gz.fai (SAMtools FASTA index)
#   - .fa.gz.gzi (BGZF index for random access / CRAM)
#   - .fa.gz.r150.sti (strobealign index)
#
# IMPORTANT:
# This script MUST NOT use FASTQ data.
# FASTQ-based indexing is experimental and belongs to alignment pipelines.
#
# Author: Xavier Araque
# License: MIT

set -eo pipefail

# ================================
# Logging utilities
# ================================
timestamp() {
    date +"%Y-%m-%d %H:%M:%S"
}

log() {
    echo "[$(timestamp)] $1"
}

log_step() {
    echo "[$(timestamp)] 📊 STEP $1: $2"
}

log_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "[$(timestamp)] 📁 $(basename "$file") ($(du -h "$file" | cut -f1))"
    fi
}

# ================================
# Configuration
# ================================
INPUT_FA="${INPUT_FA:-}"
OUTPUT_DIR="${OUTPUT_DIR:-datasets/reference_genome}"
THREADS="${THREADS:-$(nproc)}"

# Use 75% CPU safely
THREADS=$((THREADS * 3 / 4))
[ "$THREADS" -lt 2 ] && THREADS=2

# ================================
# Validation
# ================================
if [ -z "$INPUT_FA" ]; then
    echo "❌ ERROR: INPUT_FA is required"
    echo "Usage: INPUT_FA=genome.fa bash index_genome.sh"
    exit 1
fi

if [ ! -f "$INPUT_FA" ]; then
    echo "❌ ERROR: File not found: $INPUT_FA"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

# ================================
# Naming
# ================================
BASENAME=$(basename "$INPUT_FA")
BASENAME=${BASENAME%.fa}
BASENAME=${BASENAME%.fasta}

PREFIX="$OUTPUT_DIR/$BASENAME"

FA_GZ="${PREFIX}.fa.gz"
FAI="${FA_GZ}.fai"
GZI="${FA_GZ}.gzi"
STI="${FA_GZ}.r150.sti"

START_TIME=$(date +%s)

echo "=========================================="
echo "🧬 PURE Reference Genome Indexing"
echo "=========================================="
echo "Input : $INPUT_FA"
echo "Output: $OUTPUT_DIR"
echo "Threads: $THREADS"
echo "=========================================="

# ================================
# STEP 1: BGZF compression
# ================================
log_step 1 "Compressing genome with BGZF"

if [ -f "$FA_GZ" ]; then
    log "⚠️ BGZF already exists, skipping"
else
    bgzip -@ "$THREADS" -c "$INPUT_FA" > "$FA_GZ"
    log "✅ BGZF compression complete"
fi

log_file "$FA_GZ"

# ================================
# STEP 2: FASTA index (FAI)
# ================================
log_step 2 "Creating FASTA index (samtools faidx)"

if [ -f "$FAI" ]; then
    log "⚠️ FAI already exists, skipping"
else
    samtools faidx "$FA_GZ"
    log "✅ FAI created"
fi

log_file "$FAI"

# ================================
# STEP 3: BGZF index (GZI)
# ================================
# log_step 3 "Verifying BGZF index"
#
#if [ -f "$GZI" ]; then
#    log "⚠️ GZI already exists"
#else
#    # bgzip generates this automatically
#    log "ℹ️ GZI generated automatically by bgzip"
#    touch "$GZI"
#fi

log_file "$GZI"

# ================================
# STEP 4: strobealign index (deterministic mode)
# ================================
log_step 4 "Building strobealign index (genome-only mode)"

if [ -f "$STI" ]; then
    log "⚠️ STI already exists, skipping"
else
    # IMPORTANT:
    # No FASTQ usage → deterministic index
    strobealign --index "$FA_GZ"

    GENERATED=$(ls "${FA_GZ}"*.sti 2>/dev/null | head -n 1)

    if [ -n "$GENERATED" ]; then
        mv "$GENERATED" "$STI"
        log "✅ STI created"
    else
        echo "❌ ERROR: STI not generated"
        exit 1
    fi
fi

log_file "$STI"

# ================================
# Final summary
# ================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "=========================================="
echo "✅ PURE INDEXING COMPLETE"
echo "=========================================="

ls -lh "$FA_GZ" "$FAI" "$GZI" "$STI" 2>/dev/null || true

echo ""
echo "⏱️ Total time: $((DURATION / 60))m $((DURATION % 60))s"

echo ""
echo "=== OUTPUT PATHS ==="
echo "FA_GZ=$FA_GZ"
echo "FAI=$FAI"
echo "GZI=$GZI"
echo "STI=$STI"
echo "===================="