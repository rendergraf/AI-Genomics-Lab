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
from datetime import date, datetime
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


class CaseStatus(str, Enum):
    """Status of a clinical case"""
    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    REPORTED = "reported"


class ClinicalSampleType(str, Enum):
    """Type of clinical sample"""
    TUMOR = "tumor"
    NORMAL = "normal"
    RNA = "rna"
    GERMLINE = "germline"


class SamplePurpose(str, Enum):
    """Purpose of a clinical sample for pipeline selection"""
    TUMOR = "tumor"
    NORMAL = "normal"
    GERMLINE = "germline"
    RNA = "rna"
    CTDNA = "ctdna"
    RELAPSE = "relapse"
    BASELINE = "baseline"
    FOLLOWUP = "followup"


class QualityStatus(str, Enum):
    """Quality control status"""
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    LOW_QUALITY = "low_quality"
    CONTAMINATED = "contaminated"
    INSUFFICIENT_MATERIAL = "insufficient_material"


class SequencingType(str, Enum):
    """Type of sequencing"""
    WGS = "WGS"
    WES = "WES"
    TARGETED_PANEL = "targeted_panel"
    RNA_SEQ = "RNA-seq"


class VariantType(str, Enum):
    """Type of genetic variant"""
    SNV = "SNV"
    INDEL = "INDEL"
    CNV = "CNV"
    SV = "SV"
    FUSION = "FUSION"


class VariantOrigin(str, Enum):
    """Origin of a variant"""
    SOMATIC = "somatic"
    GERMLINE = "germline"
    RNA = "rna"
    UNKNOWN = "unknown"


class PipelineRunStatus(str, Enum):
    """Status of a clinical pipeline run"""
    PENDING = "pending"
    VALIDATING = "validating"
    RUNNING = "running"
    FAILED = "failed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


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
class Species:
    """Species reference data model"""
    id: int
    name: str
    tier: int
    display_order: int


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


@dataclass
class Hospital:
    """Hospital data model"""
    id: int
    name: str
    code: str
    created_at: datetime


@dataclass
class Patient:
    """Patient data model"""
    id: int
    external_patient_id: str
    sex: Optional[str]
    date_of_birth: Optional[date]
    hospital_id: Optional[int]
    created_at: datetime


@dataclass
class Case:
    """Clinical case data model"""
    id: int
    patient_id: int
    case_code: str
    diagnosis: Optional[str]
    cancer_type: Optional[str]
    primary_site: Optional[str]
    stage: Optional[str]
    histology_subtype: Optional[str]
    metastatic_sites: Optional[List[str]]
    clinical_question: Optional[str]
    requested_modules: Optional[str]
    metadata: Dict[str, Any]
    status: str
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime


@dataclass
class ClinicalSample:
    """Clinical sample data model (samples_v2 table)"""
    id: int
    case_id: int
    sample_code: str
    sample_type: str
    tissue_site: Optional[str]
    collection_method: Optional[str]
    quality_status: str
    created_at: datetime
    sample_purpose: Optional[str] = None
    tumor_content: Optional[int] = None
    matched_normal: bool = False
    matched_normal_sample_id: Optional[int] = None
    anatomical_site: Optional[str] = None
    pathology_notes: Optional[str] = None
    collection_date: Optional[date] = None
    preservation_method: Optional[str] = None


@dataclass
class SequencingRun:
    """Sequencing run data model"""
    id: int
    sample_id: int
    run_code: str
    sequencing_type: str
    platform: Optional[str]
    coverage: Optional[int]
    run_date: Optional[date]
    quality_status: str
    created_at: datetime


@dataclass
class FastqFile:
    """FASTQ file data model"""
    id: int
    sequencing_run_id: int
    read_pair: str
    file_path: str
    file_size: Optional[int]
    md5_checksum: Optional[str]
    created_at: datetime


@dataclass
class PipelineRun:
    """Clinical pipeline run data model"""
    id: int
    sequencing_run_id: int
    case_id: int
    module_set: List[str]
    module_dependencies: Dict[str, Any]
    status: str
    config: Dict[str, Any]
    retry_count: int
    max_retries: int
    last_error: Optional[str]
    error_type: Optional[str]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    logs_path: Optional[str]
    nextflow_run_id: Optional[str]
    created_by: Optional[int]
    created_at: datetime


@dataclass
class Variant:
    """Variant data model"""
    id: int
    case_id: int
    sequencing_run_id: Optional[int]
    pipeline_run_id: Optional[int]
    tumor_sample_id: Optional[int]
    normal_sample_id: Optional[int]
    variant_origin: Optional[str]
    gene: Optional[str]
    chromosome: Optional[str]
    position: Optional[int]
    ref: Optional[str]
    alt: Optional[str]
    variant_type: str
    qual: Optional[float]
    filter: Optional[str]
    format: Optional[str]
    sample_data: Optional[Dict[str, Any]]
    vcf_raw: Optional[Dict[str, Any]]
    created_at: datetime


@dataclass
class Annotation:
    """Variant annotation data model"""
    id: int
    variant_id: int
    gene: Optional[str]
    transcript: Optional[str]
    consequence: Optional[str]
    impact: Optional[str]
    dbsnp_id: Optional[str]
    cosmic_id: Optional[str]
    vep_json: Dict[str, Any]
    clinvar_significance: Optional[str]
    oncogenicity: Optional[str]
    drug_response: Dict[str, Any]
    evidence_level: Optional[str]
    therapy_recommendations: Optional[List[str]]
    created_at: datetime


