#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 OPTIMIZED Genome Indexing Pipeline

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
        path("${genome_id}.fa.r150.sti"), emit: sti
        path("results.txt"), emit: results
    
    script:
    """
    set -e  # Exit on error
    
    echo "⬇️ Downloading ${genome_id}..."
    
    # Create output directory
    mkdir -p "${params.output_dir}"
    
    # Download and convert directly to bgzip in output directory
    # Esto evita guardar el gzip temporalmente
    wget -q -O - "${url}" | \
        gunzip -c | \
        bgzip -@ ${params.threads} -c > "${params.output_dir}/${genome_id}.fa.gz"
    
    echo "✅ Download and conversion complete"
    
    # Step 1: FASTA index (needs bgzip)
    echo "📊 Creating FASTA index..."
    samtools faidx "${params.output_dir}/${genome_id}.fa.gz"
    echo "✅ FAI created"
    
    # Step 2: strobealign index (needs bgzip)
    echo "🎯 Building strobealign index..."
    strobealign -i -r 150 "${params.output_dir}/${genome_id}.fa.gz"
    
    # Rename STI file
    if [ -f "${params.output_dir}/${genome_id}.fa.gz.sti" ]; then
        mv "${params.output_dir}/${genome_id}.fa.gz.sti" "${params.output_dir}/${genome_id}.fa.r150.sti"
        echo "✅ STI created"
    fi
    
    # Copy files for output (Nextflow needs them in work directory)
    cp "${params.output_dir}/${genome_id}.fa.gz" .
    cp "${params.output_dir}/${genome_id}.fa.gz.fai" .
    cp "${params.output_dir}/${genome_id}.fa.r150.sti" .
    
    # Create results file
    echo "PIPELINE: genome_index" > results.txt
    echo "GENOME_ID: ${genome_id}" >> results.txt
    echo "STATUS: completed" >> results.txt
    echo "OUTPUT_DIR: ${params.output_dir}" >> results.txt
    echo "FILES:" >> results.txt
    echo "  - ${params.output_dir}/${genome_id}.fa.gz" >> results.txt
    echo "  - ${params.output_dir}/${genome_id}.fa.gz.fai" >> results.txt
    echo "  - ${params.output_dir}/${genome_id}.fa.r150.sti" >> results.txt
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