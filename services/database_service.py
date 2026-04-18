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
import json
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


@dataclass
class User:
    """User data model"""
    id: int
    email: str
    password_hash: str
    name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


@dataclass
class Role:
    """Role data model"""
    id: int
    name: str
    description: Optional[str]


@dataclass
class UserRole:
    """User-Role relationship"""
    user_id: int
    role_id: int


@dataclass
class GenomeReference:
    """Genome reference data model (enhanced)"""
    id: int
    key: str
    name: str
    species: Optional[str]
    build: Optional[str]
    url: str
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime


@dataclass
class PipelineSetting:
    """Pipeline setting data model"""
    id: int
    setting_key: str
    setting_value: str
    data_type: str
    validation_rules: Optional[str]
    description: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime


@dataclass
class AIProviderSetting:
    """AI provider setting data model"""
    id: int
    provider: str
    model: str
    api_key_encrypted: Optional[str]
    base_url: Optional[str]
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime


@dataclass
class UIPreference:
    """UI preference data model"""
    id: int
    user_id: int
    language: str
    timezone: str
    theme: str
    display_options: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


@dataclass
class AuditLog:
    """Audit log data model"""
    id: int
    user_id: Optional[int]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[int]
    details: Dict[str, Any]
    ip_address: Optional[str]
    user_agent: Optional[str]
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
            
            # Create users table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(255),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create roles table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL UNIQUE,
                    description TEXT
                )
            """)
            
            # Create user_roles junction table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS user_roles (
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                    PRIMARY KEY (user_id, role_id)
                )
            """)
            
            # Create genome_references table (enhanced version)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS genome_references (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    species VARCHAR(100),
                    build VARCHAR(50),
                    url VARCHAR(512) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create pipeline_settings table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_settings (
                    id SERIAL PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT NOT NULL,
                    data_type VARCHAR(50) NOT NULL,
                    validation_rules TEXT,
                    description TEXT,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create ai_provider_settings table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS ai_provider_settings (
                    id SERIAL PRIMARY KEY,
                    provider VARCHAR(50) NOT NULL,
                    model VARCHAR(100) NOT NULL,
                    api_key_encrypted TEXT,
                    base_url VARCHAR(255),
                    is_active BOOLEAN DEFAULT FALSE,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create ui_preferences table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS ui_preferences (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    language VARCHAR(10) DEFAULT 'en',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    theme VARCHAR(20) DEFAULT 'light',
                    display_options JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create audit_logs table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    action VARCHAR(100) NOT NULL,
                    resource_type VARCHAR(50),
                    resource_id INTEGER,
                    details JSONB DEFAULT '{}',
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Seed initial roles if not exist
            await conn.execute("""
                INSERT INTO roles (name, description) 
                VALUES 
                    ('admin', 'Full system access'),
                    ('analyst', 'Can analyze data and run pipelines'),
                    ('researcher', 'Can view and query data'),
                    ('viewer', 'Read-only access')
                ON CONFLICT (name) DO NOTHING
            """)
            
            # Seed admin user if not exist (password: admin123 - should be changed immediately)
            await conn.execute("""
                INSERT INTO users (email, password_hash, name, is_active) 
                VALUES (
                    'admin@company.com', 
                    '$argon2id$v=19$m=65536,t=3,p=4$xNg7B0Bo7d1bS6l1bq31Xg$SeSzVI5vAzqeRnDKjh1zsKPeek3Vq6KpmktDgVDWbHU',  -- argon2 hash of 'admin123'
                    'Administrator', 
                    TRUE
                ) 
                ON CONFLICT (email) DO NOTHING
            """)
            
            # Assign admin role to admin user
            await conn.execute("""
                INSERT INTO user_roles (user_id, role_id)
                SELECT u.id, r.id 
                FROM users u, roles r 
                WHERE u.email = 'admin@company.com' AND r.name = 'admin'
                ON CONFLICT (user_id, role_id) DO NOTHING
            """)
            
            # Seed initial pipeline settings
            await conn.execute("""
                INSERT INTO pipeline_settings (setting_key, setting_value, data_type, description) 
                VALUES 
                    ('default_read_length', '150', 'integer', 'Default read length for alignment'),
                    ('strobealign_r', '150', 'integer', 'Strobealign read length parameter'),
                    ('max_threads', '32', 'integer', 'Maximum threads for pipeline execution')
                ON CONFLICT (setting_key) DO NOTHING
            """)
            
            logger.info("Database schema initialized with authentication and settings tables")
    
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
    
    # ==================== USERS ====================
    
    async def create_user(
        self,
        email: str,
        password_hash: str,
        name: Optional[str] = None,
        is_active: bool = True
    ) -> User:
        """Create a new user"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO users (email, password_hash, name, is_active)
                VALUES ($1, $2, $3, $4)
                RETURNING id, email, password_hash, name, is_active, created_at, updated_at
            """, email, password_hash, name, is_active)
            
            return User(**dict(row))
    
    async def get_user(self, user_id: int) -> Optional[User]:
        """Get a user by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, email, password_hash, name, is_active, created_at, updated_at
                FROM users
                WHERE id = $1
            """, user_id)
            
            return User(**dict(row)) if row else None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, email, password_hash, name, is_active, created_at, updated_at
                FROM users
                WHERE email = $1
            """, email)
            
            return User(**dict(row)) if row else None
    
    async def get_users(self) -> List[User]:
        """Get all users"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, email, password_hash, name, is_active, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
            """)
            
            return [User(**dict(row)) for row in rows]
    
    async def update_user(
        self,
        user_id: int,
        email: Optional[str] = None,
        name: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[User]:
        """Update user information"""
        async with self.pool.acquire() as conn:
            query = "UPDATE users SET updated_at = CURRENT_TIMESTAMP"
            params = [user_id]
            param_count = 1
            
            if email is not None:
                param_count += 1
                query += f", email = ${param_count}"
                params.append(email)
            
            if name is not None:
                param_count += 1
                query += f", name = ${param_count}"
                params.append(name)
            
            if is_active is not None:
                param_count += 1
                query += f", is_active = ${param_count}"
                params.append(is_active)
            
            query += f" WHERE id = $1 RETURNING id, email, password_hash, name, is_active, created_at, updated_at"
            
            row = await conn.fetchrow(query, *params)
            return User(**dict(row)) if row else None
    
    async def update_user_password(self, user_id: int, password_hash: str) -> bool:
        """Update user password hash"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE users 
                SET password_hash = $2, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $1
            """, user_id, password_hash)
            
            return result == "UPDATE 1"
    
    async def delete_user(self, user_id: int) -> bool:
        """Delete a user"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM users WHERE id = $1
            """, user_id)
            
            return result == "DELETE 1"
    
    # ==================== ROLES ====================
    
    async def get_roles(self) -> List[Role]:
        """Get all roles"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name, description
                FROM roles
                ORDER BY id
            """)
            
            return [Role(**dict(row)) for row in rows]
    
    async def get_user_roles(self, user_id: int) -> List[Role]:
        """Get roles for a specific user"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT r.id, r.name, r.description
                FROM roles r
                JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = $1
            """, user_id)
            
            return [Role(**dict(row)) for row in rows]
    
    async def assign_role_to_user(self, user_id: int, role_id: int) -> bool:
        """Assign a role to a user"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                INSERT INTO user_roles (user_id, role_id)
                VALUES ($1, $2)
                ON CONFLICT (user_id, role_id) DO NOTHING
            """, user_id, role_id)
            
            return result == "INSERT 0 1"
    
    async def remove_role_from_user(self, user_id: int, role_id: int) -> bool:
        """Remove a role from a user"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM user_roles 
                WHERE user_id = $1 AND role_id = $2
            """, user_id, role_id)
            
            return result == "DELETE 1"
    
    # ==================== GENOME REFERENCES (ENHANCED) ====================
    
    async def create_genome_reference(
        self,
        key: str,
        name: str,
        url: str,
        species: Optional[str] = None,
        build: Optional[str] = None,
        is_active: bool = True,
        created_by: Optional[int] = None
    ) -> GenomeReference:
        """Create a new genome reference entry"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO genome_references (key, name, species, build, url, is_active, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, key, name, species, build, url, is_active, created_by, created_at, updated_at
            """, key, name, species, build, url, is_active, created_by)
            
            return GenomeReference(**dict(row))
    
    async def get_genome_references(self) -> List[GenomeReference]:
        """Get all genome references"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, key, name, species, build, url, is_active, created_by, created_at, updated_at
                FROM genome_references
                ORDER BY created_at DESC
            """)
            
            return [GenomeReference(**dict(row)) for row in rows]
    
    async def get_genome_reference(self, ref_id: int) -> Optional[GenomeReference]:
        """Get a genome reference by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, key, name, species, build, url, is_active, created_by, created_at, updated_at
                FROM genome_references
                WHERE id = $1
            """, ref_id)
            
            return GenomeReference(**dict(row)) if row else None
    
    async def get_genome_reference_by_key(self, key: str) -> Optional[GenomeReference]:
        """Get a genome reference by key"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, key, name, species, build, url, is_active, created_by, created_at, updated_at
                FROM genome_references
                WHERE key = $1
            """, key)
            
            return GenomeReference(**dict(row)) if row else None
    
    async def update_genome_reference(
        self,
        ref_id: int,
        key: Optional[str] = None,
        name: Optional[str] = None,
        species: Optional[str] = None,
        build: Optional[str] = None,
        url: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[GenomeReference]:
        """Update genome reference"""
        async with self.pool.acquire() as conn:
            query = "UPDATE genome_references SET updated_at = CURRENT_TIMESTAMP"
            params = [ref_id]
            param_count = 1
            
            if key is not None:
                param_count += 1
                query += f", key = ${param_count}"
                params.append(key)
            
            if name is not None:
                param_count += 1
                query += f", name = ${param_count}"
                params.append(name)
            
            if species is not None:
                param_count += 1
                query += f", species = ${param_count}"
                params.append(species)
            
            if build is not None:
                param_count += 1
                query += f", build = ${param_count}"
                params.append(build)
            
            if url is not None:
                param_count += 1
                query += f", url = ${param_count}"
                params.append(url)
            
            if is_active is not None:
                param_count += 1
                query += f", is_active = ${param_count}"
                params.append(is_active)
            
            query += f" WHERE id = $1 RETURNING id, key, name, species, build, url, is_active, created_by, created_at, updated_at"
            
            row = await conn.fetchrow(query, *params)
            return GenomeReference(**dict(row)) if row else None
    
    async def delete_genome_reference(self, ref_id: int) -> bool:
        """Delete a genome reference"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM genome_references WHERE id = $1
            """, ref_id)
            
            return result == "DELETE 1"
    
    # ==================== PIPELINE SETTINGS ====================
    
    async def get_pipeline_settings(self) -> List[PipelineSetting]:
        """Get all pipeline settings"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, setting_key, setting_value, data_type, validation_rules, description, created_by, created_at, updated_at
                FROM pipeline_settings
                ORDER BY setting_key
            """)
            
            return [PipelineSetting(**dict(row)) for row in rows]
    
    async def get_pipeline_setting(self, key: str) -> Optional[PipelineSetting]:
        """Get a pipeline setting by key"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, setting_key, setting_value, data_type, validation_rules, description, created_by, created_at, updated_at
                FROM pipeline_settings
                WHERE setting_key = $1
            """, key)
            
            return PipelineSetting(**dict(row)) if row else None
    
    async def update_pipeline_setting(
        self,
        key: str,
        setting_value: str,
        data_type: Optional[str] = None,
        validation_rules: Optional[str] = None,
        description: Optional[str] = None
    ) -> Optional[PipelineSetting]:
        """Update a pipeline setting"""
        async with self.pool.acquire() as conn:
            query = "UPDATE pipeline_settings SET setting_value = $2, updated_at = CURRENT_TIMESTAMP"
            params = [key, setting_value]
            param_count = 2
            
            if data_type is not None:
                param_count += 1
                query += f", data_type = ${param_count}"
                params.append(data_type)
            
            if validation_rules is not None:
                param_count += 1
                query += f", validation_rules = ${param_count}"
                params.append(validation_rules)
            
            if description is not None:
                param_count += 1
                query += f", description = ${param_count}"
                params.append(description)
            
            query += f" WHERE setting_key = $1 RETURNING id, setting_key, setting_value, data_type, validation_rules, description, created_by, created_at, updated_at"
            
            row = await conn.fetchrow(query, *params)
            return PipelineSetting(**dict(row)) if row else None
    
    # ==================== AI PROVIDER SETTINGS ====================
    
    async def get_ai_provider_settings(self) -> List[AIProviderSetting]:
        """Get all AI provider settings"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, provider, model, api_key_encrypted, base_url, is_active, created_by, created_at, updated_at
                FROM ai_provider_settings
                ORDER BY provider, model
            """)
            
            return [AIProviderSetting(**dict(row)) for row in rows]
    
    async def get_ai_provider_setting(self, provider: str, model: str) -> Optional[AIProviderSetting]:
        """Get AI provider setting by provider and model"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, provider, model, api_key_encrypted, base_url, is_active, created_by, created_at, updated_at
                FROM ai_provider_settings
                WHERE provider = $1 AND model = $2
            """, provider, model)
            
            return AIProviderSetting(**dict(row)) if row else None
    
    async def update_ai_provider_setting(
        self,
        provider: str,
        model: str,
        api_key_encrypted: Optional[str] = None,
        base_url: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[AIProviderSetting]:
        """Update AI provider setting"""
        async with self.pool.acquire() as conn:
            query = "UPDATE ai_provider_settings SET updated_at = CURRENT_TIMESTAMP"
            params = [provider, model]
            param_count = 2
            
            if api_key_encrypted is not None:
                param_count += 1
                query += f", api_key_encrypted = ${param_count}"
                params.append(api_key_encrypted)
            
            if base_url is not None:
                param_count += 1
                query += f", base_url = ${param_count}"
                params.append(base_url)
            
            if is_active is not None:
                param_count += 1
                query += f", is_active = ${param_count}"
                params.append(is_active)
            
            query += f" WHERE provider = $1 AND model = $2 RETURNING id, provider, model, api_key_encrypted, base_url, is_active, created_by, created_at, updated_at"
            
            row = await conn.fetchrow(query, *params)
            return AIProviderSetting(**dict(row)) if row else None
    
    # ==================== UI PREFERENCES ====================
    
    async def get_ui_preferences(self, user_id: int) -> Optional[UIPreference]:
        """Get UI preferences for a user"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, user_id, language, timezone, theme, display_options, created_at, updated_at
                FROM ui_preferences
                WHERE user_id = $1
            """, user_id)
            
            return UIPreference(**dict(row)) if row else None
    
    async def update_ui_preferences(
        self,
        user_id: int,
        language: Optional[str] = None,
        timezone: Optional[str] = None,
        theme: Optional[str] = None,
        display_options: Optional[Dict[str, Any]] = None
    ) -> Optional[UIPreference]:
        """Update UI preferences for a user"""
        async with self.pool.acquire() as conn:
            # Check if preferences exist
            existing = await self.get_ui_preferences(user_id)
            
            if existing:
                # Update existing
                query = "UPDATE ui_preferences SET updated_at = CURRENT_TIMESTAMP"
                params = [user_id]
                param_count = 1
                
                if language is not None:
                    param_count += 1
                    query += f", language = ${param_count}"
                    params.append(language)
                
                if timezone is not None:
                    param_count += 1
                    query += f", timezone = ${param_count}"
                    params.append(timezone)
                
                if theme is not None:
                    param_count += 1
                    query += f", theme = ${param_count}"
                    params.append(theme)
                
                if display_options is not None:
                    param_count += 1
                    query += f", display_options = ${param_count}"
                    params.append(display_options)
                
                query += f" WHERE user_id = $1 RETURNING id, user_id, language, timezone, theme, display_options, created_at, updated_at"
                
                row = await conn.fetchrow(query, *params)
                return UIPreference(**dict(row)) if row else None
            else:
                # Create new
                row = await conn.fetchrow("""
                    INSERT INTO ui_preferences (user_id, language, timezone, theme, display_options)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, user_id, language, timezone, theme, display_options, created_at, updated_at
                """, user_id, language or 'en', timezone or 'UTC', theme or 'light', display_options or {})
                
                return UIPreference(**dict(row))
    
    # ==================== AUDIT LOGS ====================
    
    async def create_audit_log(
        self,
        user_id: Optional[int],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Create an audit log entry"""
        async with self.pool.acquire() as conn:
            details_json = json.dumps(details) if details else "{}"
            row = await conn.fetchrow("""
                INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
                RETURNING id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
            """, user_id, action, resource_type, resource_id, details_json, ip_address, user_agent)
            
            return AuditLog(**dict(row))
    
    async def get_audit_logs(
        self,
        limit: int = 100,
        offset: int = 0,
        user_id: Optional[int] = None,
        action: Optional[str] = None
    ) -> List[AuditLog]:
        """Get audit logs with optional filtering"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
                FROM audit_logs
                WHERE 1=1
            """
            params = []
            param_count = 0
            
            if user_id is not None:
                param_count += 1
                query += f" AND user_id = ${param_count}"
                params.append(user_id)
            
            if action is not None:
                param_count += 1
                query += f" AND action = ${param_count}"
                params.append(action)
            
            query += " ORDER BY created_at DESC"
            param_count += 1
            query += f" LIMIT ${param_count}"
            params.append(limit)
            param_count += 1
            query += f" OFFSET ${param_count}"
            params.append(offset)
            
            rows = await conn.fetch(query, *params)
            return [AuditLog(**dict(row)) for row in rows]
    
    # ==================== UTILITY ====================
    
    async def get_statistics(self) -> Dict[str, int]:
        """Get database statistics"""
        async with self.pool.acquire() as conn:
            # Original statistics
            genome_count = await conn.fetchval("SELECT COUNT(*) FROM reference_genomes")
            ready_genomes = await conn.fetchval("SELECT COUNT(*) FROM reference_genomes WHERE status = 'ready'")
            sample_count = await conn.fetchval("SELECT COUNT(*) FROM samples")
            completed_samples = await conn.fetchval("SELECT COUNT(*) FROM samples WHERE status = 'completed'")
            
            # New statistics
            user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            active_users = await conn.fetchval("SELECT COUNT(*) FROM users WHERE is_active = TRUE")
            genome_ref_count = await conn.fetchval("SELECT COUNT(*) FROM genome_references")
            active_genome_refs = await conn.fetchval("SELECT COUNT(*) FROM genome_references WHERE is_active = TRUE")
            pipeline_settings_count = await conn.fetchval("SELECT COUNT(*) FROM pipeline_settings")
            ai_provider_settings_count = await conn.fetchval("SELECT COUNT(*) FROM ai_provider_settings")
            active_ai_providers = await conn.fetchval("SELECT COUNT(*) FROM ai_provider_settings WHERE is_active = TRUE")
            audit_logs_count = await conn.fetchval("SELECT COUNT(*) FROM audit_logs")
            
            return {
                "total_reference_genomes": genome_count,
                "ready_reference_genomes": ready_genomes,
                "total_samples": sample_count,
                "completed_samples": completed_samples,
                "total_users": user_count,
                "active_users": active_users,
                "total_genome_references": genome_ref_count,
                "active_genome_references": active_genome_refs,
                "pipeline_settings": pipeline_settings_count,
                "ai_provider_settings": ai_provider_settings_count,
                "active_ai_providers": active_ai_providers,
                "audit_logs": audit_logs_count
            }


# Singleton instance
_database_service: Optional[DatabaseService] = None


def get_database_service() -> DatabaseService:
    """Get singleton database service instance"""
    global _database_service
    if _database_service is None:
        _database_service = DatabaseService()
    return _database_service
