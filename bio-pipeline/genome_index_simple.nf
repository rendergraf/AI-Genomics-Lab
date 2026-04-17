#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 Simple Genome Indexing Pipeline

params.genome_id = "hg38"
params.output_dir = "/datasets/reference_genome"

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
    cpus 4
    
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
    echo "⬇️ Downloading ${genome_id}..."
    wget -q -O "${genome_id}.fa.gz" "${url}"
    echo "✅ Download complete"
    
    echo "🧬 Indexing ${genome_id}..."
    
    # Create output directory
    mkdir -p "${params.output_dir}"
    
    # Copy to output directory
    cp "${genome_id}.fa.gz" "${params.output_dir}/"
    
    # Step 1: FASTA index
    echo "📊 Creating FASTA index..."
    samtools faidx "${params.output_dir}/${genome_id}.fa.gz"
    echo "✅ FAI created"
    
    # Step 2: strobealign index
    echo "🎯 Building strobealign index..."
    strobealign -i -r 150 "${params.output_dir}/${genome_id}.fa.gz"
    
    # Rename STI file
    if [ -f "${params.output_dir}/${genome_id}.fa.gz.sti" ]; then
        mv "${params.output_dir}/${genome_id}.fa.gz.sti" "${params.output_dir}/${genome_id}.fa.r150.sti"
        echo "✅ STI created"
    fi
    
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
    
    echo "✅ Genome indexing complete!"
    """
}

workflow.onComplete {
    println "=========================================="
    println "✅ Nextflow pipeline complete!"
    println "Genome: ${params.genome_id}"
    println "Output: ${params.output_dir}"
    println "=========================================="
}
