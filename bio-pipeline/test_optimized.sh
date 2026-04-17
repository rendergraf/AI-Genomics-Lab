#!/bin/bash
set -e

echo "🧬 Testing optimized pipeline logic..."

# Create a small test file
cat > test.fa << 'EOF'
>chr1
ACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGT
>chr2
TGCAACGTGCAACGTGCAACGTGCAACGTGCAACGTGCAACGTGCAAC
EOF

# Compress with gzip (simulating Ensembl download)
gzip -c test.fa > test.fa.gz

echo "Testing pipe download and conversion..."
cat test.fa.gz | gunzip -c | bgzip -@ 4 -c > test.bgzip.fa.gz

echo "Testing samtools faidx..."
samtools faidx test.bgzip.fa.gz && echo "✅ samtools faidx works" || echo "❌ samtools faidx failed"

echo "Testing strobealign index..."
strobealign -i -r 150 test.bgzip.fa.gz && echo "✅ strobealign index works" || echo "❌ strobealign index failed"

# Check if STI file was created
if [ -f "test.bgzip.fa.gz.sti" ]; then
    echo "✅ STI file created: test.bgzip.fa.gz.sti"
    mv test.bgzip.fa.gz.sti test.bgzip.fa.r150.sti
fi

echo "Cleaning up..."
rm -f test.fa test.fa.gz test.bgzip.fa.gz test.bgzip.fa.gz.fai test.bgzip.fa.r150.sti

echo "✅ Test complete!"