#!/usr/bin/env python3
"""
🧬 AI Genomics Lab - Sample Data Ingestion
Script para cargar datos de ejemplo en Neo4j

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import asyncio
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.neo4j_service import Neo4jService


async def ingest_sample_data():
    """Ingest sample data into Neo4j"""
    
    neo4j = Neo4jService()
    await neo4j.connect()
    
    print("🧬 AI Genomics Lab - Sample Data Ingestion")
    print("=" * 50)
    
    # Sample Genes
    genes = [
        {
            "gene_id": "BRCA1",
            "name": "BRCA1 DNA Repair Associated",
            "chromosome": "17",
            "start_position": 43044295,
            "end_position": 43170245,
            "description": "BRCA1 repairs DNA and maintains genome stability. Mutations increase breast and ovarian cancer risk."
        },
        {
            "gene_id": "BRCA2",
            "name": "BRCA2 DNA Repair Associated",
            "chromosome": "13",
            "start_position": 32889611,
            "end_position": 32973809,
            "description": "BRCA2 is involved in homologous recombination repair."
        },
        {
            "gene_id": "TP53",
            "name": "Tumor Protein P53",
            "chromosome": "17",
            "start_position": 7661779,
            "end_position": 7687538,
            "description": "TP53 is a tumor suppressor gene that regulates cell cycle and apoptosis."
        },
        {
            "gene_id": "EGFR",
            "name": "Epidermal Growth Factor Receptor",
            "chromosome": "7",
            "start_position": 55019017,
            "end_position": 55242528,
            "description": "EGFR is a cell surface receptor involved in cell growth and division."
        },
        {
            "gene_id": "KRAS",
            "name": "KRAS Proto-Oncogene",
            "chromosome": "12",
            "start_position": 25205246,
            "end_position": 25380203,
            "description": "KRAS is a GTPase involved in cell signaling pathways."
        },
        {
            "gene_id": "PIK3CA",
            "name": "Phosphatidylinositol-4,5-Bisphosphate 3-Kinase Catalytic Subunit Alpha",
            "chromosome": "3",
            "start_position": 178866882,
            "end_position": 178958874,
            "description": "PIK3CA is a catalytic subunit of PI3K involved in cell growth."
        },
    ]
    
    # Sample Mutations
    mutations = [
        {
            "mutation_id": "c.68_69delAG",
            "gene_id": "BRCA1",
            "mutation_type": "indel",
            "position": 43070976,
            "ref_allele": "AG",
            "alt_allele": "-",
            "pathogenicity": "pathogenic",
            "clinvar_id": "CV0000456"
        },
        {
            "mutation_id": "c.5266dupC",
            "gene_id": "BRCA1",
            "mutation_type": "indel",
            "position": 43090781,
            "ref_allele": "C",
            "alt_allele": "CC",
            "pathogenicity": "pathogenic",
            "clinvar_id": "CV0000167"
        },
        {
            "mutation_id": "R273H",
            "gene_id": "TP53",
            "mutation_type": "SNP",
            "position": 7674220,
            "ref_allele": "G",
            "alt_allele": "A",
            "pathogenicity": "pathogenic",
            "clinvar_id": "CV0000874"
        },
        {
            "mutation_id": "L858R",
            "gene_id": "EGFR",
            "mutation_type": "SNP",
            "position": 55259515,
            "ref_allele": "T",
            "alt_allele": "G",
            "pathogenicity": "pathogenic",
            "clinvar_id": "CV0000194"
        },
        {
            "mutation_id": "G12D",
            "gene_id": "KRAS",
            "mutation_type": "SNP",
            "position": 25245340,
            "ref_allele": "G",
            "alt_allele": "A",
            "pathogenicity": "pathogenic",
            "clinvar_id": "CV0000673"
        },
        {
            "mutation_id": "E545K",
            "gene_id": "PIK3CA",
            "mutation_type": "SNP",
            "position": 178936091,
            "ref_allele": "G",
            "alt_allele": "A",
            "pathogenicity": "likely_pathogenic",
            "clinvar_id": "CV0002562"
        },
    ]
    
    # Sample Diseases
    diseases = [
        {
            "disease_id": "OMIM:604370",
            "name": "Hereditary Breast and Ovarian Cancer",
            "description": "Hereditary cancer syndrome with increased risk of breast and ovarian cancer",
            "category": "cancer",
            "inheritance": "autosomal_dominant"
        },
        {
            "disease_id": "OMIM:113705",
            "name": "Breast-Ovarian Cancer",
            "description": "Familial breast and ovarian cancer syndrome",
            "category": "cancer",
            "inheritance": "autosomal_dominant"
        },
        {
            "disease_id": "OMIM:191170",
            "name": "Li-Fraumeni Syndrome",
            "description": "Hereditary cancer syndrome with diverse tumors",
            "category": "cancer",
            "inheritance": "autosomal_dominant"
        },
        {
            "disease_id": "OMIM:211400",
            "name": "Non-Small Cell Lung Cancer",
            "description": "Most common type of lung cancer",
            "category": "cancer",
            "inheritance": "somatic"
        },
        {
            "disease_id": "OMIM:604370",
            "name": "Colorectal Cancer",
            "description": "Cancer of the colon or rectum",
            "category": "cancer",
            "inheritance": "multifactorial"
        },
    ]
    
    # Create genes
    print("📊 Creating genes...")
    for gene in genes:
        result = await neo4j.create_gene(
            gene_id=gene["gene_id"],
            name=gene["name"],
            chromosome=gene["chromosome"],
            start_position=gene["start_position"],
            end_position=gene["end_position"],
            description=gene["description"]
        )
        print(f"  ✅ Created gene: {gene['gene_id']}")
    
    # Create mutations and link to genes
    print("📊 Creating mutations...")
    for mutation in mutations:
        result = await neo4j.create_mutation(
            mutation_id=mutation["mutation_id"],
            gene_id=mutation["gene_id"],
            mutation_type=mutation["mutation_type"],
            position=mutation["position"],
            ref_allele=mutation["ref_allele"],
            alt_allele=mutation["alt_allele"],
            pathogenicity=mutation["pathogenicity"],
            clinvar_id=mutation["clinvar_id"]
        )
        print(f"  ✅ Created mutation: {mutation['mutation_id']} in {mutation['gene_id']}")
    
    # Link mutations to diseases
    print("📊 Linking mutations to diseases...")
    disease_links = [
        ("c.68_69delAG", "OMIM:604370", "strong", "loss_of_function"),
        ("c.5266dupC", "OMIM:113705", "strong", "loss_of_function"),
        ("R273H", "OMIM:191170", "strong", "gain_of_function"),
        ("L858R", "OMIM:211400", "strong", "gain_of_function"),
        ("G12D", "OMIM:604370", "moderate", "constitutive_activation"),
    ]
    
    for mutation_id, disease_id, evidence, mechanism in disease_links:
        result = await neo4j.link_mutation_to_disease(
            mutation_id=mutation_id,
            disease_id=disease_id,
            evidence_level=evidence,
            mechanism=mechanism
        )
        print(f"  ✅ Linked {mutation_id} → {disease_id}")
    
    # Print statistics
    print("\n📈 Database Statistics:")
    stats = await neo4j.get_statistics()
    for key, value in stats.items():
        print(f"  - {key}: {value}")
    
    await neo4j.close()
    
    print("\n✅ Sample data ingestion completed!")
    print(f"⏰ Timestamp: {datetime.utcnow().isoformat()}")


if __name__ == "__main__":
    asyncio.run(ingest_sample_data())
