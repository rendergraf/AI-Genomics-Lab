#!/usr/bin/env python3
"""
🧬 AI Genomics Lab - ClinVar Data Ingestion
Script para descargar y cargar datos de ClinVar en Neo4j

Este script ingiere variantes clínicas de ClinVar, una base de datos pública
de variantes genéticas relacionadas con enfermedades humanas.

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import asyncio
import gzip
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.neo4j_service import Neo4jService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Datos de ejemplo de ClinVar (variantes clínicas comunes)
# En producción, esto descargaría el archivo VCF de ClinVar
CLINVAR_SAMPLE_DATA = {
    "genes": [
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
            "gene_id": "CFTR",
            "name": "CF Transmembrane Conductance Regulator",
            "chromosome": "7",
            "start_position": 117559595,
            "end_position": 117668665,
            "description": "CFTR encodes a chloride channel. Mutations cause cystic fibrosis."
        },
        {
            "gene_id": "DMD",
            "name": "Dystrophin",
            "chromosome": "X",
            "start_position": 31137345,
            "end_position": 33357767,
            "description": "DMD encodes dystrophin. Mutations cause Duchenne muscular dystrophy."
        },
        {
            "gene_id": "FBN1",
            "name": "Fibrillin 1",
            "chromosome": "15",
            "start_position": 48844525,
            "end_position": 49028328,
            "description": "FBN1 encodes fibrillin-1. Mutations cause Marfan syndrome."
        },
        {
            "gene_id": "LDLR",
            "name": "Low Density Lipoprotein Receptor",
            "chromosome": "19",
            "start_position": 11216138,
            "end_position": 11337880,
            "description": "LDLR encodes LDL receptor. Mutations cause familial hypercholesterolemia."
        },
        {
            "gene_id": "HTT",
            "name": "Huntingtin",
            "chromosome": "4",
            "start_position": 3076603,
            "end_position": 3243565,
            "description": "HTT encodes huntingtin. CAG repeat expansions cause Huntington disease."
        },
    ],
    
    "mutations": [
        # BRCA1 mutations (ClinVar)
        {"mutation_id": "c.68_69delAG", "gene_id": "BRCA1", "mutation_type": "indel", 
         "position": 43070976, "ref_allele": "AG", "alt_allele": "-", 
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000456"},
        {"mutation_id": "c.5266dupC", "gene_id": "BRCA1", "mutation_type": "indel",
         "position": 43090781, "ref_allele": "C", "alt_allele": "CC",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000167"},
        {"mutation_id": "c.181T>G", "gene_id": "BRCA1", "mutation_type": "SNP",
         "position": 43070905, "ref_allele": "T", "alt_allele": "G",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000176"},
         
        # TP53 mutations (ClinVar)
        {"mutation_id": "R273H", "gene_id": "TP53", "mutation_type": "SNP",
         "position": 7674220, "ref_allele": "G", "alt_allele": "A",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000874"},
        {"mutation_id": "R175H", "gene_id": "TP53", "mutation_type": "SNP",
         "position": 7674998, "ref_allele": "G", "alt_allele": "A",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000123"},
        {"mutation_id": "R248Q", "gene_id": "TP53", "mutation_type": "SNP",
         "position": 7677538, "ref_allele": "G", "alt_allele": "A",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000456"},
         
        # CFTR mutations (ClinVar)
        {"mutation_id": "F508del", "gene_id": "CFTR", "mutation_type": "indel",
         "position": 117174144, "ref_allele": "CTT", "alt_allele": "-",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000089"},
        {"mutation_id": "G551D", "gene_id": "CFTR", "mutation_type": "SNP",
         "position": 117259760, "ref_allele": "G", "alt_allele": "A",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000234"},
         
        # DMD mutations (ClinVar)
        {"mutation_id": "c.30C>T", "gene_id": "DMD", "mutation_type": "SNP",
         "position": 32354289, "ref_allele": "C", "alt_allele": "T",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000567"},
         
        # LDLR mutations (ClinVar)
        {"mutation_id": "c.68G>A", "gene_id": "LDLR", "mutation_type": "SNP",
         "position": 11216206, "ref_allele": "G", "alt_allele": "A",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000789"},
         
        # HTT mutations (ClinVar)
        {"mutation_id": "CAG.repeat", "gene_id": "HTT", "mutation_type": "repeat",
         "position": 3175651, "ref_allele": "CAG", "alt_allele": "CAGCAG",
         "pathogenicity": "pathogenic", "clinvar_id": "CV0000234"},
    ],
    
    "diseases": [
        {"disease_id": "OMIM:113705", "name": "Breast-Ovarian Cancer", 
         "description": "Familial breast and ovarian cancer syndrome", 
         "category": "cancer", "inheritance": "autosomal_dominant"},
        {"disease_id": "OMIM:191170", "name": "Li-Fraumeni Syndrome",
         "description": "Hereditary cancer syndrome with diverse tumors",
         "category": "cancer", "inheritance": "autosomal_dominant"},
        {"disease_id": "OMIM:219700", "name": "Cystic Fibrosis",
         "description": "Autosomal recessive disorder affecting lungs and digestive system",
         "category": "metabolic", "inheritance": "autosomal_recessive"},
        {"disease_id": "OMIM:310400", "name": "Duchenne Muscular Dystrophy",
         "description": "Progressive muscle weakness due to dystrophin deficiency",
         "category": "neuromuscular", "inheritance": "x-linked"},
        {"disease_id": "OMIM:154700", "name": "Marfan Syndrome",
         "description": "Connective tissue disorder affecting multiple systems",
         "category": "connective_tissue", "inheritance": "autosomal_dominant"},
        {"disease_id": "OMIM:143890", "name": "Familial Hypercholesterolemia",
         "description": "Elevated LDL cholesterol and premature cardiovascular disease",
         "category": "cardiovascular", "inheritance": "autosomal_dominant"},
        {"disease_id": "OMIM:143100", "name": "Huntington Disease",
         "description": "Neurodegenerative disorder with chorea and psychiatric symptoms",
         "category": "neurological", "inheritance": "autosomal_dominant"},
    ],
    
    "disease_links": [
        # BRCA1 -> Cancer
        ("c.68_69delAG", "OMIM:113705", "strong", "loss_of_function"),
        ("c.5266dupC", "OMIM:113705", "strong", "loss_of_function"),
        ("c.181T>G", "OMIM:113705", "strong", "loss_of_function"),
        
        # TP53 -> Li-Fraumeni
        ("R273H", "OMIM:191170", "strong", "gain_of_function"),
        ("R175H", "OMIM:191170", "strong", "dominant_negative"),
        ("R248Q", "OMIM:191170", "strong", "dominant_negative"),
        
        # CFTR -> Cystic Fibrosis
        ("F508del", "OMIM:219700", "strong", "loss_of_function"),
        ("G551D", "OMIM:219700", "strong", "loss_of_function"),
        
        # DMD -> DMD
        ("c.30C>T", "OMIM:310400", "strong", "loss_of_function"),
        
        # FBN1 -> Marfan
        # (would need FBN1 mutation data)
        
        # LDLR -> FH
        ("c.68G>A", "OMIM:143890", "strong", "loss_of_function"),
        
        # HTT -> Huntington
        ("CAG.repeat", "OMIM:143100", "strong", "gain_of_function"),
    ]
}


async def ingest_clinvar_data():
    """Ingest ClinVar sample data into Neo4j"""
    
    neo4j = Neo4jService()
    await neo4j.connect()
    
    logger.info("🧬 AI Genomics Lab - ClinVar Data Ingestion")
    logger.info("=" * 50)
    
    # Create genes
    logger.info("📊 Creating genes from ClinVar data...")
    for gene in CLINVAR_SAMPLE_DATA["genes"]:
        try:
            result = await neo4j.create_gene(
                gene_id=gene["gene_id"],
                name=gene["name"],
                chromosome=gene["chromosome"],
                start_position=gene["start_position"],
                end_position=gene["end_position"],
                description=gene["description"]
            )
            logger.info(f"  ✅ Created gene: {gene['gene_id']}")
        except Exception as e:
            logger.warning(f"  ⚠️ Gene {gene['gene_id']} may already exist: {e}")
    
    # Create diseases
    logger.info("📊 Creating diseases...")
    for disease in CLINVAR_SAMPLE_DATA["diseases"]:
        try:
            query = """
            CREATE (d:Disease {
                id: $disease_id,
                name: $name,
                description: $description,
                category: $category,
                inheritance: $inheritance,
                source: 'ClinVar',
                created_at: datetime()
            })
            RETURN d
            """
            await neo4j.execute_query(query, disease)
            logger.info(f"  ✅ Created disease: {disease['name']}")
        except Exception as e:
            logger.warning(f"  ⚠️ Disease {disease['disease_id']} may already exist: {e}")
    
    # Create mutations and link to genes
    logger.info("📊 Creating mutations...")
    for mutation in CLINVAR_SAMPLE_DATA["mutations"]:
        try:
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
            logger.info(f"  ✅ Created mutation: {mutation['mutation_id']} in {mutation['gene_id']}")
        except Exception as e:
            logger.warning(f"  ⚠️ Mutation {mutation['mutation_id']} may already exist: {e}")
    
    # Link mutations to diseases
    logger.info("📊 Linking mutations to diseases...")
    for mutation_id, disease_id, evidence, mechanism in CLINVAR_SAMPLE_DATA["disease_links"]:
        try:
            result = await neo4j.link_mutation_to_disease(
                mutation_id=mutation_id,
                disease_id=disease_id,
                evidence_level=evidence,
                mechanism=mechanism
            )
            logger.info(f"  ✅ Linked {mutation_id} → {disease_id}")
        except Exception as e:
            logger.warning(f"  ⚠️ Link may already exist: {e}")
    
    # Print statistics
    logger.info("\n📈 Database Statistics:")
    stats = await neo4j.get_statistics()
    for key, value in stats.items():
        logger.info(f"  - {key}: {value}")
    
    await neo4j.close()
    
    logger.info("\n✅ ClinVar data ingestion completed!")
    logger.info("=" * 50)


if __name__ == "__main__":
    asyncio.run(ingest_clinvar_data())
