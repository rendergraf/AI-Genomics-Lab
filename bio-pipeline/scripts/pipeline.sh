#!/bin/bash
# 🧬 AI Genomics Lab - Bioinformatics Pipeline
# Pipeline: FASTQ → Alignment → BAM → Sorting → Variant Calling → VCF
#
# Author: Xavier Araque
# Email: xavieraraque@gmail.com
# GitHub: https://github.com/rendergraf/AI-Genomics-Lab
# Version: 0.1
# License: MIT

set -e

# Configuration - Updated paths for datasets directory
REFERENCE_GENOME_GZ="${REFERENCE_GENOME_GZ:-/datasets/reference_genome/Homo_sapiens.GRCh38.dna_sm.toplevel.fa.gz}"
REFERENCE_GENOME="${REFERENCE_GENOME:-/datasets/reference_genome/Homo_sapiens.GRCh38.dna_sm.toplevel.fa}"
INPUT_DIR="${INPUT_DIR:-/datasets/fastq}"
OUTPUT_DIR="${OUTPUT_DIR:-/datasets/bam}"
VCF_OUTPUT_DIR="${VCF_OUTPUT_DIR:-/datasets/vcf}"
ANNOTATION_DIR="${ANNOTATION_DIR:-/datasets/annotations}"
LOGS_DIR="${LOGS_DIR:-/datasets/logs}"

echo "=========================================="
echo "🧬 AI Genomics Lab - Bio Pipeline"
echo "=========================================="
echo "Reference: $REFERENCE_GENOME"
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "VCF Output: $VCF_OUTPUT_DIR"
echo "=========================================="

# Create output directories
mkdir -p "$OUTPUT_DIR" "$VCF_OUTPUT_DIR" "$LOGS_DIR"

# Check if reference genome exists (support both .fa and .fa.gz)
if [ ! -f "${REFERENCE_GENOME}" ] && [ ! -f "${REFERENCE_GENOME_GZ}" ]; then
    echo "⚠️ Reference genome not found at $REFERENCE_GENOME or $REFERENCE_GENOME_GZ"
    echo "Please place Homo_sapiens.GRCh38.dna_sm.toplevel.fa or .fa.gz in /datasets/reference_genome/"
    exit 1
fi

# Handle compressed genome file - decompress if needed
if [ -f "${REFERENCE_GENOME_GZ}" ] && [ ! -f "${REFERENCE_GENOME}" ]; then
    echo "📦 Decompressing reference genome..."
    gunzip -c "${REFERENCE_GENOME_GZ}" > "${REFERENCE_GENOME}"
    echo "✅ Reference genome decompressed successfully"
fi

# Check if input files exist
if [ ! "$(ls -A $INPUT_DIR 2>/dev/null)" ]; then
    echo "⚠️ No input files found in $INPUT_DIR"
    echo "Please place FASTQ files in /datasets/fastq/"
    exit 1
fi

if [ ! -f "${REFERENCE_GENOME}.bwt" ]; then
    echo "📇 Indexing reference genome with BWA..."
    bwa index "$REFERENCE_GENOME"
fi

if [ ! -f "${REFERENCE_GENOME}.fai" ]; then
    echo "📇 Indexing reference genome with SAMtools..."
    samtools faidx "$REFERENCE_GENOME"
fi

# Keep compressed file for reference
REFERENCE_GENOME_FOR_BWA="$REFERENCE_GENOME"

# Get unique sample names (remove _1/_2 suffix for paired-end)
SAMPLES=$(ls "$INPUT_DIR"/*.fastq 2>/dev/null | sed 's/_[12]\.fastq$//' | sort -u)

for sample in $SAMPLES; do
    basename=$(basename "$sample")
    
    echo ""
    echo "----------------------------------------"
    echo "Processing: $basename"
    echo "----------------------------------------"
    
    # Check if paired-end or single-end
    R1="${sample}_1.fastq"
    R2="${sample}_2.fastq"
    
    if [ -f "$R1" ] && [ -f "$R2" ]; then
        # Paired-end alignment with streaming (no SAM to disk)
        echo "📊 Step 1: Paired-end Alignment with BWA-MEM (streaming)..."
        bwa mem -t 4 "$REFERENCE_GENOME" "$R1" "$R2" 2> "$LOGS_DIR/${basename}_bwa.log" | \
            samtools view -Sb - 2> "$LOGS_DIR/${basename}_samtools_view.log" | \
            samtools sort -@ 4 -o "$OUTPUT_DIR/${basename}_sorted.bam" 2> "$LOGS_DIR/${basename}_samtools_sort.log"
    elif [ -f "${sample}.fastq" ]; then
        # Single-end alignment with streaming
        echo "📊 Step 1: Single-end Alignment with BWA-MEM (streaming)..."
        bwa mem -t 4 "$REFERENCE_GENOME" "${sample}.fastq" 2> "$LOGS_DIR/${basename}_bwa.log" | \
            samtools view -Sb - 2> "$LOGS_DIR/${basename}_samtools_view.log" | \
            samtools sort -@ 4 -o "$OUTPUT_DIR/${basename}_sorted.bam" 2> "$LOGS_DIR/${basename}_samtools_sort.log"
    else
        echo "⚠️ No input files found for $basename"
        continue
    fi
    
    # Step 2: Index BAM
    echo "📊 Step 2: Indexing BAM..."
    samtools index "$OUTPUT_DIR/${basename}_sorted.bam" 2> "$LOGS_DIR/${basename}_samtools_index.log"
    
    # Step 3: Variant Calling
    echo "📊 Step 3: Variant Calling with bcftools..."
    bcftools mpileup -f "$REFERENCE_GENOME" "$OUTPUT_DIR/${basename}_sorted.bam" 2> "$LOGS_DIR/${basename}_bcftools_mpileup.log" | \
        bcftools call -mv -Ov -o "$VCF_OUTPUT_DIR/${basename}_variants.vcf" 2>> "$LOGS_DIR/${basename}_bcftools_mpileup.log"
    
    # Step 4: Filter variants
    echo "📊 Step 4: Filtering variants..."
    bcftools filter -O v -o "$VCF_OUTPUT_DIR/${basename}_filtered.vcf" \
        -s LOWQUAL -g 10 -S 60 "$VCF_OUTPUT_DIR/${basename}_variants.vcf" 2> "$LOGS_DIR/${basename}_bcftools_filter.log"
    
    # Step 5: Annotate with ClinVar if available
    if [ -f "$ANNOTATION_DIR/clinvar.vcf" ]; then
        echo "📊 Step 5: Annotating with ClinVar..."
        bcftools annotate -a "$ANNOTATION_DIR/clinvar.vcf" \
            -c CHROM,POS,ID,REF,ALT,QUAL \
            -o "$VCF_OUTPUT_DIR/${basename}_annotated.vcf" \
            "$VCF_OUTPUT_DIR/${basename}_filtered.vcf" 2> "$LOGS_DIR/${basename}_bcftools_annotate.log"
    fi
    
    echo "✅ Completed: $basename"
    echo "   Output BAM: $OUTPUT_DIR/${basename}_sorted.bam"
    echo "   Output VCF: $VCF_OUTPUT_DIR/${basename}_filtered.vcf"
done

echo ""
echo "=========================================="
echo "✅ Pipeline completed successfully!"
echo "=========================================="
echo "BAM files are available in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*.bam 2>/dev/null || echo "No BAM files"
echo ""
echo "VCF files are available in: $VCF_OUTPUT_DIR"
ls -lh "$VCF_OUTPUT_DIR"/*.vcf 2>/dev/null || echo "No VCF files"
