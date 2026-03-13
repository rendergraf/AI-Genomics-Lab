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
REFERENCE_GENOME="${REFERENCE_GENOME:-/datasets/reference_genome/Homo_sapiens.GRCh38.dna_sm.toplevel.fa}"
INPUT_DIR="${INPUT_DIR:-/datasets/fastq}"
OUTPUT_DIR="${OUTPUT_DIR:-/datasets/bam}"
VCF_OUTPUT_DIR="${VCF_OUTPUT_DIR:-/datasets/vcf}"
ANNOTATION_DIR="${ANNOTATION_DIR:-/datasets/annotations}"

echo "=========================================="
echo "🧬 AI Genomics Lab - Bio Pipeline"
echo "=========================================="
echo "Reference: $REFERENCE_GENOME"
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "VCF Output: $VCF_OUTPUT_DIR"
echo "=========================================="

# Create output directories
mkdir -p "$OUTPUT_DIR" "$VCF_OUTPUT_DIR"

# Check if reference genome exists
if [ ! -f "${REFERENCE_GENOME}" ]; then
    echo "⚠️ Reference genome not found at $REFERENCE_GENOME"
    echo "Please place Homo_sapiens.GRCh38.dna_sm.toplevel.fa in /datasets/reference_genome/"
    exit 1
fi

# Check if input files exist
if [ ! "$(ls -A $INPUT_DIR 2>/dev/null)" ]; then
    echo "⚠️ No input files found in $INPUT_DIR"
    echo "Please place FASTQ files in /datasets/fastq/"
    exit 1
fi

# Index reference if needed
REFERENCE_BASE=$(basename "$REFERENCE_GENOME" .fa)
REFERENCE_BASE=$(basename "$REFERENCE_BASE" .fasta)
REFERENCE_DIR=$(dirname "$REFERENCE_GENOME")

if [ ! -f "${REFERENCE_GENOME}.bwt" ]; then
    echo "📇 Indexing reference genome with BWA..."
    bwa index "$REFERENCE_GENOME"
fi

if [ ! -f "${REFERENCE_GENOME}.fai" ]; then
    echo "📇 Indexing reference genome with SAMtools..."
    samtools faidx "$REFERENCE_GENOME"
fi

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
        # Paired-end alignment
        echo "📊 Step 1: Paired-end Alignment with BWA-MEM..."
        bwa mem -t 4 "$REFERENCE_GENOME" "$R1" "$R2" > "$OUTPUT_DIR/${basename}.sam"
    elif [ -f "${sample}.fastq" ]; then
        # Single-end alignment
        echo "📊 Step 1: Single-end Alignment with BWA-MEM..."
        bwa mem -t 4 "$REFERENCE_GENOME" "${sample}.fastq" > "$OUTPUT_DIR/${basename}.sam"
    else
        echo "⚠️ No input files found for $basename"
        continue
    fi
    
    # Step 2: Convert SAM to BAM
    echo "📊 Step 2: Converting SAM to BAM..."
    samtools view -Sb "$OUTPUT_DIR/${basename}.sam" > "$OUTPUT_DIR/${basename}.bam"
    
    # Step 3: Sort BAM
    echo "📊 Step 3: Sorting BAM..."
    samtools sort "$OUTPUT_DIR/${basename}.bam" -o "$OUTPUT_DIR/${basename}_sorted.bam"
    
    # Step 4: Index BAM
    echo "📊 Step 4: Indexing BAM..."
    samtools index "$OUTPUT_DIR/${basename}_sorted.bam"
    
    # Step 5: Variant Calling
    echo "📊 Step 5: Variant Calling with bcftools..."
    bcftools mpileup -f "$REFERENCE_GENOME" "$OUTPUT_DIR/${basename}_sorted.bam" | \
        bcftools call -mv -Ov -o "$VCF_OUTPUT_DIR/${basename}_variants.vcf"
    
    # Step 6: Filter variants
    echo "📊 Step 6: Filtering variants..."
    bcftools filter -O v -o "$VCF_OUTPUT_DIR/${basename}_filtered.vcf" \
        -s LOWQUAL -g 10 -S 60 "$VCF_OUTPUT_DIR/${basename}_variants.vcf"
    
    # Step 7: Annotate with ClinVar if available
    if [ -f "$ANNOTATION_DIR/clinvar.vcf" ]; then
        echo "📊 Step 7: Annotating with ClinVar..."
        bcftools annotate -a "$ANNOTATION_DIR/clinvar.vcf" \
            -c CHROM,POS,ID,REF,ALT,QUAL \
            -o "$VCF_OUTPUT_DIR/${basename}_annotated.vcf" \
            "$VCF_OUTPUT_DIR/${basename}_filtered.vcf"
    fi
    
    echo "✅ Completed: $basename"
    echo "   Output BAM: $OUTPUT_DIR/${basename}_sorted.bam"
    echo "   Output VCF: $VCF_OUTPUT_DIR/${basename}_filtered.vcf"
    
    # Clean up intermediate files
    rm -f "$OUTPUT_DIR/${basename}.sam"
    rm -f "$OUTPUT_DIR/${basename}.bam"
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
