#!/bin/bash
set -e

echo "Testing bgzip conversion..."
echo "Downloading test file..."

# Create a small test file
cat > test.fa << 'EOF'
>chr1
ACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGT
>chr2
TGCAACGTGCAACGTGCAACGTGCAACGTGCAACGTGCAACGTGCAAC
EOF

# Compress with gzip
echo "Compressing with gzip..."
gzip -c test.fa > test.fa.gz

# Test bgzip conversion
echo "Converting gzip to bgzip..."
bgzip -d -c test.fa.gz | bgzip -@ 4 -c > test.bgzip.fa.gz

echo "Checking if bgzip file is valid..."
bgzip -t test.bgzip.fa.gz && echo "✅ bgzip file is valid" || echo "❌ bgzip file is invalid"

echo "Testing samtools faidx on bgzip file..."
samtools faidx test.bgzip.fa.gz && echo "✅ samtools faidx works on bgzip" || echo "❌ samtools faidx failed"

echo "Testing samtools faidx on original gzip file..."
samtools faidx test.fa.gz && echo "✅ samtools faidx works on gzip" || echo "❌ samtools faidx failed on gzip"

echo "Cleaning up..."
rm -f test.fa test.fa.gz test.bgzip.fa.gz test.bgzip.fa.gz.fai