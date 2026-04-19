#!/usr/bin/env nextflow
nextflow.enable.dsl = 2

// 🧬 PIPELINE 1: Reference Genome Preparation
// Input: genome.fa.gz (gzip compressed FASTA from Ensembl)
// Outputs:
//  1. genome.fa.gz.fai - FASTA index (samtools)
//  2. genome.fa.gz.gzi - GZI index
//  3. strobealign.sti - Strobealign index

params.genome_id = "hg38"
params.genome_url = null
params.output_dir = "/datasets/reference_genome"
params.threads = null
params.read_length = 150
params.minio_bucket = "genomics"
params.minio_prefix = "reference_genome"

// Auto-detect threads if not provided
def available_cpus = Runtime.runtime.availableProcessors()
params.threads = params.threads ?: Math.max(2, (available_cpus * 0.75).toInteger())

workflow {
    if (!params.genome_url) {
        error "Genome URL is required. Provide --genome_url parameter."
    }
    def url = params.genome_url
    
    // Download and prepare genome
    download_and_prepare_genome(url, params.genome_id)
    
    // Upload to MinIO
    upload_to_minio(
        download_and_prepare_genome.out.bgzip_fasta,
        download_and_prepare_genome.out.fai_index,
        download_and_prepare_genome.out.gzi_index,
        download_and_prepare_genome.out.strobealign_index,
        params.genome_id
    )
    
    // Emit workflow outputs
    emit:
        bgzip_fasta = upload_to_minio.out.bgzip_fasta_url
        fai_index = upload_to_minio.out.fai_index_url
        gzi_index = upload_to_minio.out.gzi_index_url
        strobealign_index = upload_to_minio.out.strobealign_index_url
        results = download_and_prepare_genome.out.results
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
        path("${genome_id}.fa.gz.r${params.read_length}.sti"), emit: strobealign_index
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
    strobealign -i -r ${params.read_length} "${params.output_dir}/${genome_id}.fa.gz"
    
    # Find actual STI file generated (strobealign may round read length)
    actual_sti=$(ls "${params.output_dir}/${genome_id}.fa.gz.r"*.sti 2>/dev/null | head -1)
    
    if [ -n "$actual_sti" ] && [ -f "$actual_sti" ]; then
        actual_name=$(basename "$actual_sti")
        echo "✅ Strobealign index created: $actual_name"
        
        # If the actual name doesn't match expected read length, rename it
        expected_name="${genome_id}.fa.gz.r${params.read_length}.sti"
        if [ "$actual_name" != "$expected_name" ]; then
            echo "⚠️  STI file has different read length ($actual_name), renaming to $expected_name"
            cp "$actual_sti" "${params.output_dir}/$expected_name"
        fi
    else
        echo "⚠️  No STI file found after strobealign indexing"
    fi
            
    # Copy files to work directory for Nextflow output
    cp "${params.output_dir}/${genome_id}.fa.gz" .
    cp "${params.output_dir}/${genome_id}.fa.gz.fai" .
    cp "${params.output_dir}/${genome_id}.fa.gz.gzi" .
    if [ -f "${params.output_dir}/${genome_id}.fa.gz.r${params.read_length}.sti" ]; then
        cp "${params.output_dir}/${genome_id}.fa.gz.r${params.read_length}.sti" .
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
    echo "  - ${params.output_dir}/${genome_id}.fa.gz.r${params.read_length}.sti" >> "${genome_id}_prep_results.txt"
    
    echo ""
    echo "✅ PIPELINE 1 COMPLETE"
    echo "📁 Output: ${params.output_dir}"
    echo "📄 Results: ${genome_id}_prep_results.txt"
    """
}

process upload_to_minio {
    tag "Upload ${genome_id} to MinIO"
    
    input:
        path bgzip_fasta
        path fai_index
        path gzi_index
        path strobealign_index
        val genome_id
    
    output:
        path "bgzip_fasta_url", emit: bgzip_fasta_url
        path "fai_index_url", emit: fai_index_url
        path "gzi_index_url", emit: gzi_index_url
        path "strobealign_index_url", emit: strobealign_index_url
    
    script:
    """
    set -e
    
    # Send info messages to stderr, URLs to stdout
    echo "☁️ Uploading ${genome_id} files to MinIO..." >&2
    
    # Configure mc alias if not already configured
    if ! mc alias list | grep -q "genomics"; then
        echo "Configuring mc alias..." >&2
        mc alias set genomics http://\${MINIO_ENDPOINT:-minio:9000} \${MINIO_ACCESS_KEY:-genomics} \${MINIO_SECRET_KEY:-genomics} > /dev/null 2>&1
    fi
    
    # Ensure bucket exists
    mc mb -p genomics/${params.minio_bucket} > /dev/null 2>&1 || true
    
    # Initialize URL variables
    bgzip_url=""
    fai_url=""
    gzi_url=""
    sti_url=""
    
    # Upload each file
    for file_path in "$bgzip_fasta" "$fai_index" "$gzi_index" "$strobealign_index"; do
        if [ -f "\$file_path" ]; then
            filename=\$(basename "\$file_path")
            object_name="${params.minio_prefix}/${genome_id}/\$filename"
            echo "Uploading \$filename..." >&2
            # Suppress all mc output, only show errors if they occur
            if ! mc cp "\$file_path" "genomics/${params.minio_bucket}/\$object_name" > /dev/null 2>&1; then
                echo "❌ Failed to upload \$filename" >&2
                exit 1
            fi
            url="s3://${params.minio_bucket}/\$object_name"
            
            # Store URL based on file type
            if [[ "\$filename" == *.fa.gz && ! "\$filename" == *.fa.gz.fai && ! "\$filename" == *.fa.gz.gzi && ! "\$filename" == *.fa.gz.sti && ! "\$filename" == *.fa.gz.r*.sti ]]; then
                bgzip_url="\$url"
            elif [[ "\$filename" == *.fa.gz.fai ]]; then
                fai_url="\$url"
            elif [[ "\$filename" == *.fa.gz.gzi ]]; then
                gzi_url="\$url"
            elif [[ "\$filename" == *.fa.gz.sti ]]; then
                sti_url="\$url"
            elif [[ "\$filename" == *.fa.gz.r*.sti ]]; then
                sti_url="\$url"
            fi
            echo "✅ Uploaded: \$url" >&2
        else
            echo "⚠️ File not found: \$file_path" >&2
        fi
    done
    
    # Ensure all variables have values (even if empty strings)
    bgzip_url="\${bgzip_url:-}"
    fai_url="\${fai_url:-}"
    gzi_url="\${gzi_url:-}"
    sti_url="\${sti_url:-}"
    
    # Write each URL to its own file (Nextflow will capture these files)
    echo "\$bgzip_url" > bgzip_fasta_url
    echo "\$fai_url" > fai_index_url
    echo "\$gzi_url" > gzi_index_url
    echo "\$sti_url" > strobealign_index_url
    
    echo "✅ Upload completed" >&2
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
    println "4. ${output_dir}/${genome_id}.fa.gz.r${params.read_length}.sti (Strobealign index)"
    println "=========================================="
}
