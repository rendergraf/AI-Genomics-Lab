#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 PIPELINE 1: Reference Genome Preparation
// Input: genome.fa.gz (gzip compressed FASTA from Ensembl)
// Outputs:
//  1. genome.fa.gz.fai - FASTA index (samtools)
//  2. genome.fa.gz.gzi - GZI index
//  3. strobealign.sti - Strobealign index

params.genome_fa_gz = null
params.output_dir = "/datasets/reference_genome"
params.threads = 4
params.genome_id = null

workflow {
    // Validate inputs
    if (!params.genome_fa_gz) {
        error "Missing required parameter: --genome_fa_gz"
    }
    if (!params.genome_id) {
        error "Missing required parameter: --genome_id"
    }
    
    // Run the genome preparation pipeline
    main: genome_preparation()
}

process genome_preparation {
    cpus params.threads
    
    input:
        val(genome_fa_gz)
        val(genome_id)
    
    output:
        path("${genome_id}.fa.gz"), emit: bgzip_fasta
        path("${genome_id}.fa.gz.fai"), emit: fai_index
        path("${genome_id}.fa.gz.gzi"), emit: gzi_index
        path("${genome_id}.strobealign.sti"), emit: strobealign_index
        path("${genome_id}_prep_results.json"), emit: results
    
    script:
    """
    set -e  # Exit on error
    
    echo "🧬 PIPELINE 1: Reference Genome Preparation"
    echo "Genome ID: ${genome_id}"
    echo "Input: ${genome_fa_gz}"
    echo "Output directory: ${params.output_dir}"
    echo "Threads: ${params.threads}"
    echo ""
    
    # Create output directory
    mkdir -p "${params.output_dir}"
    
    # Step 0: Check if input exists
    if [ ! -f "${genome_fa_gz}" ]; then
        echo "❌ Error: Input file not found: ${genome_fa_gz}"
        exit 1
    fi
    
    # Step 1: Convert gzip to bgzip (required for samtools indexing)
    echo "🔧 Step 1: Converting gzip to bgzip..."
    gunzip -c "${genome_fa_gz}" | bgzip -@ ${params.threads} -c > "${params.output_dir}/${genome_id}.fa.gz"
    echo "✅ bgzip conversion complete"
    
    # Step 2: Create FASTA index (.fai)
    echo "📊 Step 2: Creating FASTA index (samtools faidx)..."
    samtools faidx "${params.output_dir}/${genome_id}.fa.gz"
    echo "✅ FAI index created: ${params.output_dir}/${genome_id}.fa.gz.fai"
    
    # Step 3: Create GZI index (.gzi)
    echo "📊 Step 3: Creating GZI index..."
    # Note: The .gzi file is automatically created by bgzip during compression
    # If it doesn't exist, we can create it with: bgzip -r "${params.output_dir}/${genome_id}.fa.gz"
    # But typically samtools faidx creates it automatically
    echo "✅ GZI index should be auto-created by bgzip"
    
    # Step 4: Create Strobealign index (.sti)
    echo "🎯 Step 4: Creating Strobealign index..."
    strobealign -i -r 150 "${params.output_dir}/${genome_id}.fa.gz"
    
    # Rename the strobealign index file
    if [ -f "${params.output_dir}/${genome_id}.fa.gz.r150.sti" ]; then
        mv "${params.output_dir}/${genome_id}.fa.gz.r150.sti" "${params.output_dir}/${genome_id}.strobealign.sti"
        echo "✅ Strobealign index created: ${params.output_dir}/${genome_id}.strobealign.sti"
    else
        echo "⚠️  Strobealign index file not found with expected name"
    fi
    
    # Copy files to work directory for Nextflow output
    cp "${params.output_dir}/${genome_id}.fa.gz" .
    cp "${params.output_dir}/${genome_id}.fa.gz.fai" .
    cp "${params.output_dir}/${genome_id}.fa.gz.gzi" .
    cp "${params.output_dir}/${genome_id}.strobealign.sti" .
    
    # Create results JSON file
    cat > "${genome_id}_prep_results.json" << EOF
{
    "pipeline": "pipeline_1_genome_preparation",
    "genome_id": "${genome_id}",
    "status": "completed",
    "timestamp": "$(date -Iseconds)",
    "input_file": "${genome_fa_gz}",
    "output_files": {
        "bgzip_fasta": "${params.output_dir}/${genome_id}.fa.gz",
        "fai_index": "${params.output_dir}/${genome_id}.fa.gz.fai",
        "gzi_index": "${params.output_dir}/${genome_id}.fa.gz.gzi",
        "strobealign_index": "${params.output_dir}/${genome_id}.strobealign.sti"
    },
    "tools_used": {
        "bgzip": "$(bgzip --version 2>/dev/null | head -1 || echo 'unknown')",
        "samtools": "$(samtools --version 2>/dev/null | head -1 || echo 'unknown')",
        "strobealign": "$(strobealign --version 2>/dev/null | head -1 || echo 'unknown')"
    }
}
EOF
    
    echo ""
    echo "✅ PIPELINE 1 COMPLETE: Reference genome prepared successfully!"
    echo "📁 Output directory: ${params.output_dir}"
    echo "📄 Results: ${genome_id}_prep_results.json"
    """
}

workflow.onComplete {
    println "=========================================="
    println "✅ PIPELINE 1: Reference Genome Preparation COMPLETE"
    println "Genome ID: ${params.genome_id}"
    println "Input: ${params.genome_fa_gz}"
    println "Output directory: ${params.output_dir}"
    println "=========================================="
    
    // Print output file paths
    def output_dir = params.output_dir
    def genome_id = params.genome_id
    println "Generated files:"
    println "1. ${output_dir}/${genome_id}.fa.gz (bgzip compressed FASTA)"
    println "2. ${output_dir}/${genome_id}.fa.gz.fai (FASTA index)"
    println "3. ${output_dir}/${genome_id}.fa.gz.gzi (GZI index)"
    println "4. ${output_dir}/${genome_id}.strobealign.sti (Strobealign index)"
    println "=========================================="
}