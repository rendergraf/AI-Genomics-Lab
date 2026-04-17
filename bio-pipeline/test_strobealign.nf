#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

params.genome_id = "test"
params.output_dir = "/datasets/reference_genome_test"
params.threads = 4

workflow {
    download_and_prepare_genome()
}

process download_and_prepare_genome {
    cpus params.threads
    
    output:
        path("${params.genome_id}.fa.gz"), emit: bgzip_fasta
        path("${params.genome_id}.fa.gz.fai"), emit: fai_index
        path("${params.genome_id}.fa.gz.gzi"), emit: gzi_index
        path("${params.genome_id}.fa.gz.sti"), emit: strobealign_index
    
    script:
    """
    set -e
    
    echo "🧬 Testing strobealign output renaming..."
    
    # Create a minimal test file
    echo ">chr1" > test.fa
    echo "ACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGT" >> test.fa
    echo ">chr2" >> test.fa
    echo "TGCAACGTGCAACGTGCAACGTGCAACGTGCAACGTGCAACGTGCAAC" >> test.fa
    
    # Compress with bgzip
    bgzip -@ ${params.threads} test.fa
    
    # Create FASTA index
    samtools faidx test.fa.gz
    
    # Create strobealign index (will create .r150.sti)
    strobealign -i test.fa.gz
    
    # Rename .r150.sti to .sti
    if [ -f "test.fa.gz.r150.sti" ]; then
        mv "test.fa.gz.r150.sti" "${params.genome_id}.fa.gz.sti"
        echo "✅ Renamed .r150.sti to .sti"
    fi
    
    cp test.fa.gz "${params.genome_id}.fa.gz"
    cp test.fa.gz.fai "${params.genome_id}.fa.gz.fai"
    cp test.fa.gz.gzi "${params.genome_id}.fa.gz.gzi"
    
    echo "✅ Test complete"
    """
}
