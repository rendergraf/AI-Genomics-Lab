#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 TEST Pipeline for quick testing (chromosome 21 only)

params.genome_id = "hg38-test"
params.output_dir = "/datasets/reference_genome/test"
params.threads = 4

def GENOME_URLS = [
    "hg38-test": "https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.chromosome.21.fa.gz",
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
    
    echo "🧬 TEST PIPELINE: Quick test with chromosome 21 (11MB)"
    echo "Genome ID: ${genome_id}"
    echo "Threads: ${params.threads}"
    echo ""
    
    # Create output directory
    mkdir -p "${params.output_dir}"
    
    # Step 1: Download and convert gzip to bgzip
    echo "⬇️ Downloading chromosome 21 (11MB)..."
    wget --progress=dot:giga -O - "${url}" | \
        gunzip -c | \
        bgzip -@ ${params.threads} -c > "${params.output_dir}/${genome_id}.fa.gz"
    echo ""
    echo "✅ Download complete"
    
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
    echo "🎯 Creating Strobealign index..."
    strobealign -i "${params.output_dir}/${genome_id}.fa.gz"
    echo "✅ Strobealign index created (${genome_id}.fa.gz.sti)"

    
    # Copy files to work directory for Nextflow output
    cp "${params.output_dir}/${genome_id}.fa.gz" .
    cp "${params.output_dir}/${genome_id}.fa.gz.fai" .
    cp "${params.output_dir}/${genome_id}.fa.gz.gzi" .
    if [ -f "${params.output_dir}/${genome_id}.fa.gz.sti" ]; then
        cp "${params.output_dir}/${genome_id}.fa.gz.sti" .
    else
        echo "⚠️  STI file not found in ${params.output_dir}"
    fi
    
    # Create results file
    echo "PIPELINE: genome_preparation_test" > "${genome_id}_prep_results.txt"
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
    echo "✅ TEST PIPELINE COMPLETE"
    echo "📁 Output: ${params.output_dir}"
    echo "📄 Results: ${genome_id}_prep_results.txt"
    """
}

workflow.onComplete {
    println "=========================================="
    println "✅ TEST PIPELINE COMPLETE"
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