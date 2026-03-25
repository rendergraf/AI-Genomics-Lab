#!/bin/bash
# mini-dashboard automático para VCFs
# Detecta VCF en datasets/vcf y genera CSV ordenado en datasets/csv

VCF_DIR="datasets/vcf"
CSV_DIR="datasets/csv"

mkdir -p "$CSV_DIR"

VCF_FILE=$(ls "$VCF_DIR"/*.vcf 2>/dev/null | head -n1)

if [ -z "$VCF_FILE" ]; then
    echo "❌ No se encontró ningún VCF en $VCF_DIR"
    exit 1
fi

BASE=$(basename "$VCF_FILE" .vcf)
OUT_CSV="$CSV_DIR/${BASE}_dashboard.csv"
TMP_CSV="$CSV_DIR/${BASE}_tmp.csv"

# Cabecera
echo "Chromosome,SNPs,Indels,Ts,Tv,Ts/Tv,HighQualVariants" > "$OUT_CSV"

# Generar datos sin ordenar
bcftools query -f '%CHROM\t%REF\t%ALT\t%QUAL\n' "$VCF_FILE" | \
awk -F'\t' '{
    chrom=$1
    ref=$2
    alt=$3
    qual=$4

    chromosomes[chrom]=1

    # Detectar SNP vs INDEL
    if(length(ref)==1 && length(alt)==1){
        snps[chrom]++

        # Ts / Tv
        if((ref=="A" && alt=="G") || (ref=="G" && alt=="A") ||
           (ref=="C" && alt=="T") || (ref=="T" && alt=="C")){
            ts[chrom]++
        } else {
            tv[chrom]++
        }
    } else {
        indels[chrom]++
    }

    if(qual>30) hq[chrom]++
}
END{
    for(c in chromosomes){
        s=snps[c]+0
        i=indels[c]+0
        t=ts[c]+0
        v=tv[c]+0
        h=hq[c]+0
        ratio=(v==0 ? "NA" : t/v)
        print c","s","i","t","v","ratio","h
    }
}' > "$TMP_CSV"

# Ordenar: primero cromosomas principales
grep -E '^chr([1-9]|1[0-9]|2[0-2]|X|Y|M),' "$TMP_CSV" | \
sort -t',' -k1,1V >> "$OUT_CSV"

# Luego los secundarios
grep -v -E '^chr([1-9]|1[0-9]|2[0-2]|X|Y|M),' "$TMP_CSV" | \
sort >> "$OUT_CSV"

# Limpiar temporal
rm "$TMP_CSV"

echo "✅ Dashboard generado y ordenado en $OUT_CSV"