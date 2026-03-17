#!/usr/bin/env python3
"""
🧬 AI Genomics Lab - Seed Existing Data
Script to register existing reference genomes and samples in the database

Usage:
    python scripts/seed_existing_data.py

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
"""

import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database_service import get_database_service


async def seed_data():
    """Register existing reference genomes and samples in the database"""
    db = get_database_service()
    
    try:
        await db.connect()
        print("✅ Connected to database")
        
        # Check existing genomes
        existing_genomes = await db.get_reference_genomes()
        print(f"📊 Found {len(existing_genomes)} existing genomes")
        
        # Add hg38 reference genome if not exists
        hg38_exists = any(g.name == "hg38" for g in existing_genomes)
        
        if not hg38_exists:
            print("\n📥 Registering hg38 reference genome...")
            genome = await db.create_reference_genome(
                name="hg38",
                species="Homo sapiens",
                build="GRCh38",
                file_path="/datasets/reference_genome/hg38.fa"
            )
            print(f"✅ Created genome: {genome.id}")
            
            # Update with indexed paths
            await db.update_reference_genome_status(
                genome.id,
                "ready",
                gz_path="/datasets/reference_genome/hg38.fa.gz",
                fai_path="/datasets/reference_genome/hg38.fa.gz.fai",
                gzi_path="/datasets/reference_genome/hg38.fa.gz.gzi",
                sti_path="/datasets/reference_genome/hg38.fa.gz.r150.sti"
            )
            print("✅ Genome marked as ready with all indices")
        else:
            print("\nℹ️ hg38 already exists in database")
        
        # Check existing samples
        existing_samples = await db.get_samples()
        print(f"📊 Found {len(existing_samples)} existing samples")
        
        # Get genome ID for samples
        genome = await db.get_reference_genome_by_name("hg38")
        
        if genome:
            # Add SRR1517848 sample if not exists
            sample_exists = any(s.name == "SRR1517848" for s in existing_samples)
            
            if not sample_exists:
                print("\n📥 Registering SRR1517848 sample...")
                sample = await db.create_sample(
                    name="SRR1517848",
                    sample_type="paired-end",
                    reference_genome_id=genome.id,
                    r1_path="/datasets/fastq/SRR1517848_1.fastq.gz",
                    r2_path="/datasets/fastq/SRR1517848_2.fastq.gz"
                )
                print(f"✅ Created sample: {sample.id}")
            else:
                print("\nℹ️ SRR1517848 already exists in database")
        
        # Print final statistics
        print("\n📊 Final Statistics:")
        stats = await db.get_statistics()
        print(f"   Total Reference Genomes: {stats['total_reference_genomes']}")
        print(f"   Ready Reference Genomes: {stats['ready_reference_genomes']}")
        print(f"   Total Samples: {stats['total_samples']}")
        print(f"   Completed Samples: {stats['completed_samples']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_data())
