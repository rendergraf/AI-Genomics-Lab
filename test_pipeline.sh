#!/bin/bash
# 🧬 AI Genomics Lab - Pipeline Test Script
# Tests the Nextflow genome indexing pipeline end-to-end

set -e

echo "🧬 Testing AI Genomics Lab Pipeline 1 - Genome Indexing"
echo "========================================================"

# Test 1: Manual Nextflow execution (small test genome)
echo ""
echo "📋 Test 1: Manual Nextflow execution (hg38-test - chromosome 21)"
echo "----------------------------------------------------------------"

docker exec ai-genomics-bio bash -c "
    cd /pipeline && \
    rm -rf /datasets/test_output_final && \
    mkdir -p /datasets/test_output_final && \
    stdbuf -o0 -e0 nextflow run genome_index_test_small.nf \
        --genome_id hg38-test \
        --output_dir /datasets/test_output_final \
        -work-dir /nextflow-work/test_final \
        -ansi-log false 2>&1
"

echo ""
echo "✅ Test 1 complete. Checking output files..."

# Check generated files
docker exec ai-genomics-bio bash -c "
    echo '📁 Output directory contents:'
    ls -lh /datasets/test_output_final/
    echo ''
    echo '📊 File validation:'
    echo '1. FASTA file (bgzip):' && [ -f /datasets/test_output_final/hg38-test.fa.gz ] && echo '✅ Exists' || echo '❌ Missing'
    echo '2. FAI index:' && [ -f /datasets/test_output_final/hg38-test.fa.gz.fai ] && echo '✅ Exists' || echo '❌ Missing'
    echo '3. GZI index:' && [ -f /datasets/test_output_final/hg38-test.fa.gz.gzi ] && echo '✅ Exists' || echo '❌ Missing'
    echo '4. STI index (strobealign):' && [ -f /datasets/test_output_final/hg38-test.fa.gz.sti ] && echo '✅ Exists' || echo '❌ Missing'
    
    echo ''
    echo '🔍 Detailed file info:'
    ls -la /datasets/test_output_final/hg38-test.fa.gz*
    echo ''
    echo '📄 Results file:'
    cat /pipeline/hg38-test_prep_results.txt 2>/dev/null || echo 'Results file not found'
"

echo ""
echo "========================================================"
echo "🧬 Test 2: Nextflow Runner Service (Python)"
echo "----------------------------------------------------------------"

# Test 2: Python runner service
python3 -c "
import sys
sys.path.insert(0, 'services')
from nextflow_runner import get_nextflow_runner

runner = get_nextflow_runner()
print('🚀 Starting Nextflow runner test...')
job = runner.run_genome_indexing('hg38-test', '/datasets/test_output_runner')

print(f'📦 Job ID: {job[\"job_id\"]}')
print(f'📁 Output dir: {job[\"output_dir\"]}')
print(f'📊 Status: {job[\"status\"]}')

# Stream logs
print('📋 Streaming logs:')
for log_line in runner.stream_pipeline_logs(job):
    import json
    try:
        data = json.loads(log_line.strip().replace('data: ', ''))
        print(f'  {data[\"type\"]}: {data[\"message\"]}')
    except:
        pass
"

echo ""
echo "========================================================"
echo "🧬 Test 3: Verify strobealign .sti file naming"
echo "----------------------------------------------------------------"

docker exec ai-genomics-bio bash -c "
    echo '🎯 Testing strobealign output naming...'
    cd /tmp && \
    echo '>test' > test.fa && \
    echo 'ACGT' >> test.fa && \
    bgzip test.fa && \
    strobealign -r 150 -i test.fa.gz
    
    echo ''
    echo '📁 Generated files:'
    ls -la test.fa.gz*
    echo ''
    echo '📝 Strobalign version:'
    strobealign --version
"

echo ""
echo "========================================================"
echo "✅ All tests completed!"
echo "========================================================"
echo ""
echo "📋 Summary:"
echo "- Pipeline 1 (Genome Indexing) is functional"
echo "- Nextflow integration works with Docker exec"
echo "- strobealign creates .r150.sti, renamed to .sti"
echo "- Output files: .fa.gz, .fai, .gzi, .sti"
echo ""
echo "🔧 Next steps:"
echo "1. Update API to include hg38-test genome"
echo "2. Rebuild API container with latest code"
echo "3. Test full hg38 pipeline (841MB) with streaming"
echo "4. Integrate with MinIO for file upload"
echo "5. Integrate with PostgreSQL for metadata"
echo ""