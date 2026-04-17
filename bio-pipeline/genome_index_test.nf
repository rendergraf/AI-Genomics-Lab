#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 TEST Genome Indexing Pipeline

params.genome_id = "hg38"
params.output_dir = "/datasets/reference_genome/test"
params.threads = 4

def GENOME_URLS = [
    "hg38": "https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz"
]

workflow {
    def url = GENOME_URLS[params.genome_id]
    if (!url) {
        error "Unknown genome: ${params.genome_id}"
    }
    
    // Single process that does everything
    index_genome(url, params.genome_id)
}

process index_genome {
    cpus params.threads
    
    input:
        val(url)
        val(genome_id)
    
    output:
        path("${genome_id}.fa.gz"), emit: bgzip
        path("${genome_id}.fa.gz.fai"), emit: fai
        path("results.txt"), emit: results
    
    script:
    """
    set -e  # Exit on error
    
    echo "⬇️ Downloading ${genome_id}..."
    wget -q -O "${genome_id}.gzip.fa.gz" "${url}"
    echo "✅ Download complete"
    
    echo "🧬 Indexing ${genome_id}..."
    
    # Create output directory
    mkdir -p "${params.output_dir}"
    
    # Convert gzip to bgzip
    echo "🔧 Converting gzip to bgzip..."
    bgzip -d -c "${genome_id}.gzip.fa.gz" | bgzip -@ ${params.threads} -c > "${genome_id}.fa.gz"
    
    # Move bgzip file to output directory
    mv "${genome_id}.fa.gz" "${params.output_dir}/"
    
    # Step 1: FASTA index (now works with bgzip)
    echo "📊 Creating FASTA index..."
    samtools faidx "${params.output_dir}/${genome_id}.fa.gz"
    echo "✅ FAI created"
    
    # Copy files for output
    cp "${params.output_dir}/${genome_id}.fa.gz" .
    cp "${params.output_dir}/${genome_id}.fa.gz.fai" .
    
    # Create results file
    echo "PIPELINE: genome_index" > results.txt
    echo "GENOME_ID: ${genome_id}" >> results.txt
    echo "STATUS: completed" >> results.txt
    echo "OUTPUT_DIR: ${params.output_dir}" >> results.txt
    echo "TIMESTAMP: \$(date)" >> results.txt
    
    echo "✅ Genome indexing complete for ${genome_id}!"
    """
}

workflow.onComplete {
    println "=========================================="
    println "✅ Nextflow pipeline complete!"
    println "Genome: ${params.genome_id}"
    println "Output: ${params.output_dir}"
    println "=========================================="
}