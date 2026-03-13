#!/bin/bash
# 🧬 AI Genomics Lab - Bioinformatics Pipeline
# Pipeline: FASTQ → Alignment → BAM → Sorting → Variant Calling → VCF

set -e

# Configuration
REFERENCE_GENOME="${REFERENCE_GENOME:-/reference/hg38.fa}"
INPUT_DIR="${INPUT_DIR:-/datasets}"
OUTPUT_DIR="${OUTPUT_DIR:-/output}"

echo "=========================================="
echo "🧬 AI Genomics Lab - Bio Pipeline"
echo "=========================================="
echo "Reference: $REFERENCE_GENOME"
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "=========================================="

# Check if reference genome exists
if [ ! -f "${REFERENCE_GENOME}.fa" ] && [ ! -f "${REFERENCE_GENOME}.fasta" ]; then
    echo "⚠️ Reference genome not found at $REFERENCE_GENOME"
    echo "Downloading human reference genome (hg38)..."
    
    mkdir -p /reference
    cd /reference
    
    # Download hg38 from NCBI
    wget -q https://ftp.ncbi.nih.gov/genomes/all/GCF/000/001/405/GCF_000001405.39_GRCh38.p13/GCF_000001405.39_GRCh38.p13_genomic.fna
    mv GCF_000001405.39_GRCh38.p13_genomic.fna hg38.fa
    
    # Index reference with BWA
    echo "📇 Indexing reference genome with BWA..."
    bwa index hg38.fa
    
    echo "📇 Indexing reference genome with SAMtools..."
    samtools faidx hg38.fa
    
    REFERENCE_GENOME="/reference/hg38"
fi

# Process each FASTQ file in input directory
for fastq_file in "$INPUT_DIR"/*.fastq "$INPUT_DIR"/*.fq; do
    if [ -f "$fastq_file" ]; then
        basename=$(basename "$fastq_file" .fastq)
        basename=$(basename "$basename" .fq)
        
        echo ""
        echo "----------------------------------------"
        echo "Processing: $basename"
        echo "----------------------------------------"
        
        # Step 1: Alignment with BWA
        echo "📊 Step 1: Alignment with BWA-MEM..."
        bwa mem -t 4 "$REFERENCE_GENOME" "$fastq_file" > "$OUTPUT_DIR/${basename}.sam"
        
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
        bcftools mpileup -f "${REFERENCE_GENOME}.fa" "$OUTPUT_DIR/${basename}_sorted.bam" | \
            bcftools call -mv -Ov -o "$OUTPUT_DIR/${basename}_variants.vcf"
        
        # Step 6: Filter variants
        echo "📊 Step 6: Filtering variants..."
        bcftools filter -O v -o "$OUTPUT_DIR/${basename}_filtered.vcf" \
            -s LOWQUAL -g 10 -S 60 "$OUTPUT_DIR/${basename}_variants.vcf"
        
        echo "✅ Completed: $basename"
        echo "   Output VCF: $OUTPUT_DIR/${basename}_filtered.vcf"
        
        # Clean up intermediate files
        rm -f "$OUTPUT_DIR/${basename}.sam"
        rm -f "$OUTPUT_DIR/${basename}.bam"
    fi
done

echo ""
echo "=========================================="
echo "✅ Pipeline completed successfully!"
echo "=========================================="
echo "VCF files are available in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*.vcf
