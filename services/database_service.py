"""
🧬 AI Genomics Lab - Database Service
Service for managing reference genomes and samples in PostgreSQL

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum

import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GenomeStatus(str, Enum):
    """Status of a reference genome"""
    UPLOADED = "uploaded"
    INDEXING = "indexing"
    READY = "ready"
    ERROR = "error"


class SampleStatus(str, Enum):
    """Status of a sample/test"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ReferenceGenome:
    """Reference genome data model"""
    id: int
    name: str
    species: str
    build: str
    file_path: str
    gz_path: Optional[str]
    fai_path: Optional[str]
    gzi_path: Optional[str]
    sti_path: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime


@dataclass
class Sample:
    """Sample/test data model"""
    id: int
    name: str
    sample_type: str  # "paired-end" or "single-end"
    reference_genome_id: int
    r1_path: Optional[str]
    r2_path: Optional[str]
    bam_path: Optional[str]
    cram_path: Optional[str]
    vcf_path: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime


@dataclass
class PipelineJob:
    """Pipeline job data model"""
    id: int
    pipeline_name: str
    status: str  # "pending", "running", "completed", "failed"
    parameters: str  # JSON string
    logs_path: Optional[str]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    created_at: datetime


class DatabaseService:
    """Service for managing reference genomes and samples in PostgreSQL"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize connection pool from environment variables"""
        # Get database URL from environment or use default
        db_url = os.getenv(
            "DATABASE_URL",
            "postgresql://genomics:genomics@postgres:5432/genomics"
        )
        
        # For synchronous initialization, we'll use a simple approach
        # The actual connection will be established when needed
        self._db_url = db_url
        logger.info(f"Database service initialized with URL: {db_url.split('@')[0]}@***")
    
    async def connect(self) -> None:
        """Establish connection to PostgreSQL"""
        if self.pool is None:
            self.pool = await asyncpg.create_pool(
                self._db_url,
                min_size=2,
                max_size=10
            )
            await self.initialize_schema()
            logger.info("Database connected and schema initialized")
    
    async def close(self) -> None:
        """Close database connection"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Database connection closed")
    
    async def initialize_schema(self) -> None:
        """Create tables if they don't exist"""
        async with self.pool.acquire() as conn:
            # Create reference_genomes table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS reference_genomes (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    species VARCHAR(255) NOT NULL,
                    build VARCHAR(50) NOT NULL,
                    file_path VARCHAR(512) NOT NULL,
                    gz_path VARCHAR(512),
                    fai_path VARCHAR(512),
                    gzi_path VARCHAR(512),
                    sti_path VARCHAR(512),
                    status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create samples table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS samples (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    sample_type VARCHAR(50) NOT NULL DEFAULT 'paired-end',
                    reference_genome_id INTEGER REFERENCES reference_genomes(id),
                    r1_path VARCHAR(512),
                    r2_path VARCHAR(512),
                    bam_path VARCHAR(512),
                    cram_path VARCHAR(512),
                    vcf_path VARCHAR(512),
                    status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create pipeline_jobs table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_jobs (
                    id SERIAL PRIMARY KEY,
                    pipeline_name VARCHAR(255) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    parameters TEXT,
                    logs_path VARCHAR(512),
                    started_at TIMESTAMP,
                    finished_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            logger.info("Database schema initialized")
    
    # ==================== REFERENCE GENOMES ====================
    
    async def create_reference_genome(
        self,
        name: str,
        species: str,
        build: str,
        file_path: str
    ) -> ReferenceGenome:
        """Create a new reference genome entry"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO reference_genomes (name, species, build, file_path, status)
                VALUES ($1, $2, $3, $4, 'uploaded')
                RETURNING id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
            """, name, species, build, file_path)
            
            return ReferenceGenome(**dict(row))
    
    async def get_reference_genomes(self) -> List[ReferenceGenome]:
        """Get all reference genomes"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
                FROM reference_genomes
                ORDER BY created_at DESC
            """)
            
            return [ReferenceGenome(**dict(row)) for row in rows]
    
    async def get_reference_genome(self, genome_id: int) -> Optional[ReferenceGenome]:
        """Get a reference genome by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
                FROM reference_genomes
                WHERE id = $1
            """, genome_id)
            
            return ReferenceGenome(**dict(row)) if row else None
    
    async def get_reference_genome_by_name(self, name: str) -> Optional[ReferenceGenome]:
        """Get a reference genome by name"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
                FROM reference_genomes
                WHERE name = $1
            """, name)
            
            return ReferenceGenome(**dict(row)) if row else None
    
    async def update_reference_genome_status(
        self,
        genome_id: int,
        status: str,
        gz_path: Optional[str] = None,
        fai_path: Optional[str] = None,
        gzi_path: Optional[str] = None,
        sti_path: Optional[str] = None
    ) -> Optional[ReferenceGenome]:
        """Update reference genome status and paths"""
        async with self.pool.acquire() as conn:
            # Build dynamic query
            query = "UPDATE reference_genomes SET status = $2, updated_at = CURRENT_TIMESTAMP"
            params = [genome_id, status]
            param_count = 2
            
            if gz_path is not None:
                param_count += 1
                query += f", gz_path = ${param_count}"
                params.append(gz_path)
            
            if fai_path is not None:
                param_count += 1
                query += f", fai_path = ${param_count}"
                params.append(fai_path)
            
            if gzi_path is not None:
                param_count += 1
                query += f", gzi_path = ${param_count}"
                params.append(gzi_path)
            
            if sti_path is not None:
                param_count += 1
                query += f", sti_path = ${param_count}"
                params.append(sti_path)
            
            query += f" WHERE id = $1 RETURNING id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at"
            
            row = await conn.fetchrow(query, *params)
            return ReferenceGenome(**dict(row)) if row else None
    
    async def delete_reference_genome(self, genome_id: int) -> bool:
        """Delete a reference genome"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM reference_genomes WHERE id = $1
            """, genome_id)
            
            return result == "DELETE 1"
    
    # ==================== SAMPLES ====================
    
    async def create_sample(
        self,
        name: str,
        sample_type: str,
        reference_genome_id: int,
        r1_path: Optional[str] = None,
        r2_path: Optional[str] = None
    ) -> Sample:
        """Create a new sample entry"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO samples (name, sample_type, reference_genome_id, r1_path, r2_path, status)
                VALUES ($1, $2, $3, $4, $5, 'uploaded')
                RETURNING id, name, sample_type, reference_genome_id, r1_path, r2_path, bam_path, cram_path, vcf_path, status, created_at, updated_at
            """, name, sample_type, reference_genome_id, r1_path, r2_path)
            
            return Sample(**dict(row))
    
    async def get_samples(self) -> List[Sample]:
        """Get all samples"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name, sample_type, reference_genome_id, r1_path, r2_path, bam_path, cram_path, vcf_path, status, created_at, updated_at
                FROM samples
                ORDER BY created_at DESC
            """)
            
            return [Sample(**dict(row)) for row in rows]
    
    async def get_sample(self, sample_id: int) -> Optional[Sample]:
        """Get a sample by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, sample_type, reference_genome_id, r1_path, r2_path, bam_path, cram_path, vcf_path, status, created_at, updated_at
                FROM samples
                WHERE id = $1
            """, sample_id)
            
            return Sample(**dict(row)) if row else None
    
    async def get_sample_by_name(self, name: str) -> Optional[Sample]:
        """Get a sample by name"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, sample_type, reference_genome_id, r1_path, r2_path, bam_path, cram_path, vcf_path, status, created_at, updated_at
                FROM samples
                WHERE name = $1
            """, name)
            
            return Sample(**dict(row)) if row else None
    
    async def update_sample_status(
        self,
        sample_id: int,
        status: str,
        bam_path: Optional[str] = None,
        cram_path: Optional[str] = None,
        vcf_path: Optional[str] = None
    ) -> Optional[Sample]:
        """Update sample status and output paths"""
        async with self.pool.acquire() as conn:
            query = "UPDATE samples SET status = $2, updated_at = CURRENT_TIMESTAMP"
            params = [sample_id, status]
            param_count = 2
            
            if bam_path is not None:
                param_count += 1
                query += f", bam_path = ${param_count}"
                params.append(bam_path)
            
            if cram_path is not None:
                param_count += 1
                query += f", cram_path = ${param_count}"
                params.append(cram_path)
            
            if vcf_path is not None:
                param_count += 1
                query += f", vcf_path = ${param_count}"
                params.append(vcf_path)
            
            query += f" WHERE id = $1 RETURNING id, name, sample_type, reference_genome_id, r1_path, r2_path, bam_path, cram_path, vcf_path, status, created_at, updated_at"
            
            row = await conn.fetchrow(query, *params)
            return Sample(**dict(row)) if row else None
    
    async def delete_sample(self, sample_id: int) -> bool:
        """Delete a sample"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM samples WHERE id = $1
            """, sample_id)
            
            return result == "DELETE 1"
    
    # ==================== PIPELINE JOBS ====================
    
    async def create_pipeline_job(
        self,
        pipeline_name: str,
        parameters: str
    ) -> PipelineJob:
        """Create a new pipeline job entry"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO pipeline_jobs (pipeline_name, status, parameters)
                VALUES ($1, 'pending', $2)
                RETURNING id, pipeline_name, status, parameters, logs_path, started_at, finished_at, created_at
            """, pipeline_name, parameters)
            
            return PipelineJob(**dict(row))
    
    async def get_pipeline_job(self, job_id: int) -> Optional[PipelineJob]:
        """Get a pipeline job by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, pipeline_name, status, parameters, logs_path, started_at, finished_at, created_at
                FROM pipeline_jobs
                WHERE id = $1
            """, job_id)
            
            return PipelineJob(**dict(row)) if row else None
    
    async def get_pipeline_jobs(self) -> List[PipelineJob]:
        """Get all pipeline jobs"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, pipeline_name, status, parameters, logs_path, started_at, finished_at, created_at
                FROM pipeline_jobs
                ORDER BY created_at DESC
            """)
            
            return [PipelineJob(**dict(row)) for row in rows]
    
    async def update_pipeline_job_status(
        self,
        job_id: int,
        status: str,
        logs_path: Optional[str] = None,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None
    ) -> Optional[PipelineJob]:
        """Update pipeline job status"""
        async with self.pool.acquire() as conn:
            query = "UPDATE pipeline_jobs SET status = $2, updated_at = CURRENT_TIMESTAMP"
            params = [job_id, status]
            param_count = 2
            
            if logs_path is not None:
                param_count += 1
                query += f", logs_path = ${param_count}"
                params.append(logs_path)
            
            if started_at is not None:
                param_count += 1
                query += f", started_at = ${param_count}"
                params.append(started_at)
            
            if finished_at is not None:
                param_count += 1
                query += f", finished_at = ${param_count}"
                params.append(finished_at)
            
            query += f" WHERE id = $1 RETURNING id, pipeline_name, status, parameters, logs_path, started_at, finished_at, created_at"
            
            row = await conn.fetchrow(query, *params)
            return PipelineJob(**dict(row)) if row else None
    
    # ==================== UTILITY ====================
    
    async def get_statistics(self) -> Dict[str, int]:
        """Get database statistics"""
        async with self.pool.acquire() as conn:
            genome_count = await conn.fetchval("SELECT COUNT(*) FROM reference_genomes")
            ready_genomes = await conn.fetchval("SELECT COUNT(*) FROM reference_genomes WHERE status = 'ready'")
            sample_count = await conn.fetchval("SELECT COUNT(*) FROM samples")
            completed_samples = await conn.fetchval("SELECT COUNT(*) FROM samples WHERE status = 'completed'")
            
            return {
                "total_reference_genomes": genome_count,
                "ready_reference_genomes": ready_genomes,
                "total_samples": sample_count,
                "completed_samples": completed_samples
            }


# Singleton instance
_database_service: Optional[DatabaseService] = None


def get_database_service() -> DatabaseService:
    """Get singleton database service instance"""
    global _database_service
    if _database_service is None:
        _database_service = DatabaseService()
    return _database_service
