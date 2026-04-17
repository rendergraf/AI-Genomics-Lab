#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 Genome Indexing Pipeline (Nextflow)
// Replaces index_genome.sh with proper pipeline orchestration

params.genome_id = "hg38"
params.output_dir = "/datasets/reference_genome"
params.threads = 4

def REMOTE_GENOMES = [
    "hg38": [
        "name": "hg38",
        "url": "https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz"
    ],
    "hg19": [
        "name": "hg19",
        "url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/bigZips/hg19.fa.gz"
    ]
]

workflow {
    def genome_config = REMOTE_GENOMES[params.genome_id]
    if (!genome_config) {
        error "Unknown genome: ${params.genome_id}"
    }
    
    // Download genome
    Channel.of(genome_config)
        | download_genome
        | index_genome
        | collect_results
}

process download_genome {
    input:
        val(genome_config)
    
    output:
        path("${genome_config.name}.fa.gz"), emit: genome_gz
    
    script:
    def genome_name = genome_config.name
    def url = genome_config.url
    """
    echo "⬇️ Downloading ${genome_name}..."
    wget -q -O "${genome_name}.fa.gz" "${url}"
    echo "✅ Download complete: ${genome_name}.fa.gz"
    """
}

process index_genome {
    cpus params.threads
    
    input:
        path(genome_gz)
    
    output:
        path("*.fa.gz"), emit: bgzip
        path("*.fa.gz.fai"), emit: fai
        path("*.fa.gz.sti"), emit: sti
        path("indexed.txt"), emit: status
    
    script:
    def base_name = genome_gz.baseName.replace('.fa.gz', '')
    """
    echo "🧬 Indexing ${base_name}..."
    
    # Create output directory
    mkdir -p "${params.output_dir}"
    
    # Copy genome to output directory
    cp "${genome_gz}" "${params.output_dir}/${base_name}.fa.gz"
    
    # Step 1: FASTA index
    echo "📊 Creating FASTA index..."
    samtools faidx "${params.output_dir}/${base_name}.fa.gz"
    echo "✅ FAI created"
    
    # Step 2: strobealign index
    echo "🎯 Building strobealign index..."
    strobealign -i "${params.output_dir}/${base_name}.fa.gz"
    echo "✅ STI created"
        
    # Create status file
    echo "indexed" > indexed.txt
    """
}

process collect_results {
    input:
        path(bgzip)
        path(fai)
        path(sti)
        path(status)
    
    output:
        path("results.txt"), emit: results
    
    script:
    """
    echo "PIPELINE: genome_index" > results.txt
    echo "GENOME_ID: ${params.genome_id}" >> results.txt
    echo "STATUS: completed" >> results.txt
    echo "OUTPUT_DIR: ${params.output_dir}" >> results.txt
    echo "FILES:" >> results.txt
    echo "  - ${bgzip}" >> results.txt
    echo "  - ${fai}" >> results.txt
    echo "  - ${sti}" >> results.txt
    echo "TIMESTAMP: \$(date)" >> results.txt
    """
}

workflow.onComplete {
    println "=========================================="
    println "✅ Nextflow pipeline complete!"
    println "Genome: ${params.genome_id}"
    println "Output: ${params.output_dir}"
    println "=========================================="
}