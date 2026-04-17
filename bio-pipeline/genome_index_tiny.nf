#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 TINY TEST Genome Indexing Pipeline

params.genome_id = "test"
params.output_dir = "/datasets/reference_genome/test"
params.threads = 4

workflow {
    index_genome()
}

process index_genome {
    cpus params.threads
    
    output:
        path("test.fa.gz"), emit: bgzip
        path("test.fa.gz.fai"), emit: fai
        path("results.txt"), emit: results
    
    script:
    """
    set -e  # Exit on error
    
    echo "🧬 Creating test FASTA..."
    
    # Create a tiny test FASTA file
    cat > test.fa << 'EOF'
>chr1
ACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGT
>chr2
TGCAACGTGCAACGTGCAACGTGCAACGTGCAACGTGCAACGTGCAAC
EOF
    
    echo "🔧 Converting to bgzip..."
    bgzip -@ ${params.threads} -c test.fa > test.fa.gz
    
    # Create output directory
    mkdir -p "${params.output_dir}"
    
    # Copy to output directory
    cp test.fa.gz "${params.output_dir}/"
    
    # Create FASTA index
    echo "📊 Creating FASTA index..."
    samtools faidx "${params.output_dir}/test.fa.gz"
    echo "✅ FAI created"
    
    # Copy files for output
    cp "${params.output_dir}/test.fa.gz" .
    cp "${params.output_dir}/test.fa.gz.fai" .
    
    # Create results file
    echo "PIPELINE: genome_index" > results.txt
    echo "GENOME_ID: test" >> results.txt
    echo "STATUS: completed" >> results.txt
    echo "OUTPUT_DIR: ${params.output_dir}" >> results.txt
    echo "TIMESTAMP: \$(date)" >> results.txt
    
    echo "✅ Test genome indexing complete!"
    """
}

workflow.onComplete {
    println "=========================================="
    println "✅ Nextflow pipeline complete!"
    println "Output: ${params.output_dir}"
    println "=========================================="
}