@dataclass
class ClinicalReport:
    """Clinical report data model"""
    id: int
    case_id: int
    sequencing_run_id: Optional[int]
    modules: Dict[str, Any]
    summary: Optional[str]
    actionable_variants: Dict[str, Any]
    therapy_recommendations: Dict[str, Any]
    biomarkers: Dict[str, Any]
    pdf_path: Optional[str]
    json_path: Optional[str]
    generated_by: Optional[int]
    generated_at: datetime


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
            # Migrate old table names if they exist
            # Rename reference_genomes -> indexed_genomes if old exists and new doesn't
            await conn.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'reference_genomes') 
                    AND NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'indexed_genomes') THEN
                        ALTER TABLE reference_genomes RENAME TO indexed_genomes;
                    END IF;
                    
                    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'genome_references') 
                    AND NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'genome_sources') THEN
                        ALTER TABLE genome_references RENAME TO genome_sources;
                    END IF;
                END
                $$;
            """)
            
            # Create reference_genomes table (now indexed_genomes)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS indexed_genomes (
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
                    reference_genome_id INTEGER REFERENCES indexed_genomes(id),
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
            
            # Create genome_sources table (enhanced version)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS genome_sources (
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
            
            # Create species reference table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS species (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    tier INTEGER NOT NULL,
                    display_order INTEGER NOT NULL DEFAULT 0
                )
            """)
            
            # Seed species data (idempotent)
            await conn.execute("""
                INSERT INTO species (name, tier, display_order) VALUES
                    ('Homo sapiens', 1, 1),
                    ('Mus musculus', 2, 2),
                    ('Rattus norvegicus', 2, 3),
                    ('Danio rerio', 2, 4),
                    ('E. coli', 3, 5),
                    ('Yeast', 3, 6),
                    ('Mycobacterium tuberculosis', 3, 7)
                ON CONFLICT (name) DO NOTHING
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
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(provider, model)
                )
            """)
            
            # Migrate: add unique constraint on ai_provider_settings(provider, model) if missing
            await conn.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conrelid = 'ai_provider_settings'::regclass
                        AND conname = 'ai_provider_settings_provider_model_key'
                    ) THEN
                        ALTER TABLE ai_provider_settings ADD UNIQUE (provider, model);
                    END IF;
                END
                $$;
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
            
            # ==================== CLINICAL TABLES (Phase 0) ====================
            
            # Create hospitals table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS hospitals (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create patients table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS patients (
                    id SERIAL PRIMARY KEY,
                    external_patient_id VARCHAR(100) UNIQUE NOT NULL,
                    sex VARCHAR(10),
                    date_of_birth DATE,
                    hospital_id INTEGER REFERENCES hospitals(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Migrate: add hospital_id column to patients table if missing
            await conn.execute("""
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_id INTEGER REFERENCES hospitals(id)
            """)
            
            # Create cases table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cases (
                    id SERIAL PRIMARY KEY,
                    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                    case_code VARCHAR(50) UNIQUE NOT NULL,
                    diagnosis TEXT,
                    cancer_type VARCHAR(100),
                    primary_site VARCHAR(100),
                    stage VARCHAR(50),
                    clinical_question TEXT,
                    requested_modules VARCHAR(100),
                    metadata JSONB DEFAULT '{}',
                    status VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','running','completed','reported')),
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create samples_v2 table (clinical samples — biological entities)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS samples_v2 (
                    id SERIAL PRIMARY KEY,
                    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
                    sample_code VARCHAR(50) UNIQUE NOT NULL,
                    sample_type VARCHAR(20) NOT NULL
                        CHECK (sample_type IN ('tumor','normal','rna','germline')),
                    tissue_site VARCHAR(100),
                    collection_method VARCHAR(50),
                    quality_status VARCHAR(20) DEFAULT 'pending'
                        CHECK (quality_status IN ('pending','passed','failed','low_quality','contaminated','insufficient_material')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Migration: add new columns to samples_v2
            await conn.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'samples_v2' AND column_name = 'sample_purpose'
                    ) THEN
                        ALTER TABLE samples_v2 ADD COLUMN sample_purpose VARCHAR(30);
                        ALTER TABLE samples_v2 ADD COLUMN tumor_content INTEGER;
                        ALTER TABLE samples_v2 ADD COLUMN matched_normal BOOLEAN DEFAULT FALSE;
                        ALTER TABLE samples_v2 ADD COLUMN matched_normal_sample_id INTEGER REFERENCES samples_v2(id);
                        ALTER TABLE samples_v2 ADD COLUMN anatomical_site VARCHAR(100);
                        ALTER TABLE samples_v2 ADD COLUMN pathology_notes TEXT;
                        ALTER TABLE samples_v2 ADD COLUMN collection_date DATE;
                        ALTER TABLE samples_v2 ADD COLUMN preservation_method VARCHAR(50);
                    END IF;
                END
                $$;
            """)

            # Migration: update quality_status CHECK constraint to include new values
            await conn.execute("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conrelid = 'samples_v2'::regclass
                        AND conname LIKE '%quality_status%'
                        AND pg_get_constraintdef(oid) LIKE '%pending%passed%failed%'
                        AND pg_get_constraintdef(oid) NOT LIKE '%low_quality%'
                    ) THEN
                        ALTER TABLE samples_v2 DROP CONSTRAINT IF EXISTS samples_v2_quality_status_check;
                        ALTER TABLE samples_v2 ADD CONSTRAINT samples_v2_quality_status_check
                            CHECK (quality_status IN ('pending','passed','failed','low_quality','contaminated','insufficient_material'));
                    END IF;
                END
                $$;
            """)

            # Migration: add check constraint for tumor_content
            await conn.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conrelid = 'samples_v2'::regclass
                        AND conname = 'check_tumor_content'
                    ) THEN
                        ALTER TABLE samples_v2
                        ADD CONSTRAINT check_tumor_content
                        CHECK (tumor_content IS NULL OR (tumor_content >= 0 AND tumor_content <= 100));
                    END IF;
                END
                $$;
            """)

            # Migration: add check constraint for sample_purpose
            await conn.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conrelid = 'samples_v2'::regclass
                        AND conname = 'check_sample_purpose'
                    ) THEN
                        ALTER TABLE samples_v2
                        ADD CONSTRAINT check_sample_purpose
                        CHECK (sample_purpose IS NULL OR sample_purpose IN ('tumor','normal','germline','rna','ctdna','relapse','baseline','followup'));
                    END IF;
                END
                $$;
            """)
            
            # Create sequencing_runs table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS sequencing_runs (
                    id SERIAL PRIMARY KEY,
                    sample_id INTEGER NOT NULL REFERENCES samples_v2(id) ON DELETE CASCADE,
                    run_code VARCHAR(50) UNIQUE NOT NULL,
                    sequencing_type VARCHAR(20) NOT NULL DEFAULT 'WES'
                        CHECK (sequencing_type IN ('WGS','WES','targeted_panel','RNA-seq')),
                    platform VARCHAR(50),
                    coverage INTEGER,
                    run_date DATE,
                    quality_status VARCHAR(20) DEFAULT 'pending'
                        CHECK (quality_status IN ('pending','passed','failed')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create fastq_files table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS fastq_files (
                    id SERIAL PRIMARY KEY,
                    sequencing_run_id INTEGER NOT NULL REFERENCES sequencing_runs(id) ON DELETE CASCADE,
                    read_pair VARCHAR(10) NOT NULL
                        CHECK (read_pair IN ('R1','R2')),
                    file_path TEXT NOT NULL,
                    file_size BIGINT,
                    md5_checksum VARCHAR(32),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create pipeline_runs table (clinical pipeline execution)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_runs (
                    id SERIAL PRIMARY KEY,
                    sequencing_run_id INTEGER NOT NULL REFERENCES sequencing_runs(id) ON DELETE CASCADE,
                    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
                    module_set TEXT[] NOT NULL,
                    module_dependencies JSONB DEFAULT '{}',
                    status VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','validating','running','failed','completed','cancelled')),
                    config JSONB DEFAULT '{}',
                    retry_count INTEGER DEFAULT 0,
                    max_retries INTEGER DEFAULT 3,
                    last_error TEXT,
                    error_type VARCHAR(50),
                    started_at TIMESTAMP,
                    finished_at TIMESTAMP,
                    logs_path TEXT,
                    nextflow_run_id VARCHAR(100),
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create variants table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS variants (
                    id SERIAL PRIMARY KEY,
                    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
                    sequencing_run_id INTEGER REFERENCES sequencing_runs(id),
                    pipeline_run_id INTEGER REFERENCES pipeline_runs(id),
                    tumor_sample_id INTEGER REFERENCES samples_v2(id),
                    normal_sample_id INTEGER REFERENCES samples_v2(id),
                    variant_origin VARCHAR(20) CHECK (variant_origin IN ('somatic','germline','rna','unknown')),
                    gene VARCHAR(50),
                    chromosome VARCHAR(10),
                    position BIGINT,
                    ref VARCHAR(255),
                    alt VARCHAR(255),
                    variant_type VARCHAR(20) NOT NULL
                        CHECK (variant_type IN ('SNV','INDEL','CNV','SV','FUSION')),
                    qual REAL,
                    filter VARCHAR(50),
                    format VARCHAR(20),
                    sample_data JSONB,
                    vcf_raw JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create annotations table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS annotations (
                    id SERIAL PRIMARY KEY,
                    variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
                    gene VARCHAR(50),
                    transcript VARCHAR(50),
                    consequence VARCHAR(100),
                    impact VARCHAR(20),
                    dbsnp_id VARCHAR(50),
                    cosmic_id VARCHAR(50),
                    vep_json JSONB DEFAULT '{}',
                    clinvar_significance VARCHAR(50),
                    oncogenicity VARCHAR(50),
                    drug_response JSONB DEFAULT '{}',
                    evidence_level VARCHAR(10),
                    therapy_recommendations TEXT[],
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create clinical_reports table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS clinical_reports (
                    id SERIAL PRIMARY KEY,
                    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
                    sequencing_run_id INTEGER REFERENCES sequencing_runs(id),
                    modules JSONB NOT NULL,
                    summary TEXT,
                    actionable_variants JSONB DEFAULT '[]',
                    therapy_recommendations JSONB DEFAULT '[]',
                    biomarkers JSONB DEFAULT '{}',
                    pdf_path TEXT,
                    json_path TEXT,
                    generated_by INTEGER REFERENCES users(id),
                    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            # Delete obsolete settings first
            await conn.execute("""
                DELETE FROM pipeline_settings WHERE setting_key IN ('strobealign_r', 'max_threads')
            """)
            await conn.execute("""
                INSERT INTO pipeline_settings (setting_key, setting_value, data_type, description) 
                VALUES 
                    ('default_read_length', '150', 'integer', 'Read length for alignment (bp)'),
                    ('default_threads', '4', 'integer', 'Default number of threads for alignment'),
                    ('max_memory_gb', '32', 'integer', 'Maximum memory allocation in GB'),
                    ('strobealign_k', '15', 'integer', 'Strobealign k-mer size parameter'),
                    ('strobealign_max_errors', '5', 'integer', 'Maximum errors allowed in alignment'),
                    ('alignment_mode', 'standard', 'string', 'Alignment mode: standard or sensitive'),
                    ('enable_secondary_alignments', 'true', 'boolean', 'Enable secondary alignments output')
                ON CONFLICT (setting_key) DO NOTHING
            """)
            
            # Insert or update read_length_options specifically
            await conn.execute("""
                INSERT INTO pipeline_settings (setting_key, setting_value, data_type, description) 
                VALUES ('read_length_options', '75,100,150,250,300', 'string', 'Available read length options (comma-separated)')
                ON CONFLICT (setting_key) DO UPDATE SET 
                    setting_value = EXCLUDED.setting_value,
                    data_type = EXCLUDED.data_type,
                    description = EXCLUDED.description
            """)
            
            # Seed default genome sources (remote genomes)
            await conn.execute("""
                INSERT INTO genome_sources (key, name, species, build, url, is_active) 
                VALUES 
                    (
                        'hg38',
                        'Human Genome (GRCh38)',
                        'Homo sapiens',
                        'GRCh38',
                        'https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz',
                        TRUE
                    ),
                    (
                        'hg19',
                        'Homo sapiens GRCh37 (hg19)',
                        'Homo sapiens',
                        'GRCh37',
                        'https://hgdownload.soe.ucsc.edu/goldenPath/hg19/bigZips/hg19.fa.gz',
                        TRUE
                    ),
                    (
                        'ecoli_k12',
                        'Escherichia coli K-12 MG1655',
                        'Escherichia coli',
                        'ASM584v2',
                        'https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/005/845/GCF_000005845.2_ASM584v2/GCF_000005845.2_ASM584v2_genomic.fna.gz',
                        TRUE
                    ),
                    (
                        'bacillus_168',
                        'Bacillus subtilis 168',
                        'Bacillus subtilis',
                        'ASM904v1',
                        'https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-62/fasta/bacteria_0_collection/bacillus_subtilis_subsp_subtilis_str_168_gca_000009045/dna/Bacillus_subtilis_subsp_subtilis_str_168_gca_000009045.ASM904v1.dna.chromosome.Chromosome.fa.gz',
                        TRUE
                    ),
                    (
                        'pseudomonas_pao1',
                        'Pseudomonas aeruginosa PAO1',
                        'Pseudomonas aeruginosa',
                        'ASM676v1',
                        'https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-62/fasta/bacteria_5_collection/pseudomonas_aeruginosa_pao1_gca_000006765/dna/Pseudomonas_aeruginosa_pao1_gca_000006765.ASM676v1_.dna.toplevel.fa.gz',
                        TRUE
                    )
                ON CONFLICT (key) DO UPDATE SET
                    name = EXCLUDED.name,
                    species = EXCLUDED.species,
                    build = EXCLUDED.build,
                    url = EXCLUDED.url,
                    is_active = EXCLUDED.is_active,
                    updated_at = CURRENT_TIMESTAMP
            """)
            
            # Seed AI provider settings (inactive by default)
            await conn.execute("""
                INSERT INTO ai_provider_settings (provider, model, api_key_encrypted, base_url, is_active)
                VALUES
                    ('openai', 'gpt-4', NULL, 'https://api.openai.com/v1', FALSE),
                    ('openai', 'gpt-3.5-turbo', NULL, 'https://api.openai.com/v1', FALSE),
                    ('anthropic', 'claude-3-opus', NULL, 'https://api.anthropic.com', FALSE),
                    ('anthropic', 'claude-3-sonnet', NULL, 'https://api.anthropic.com', FALSE),
                    ('google', 'gemini-pro', NULL, 'https://generativelanguage.googleapis.com', FALSE),
                    ('local', 'llama2', NULL, 'http://localhost:11434', FALSE)
                ON CONFLICT (provider, model) DO UPDATE SET
                    base_url = EXCLUDED.base_url,
                    updated_at = CURRENT_TIMESTAMP
            """)
            
            # Ensure UNIQUE constraint on ui_preferences.user_id exists
            await conn.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conrelid = 'ui_preferences'::regclass
                        AND conname = 'ui_preferences_user_id_key'
                    ) THEN
                        ALTER TABLE ui_preferences ADD UNIQUE (user_id);
                    END IF;
                END
                $$;
            """)
            
            # Seed UI preferences for admin user (if admin exists)
            await conn.execute("""
                INSERT INTO ui_preferences (user_id, language, timezone, theme, display_options)
                SELECT id, 'en', 'UTC', 'light', '{"showTutorial": true, "density": "comfortable", "fontSize": "medium"}'::jsonb
                FROM users WHERE email = 'admin@company.com'
                ON CONFLICT (user_id) DO NOTHING
            """)
            
            # ==================== CLINICAL CATALOG TABLES ====================
            
            # Create clinical_modules table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS clinical_modules (
                    id SERIAL PRIMARY KEY,
                    module_key VARCHAR(2) NOT NULL UNIQUE,
                    name VARCHAR(50) NOT NULL,
                    description TEXT,
                    required_sample_types TEXT[],
                    optional_sample_types TEXT[],
                    estimated_runtime_hours INTEGER,
                    clinical_utility TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    display_order INTEGER
                )
            """)
            
            # Create cancer_types table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cancer_types (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    category VARCHAR(50),
                    is_active BOOLEAN DEFAULT TRUE
                )
            """)
            
            # Create primary_sites table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS primary_sites (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL UNIQUE,
                    category VARCHAR(50)
                )
            """)
            
            # Create clinical_stages table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS clinical_stages (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(50) NOT NULL,
                    display_order INTEGER DEFAULT 0
                )
            """)
            
            # Create histology_subtypes table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS histology_subtypes (
                    id SERIAL PRIMARY KEY,
                    cancer_type_id INTEGER NOT NULL REFERENCES cancer_types(id) ON DELETE CASCADE,
                    name VARCHAR(100) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE
                )
            """)
            
            # Create cancer_type_primary_sites table (many-to-many mapping)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cancer_type_primary_sites (
                    id SERIAL PRIMARY KEY,
                    cancer_type_id INTEGER NOT NULL REFERENCES cancer_types(id) ON DELETE CASCADE,
                    primary_site_id INTEGER NOT NULL REFERENCES primary_sites(id) ON DELETE CASCADE,
                    is_primary BOOLEAN DEFAULT TRUE,
                    UNIQUE(cancer_type_id, primary_site_id)
                )
            """)
            
            # Create indexes for the new tables
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_histology_subtypes_cancer_type
                ON histology_subtypes(cancer_type_id)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_cancer_type_primary_sites_cancer_type
                ON cancer_type_primary_sites(cancer_type_id)
            """)
            
            # Migration: add histology_subtype and metastatic_sites to cases table
            await conn.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'cases' AND column_name = 'histology_subtype'
                    ) THEN
                        ALTER TABLE cases ADD COLUMN histology_subtype VARCHAR(100);
                    END IF;
                    
                    IF NOT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'cases' AND column_name = 'metastatic_sites'
                    ) THEN
                        ALTER TABLE cases ADD COLUMN metastatic_sites TEXT[];
                    END IF;
                END
                $$;
            """)
            
            # Seed clinical modules
            await conn.execute("""
                INSERT INTO clinical_modules (module_key, name, description, required_sample_types, estimated_runtime_hours, clinical_utility, display_order) VALUES
                    ('A', 'SNV / Indel', 'Single nucleotide variants and small insertions/deletions', ARRAY['tumor'], 2, 'Targetable mutations, diagnostic variants', 1),
                    ('B', 'CNV', 'Copy number variations and amplifications/deletions', ARRAY['tumor'], 1, 'Amplifications (ERBB2, EGFR, MET), homozygous deletions', 2),
                    ('C', 'SV', 'Structural variants and large rearrangements', ARRAY['tumor'], 1, 'Fusions, large deletions, inversions', 3),
                    ('D', 'RNA Fusion', 'Gene fusions from RNA-seq data', ARRAY['rna'], 2, 'Actionable fusions (ALK, ROS1, RET, NTRK)', 4),
                    ('E', 'MSI / TMB', 'Microsatellite instability and Tumor Mutational Burden', ARRAY['tumor'], 1, 'Immunotherapy eligibility (Pembrolizumab, Nivolumab)', 5),
                    ('F', 'HRD', 'Homologous Recombination Deficiency', ARRAY['tumor'], 1, 'PARP inhibitor sensitivity (Olaparib, Niraparib)', 6),
                    ('G', 'Germline', 'Hereditary variants from normal sample', ARRAY['germline', 'normal'], 2, 'Inherited cancer syndromes (BRCA, Lynch, TP53)', 7)
                ON CONFLICT (module_key) DO NOTHING
            """)
            
            # Seed cancer types (expanded)
            await conn.execute("""
                INSERT INTO cancer_types (code, name, category) VALUES
                    ('BRCA', 'Breast Cancer', 'Breast'),
                    ('LUNG', 'Lung Cancer', 'Lung'),
                    ('CRC', 'Colorectal Cancer', 'Colorectal'),
                    ('PROSTATE', 'Prostate Cancer', 'Prostate'),
                    ('MELANOMA', 'Melanoma', 'Skin'),
                    ('LEUKEMIA', 'Leukemia', 'Hematologic'),
                    ('LYMPHOMA', 'Lymphoma', 'Hematologic'),
                    ('PANCREAS', 'Pancreatic Cancer', 'Pancreatic'),
                    ('OVARY', 'Ovarian Cancer', 'Gynecologic'),
                    ('LIVER', 'Liver Cancer', 'Hepatic'),
                    ('BRAIN', 'Brain Tumor', 'CNS'),
                    ('GASTRIC', 'Gastric Cancer', 'Gastrointestinal'),
                    ('ENDOMETRIAL', 'Endometrial Cancer', 'Gynecologic'),
                    ('CERVICAL', 'Cervical Cancer', 'Gynecologic'),
                    ('HEADNECK', 'Head and Neck Cancer', 'Head & Neck'),
                    ('ESOPHAGEAL', 'Esophageal Cancer', 'Gastrointestinal'),
                    ('SARCOMA', 'Sarcoma', 'Musculoskeletal'),
                    ('THYROID', 'Thyroid Cancer', 'Endocrine'),
                    ('RCC', 'Renal Cell Carcinoma', 'Genitourinary'),
                    ('BLADDER', 'Bladder Cancer', 'Genitourinary'),
                    ('CHOLANGIO', 'Cholangiocarcinoma', 'Hepatic'),
                    ('MYELOMA', 'Multiple Myeloma', 'Hematologic'),
                    ('GBM', 'Glioblastoma', 'CNS'),
                    ('AML', 'AML', 'Hematologic'),
                    ('ALL', 'ALL', 'Hematologic'),
                    ('MDS', 'MDS', 'Hematologic'),
                    ('MPN', 'Myeloproliferative Neoplasm', 'Hematologic'),
                    ('UNKNOWN_PRIMARY', 'Unknown Primary', 'Other')
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    category = EXCLUDED.category
            """)
            
            # Seed primary sites (expanded)
            await conn.execute("""
                INSERT INTO primary_sites (name, category) VALUES
                    ('Breast', 'Breast'), ('Lung', 'Thoracic'), ('Colon', 'Gastrointestinal'),
                    ('Rectum', 'Gastrointestinal'), ('Prostate', 'Genitourinary'), ('Skin', 'Skin'),
                    ('Blood', 'Hematologic'), ('Lymph Node', 'Lymphatic'), ('Pancreas', 'Pancreatic'),
                    ('Ovary', 'Gynecologic'), ('Liver', 'Hepatic'), ('Brain', 'CNS'),
                    ('Bone', 'Musculoskeletal'), ('Kidney', 'Genitourinary'), ('Bladder', 'Genitourinary'),
                    ('Stomach', 'Gastrointestinal'), ('Endometrium', 'Gynecologic'),
                    ('Cervix', 'Gynecologic'), ('Thyroid', 'Endocrine'), ('Pleura', 'Thoracic'),
                    ('Peritoneum', 'Gastrointestinal'), ('Bone Marrow', 'Hematologic'),
                    ('Adrenal', 'Endocrine'), ('Soft Tissue', 'Musculoskeletal'),
                    ('Head & Neck', 'Head & Neck'), ('Esophagus', 'Gastrointestinal'),
                    ('Gallbladder', 'Hepatic'), ('Bile Duct', 'Hepatic'),
                    ('Unknown Primary', 'Other'), ('Other', 'Other')
                ON CONFLICT (name) DO UPDATE SET
                    category = EXCLUDED.category
            """)
            
            # Seed clinical stages
            await conn.execute("""
                INSERT INTO clinical_stages (code, name, display_order) VALUES
                    ('0', 'Stage 0', 1),
                    ('I', 'Stage I', 2),
                    ('IA', 'Stage IA', 3),
                    ('IB', 'Stage IB', 4),
                    ('II', 'Stage II', 5),
                    ('IIA', 'Stage IIA', 6),
                    ('IIB', 'Stage IIB', 7),
                    ('III', 'Stage III', 8),
                    ('IIIA', 'Stage IIIA', 9),
                    ('IIIB', 'Stage IIIB', 10),
                    ('IV', 'Stage IV', 11),
                    ('Unknown', 'Unknown', 12)
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    display_order = EXCLUDED.display_order
            """)
            
            # Seed histology subtypes
            await conn.execute("""
                INSERT INTO histology_subtypes (cancer_type_id, name) VALUES
                    -- Breast Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), 'Ductal Carcinoma In Situ (DCIS)'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), 'Invasive Ductal Carcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), 'Invasive Lobular Carcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), 'ER+/HER2-'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), 'HER2+'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), 'Triple Negative'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), 'Luminal A'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), 'Luminal B'),
                    -- Lung Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'LUNG'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'LUNG'), 'Squamous Cell Carcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'LUNG'), 'Small Cell Carcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'LUNG'), 'Large Cell Carcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'LUNG'), 'Carcinoid Tumor'),
                    ((SELECT id FROM cancer_types WHERE code = 'LUNG'), 'Mesothelioma'),
                    -- Colorectal Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'CRC'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'CRC'), 'Mucinous Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'CRC'), 'Signet Ring Cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'CRC'), 'Neuroendocrine'),
                    -- Prostate Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'PROSTATE'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'PROSTATE'), 'Small Cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'PROSTATE'), 'Ductal'),
                    ((SELECT id FROM cancer_types WHERE code = 'PROSTATE'), 'Neuroendocrine'),
                    -- Melanoma
                    ((SELECT id FROM cancer_types WHERE code = 'MELANOMA'), 'Superficial Spreading'),
                    ((SELECT id FROM cancer_types WHERE code = 'MELANOMA'), 'Nodular'),
                    ((SELECT id FROM cancer_types WHERE code = 'MELANOMA'), 'Lentigo Maligna'),
                    ((SELECT id FROM cancer_types WHERE code = 'MELANOMA'), 'Acral Lentiginous'),
                    ((SELECT id FROM cancer_types WHERE code = 'MELANOMA'), 'Uveal'),
                    -- Leukemia
                    ((SELECT id FROM cancer_types WHERE code = 'LEUKEMIA'), 'ALL'),
                    ((SELECT id FROM cancer_types WHERE code = 'LEUKEMIA'), 'AML'),
                    ((SELECT id FROM cancer_types WHERE code = 'LEUKEMIA'), 'CLL'),
                    ((SELECT id FROM cancer_types WHERE code = 'LEUKEMIA'), 'CML'),
                    ((SELECT id FROM cancer_types WHERE code = 'LEUKEMIA'), 'Hairy Cell'),
                    -- Lymphoma
                    ((SELECT id FROM cancer_types WHERE code = 'LYMPHOMA'), 'DLBCL'),
                    ((SELECT id FROM cancer_types WHERE code = 'LYMPHOMA'), 'Follicular'),
                    ((SELECT id FROM cancer_types WHERE code = 'LYMPHOMA'), 'Hodgkin'),
                    ((SELECT id FROM cancer_types WHERE code = 'LYMPHOMA'), 'Burkitt'),
                    ((SELECT id FROM cancer_types WHERE code = 'LYMPHOMA'), 'Mantle Cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'LYMPHOMA'), 'Marginal Zone'),
                    ((SELECT id FROM cancer_types WHERE code = 'LYMPHOMA'), 'T-cell'),
                    -- Pancreatic Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'PANCREAS'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'PANCREAS'), 'Pancreatic Neuroendocrine (PNET)'),
                    ((SELECT id FROM cancer_types WHERE code = 'PANCREAS'), 'Acinar Cell'),
                    -- Ovarian Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'OVARY'), 'High-Grade Serous'),
                    ((SELECT id FROM cancer_types WHERE code = 'OVARY'), 'Low-Grade Serous'),
                    ((SELECT id FROM cancer_types WHERE code = 'OVARY'), 'Mucinous'),
                    ((SELECT id FROM cancer_types WHERE code = 'OVARY'), 'Endometrioid'),
                    ((SELECT id FROM cancer_types WHERE code = 'OVARY'), 'Clear Cell'),
                    -- Liver Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'LIVER'), 'Hepatocellular Carcinoma (HCC)'),
                    ((SELECT id FROM cancer_types WHERE code = 'LIVER'), 'Fibrolamellar'),
                    ((SELECT id FROM cancer_types WHERE code = 'LIVER'), 'Hepatoblastoma'),
                    -- Brain Tumor
                    ((SELECT id FROM cancer_types WHERE code = 'BRAIN'), 'Glioblastoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRAIN'), 'Astrocytoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRAIN'), 'Oligodendroglioma'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRAIN'), 'Medulloblastoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'BRAIN'), 'Meningioma'),
                    -- Gastric Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'GASTRIC'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'GASTRIC'), 'Diffuse Type'),
                    ((SELECT id FROM cancer_types WHERE code = 'GASTRIC'), 'Intestinal Type'),
                    ((SELECT id FROM cancer_types WHERE code = 'GASTRIC'), 'Signet Ring Cell'),
                    -- Endometrial Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'ENDOMETRIAL'), 'Endometrioid'),
                    ((SELECT id FROM cancer_types WHERE code = 'ENDOMETRIAL'), 'Serous'),
                    ((SELECT id FROM cancer_types WHERE code = 'ENDOMETRIAL'), 'Clear Cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'ENDOMETRIAL'), 'Carcinosarcoma'),
                    -- Cervical Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'CERVICAL'), 'Squamous Cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'CERVICAL'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'CERVICAL'), 'Adenosquamous'),
                    ((SELECT id FROM cancer_types WHERE code = 'CERVICAL'), 'Small Cell'),
                    -- Head and Neck Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'HEADNECK'), 'Squamous Cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'HEADNECK'), 'HPV+'),
                    ((SELECT id FROM cancer_types WHERE code = 'HEADNECK'), 'Adenoid Cystic'),
                    ((SELECT id FROM cancer_types WHERE code = 'HEADNECK'), 'Mucoepidermoid'),
                    -- Esophageal Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'ESOPHAGEAL'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'ESOPHAGEAL'), 'Squamous Cell'),
                    -- Sarcoma
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), 'Leiomyosarcoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), 'Liposarcoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), 'Synovial Sarcoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), 'Osteosarcoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), 'Ewing Sarcoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), 'Rhabdomyosarcoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), 'GIST'),
                    -- Thyroid Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'THYROID'), 'Papillary'),
                    ((SELECT id FROM cancer_types WHERE code = 'THYROID'), 'Follicular'),
                    ((SELECT id FROM cancer_types WHERE code = 'THYROID'), 'Medullary'),
                    ((SELECT id FROM cancer_types WHERE code = 'THYROID'), 'Anaplastic'),
                    ((SELECT id FROM cancer_types WHERE code = 'THYROID'), 'Hurthle Cell'),
                    -- Renal Cell Carcinoma
                    ((SELECT id FROM cancer_types WHERE code = 'RCC'), 'Clear Cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'RCC'), 'Papillary'),
                    ((SELECT id FROM cancer_types WHERE code = 'RCC'), 'Chromophobe'),
                    ((SELECT id FROM cancer_types WHERE code = 'RCC'), 'Collecting Duct'),
                    -- Bladder Cancer
                    ((SELECT id FROM cancer_types WHERE code = 'BLADDER'), 'Urothelial'),
                    ((SELECT id FROM cancer_types WHERE code = 'BLADDER'), 'Squamous Cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'BLADDER'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'BLADDER'), 'Small Cell'),
                    -- Cholangiocarcinoma
                    ((SELECT id FROM cancer_types WHERE code = 'CHOLANGIO'), 'Intrahepatic'),
                    ((SELECT id FROM cancer_types WHERE code = 'CHOLANGIO'), 'Extrahepatic'),
                    ((SELECT id FROM cancer_types WHERE code = 'CHOLANGIO'), 'Perihilar'),
                    ((SELECT id FROM cancer_types WHERE code = 'CHOLANGIO'), 'Distal'),
                    -- Multiple Myeloma
                    ((SELECT id FROM cancer_types WHERE code = 'MYELOMA'), 'IgG'),
                    ((SELECT id FROM cancer_types WHERE code = 'MYELOMA'), 'IgA'),
                    ((SELECT id FROM cancer_types WHERE code = 'MYELOMA'), 'Light Chain'),
                    ((SELECT id FROM cancer_types WHERE code = 'MYELOMA'), 'Non-Secretory'),
                    ((SELECT id FROM cancer_types WHERE code = 'MYELOMA'), 'Smoldering'),
                    -- Glioblastoma
                    ((SELECT id FROM cancer_types WHERE code = 'GBM'), 'IDH-wildtype'),
                    ((SELECT id FROM cancer_types WHERE code = 'GBM'), 'IDH-mutant'),
                    ((SELECT id FROM cancer_types WHERE code = 'GBM'), 'MGMT-methylated'),
                    ((SELECT id FROM cancer_types WHERE code = 'GBM'), 'MGMT-unmethylated'),
                    -- AML
                    ((SELECT id FROM cancer_types WHERE code = 'AML'), 'de novo'),
                    ((SELECT id FROM cancer_types WHERE code = 'AML'), 'Secondary/therapy-related'),
                    ((SELECT id FROM cancer_types WHERE code = 'AML'), 'APL'),
                    -- ALL
                    ((SELECT id FROM cancer_types WHERE code = 'ALL'), 'B-cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'ALL'), 'T-cell'),
                    ((SELECT id FROM cancer_types WHERE code = 'ALL'), 'Ph+'),
                    ((SELECT id FROM cancer_types WHERE code = 'ALL'), 'Infant'),
                    -- MDS
                    ((SELECT id FROM cancer_types WHERE code = 'MDS'), 'MDS-MLD'),
                    ((SELECT id FROM cancer_types WHERE code = 'MDS'), 'MDS-EB'),
                    ((SELECT id FROM cancer_types WHERE code = 'MDS'), 'MDS-RS'),
                    ((SELECT id FROM cancer_types WHERE code = 'MDS'), 'MDS-5q'),
                    -- Myeloproliferative Neoplasm
                    ((SELECT id FROM cancer_types WHERE code = 'MPN'), 'PV (Polycythemia Vera)'),
                    ((SELECT id FROM cancer_types WHERE code = 'MPN'), 'ET (Essential Thrombocythemia)'),
                    ((SELECT id FROM cancer_types WHERE code = 'MPN'), 'PMF (Primary Myelofibrosis)'),
                    ((SELECT id FROM cancer_types WHERE code = 'MPN'), 'CMML'),
                    -- Unknown Primary
                    ((SELECT id FROM cancer_types WHERE code = 'UNKNOWN_PRIMARY'), 'Adenocarcinoma'),
                    ((SELECT id FROM cancer_types WHERE code = 'UNKNOWN_PRIMARY'), 'Squamous'),
                    ((SELECT id FROM cancer_types WHERE code = 'UNKNOWN_PRIMARY'), 'Neuroendocrine'),
                    ((SELECT id FROM cancer_types WHERE code = 'UNKNOWN_PRIMARY'), 'Undifferentiated')
                ON CONFLICT DO NOTHING
            """)
            
            # Seed cancer_type <-> primary_site mappings
            await conn.execute("""
                INSERT INTO cancer_type_primary_sites (cancer_type_id, primary_site_id, is_primary) VALUES
                    -- Breast Cancer -> Breast
                    ((SELECT id FROM cancer_types WHERE code = 'BRCA'), (SELECT id FROM primary_sites WHERE name = 'Breast'), TRUE),
                    -- Lung Cancer -> Lung
                    ((SELECT id FROM cancer_types WHERE code = 'LUNG'), (SELECT id FROM primary_sites WHERE name = 'Lung'), TRUE),
                    -- Colorectal Cancer -> Colon, Rectum
                    ((SELECT id FROM cancer_types WHERE code = 'CRC'), (SELECT id FROM primary_sites WHERE name = 'Colon'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'CRC'), (SELECT id FROM primary_sites WHERE name = 'Rectum'), FALSE),
                    -- Prostate Cancer -> Prostate
                    ((SELECT id FROM cancer_types WHERE code = 'PROSTATE'), (SELECT id FROM primary_sites WHERE name = 'Prostate'), TRUE),
                    -- Melanoma -> Skin
                    ((SELECT id FROM cancer_types WHERE code = 'MELANOMA'), (SELECT id FROM primary_sites WHERE name = 'Skin'), TRUE),
                    -- Leukemia -> Blood, Bone Marrow
                    ((SELECT id FROM cancer_types WHERE code = 'LEUKEMIA'), (SELECT id FROM primary_sites WHERE name = 'Blood'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'LEUKEMIA'), (SELECT id FROM primary_sites WHERE name = 'Bone Marrow'), FALSE),
                    -- Lymphoma -> Lymph Node
                    ((SELECT id FROM cancer_types WHERE code = 'LYMPHOMA'), (SELECT id FROM primary_sites WHERE name = 'Lymph Node'), TRUE),
                    -- Pancreatic Cancer -> Pancreas
                    ((SELECT id FROM cancer_types WHERE code = 'PANCREAS'), (SELECT id FROM primary_sites WHERE name = 'Pancreas'), TRUE),
                    -- Ovarian Cancer -> Ovary
                    ((SELECT id FROM cancer_types WHERE code = 'OVARY'), (SELECT id FROM primary_sites WHERE name = 'Ovary'), TRUE),
                    -- Liver Cancer -> Liver
                    ((SELECT id FROM cancer_types WHERE code = 'LIVER'), (SELECT id FROM primary_sites WHERE name = 'Liver'), TRUE),
                    -- Brain Tumor -> Brain
                    ((SELECT id FROM cancer_types WHERE code = 'BRAIN'), (SELECT id FROM primary_sites WHERE name = 'Brain'), TRUE),
                    -- Gastric Cancer -> Stomach
                    ((SELECT id FROM cancer_types WHERE code = 'GASTRIC'), (SELECT id FROM primary_sites WHERE name = 'Stomach'), TRUE),
                    -- Endometrial Cancer -> Endometrium
                    ((SELECT id FROM cancer_types WHERE code = 'ENDOMETRIAL'), (SELECT id FROM primary_sites WHERE name = 'Endometrium'), TRUE),
                    -- Cervical Cancer -> Cervix
                    ((SELECT id FROM cancer_types WHERE code = 'CERVICAL'), (SELECT id FROM primary_sites WHERE name = 'Cervix'), TRUE),
                    -- Head and Neck Cancer -> Head & Neck
                    ((SELECT id FROM cancer_types WHERE code = 'HEADNECK'), (SELECT id FROM primary_sites WHERE name = 'Head & Neck'), TRUE),
                    -- Esophageal Cancer -> Esophagus
                    ((SELECT id FROM cancer_types WHERE code = 'ESOPHAGEAL'), (SELECT id FROM primary_sites WHERE name = 'Esophagus'), TRUE),
                    -- Sarcoma -> Soft Tissue, Bone
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), (SELECT id FROM primary_sites WHERE name = 'Soft Tissue'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'SARCOMA'), (SELECT id FROM primary_sites WHERE name = 'Bone'), FALSE),
                    -- Thyroid Cancer -> Thyroid
                    ((SELECT id FROM cancer_types WHERE code = 'THYROID'), (SELECT id FROM primary_sites WHERE name = 'Thyroid'), TRUE),
                    -- Renal Cell Carcinoma -> Kidney
                    ((SELECT id FROM cancer_types WHERE code = 'RCC'), (SELECT id FROM primary_sites WHERE name = 'Kidney'), TRUE),
                    -- Bladder Cancer -> Bladder
                    ((SELECT id FROM cancer_types WHERE code = 'BLADDER'), (SELECT id FROM primary_sites WHERE name = 'Bladder'), TRUE),
                    -- Cholangiocarcinoma -> Bile Duct, Liver, Gallbladder
                    ((SELECT id FROM cancer_types WHERE code = 'CHOLANGIO'), (SELECT id FROM primary_sites WHERE name = 'Bile Duct'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'CHOLANGIO'), (SELECT id FROM primary_sites WHERE name = 'Liver'), FALSE),
                    ((SELECT id FROM cancer_types WHERE code = 'CHOLANGIO'), (SELECT id FROM primary_sites WHERE name = 'Gallbladder'), FALSE),
                    -- Multiple Myeloma -> Bone Marrow
                    ((SELECT id FROM cancer_types WHERE code = 'MYELOMA'), (SELECT id FROM primary_sites WHERE name = 'Bone Marrow'), TRUE),
                    -- Glioblastoma -> Brain
                    ((SELECT id FROM cancer_types WHERE code = 'GBM'), (SELECT id FROM primary_sites WHERE name = 'Brain'), TRUE),
                    -- AML -> Blood, Bone Marrow
                    ((SELECT id FROM cancer_types WHERE code = 'AML'), (SELECT id FROM primary_sites WHERE name = 'Blood'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'AML'), (SELECT id FROM primary_sites WHERE name = 'Bone Marrow'), FALSE),
                    -- ALL -> Blood, Bone Marrow
                    ((SELECT id FROM cancer_types WHERE code = 'ALL'), (SELECT id FROM primary_sites WHERE name = 'Blood'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'ALL'), (SELECT id FROM primary_sites WHERE name = 'Bone Marrow'), FALSE),
                    -- MDS -> Blood, Bone Marrow
                    ((SELECT id FROM cancer_types WHERE code = 'MDS'), (SELECT id FROM primary_sites WHERE name = 'Blood'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'MDS'), (SELECT id FROM primary_sites WHERE name = 'Bone Marrow'), FALSE),
                    -- Myeloproliferative Neoplasm -> Blood, Bone Marrow
                    ((SELECT id FROM cancer_types WHERE code = 'MPN'), (SELECT id FROM primary_sites WHERE name = 'Blood'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'MPN'), (SELECT id FROM primary_sites WHERE name = 'Bone Marrow'), FALSE),
                    -- Unknown Primary -> Unknown Primary, Other
                    ((SELECT id FROM cancer_types WHERE code = 'UNKNOWN_PRIMARY'), (SELECT id FROM primary_sites WHERE name = 'Unknown Primary'), TRUE),
                    ((SELECT id FROM cancer_types WHERE code = 'UNKNOWN_PRIMARY'), (SELECT id FROM primary_sites WHERE name = 'Other'), FALSE),
                    -- Other -> Other
                    ((SELECT id FROM cancer_types WHERE code = 'OTHER'), (SELECT id FROM primary_sites WHERE name = 'Other'), TRUE)
                ON CONFLICT (cancer_type_id, primary_site_id) DO NOTHING
            """)
            
            logger.info("Database schema initialized with authentication, settings, genomes, AI providers, UI preferences, and clinical catalogs")
    
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
                INSERT INTO indexed_genomes (name, species, build, file_path, status)
                VALUES ($1, $2, $3, $4, 'uploaded')
                RETURNING id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
            """, name, species, build, file_path)
            
            return ReferenceGenome(**dict(row))
    
    async def get_reference_genomes(self) -> List[ReferenceGenome]:
        """Get all reference genomes"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
                FROM indexed_genomes
                ORDER BY created_at DESC
            """)
            
            return [ReferenceGenome(**dict(row)) for row in rows]
    
    async def get_ready_genomes(self, species: Optional[str] = None) -> List[ReferenceGenome]:
        """Get ready indexed genomes, optionally filtered by species"""
        async with self.pool.acquire() as conn:
            if species:
                rows = await conn.fetch("""
                    SELECT id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
                    FROM indexed_genomes
                    WHERE status = 'ready' AND species = $1
                    ORDER BY created_at DESC
                """, species)
            else:
                rows = await conn.fetch("""
                    SELECT id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
                    FROM indexed_genomes
                    WHERE status = 'ready'
                    ORDER BY created_at DESC
                """)
            return [ReferenceGenome(**dict(row)) for row in rows]
    
    async def get_reference_genome(self, genome_id: int) -> Optional[ReferenceGenome]:
        """Get a reference genome by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
                FROM indexed_genomes
                WHERE id = $1
            """, genome_id)
            
            return ReferenceGenome(**dict(row)) if row else None
    
    async def get_reference_genome_by_name(self, name: str) -> Optional[ReferenceGenome]:
        """Get a reference genome by name"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, species, build, file_path, gz_path, fai_path, gzi_path, sti_path, status, created_at, updated_at
                FROM indexed_genomes
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
            query = "UPDATE indexed_genomes SET status = $2, updated_at = CURRENT_TIMESTAMP"
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
                DELETE FROM indexed_genomes WHERE id = $1
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
    
    async def delete_pipeline_jobs_by_genome(self, genome_id: str) -> int:
        """Delete pipeline jobs related to a specific genome ID"""
        async with self.pool.acquire() as conn:
            # Look for jobs where parameters contain the genome_id
            # Parameters are stored as JSON string: {"genome_id": "hg38", ...}
            result = await conn.execute("""
                DELETE FROM pipeline_jobs 
                WHERE parameters LIKE $1
            """, f'%"genome_id": "{genome_id}"%')
            
            # Return number of deleted rows
            return int(result.split()[1]) if result else 0
    
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
                INSERT INTO genome_sources (key, name, species, build, url, is_active, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, key, name, species, build, url, is_active, created_by, created_at, updated_at
            """, key, name, species, build, url, is_active, created_by)
            
            return GenomeReference(**dict(row))
    
    async def get_genome_references(self) -> List[GenomeReference]:
        """Get all genome references"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, key, name, species, build, url, is_active, created_by, created_at, updated_at
                FROM genome_sources
                ORDER BY created_at DESC
            """)
            
            return [GenomeReference(**dict(row)) for row in rows]
    
    async def get_genome_reference(self, ref_id: int) -> Optional[GenomeReference]:
        """Get a genome reference by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, key, name, species, build, url, is_active, created_by, created_at, updated_at
                FROM genome_sources
                WHERE id = $1
            """, ref_id)
            
            return GenomeReference(**dict(row)) if row else None
    
    async def get_genome_reference_by_key(self, key: str) -> Optional[GenomeReference]:
        """Get a genome reference by key"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, key, name, species, build, url, is_active, created_by, created_at, updated_at
                FROM genome_sources
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
            query = "UPDATE genome_sources SET updated_at = CURRENT_TIMESTAMP"
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
                DELETE FROM genome_sources WHERE id = $1
            """, ref_id)
            
            return result == "DELETE 1"
    
    async def get_species(self) -> List[Species]:
        """Get all species ordered by tier and display_order"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name, tier, display_order
                FROM species
                ORDER BY tier, display_order
            """)
            return [Species(**dict(row)) for row in rows]
    
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
    
    # ==================== CLINICAL — HOSPITALS ====================
    
    async def create_hospital(
        self,
        name: str,
        code: str
    ) -> Hospital:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO hospitals (name, code)
                VALUES ($1, $2)
                RETURNING id, name, code, created_at
            """, name, code)
            return Hospital(**dict(row))
    
    async def get_hospital(self, hospital_id: int) -> Optional[Hospital]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, code, created_at
                FROM hospitals WHERE id = $1
            """, hospital_id)
            return Hospital(**dict(row)) if row else None
    
    async def get_hospitals(self) -> List[Hospital]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name, code, created_at
                FROM hospitals ORDER BY name ASC
            """)
            return [Hospital(**dict(row)) for row in rows]
    
    async def delete_hospital(self, hospital_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM hospitals WHERE id = $1", hospital_id)
            return result == "DELETE 1"
    
    # ==================== CLINICAL — PATIENTS ====================
    
    async def create_patient(
        self,
        external_patient_id: str,
        sex: Optional[str] = None,
        date_of_birth: Optional[date] = None,
        hospital_id: Optional[int] = None
    ) -> Patient:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO patients (external_patient_id, sex, date_of_birth, hospital_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id, external_patient_id, sex, date_of_birth, hospital_id, created_at
            """, external_patient_id, sex, date_of_birth, hospital_id)
            return Patient(**dict(row))
    
    async def get_patient(self, patient_id: int) -> Optional[Patient]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, external_patient_id, sex, date_of_birth, hospital_id, created_at
                FROM patients WHERE id = $1
            """, patient_id)
            return Patient(**dict(row)) if row else None
    
    async def get_patient_by_external_id(self, external_id: str) -> Optional[Patient]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, external_patient_id, sex, date_of_birth, hospital_id, created_at
                FROM patients WHERE external_patient_id = $1
            """, external_id)
            return Patient(**dict(row)) if row else None
    
    async def get_patients(self) -> List[Patient]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, external_patient_id, sex, date_of_birth, hospital_id, created_at
                FROM patients ORDER BY created_at DESC
            """)
            return [Patient(**dict(row)) for row in rows]

    async def search_patients(self, query: str, limit: int = 20) -> List[Patient]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, external_patient_id, sex, date_of_birth, hospital_id, created_at
                FROM patients
                WHERE external_patient_id ILIKE $1
                ORDER BY
                  CASE WHEN external_patient_id ILIKE $2 THEN 0 ELSE 1 END,
                  created_at DESC
                LIMIT $3
            """, f"%{query}%", f"{query}%", limit)
            return [Patient(**dict(row)) for row in rows]
    
    async def update_patient(
        self,
        patient_id: int,
        sex: Optional[str] = None,
        date_of_birth: Optional[date] = None,
        hospital_id: Optional[int] = None
    ) -> Optional[Patient]:
        async with self.pool.acquire() as conn:
            query = "UPDATE patients SET"
            params = []
            param_count = 0
            if sex is not None:
                param_count += 1
                query += f" sex = ${param_count}"
                params.append(sex)
            if date_of_birth is not None:
                param_count += 1
                query += f"{',' if param_count > 1 else ''} date_of_birth = ${param_count}"
                params.append(date_of_birth)
            if hospital_id is not None:
                param_count += 1
                query += f"{',' if param_count > 1 else ''} hospital_id = ${param_count}"
                params.append(hospital_id)
            if param_count == 0:
                return await self.get_patient(patient_id)
            params.append(patient_id)
            query += f" WHERE id = ${param_count + 1} RETURNING id, external_patient_id, sex, date_of_birth, hospital_id, created_at"
            row = await conn.fetchrow(query, *params)
            return Patient(**dict(row)) if row else None
    
    async def delete_patient(self, patient_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM patients WHERE id = $1", patient_id)
            return result == "DELETE 1"
    
    # ==================== CLINICAL — CASES ====================
    
    async def create_case(
        self,
        patient_id: int,
        case_code: str,
        diagnosis: Optional[str] = None,
        cancer_type: Optional[str] = None,
        primary_site: Optional[str] = None,
        stage: Optional[str] = None,
        histology_subtype: Optional[str] = None,
        metastatic_sites: Optional[List[str]] = None,
        clinical_question: Optional[str] = None,
        requested_modules: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        created_by: Optional[int] = None
    ) -> Case:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO cases (patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
                RETURNING id, patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status,
                    created_by, created_at, updated_at
            """, patient_id, case_code, diagnosis, cancer_type, primary_site,
                stage, histology_subtype, metastatic_sites,
                clinical_question, requested_modules,
                json.dumps(metadata) if metadata else "{}", created_by)
            return Case(**dict(row))
    
    async def get_case(self, case_id: int) -> Optional[Case]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status,
                    created_by, created_at, updated_at
                FROM cases WHERE id = $1
            """, case_id)
            return Case(**dict(row)) if row else None
    
    async def get_case_by_code(self, case_code: str) -> Optional[Case]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status,
                    created_by, created_at, updated_at
                FROM cases WHERE case_code = $1
            """, case_code)
            return Case(**dict(row)) if row else None
    
    async def get_cases(self) -> List[Case]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status,
                    created_by, created_at, updated_at
                FROM cases ORDER BY created_at DESC
            """)
            return [Case(**dict(row)) for row in rows]

    async def get_cases_filtered(
        self,
        cancer_type: Optional[str] = None,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Case]:
        async with self.pool.acquire() as conn:
            conditions = []
            params = []
            param_count = 0
            if cancer_type:
                param_count += 1
                conditions.append(f"cancer_type = ${param_count}")
                params.append(cancer_type)
            if status:
                param_count += 1
                conditions.append(f"status = ${param_count}")
                params.append(status)
            if date_from:
                param_count += 1
                conditions.append(f"created_at >= ${param_count}")
                params.append(date_from)
            if date_to:
                param_count += 1
                conditions.append(f"created_at <= ${param_count}")
                params.append(date_to)
            where_clause = " AND ".join(conditions) if conditions else "TRUE"
            param_count += 1
            params.append(limit)
            param_count += 1
            params.append(offset)
            rows = await conn.fetch(f"""
                SELECT id, patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status,
                    created_by, created_at, updated_at
                FROM cases WHERE {where_clause} ORDER BY created_at DESC
                LIMIT ${param_count - 1} OFFSET ${param_count}
            """, *params)
            return [Case(**dict(row)) for row in rows]
    
    async def get_cases_by_patient(self, patient_id: int) -> List[Case]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status,
                    created_by, created_at, updated_at
                FROM cases WHERE patient_id = $1 ORDER BY created_at DESC
            """, patient_id)
            return [Case(**dict(row)) for row in rows]
    
    async def get_cases_by_status(self, status: str) -> List[Case]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status,
                    created_by, created_at, updated_at
                FROM cases WHERE status = $1 ORDER BY created_at DESC
            """, status)
            return [Case(**dict(row)) for row in rows]
    
    async def update_case(
        self,
        case_id: int,
        diagnosis: Optional[str] = None,
        cancer_type: Optional[str] = None,
        primary_site: Optional[str] = None,
        stage: Optional[str] = None,
        histology_subtype: Optional[str] = None,
        metastatic_sites: Optional[List[str]] = None,
        clinical_question: Optional[str] = None,
        requested_modules: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Case]:
        async with self.pool.acquire() as conn:
            query = "UPDATE cases SET updated_at = CURRENT_TIMESTAMP"
            params = [case_id]
            param_count = 1
            if diagnosis is not None:
                param_count += 1
                query += f", diagnosis = ${param_count}"
                params.append(diagnosis)
            if cancer_type is not None:
                param_count += 1
                query += f", cancer_type = ${param_count}"
                params.append(cancer_type)
            if primary_site is not None:
                param_count += 1
                query += f", primary_site = ${param_count}"
                params.append(primary_site)
            if stage is not None:
                param_count += 1
                query += f", stage = ${param_count}"
                params.append(stage)
            if histology_subtype is not None:
                param_count += 1
                query += f", histology_subtype = ${param_count}"
                params.append(histology_subtype)
            if metastatic_sites is not None:
                param_count += 1
                query += f", metastatic_sites = ${param_count}"
                params.append(metastatic_sites)
            if clinical_question is not None:
                param_count += 1
                query += f", clinical_question = ${param_count}"
                params.append(clinical_question)
            if requested_modules is not None:
                param_count += 1
                query += f", requested_modules = ${param_count}"
                params.append(requested_modules)
            if metadata is not None:
                param_count += 1
                query += f", metadata = ${param_count}::jsonb"
                params.append(json.dumps(metadata))
            query += f" WHERE id = $1 RETURNING id, patient_id, case_code, diagnosis, cancer_type, primary_site, stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status, created_by, created_at, updated_at"
            row = await conn.fetchrow(query, *params)
            return Case(**dict(row)) if row else None
    
    async def update_case_status(self, case_id: int, status: str) -> Optional[Case]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                UPDATE cases SET status = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id, patient_id, case_code, diagnosis, cancer_type, primary_site,
                    stage, histology_subtype, metastatic_sites, clinical_question, requested_modules, metadata, status,
                    created_by, created_at, updated_at
            """, case_id, status)
            return Case(**dict(row)) if row else None
    
    async def delete_case(self, case_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM cases WHERE id = $1", case_id)
            return result == "DELETE 1"
    
    # ==================== CLINICAL — SAMPLES V2 ====================
    
    async def create_clinical_sample(
        self,
        case_id: int,
        sample_code: str,
        sample_type: str,
        tissue_site: Optional[str] = None,
        collection_method: Optional[str] = None
    ) -> ClinicalSample:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO samples_v2 (case_id, sample_code, sample_type, tissue_site, collection_method)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, case_id, sample_code, sample_type, tissue_site, collection_method, quality_status, created_at
            """, case_id, sample_code, sample_type, tissue_site, collection_method)
            return ClinicalSample(**dict(row))
    
    async def get_clinical_sample(self, sample_id: int) -> Optional[ClinicalSample]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, case_id, sample_code, sample_type, tissue_site, collection_method, quality_status, created_at
                FROM samples_v2 WHERE id = $1
            """, sample_id)
            return ClinicalSample(**dict(row)) if row else None
    
    async def get_clinical_samples_by_case(self, case_id: int) -> List[ClinicalSample]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, case_id, sample_code, sample_type, tissue_site, collection_method, quality_status, created_at
                FROM samples_v2 WHERE case_id = $1 ORDER BY created_at
            """, case_id)
            return [ClinicalSample(**dict(row)) for row in rows]
    
    async def get_clinical_samples(self) -> List[ClinicalSample]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, case_id, sample_code, sample_type, tissue_site, collection_method, quality_status, created_at
                FROM samples_v2 ORDER BY created_at DESC
            """)
            return [ClinicalSample(**dict(row)) for row in rows]
    
    async def get_sample_by_code(self, sample_code: str) -> Optional[ClinicalSample]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, case_id, sample_code, sample_type, tissue_site, collection_method, quality_status, created_at
                FROM samples_v2 WHERE sample_code = $1
            """, sample_code)
            return ClinicalSample(**dict(row)) if row else None
    
    async def update_clinical_sample(
        self,
        sample_id: int,
        tissue_site: Optional[str] = None,
        collection_method: Optional[str] = None,
        quality_status: Optional[str] = None
    ) -> Optional[ClinicalSample]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                UPDATE samples_v2 SET
                    tissue_site = COALESCE($2, tissue_site),
                    collection_method = COALESCE($3, collection_method),
                    quality_status = COALESCE($4, quality_status)
                WHERE id = $1
                RETURNING id, case_id, sample_code, sample_type, tissue_site, collection_method, quality_status, created_at
            """, sample_id, tissue_site, collection_method, quality_status)
            return ClinicalSample(**dict(row)) if row else None
    
    async def delete_clinical_sample(self, sample_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM samples_v2 WHERE id = $1", sample_id)
            return result == "DELETE 1"
    
    # ==================== CLINICAL — SEQUENCING RUNS ====================
    
    async def create_sequencing_run(
        self,
        sample_id: int,
        run_code: str,
        sequencing_type: str = "WES",
        platform: Optional[str] = None,
        coverage: Optional[int] = None,
        run_date: Optional[date] = None
    ) -> SequencingRun:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO sequencing_runs (sample_id, run_code, sequencing_type, platform, coverage, run_date)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, sample_id, run_code, sequencing_type, platform, coverage, run_date, quality_status, created_at
            """, sample_id, run_code, sequencing_type, platform, coverage, run_date)
            return SequencingRun(**dict(row))
    
    async def get_sequencing_run(self, run_id: int) -> Optional[SequencingRun]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, sample_id, run_code, sequencing_type, platform, coverage, run_date, quality_status, created_at
                FROM sequencing_runs WHERE id = $1
            """, run_id)
            return SequencingRun(**dict(row)) if row else None
    
    async def get_sequencing_runs_by_sample(self, sample_id: int) -> List[SequencingRun]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, sample_id, run_code, sequencing_type, platform, coverage, run_date, quality_status, created_at
                FROM sequencing_runs WHERE sample_id = $1 ORDER BY created_at DESC
            """, sample_id)
            return [SequencingRun(**dict(row)) for row in rows]
    
    async def update_sequencing_run_quality(
        self,
        run_id: int,
        quality_status: str
    ) -> Optional[SequencingRun]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                UPDATE sequencing_runs SET quality_status = $2 WHERE id = $1
                RETURNING id, sample_id, run_code, sequencing_type, platform, coverage, run_date, quality_status, created_at
            """, run_id, quality_status)
            return SequencingRun(**dict(row)) if row else None
    
    # ==================== CLINICAL — FASTQ FILES ====================
    
    async def create_fastq_file(
        self,
        sequencing_run_id: int,
        read_pair: str,
        file_path: str,
        file_size: Optional[int] = None,
        md5_checksum: Optional[str] = None
    ) -> FastqFile:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO fastq_files (sequencing_run_id, read_pair, file_path, file_size, md5_checksum)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, sequencing_run_id, read_pair, file_path, file_size, md5_checksum, created_at
            """, sequencing_run_id, read_pair, file_path, file_size, md5_checksum)
            return FastqFile(**dict(row))
    
    async def get_fastq_files_by_run(self, sequencing_run_id: int) -> List[FastqFile]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, sequencing_run_id, read_pair, file_path, file_size, md5_checksum, created_at
                FROM fastq_files WHERE sequencing_run_id = $1 ORDER BY read_pair
            """, sequencing_run_id)
            return [FastqFile(**dict(row)) for row in rows]
    
    async def delete_fastq_file(self, file_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM fastq_files WHERE id = $1", file_id)
            return result == "DELETE 1"
    
    # ==================== CLINICAL — PIPELINE RUNS ====================
    
    async def create_pipeline_run(
        self,
        sequencing_run_id: int,
        case_id: int,
        module_set: List[str],
        module_dependencies: Optional[Dict[str, Any]] = None,
        config: Optional[Dict[str, Any]] = None,
        created_by: Optional[int] = None
    ) -> PipelineRun:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO pipeline_runs (sequencing_run_id, case_id, module_set, module_dependencies, config, created_by)
                VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
                RETURNING id, sequencing_run_id, case_id, module_set, module_dependencies, status,
                    config, retry_count, max_retries, last_error, error_type,
                    started_at, finished_at, logs_path, nextflow_run_id, created_by, created_at
            """, sequencing_run_id, case_id, module_set,
                json.dumps(module_dependencies) if module_dependencies else "{}",
                json.dumps(config) if config else "{}",
                created_by)
            return PipelineRun(**dict(row))
    
    async def get_pipeline_run(self, run_id: int) -> Optional[PipelineRun]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, sequencing_run_id, case_id, module_set, module_dependencies, status,
                    config, retry_count, max_retries, last_error, error_type,
                    started_at, finished_at, logs_path, nextflow_run_id, created_by, created_at
                FROM pipeline_runs WHERE id = $1
            """, run_id)
            return PipelineRun(**dict(row)) if row else None
    
    async def get_pipeline_runs_by_case(self, case_id: int) -> List[PipelineRun]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, sequencing_run_id, case_id, module_set, module_dependencies, status,
                    config, retry_count, max_retries, last_error, error_type,
                    started_at, finished_at, logs_path, nextflow_run_id, created_by, created_at
                FROM pipeline_runs WHERE case_id = $1 ORDER BY created_at DESC
            """, case_id)
            return [PipelineRun(**dict(row)) for row in rows]
    
    async def get_pipeline_runs(self) -> List[PipelineRun]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, sequencing_run_id, case_id, module_set, module_dependencies, status,
                    config, retry_count, max_retries, last_error, error_type,
                    started_at, finished_at, logs_path, nextflow_run_id, created_by, created_at
                FROM pipeline_runs ORDER BY created_at DESC
            """)
            return [PipelineRun(**dict(row)) for row in rows]
    
    async def update_pipeline_run_status(
        self,
        run_id: int,
        status: str,
        last_error: Optional[str] = None,
        error_type: Optional[str] = None,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None,
        logs_path: Optional[str] = None,
        nextflow_run_id: Optional[str] = None,
        retry_count: Optional[int] = None
    ) -> Optional[PipelineRun]:
        async with self.pool.acquire() as conn:
            query = "UPDATE pipeline_runs SET"
            params = [run_id]
            param_count = 1
            query += f" status = ${param_count + 1}"
            params.append(status)
            param_count += 1
            if last_error is not None:
                param_count += 1
                query += f", last_error = ${param_count}"
                params.append(last_error)
            if error_type is not None:
                param_count += 1
                query += f", error_type = ${param_count}"
                params.append(error_type)
            if started_at is not None:
                param_count += 1
                query += f", started_at = ${param_count}"
                params.append(started_at)
            if finished_at is not None:
                param_count += 1
                query += f", finished_at = ${param_count}"
                params.append(finished_at)
            if logs_path is not None:
                param_count += 1
                query += f", logs_path = ${param_count}"
                params.append(logs_path)
            if nextflow_run_id is not None:
                param_count += 1
                query += f", nextflow_run_id = ${param_count}"
                params.append(nextflow_run_id)
            if retry_count is not None:
                param_count += 1
                query += f", retry_count = ${param_count}"
                params.append(retry_count)
            query += f" WHERE id = $1 RETURNING id, sequencing_run_id, case_id, module_set, module_dependencies, status, config, retry_count, max_retries, last_error, error_type, started_at, finished_at, logs_path, nextflow_run_id, created_by, created_at"
            row = await conn.fetchrow(query, *params)
            return PipelineRun(**dict(row)) if row else None
    
    # ==================== CLINICAL — VARIANTS ====================
    
    async def create_variant(
        self,
        case_id: int,
        variant_type: str,
        sequencing_run_id: Optional[int] = None,
        pipeline_run_id: Optional[int] = None,
        tumor_sample_id: Optional[int] = None,
        normal_sample_id: Optional[int] = None,
        variant_origin: Optional[str] = None,
        gene: Optional[str] = None,
        chromosome: Optional[str] = None,
        position: Optional[int] = None,
        ref: Optional[str] = None,
        alt: Optional[str] = None,
        qual: Optional[float] = None,
        filter: Optional[str] = None,
        format: Optional[str] = None,
        sample_data: Optional[Dict[str, Any]] = None,
        vcf_raw: Optional[Dict[str, Any]] = None
    ) -> Variant:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO variants (case_id, sequencing_run_id, pipeline_run_id,
                    tumor_sample_id, normal_sample_id, variant_origin, gene,
                    chromosome, position, ref, alt, variant_type, qual,
                    "filter", "format", sample_data, vcf_raw)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb)
                RETURNING id, case_id, sequencing_run_id, pipeline_run_id,
                    tumor_sample_id, normal_sample_id, variant_origin, gene,
                    chromosome, position, ref, alt, variant_type, qual,
                    "filter", "format", sample_data, vcf_raw, created_at
            """, case_id, sequencing_run_id, pipeline_run_id,
                tumor_sample_id, normal_sample_id, variant_origin, gene,
                chromosome, position, ref, alt, variant_type, qual,
                filter, format,
                json.dumps(sample_data) if sample_data else None,
                json.dumps(vcf_raw) if vcf_raw else None)
            return Variant(**dict(row))
    
    async def get_variant(self, variant_id: int) -> Optional[Variant]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, case_id, sequencing_run_id, pipeline_run_id,
                    tumor_sample_id, normal_sample_id, variant_origin, gene,
                    chromosome, position, ref, alt, variant_type, qual,
                    "filter", "format", sample_data, vcf_raw, created_at
                FROM variants WHERE id = $1
            """, variant_id)
            return Variant(**dict(row)) if row else None
    
    async def get_variants_by_case(
        self,
        case_id: int,
        limit: int = 500,
        offset: int = 0,
        variant_type: Optional[str] = None,
        gene: Optional[str] = None
    ) -> List[Variant]:
        async with self.pool.acquire() as conn:
            conditions = ["case_id = $1"]
            params = [case_id]
            param_count = 1
            if variant_type:
                param_count += 1
                conditions.append(f"variant_type = ${param_count}")
                params.append(variant_type)
            if gene:
                param_count += 1
                conditions.append(f"gene = ${param_count}")
                params.append(gene)
            where_clause = " AND ".join(conditions)
            param_count += 1
            params.append(limit)
            param_count += 1
            params.append(offset)
            rows = await conn.fetch(f"""
                SELECT id, case_id, sequencing_run_id, pipeline_run_id,
                    tumor_sample_id, normal_sample_id, variant_origin, gene,
                    chromosome, position, ref, alt, variant_type, qual,
                    "filter", "format", sample_data, vcf_raw, created_at
                FROM variants WHERE {where_clause} ORDER BY position
                LIMIT ${param_count - 1} OFFSET ${param_count}
            """, *params)
            return [Variant(**dict(row)) for row in rows]

    async def get_variants_by_gene(self, case_id: int, gene: str) -> List[Variant]:
        return await self.get_variants_by_case(case_id, gene=gene)

    async def get_variants_by_consequence(self, case_id: int, consequence: str) -> List[Variant]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT v.id, v.case_id, v.sequencing_run_id, v.pipeline_run_id,
                    v.tumor_sample_id, v.normal_sample_id, v.variant_origin, v.gene,
                    v.chromosome, v.position, v.ref, v.alt, v.variant_type, v.qual,
                    v."filter", v."format", v.sample_data, v.vcf_raw, v.created_at
                FROM variants v
                JOIN annotations a ON a.variant_id = v.id
                WHERE v.case_id = $1 AND a.consequence = $2
                ORDER BY v.position
            """, case_id, consequence)
            return [Variant(**dict(row)) for row in rows]

    async def get_variants_by_impact(self, case_id: int, impact: str) -> List[Variant]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT v.id, v.case_id, v.sequencing_run_id, v.pipeline_run_id,
                    v.tumor_sample_id, v.normal_sample_id, v.variant_origin, v.gene,
                    v.chromosome, v.position, v.ref, v.alt, v.variant_type, v.qual,
                    v."filter", v."format", v.sample_data, v.vcf_raw, v.created_at
                FROM variants v
                JOIN annotations a ON a.variant_id = v.id
                WHERE v.case_id = $1 AND a.impact = $2
                ORDER BY v.position
            """, case_id, impact)
            return [Variant(**dict(row)) for row in rows]
    
    async def delete_variant(self, variant_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM variants WHERE id = $1", variant_id)
            return result == "DELETE 1"
    
    # ==================== CLINICAL — ANNOTATIONS ====================
    
    async def create_annotation(
        self,
        variant_id: int,
        gene: Optional[str] = None,
        transcript: Optional[str] = None,
        consequence: Optional[str] = None,
        impact: Optional[str] = None,
        dbsnp_id: Optional[str] = None,
        cosmic_id: Optional[str] = None,
        vep_json: Optional[Dict[str, Any]] = None,
        clinvar_significance: Optional[str] = None,
        oncogenicity: Optional[str] = None,
        drug_response: Optional[Dict[str, Any]] = None,
        evidence_level: Optional[str] = None,
        therapy_recommendations: Optional[List[str]] = None
    ) -> Annotation:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO annotations (variant_id, gene, transcript, consequence, impact,
                    dbsnp_id, cosmic_id, vep_json, clinvar_significance, oncogenicity,
                    drug_response, evidence_level, therapy_recommendations)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb, $12, $13)
                RETURNING id, variant_id, gene, transcript, consequence, impact,
                    dbsnp_id, cosmic_id, vep_json, clinvar_significance, oncogenicity,
                    drug_response, evidence_level, therapy_recommendations, created_at
            """, variant_id, gene, transcript, consequence, impact,
                dbsnp_id, cosmic_id,
                json.dumps(vep_json) if vep_json else "{}",
                clinvar_significance, oncogenicity,
                json.dumps(drug_response) if drug_response else "{}",
                evidence_level, therapy_recommendations)
            return Annotation(**dict(row))
    
    async def get_annotation(self, annotation_id: int) -> Optional[Annotation]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, variant_id, gene, transcript, consequence, impact,
                    dbsnp_id, cosmic_id, vep_json, clinvar_significance, oncogenicity,
                    drug_response, evidence_level, therapy_recommendations, created_at
                FROM annotations WHERE id = $1
            """, annotation_id)
            return Annotation(**dict(row)) if row else None
    
    async def get_annotations_by_variant(self, variant_id: int) -> List[Annotation]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, variant_id, gene, transcript, consequence, impact,
                    dbsnp_id, cosmic_id, vep_json, clinvar_significance, oncogenicity,
                    drug_response, evidence_level, therapy_recommendations, created_at
                FROM annotations WHERE variant_id = $1 ORDER BY created_at
            """, variant_id)
            return [Annotation(**dict(row)) for row in rows]
    
    async def delete_annotation(self, annotation_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM annotations WHERE id = $1", annotation_id)
            return result == "DELETE 1"
    
    # ==================== CLINICAL — REPORTS ====================
    
    async def create_clinical_report(
        self,
        case_id: int,
        modules: Dict[str, Any],
        sequencing_run_id: Optional[int] = None,
        summary: Optional[str] = None,
        actionable_variants: Optional[Dict[str, Any]] = None,
        therapy_recommendations: Optional[Dict[str, Any]] = None,
        biomarkers: Optional[Dict[str, Any]] = None,
        pdf_path: Optional[str] = None,
        json_path: Optional[str] = None,
        generated_by: Optional[int] = None
    ) -> ClinicalReport:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO clinical_reports (case_id, sequencing_run_id, modules, summary,
                    actionable_variants, therapy_recommendations, biomarkers,
                    pdf_path, json_path, generated_by)
                VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10)
                RETURNING id, case_id, sequencing_run_id, modules, summary,
                    actionable_variants, therapy_recommendations, biomarkers,
                    pdf_path, json_path, generated_by, generated_at
            """, case_id, sequencing_run_id, json.dumps(modules),
                summary,
                json.dumps(actionable_variants) if actionable_variants else "[]",
                json.dumps(therapy_recommendations) if therapy_recommendations else "[]",
                json.dumps(biomarkers) if biomarkers else "{}",
                pdf_path, json_path, generated_by)
            return ClinicalReport(**dict(row))
    
    async def get_clinical_report(self, report_id: int) -> Optional[ClinicalReport]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, case_id, sequencing_run_id, modules, summary,
                    actionable_variants, therapy_recommendations, biomarkers,
                    pdf_path, json_path, generated_by, generated_at
                FROM clinical_reports WHERE id = $1
            """, report_id)
            return ClinicalReport(**dict(row)) if row else None
    
    async def get_clinical_reports_by_case(self, case_id: int) -> List[ClinicalReport]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, case_id, sequencing_run_id, modules, summary,
                    actionable_variants, therapy_recommendations, biomarkers,
                    pdf_path, json_path, generated_by, generated_at
                FROM clinical_reports WHERE case_id = $1 ORDER BY generated_at DESC
            """, case_id)
            return [ClinicalReport(**dict(row)) for row in rows]
    
    async def delete_clinical_report(self, report_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM clinical_reports WHERE id = $1", report_id)
            return result == "DELETE 1"
    
    # ==================== CLINICAL — QUERY ENHANCEMENTS ====================
    
    async def get_sequencing_run_by_code(self, run_code: str) -> Optional[SequencingRun]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, sample_id, run_code, sequencing_type, platform, coverage,
                       run_date, quality_status, created_at
                FROM sequencing_runs WHERE run_code = $1
            """, run_code)
            return SequencingRun(**dict(row)) if row else None
    
    async def get_pipeline_runs_by_case_and_module(
        self,
        case_id: int,
        module: Optional[str] = None
    ) -> List[PipelineRun]:
        async with self.pool.acquire() as conn:
            if module:
                rows = await conn.fetch("""
                    SELECT id, sequencing_run_id, case_id, module_set, module_dependencies, status,
                        config, retry_count, max_retries, last_error, error_type,
                        started_at, finished_at, logs_path, nextflow_run_id, created_by, created_at
                    FROM pipeline_runs
                    WHERE case_id = $1 AND $2 = ANY(module_set)
                    ORDER BY created_at DESC
                """, case_id, module)
            else:
                rows = await conn.fetch("""
                    SELECT id, sequencing_run_id, case_id, module_set, module_dependencies, status,
                        config, retry_count, max_retries, last_error, error_type,
                        started_at, finished_at, logs_path, nextflow_run_id, created_by, created_at
                    FROM pipeline_runs
                    WHERE case_id = $1
                    ORDER BY created_at DESC
                """, case_id)
            return [PipelineRun(**dict(row)) for row in rows]
    
    async def get_variants_by_significance(
        self,
        case_id: int,
        significance: str
    ) -> List[Variant]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT v.id, v.case_id, v.sequencing_run_id, v.pipeline_run_id,
                    v.tumor_sample_id, v.normal_sample_id, v.variant_origin, v.gene,
                    v.chromosome, v.position, v.ref, v.alt, v.variant_type, v.qual,
                    v."filter", v."format", v.sample_data, v.vcf_raw, v.created_at
                FROM variants v
                JOIN annotations a ON a.variant_id = v.id
                WHERE v.case_id = $1 AND a.clinvar_significance = $2
                ORDER BY v.position
            """, case_id, significance)
            return [Variant(**dict(row)) for row in rows]
    
    async def get_actionable_variants(self, case_id: int) -> List[Variant]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT v.id, v.case_id, v.sequencing_run_id, v.pipeline_run_id,
                    v.tumor_sample_id, v.normal_sample_id, v.variant_origin, v.gene,
                    v.chromosome, v.position, v.ref, v.alt, v.variant_type, v.qual,
                    v."filter", v."format", v.sample_data, v.vcf_raw, v.created_at
                FROM variants v
                JOIN annotations a ON a.variant_id = v.id
                WHERE v.case_id = $1 AND a.evidence_level IS NOT NULL
                ORDER BY a.evidence_level, v.position
            """, case_id)
            return [Variant(**dict(row)) for row in rows]
    
    # ==================== CLINICAL — CATALOG LOOKUPS ====================
    
    async def get_clinical_modules(self) -> List[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT module_key, name, description, required_sample_types,
                       optional_sample_types, estimated_runtime_hours,
                       clinical_utility, display_order
                FROM clinical_modules
                WHERE is_active = TRUE
                ORDER BY display_order
            """)
            return [dict(row) for row in rows]
    
    async def get_cancer_types(self) -> List[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, code, name, category
                FROM cancer_types
                WHERE is_active = TRUE
                ORDER BY category, name
            """)
            return [dict(row) for row in rows]
    
    async def get_primary_sites(self) -> List[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name, category
                FROM primary_sites
                ORDER BY category, name
            """)
            return [dict(row) for row in rows]
    
    async def get_primary_sites_by_cancer_type(self, cancer_type_id: int) -> List[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT ps.id, ps.name, ps.category, ctps.is_primary
                FROM primary_sites ps
                JOIN cancer_type_primary_sites ctps ON ctps.primary_site_id = ps.id
                WHERE ctps.cancer_type_id = $1
                ORDER BY ctps.is_primary DESC, ps.name
            """, cancer_type_id)
            return [dict(row) for row in rows]
    
    async def get_histology_subtypes_by_cancer_type(self, cancer_type_id: int) -> List[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name
                FROM histology_subtypes
                WHERE cancer_type_id = $1 AND is_active = TRUE
                ORDER BY name
            """, cancer_type_id)
            return [dict(row) for row in rows]
    
    async def get_stages(self) -> List[Dict[str, str]]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT code, name
                FROM clinical_stages
                ORDER BY display_order
            """)
            return [dict(row) for row in rows]
    
    async def get_clinical_statistics(self, patient_id: Optional[int] = None) -> Dict[str, Any]:
        async with self.pool.acquire() as conn:
            if patient_id:
                stats = await conn.fetchrow("""
                    SELECT
                        (SELECT COUNT(*) FROM cases WHERE patient_id = $1) as total_cases,
                        (SELECT COUNT(*) FROM cases WHERE patient_id = $1 AND status = 'completed') as completed_cases,
                        (SELECT COUNT(*) FROM cases WHERE patient_id = $1 AND status = 'running') as running_cases,
                        (SELECT COUNT(*) FROM samples_v2 s JOIN cases c ON s.case_id = c.id WHERE c.patient_id = $1) as total_samples,
                        (SELECT COUNT(*) FROM variants v JOIN cases c ON v.case_id = c.id WHERE c.patient_id = $1) as total_variants,
                        (SELECT COUNT(*) FROM clinical_reports cr JOIN cases c ON cr.case_id = c.id WHERE c.patient_id = $1) as total_reports
                """, patient_id)
            else:
                stats = await conn.fetchrow("""
                    SELECT
                        (SELECT COUNT(*) FROM patients) as total_patients,
                        (SELECT COUNT(*) FROM cases) as total_cases,
                        (SELECT COUNT(*) FROM cases WHERE status = 'completed') as completed_cases,
                        (SELECT COUNT(*) FROM cases WHERE status = 'running') as running_cases,
                        (SELECT COUNT(*) FROM samples_v2) as total_samples,
                        (SELECT COUNT(*) FROM variants) as total_variants,
                        (SELECT COUNT(*) FROM clinical_reports) as total_reports
                """)
            return dict(stats) if stats else {}
    
    # ==================== UTILITY ====================
    
    async def get_statistics(self) -> Dict[str, int]:
        """Get database statistics"""
        async with self.pool.acquire() as conn:
            # Original statistics
            genome_count = await conn.fetchval("SELECT COUNT(*) FROM indexed_genomes")
            ready_genomes = await conn.fetchval("SELECT COUNT(*) FROM indexed_genomes WHERE status = 'ready'")
            sample_count = await conn.fetchval("SELECT COUNT(*) FROM samples")
            completed_samples = await conn.fetchval("SELECT COUNT(*) FROM samples WHERE status = 'completed'")
            
            # New statistics
            user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            active_users = await conn.fetchval("SELECT COUNT(*) FROM users WHERE is_active = TRUE")
            genome_ref_count = await conn.fetchval("SELECT COUNT(*) FROM genome_sources")
            active_genome_refs = await conn.fetchval("SELECT COUNT(*) FROM genome_sources WHERE is_active = TRUE")
            pipeline_settings_count = await conn.fetchval("SELECT COUNT(*) FROM pipeline_settings")
            ai_provider_settings_count = await conn.fetchval("SELECT COUNT(*) FROM ai_provider_settings")
            active_ai_providers = await conn.fetchval("SELECT COUNT(*) FROM ai_provider_settings WHERE is_active = TRUE")
            audit_logs_count = await conn.fetchval("SELECT COUNT(*) FROM audit_logs")
            
            # Clinical statistics
            patient_count = await conn.fetchval("SELECT COUNT(*) FROM patients")
            case_count = await conn.fetchval("SELECT COUNT(*) FROM cases")
            clinical_sample_count = await conn.fetchval("SELECT COUNT(*) FROM samples_v2")
            sequencing_run_count = await conn.fetchval("SELECT COUNT(*) FROM sequencing_runs")
            pipeline_run_count = await conn.fetchval("SELECT COUNT(*) FROM pipeline_runs")
            variant_count = await conn.fetchval("SELECT COUNT(*) FROM variants")
            annotation_count = await conn.fetchval("SELECT COUNT(*) FROM annotations")
            report_count = await conn.fetchval("SELECT COUNT(*) FROM clinical_reports")
            
            return {
                "total_indexed_genomes": genome_count,
                "ready_indexed_genomes": ready_genomes,
                "total_samples": sample_count,
                "completed_samples": completed_samples,
                "total_users": user_count,
                "active_users": active_users,
                "total_genome_sources": genome_ref_count,
                "active_genome_sources": active_genome_refs,
                "pipeline_settings": pipeline_settings_count,
                "ai_provider_settings": ai_provider_settings_count,
                "active_ai_providers": active_ai_providers,
                "audit_logs": audit_logs_count,
                "total_patients": patient_count,
                "total_cases": case_count,
                "total_clinical_samples": clinical_sample_count,
                "total_sequencing_runs": sequencing_run_count,
                "total_pipeline_runs": pipeline_run_count,
                "total_variants": variant_count,
                "total_annotations": annotation_count,
                "total_clinical_reports": report_count
            }


# Singleton instance
_database_service: Optional[DatabaseService] = None


def get_database_service() -> DatabaseService:
    """Get singleton database service instance"""
    global _database_service
    if _database_service is None:
        _database_service = DatabaseService()
    return _database_service
