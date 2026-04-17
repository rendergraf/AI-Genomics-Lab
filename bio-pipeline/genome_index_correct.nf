#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 PIPELINE 1: Reference Genome Preparation
// Input: genome.fa.gz (gzip compressed FASTA from Ensembl)
// Outputs:
//  1. genome.fa.gz.fai - FASTA index (samtools)
//  2. genome.fa.gz.gzi - GZI index
//  3. strobealign.sti - Strobealign index

params.genome_id = "hg38"
params.output_dir = "/datasets/reference_genome"
params.threads = 4

def GENOME_URLS = [
    "hg38": "https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz",
    "hg19": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/bigZips/hg19.fa.gz"
]

workflow {
    def url = GENOME_URLS[params.genome_id]
    if (!url) {
        error "Unknown genome: ${params.genome_id}"
    }
    
    // Download and prepare genome
    download_and_prepare_genome(url, params.genome_id)
}

process download_and_prepare_genome {
    cpus params.threads
    
    input:
        val(url)
        val(genome_id)
    
    output:
        path("${genome_id}.fa.gz"), emit: bgzip_fasta
        path("${genome_id}.fa.gz.fai"), emit: fai_index
        path("${genome_id}.fa.gz.gzi"), emit: gzi_index
        path("${genome_id}.fa.gz.sti"), emit: strobealign_index
        path("${genome_id}_prep_results.txt"), emit: results
    
    script:
    """
    set -e  # Exit on error
    
    echo "🧬 PIPELINE 1: Reference Genome Preparation"
    echo "Genome ID: ${genome_id}"
    echo "Threads: ${params.threads}"
    echo ""
    
    # Create output directory
    mkdir -p "${params.output_dir}"
    
    # Step 1: Download and convert gzip to bgzip
    echo "⬇️ Downloading ${genome_id} from Ensembl..."
    echo "📦 This may take several minutes (file size: ~841MB for hg38)..."
    wget --progress=dot:giga -O - "${url}" | \
        gunzip -c | \
        bgzip -@ ${params.threads} -c > "${params.output_dir}/${genome_id}.fa.gz"
    echo ""
    echo "✅ Download and bgzip conversion complete"
    
    # Step 2: Create FASTA index (.fai)
    echo "📊 Creating FASTA index (samtools faidx)..."
    samtools faidx "${params.output_dir}/${genome_id}.fa.gz"
    echo "✅ FAI index created"
    
    # Step 3: Verify GZI index exists (.gzi is auto-created by bgzip)
    echo "📊 Verifying GZI index..."
    if [ -f "${params.output_dir}/${genome_id}.fa.gz.gzi" ]; then
        echo "✅ GZI index exists"
    else
        echo "⚠️  GZI index not auto-created, creating manually..."
        bgzip -r "${params.output_dir}/${genome_id}.fa.gz"
    fi
    
    # Step 4: Create Strobealign index (.sti)
    # This creates a general genome index, not sample-specific
    echo "🎯 Creating Strobealign index (general genome index)..."
    strobealign -i -r 150 "${params.output_dir}/${genome_id}.fa.gz"
    
    # Rename strobealign index to standard name
    if [ -f "${params.output_dir}/${genome_id}.fa.gz.r150.sti" ]; then
        mv "${params.output_dir}/${genome_id}.fa.gz.r150.sti" "${params.output_dir}/${genome_id}.fa.gz.sti"
        echo "✅ Strobealign index created (renamed .r150.sti to .sti)"
    fi
           
    # Copy files to work directory for Nextflow output
    cp "${params.output_dir}/${genome_id}.fa.gz" .
    cp "${params.output_dir}/${genome_id}.fa.gz.fai" .
    cp "${params.output_dir}/${genome_id}.fa.gz.gzi" .
    if [ -f "${params.output_dir}/${genome_id}.fa.gz.sti" ]; then
        cp "${params.output_dir}/${genome_id}.fa.gz.sti" .
    else
        echo "⚠️  STI file not found in ${params.output_dir}"
    fi
    
    # Create simple results file
    echo "PIPELINE: genome_preparation" > "${genome_id}_prep_results.txt"
    echo "GENOME_ID: ${genome_id}" >> "${genome_id}_prep_results.txt"
    echo "STATUS: completed" >> "${genome_id}_prep_results.txt"
    echo "TIMESTAMP: \$(date)" >> "${genome_id}_prep_results.txt"
    echo "INPUT_URL: ${url}" >> "${genome_id}_prep_results.txt"
    echo "OUTPUT_FILES:" >> "${genome_id}_prep_results.txt"
    echo "  - ${params.output_dir}/${genome_id}.fa.gz" >> "${genome_id}_prep_results.txt"
    echo "  - ${params.output_dir}/${genome_id}.fa.gz.fai" >> "${genome_id}_prep_results.txt"
    echo "  - ${params.output_dir}/${genome_id}.fa.gz.gzi" >> "${genome_id}_prep_results.txt"
    echo "  - ${params.output_dir}/${genome_id}.fa.gz.sti" >> "${genome_id}_prep_results.txt"
    
    echo ""
    echo "✅ PIPELINE 1 COMPLETE"
    echo "📁 Output: ${params.output_dir}"
    echo "📄 Results: ${genome_id}_prep_results.txt"
    """
}

workflow.onComplete {
    println "=========================================="
    println "✅ PIPELINE 1: Reference Genome Preparation COMPLETE"
    println "Genome ID: ${params.genome_id}"
    println "Output directory: ${params.output_dir}"
    println "=========================================="
    
    // Print output file paths
    def output_dir = params.output_dir
    def genome_id = params.genome_id
    println "Generated files:"
    println "1. ${output_dir}/${genome_id}.fa.gz (bgzip compressed FASTA)"
    println "2. ${output_dir}/${genome_id}.fa.gz.fai (FASTA index)"
    println "3. ${output_dir}/${genome_id}.fa.gz.gzi (GZI index)"
    println "4. ${output_dir}/${genome_id}.fa.gz.sti (Strobealign index)"
    println "=========================================="
}
