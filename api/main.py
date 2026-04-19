"""
🧬 AI Genomics Lab - Genome Indexing API
FastAPI backend for genomic analysis with AI

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import sys

import os
import json
import re
import uuid
import logging
import shutil
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Form, Path, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv

# Import services
from services.nextflow_runner import get_nextflow_runner
from services.database_service import get_database_service
from services.minio_service import get_minio_service
from services.auth_service import get_auth_service
from minio.error import S3Error

# Import Pydantic for request/response models
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

print("🐛 MODULE IMPORT STARTING...")

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Starting API initialization...")



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the application"""
    # Startup
    print("🚀 Genome Indexing API starting up...")
    
    # Initialize database connection
    db_service = get_database_service()
    try:
        await db_service.connect()
        print("📦 Database connected successfully")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
    
    yield
    
    # Shutdown
    print("🛑 Genome Indexing API shutting down...")
    
    # Close database connection
    try:
        await db_service.close()
        print("📦 Database connection closed")
    except Exception as e:
        print(f"⚠️  Database close failed: {e}")


# ==================== AUTHENTICATION MODELS & SECURITY ====================

# Security scheme
security = HTTPBearer()

# Pydantic models
class LoginRequest(BaseModel):
    model_config = {'populate_by_name': True}
    email: EmailStr
    password: str
    remember_me: bool = Field(False, alias='rememberMe')

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    is_active: bool
    roles: List[str]

class GenomeReferenceRequest(BaseModel):
    key: str
    name: str
    url: str
    species: Optional[str] = None
    build: Optional[str] = None
    is_active: bool = True

class GenomeReferenceResponse(BaseModel):
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

class PipelineSettingUpdate(BaseModel):
    setting_value: str
    data_type: Optional[str] = None
    validation_rules: Optional[str] = None
    description: Optional[str] = None

class AIProviderSettingCreate(BaseModel):
    provider: str
    model: str
    api_key_encrypted: Optional[str] = None
    base_url: Optional[str] = None
    is_active: bool = True

class AIProviderSettingUpdate(BaseModel):
    api_key_encrypted: Optional[str] = None
    base_url: Optional[str] = None
    is_active: Optional[bool] = None

class UIPreferenceUpdate(BaseModel):
    language: Optional[str] = None
    timezone: Optional[str] = None
    theme: Optional[str] = None
    display_options: Optional[Dict[str, Any]] = None


# Storage models
class GenomeFile(BaseModel):
    object: str
    size: int
    type: str
    status: Optional[str] = None
    reason: Optional[str] = None

class Genome(BaseModel):
    name: str
    files: List[GenomeFile]
    total_size: int
    has_fasta: bool
    has_fai: bool
    has_sti: bool

class SyncStatusFile(BaseModel):
    source: str
    object: Optional[str] = None
    path: Optional[str] = None
    size: int

class SyncStatus(BaseModel):
    name: str
    minio: bool
    database: bool
    local: bool
    files: List[SyncStatusFile]
    status: str
    db_status: Optional[str] = None
    db_path: Optional[str] = None

class SyncResponse(BaseModel):
    success: bool
    uploaded: Optional[int] = 0
    skipped: Optional[int] = 0
    failed: Optional[int] = 0
    error: Optional[str] = None

class DownloadResponse(BaseModel):
    success: bool
    downloaded: Optional[int] = 0
    skipped: Optional[int] = 0
    failed: Optional[int] = 0
    error: Optional[str] = None

# Dependency functions
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict[str, Any]:
    """Get current user from JWT token"""
    auth_service = get_auth_service()
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    db_service = get_database_service()
    user = await db_service.get_user(int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    roles = await auth_service.get_user_roles(user.id)
    if roles is None:
        roles = []
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_active": user.is_active,
        "roles": roles
    }

async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Require admin role"""
    if "admin" not in current_user["roles"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user

# ==================== FASTAPI APPLICATION ====================



# Create FastAPI application
app = FastAPI(
    title="🧬 AI Genomics Lab - Genome Indexing API",
    description="""
AI Genomics Lab Genome Indexing API - Service for downloading and indexing reference genomes.

Features:
- Download reference genomes from Ensembl/UCSC
- Index genomes with BGZF compression
- Create FASTA, BGZF, and Strobealign indices
- Stream real-time progress logs

Supported Genomes:
- hg38 (Human GRCh38 primary assembly)
- hg38-test (Human GRCh38 chromosome 21 for testing)
- hg19 (Human GRCh37/hg19)

Quick Start:
1. Start services: docker-compose up -d
2. Index a genome: POST /genome/index with genome_id=hg38
3. Monitor progress via streaming logs
""",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Health", "description": "🩺 Health check endpoints"},
        {"name": "Genome", "description": "🧬 Genome indexing endpoints"},
        {"name": "Authentication", "description": "🔐 User authentication and authorization"},
        {"name": "Settings", "description": "⚙️ Platform configuration and management"},
    ]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"], summary="Root endpoint", description="""
    API Root - Welcome message
    
    Returns basic information about the API including version, status, and available services.
    """)
async def root():
    """Root endpoint"""
    return {
        "name": "🧬 AI Genomics Lab API",
        "version": "0.1.0",
        "status": "running",
        "services": {
            "api": "FastAPI",
            "genome_indexing": "Nextflow"
        }
    }


@app.get("/health", tags=["Health"], summary="Health check", description="""
    Health Check - Verify API and genome indexing service are running
    
    Returns the status of system components:
    - API: Main application status
    - Genome indexing: Nextflow service availability
    
    Returns:
        Dictionary with status of services
    """)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "api": "ok",
        "genome_indexing": "ok"
    }



REMOTE_GENOMES = {
    "hg38": {
        "name": "Homo_sapiens.GRCh38.dna.primary_assembly",
        "species": "Homo sapiens",
        "build": "GRCh38",
        "url": "https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz"
    },
    "hg38-test": {
        "name": "Homo_sapiens.GRCh38.chromosome.21",
        "species": "Homo sapiens",
        "build": "GRCh38",
        "url": "https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.chromosome.21.fa.gz"
    },
    "hg19": {
        "name": "hg19",
        "species": "Homo sapiens",
        "build": "GRCh37",
        "url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/bigZips/hg19.fa.gz"
    }
}


async def get_genome_info(genome_id: str) -> Dict[str, Any]:
    """Get genome information from REMOTE_GENOMES or database"""
    # First check REMOTE_GENOMES for backward compatibility
    if genome_id in REMOTE_GENOMES:
        info = REMOTE_GENOMES[genome_id].copy()
        info["key"] = genome_id
        return info
    
    # If not in REMOTE_GENOMES, check database
    db_service = get_database_service()
    reference = await db_service.get_genome_reference_by_key(genome_id)
    if reference and reference.is_active:
        return {
            "key": reference.key,
            "name": reference.name,
            "species": reference.species or "",
            "build": reference.build or "",
            "url": reference.url,
            "is_active": reference.is_active
        }
    
    # Not found
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Unknown genome: {genome_id}"
    )


async def check_genome_indexed(genome_id: str) -> dict:
    """Check if a genome is indexed by verifying file existence in MinIO"""
    minio_service = get_minio_service()
    bucket = "genomics"
    prefix = f"reference_genome/{genome_id}"
    
    files = {
        "bgzip_fasta": f"{genome_id}.fa.gz",
        "fai_index": f"{genome_id}.fa.gz.fai",
        "gzi_index": f"{genome_id}.fa.gz.gzi",
        "sti_index": f"{genome_id}.fa.gz.sti"
    }
    
    status = {}
    for key, filename in files.items():
        object_name = f"{prefix}/{filename}"
        try:
            exists = await minio_service.object_exists(bucket, object_name)
            status[key] = exists
        except Exception as e:
            # If MinIO check fails, fall back to local filesystem for backward compatibility
            logger = logging.getLogger(__name__)
            logger.warning(f"MinIO check failed for {bucket}/{object_name}: {e}, falling back to local")
            local_path = f"/datasets/reference_genome/{filename}"
            status[key] = os.path.exists(local_path)
    
    # Consider indexed if all required files exist (bgzip_fasta is mandatory, others preferred)
    indexed = status.get("bgzip_fasta", False)  # At least the main file should exist
    return {
        "genome_id": genome_id,
        "indexed": indexed,
        "files": status,
        "storage": "minio",  # Indicate that files are stored in MinIO
        "paths": {key: f"s3://{bucket}/{prefix}/{filename}" for key, filename in files.items()}
    }


@app.get("/genome/indexed", tags=["Genome"], summary="Get indexing status for all genomes")
async def get_indexed_genomes():
    """Get indexing status for all available genomes (built-in and custom)"""
    db_service = get_database_service()
    custom_genomes = await db_service.get_genome_references()
    active_custom_ids = {ref.key for ref in custom_genomes if ref.is_active}
    all_genome_ids = set(REMOTE_GENOMES.keys()) | active_custom_ids
    
    status = {}
    for genome_id in all_genome_ids:
        status[genome_id] = await check_genome_indexed(genome_id)
    return status


@app.get("/genome/status/{genome_id}", tags=["Genome"], summary="Get indexing status for a specific genome")
async def get_genome_status(
    genome_id: str = Path(..., description="Genome ID (e.g., hg38, hg19, or custom genome defined in Settings)")
):
    """Get detailed indexing status for a specific genome"""
    # Validate genome exists (will raise HTTPException if not found)
    await get_genome_info(genome_id)
    
    return await check_genome_indexed(genome_id)


@app.delete("/genome/index/{genome_id}", tags=["Genome"], summary="Delete genome index files")
async def delete_genome_index(
    genome_id: str = Path(..., description="Genome ID (e.g., hg38, hg19, or custom genome defined in Settings)")
):
    """Delete genome index files (bgzip, fai, gzi, sti) from local storage and MinIO"""
    # Validate genome exists and get genome info
    genome_info = await get_genome_info(genome_id)
    
    base_dir = "/datasets/reference_genome"
    files_to_delete = [
        f"{genome_id}.fa.gz",
        f"{genome_id}.fa.gz.fai",
        f"{genome_id}.fa.gz.gzi",
        f"{genome_id}.fa.gz.sti"
    ]
    
    deleted_local = []
    deleted_minio = []
    errors = []
    
    # Delete local files
    for filename in files_to_delete:
        path = os.path.join(base_dir, filename)
        try:
            if os.path.exists(path):
                os.remove(path)
                deleted_local.append(filename)
        except Exception as e:
            errors.append(f"local:{filename}: {str(e)}")
    
    # Delete MinIO objects
    try:
        minio_service = get_minio_service()
        bucket = minio_service.get_bucket("reference")
        prefix = f"reference_genome/{genome_id}"
        
        for filename in files_to_delete:
            object_name = f"{prefix}/{filename}"
            try:
                exists = await minio_service.object_exists(bucket, object_name)
                if exists:
                    await minio_service.delete_object(bucket, object_name)
                    deleted_minio.append(filename)
            except Exception as e:
                errors.append(f"minio:{filename}: {str(e)}")
    except Exception as e:
        errors.append(f"minio_service: {str(e)}")
    
    # Delete database records
    db_service = get_database_service()
    try:
        # Find reference genome by name
        # genome_info already contains the name from get_genome_info
        existing_genome = await db_service.get_reference_genome_by_name(genome_info["name"])
        if existing_genome:
            await db_service.delete_reference_genome(existing_genome.id)
            deleted_db = True
        else:
            deleted_db = False
    except Exception as e:
        errors.append(f"database:reference_genome: {str(e)}")
        deleted_db = False
    
    # Delete related pipeline jobs
    try:
        deleted_jobs_count = await db_service.delete_pipeline_jobs_by_genome(genome_id)
    except Exception as e:
        errors.append(f"database:pipeline_jobs: {str(e)}")
        deleted_jobs_count = 0
    
    # Delete genome-specific directory if exists
    genome_dir = os.path.join("/datasets/reference_genome", genome_id)
    if os.path.exists(genome_dir):
        try:
            shutil.rmtree(genome_dir)
            deleted_dir = True
        except Exception as e:
            errors.append(f"directory:{genome_dir}: {str(e)}")
            deleted_dir = False
    else:
        deleted_dir = False
    
    return {
        "genome_id": genome_id,
        "deleted_local": deleted_local,
        "deleted_minio": deleted_minio,
        "deleted_db": deleted_db,
        "deleted_jobs_count": deleted_jobs_count,
        "deleted_dir": deleted_dir,
        "errors": errors,
        "success": len(errors) == 0,
        "storage": "minio" if deleted_minio else "local_only"
    }


@app.get("/genome/jobs", tags=["Genome"], summary="Get all genome indexing jobs")
async def get_genome_jobs():
    """Get all genome indexing jobs from database"""
    db_service = get_database_service()
    jobs = await db_service.get_pipeline_jobs()
    return {"jobs": jobs}


@app.get("/genome/job/{job_id}", tags=["Genome"], summary="Get genome indexing job status")
async def get_genome_job(
    job_id: int = Path(..., description="Job ID", ge=1)
):
    """Get specific genome indexing job status and details"""
    db_service = get_database_service()
    job = await db_service.get_pipeline_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job


@app.post("/genome/index", tags=["Genome"], summary="Genome indexing using Nextflow pipeline")
async def genome_index(
    genome_id: str = Form(..., description="Genome ID (e.g., hg38, hg19, or custom genome defined in Settings)")
):
    """
    Genome indexing using Nextflow pipeline in bio-pipeline container
    Creates a pipeline job in database and streams real-time progress
    Supports both built-in genomes (hg38, hg38-test, hg19) and custom genomes defined in Settings
    """
    db_service = get_database_service()
    nextflow_runner = get_nextflow_runner()
    minio_service = get_minio_service()
    reference_bucket = minio_service.get_bucket("reference")
    
    # Get genome information from database or REMOTE_GENOMES
    genome_info = await get_genome_info(genome_id)
    
    # Get read length setting
    read_length_setting = await db_service.get_pipeline_setting('default_read_length')
    read_length = int(read_length_setting.setting_value) if read_length_setting else 150
    
    # Create pipeline job in database
    parameters = json.dumps({
        "genome_id": genome_id,
        "name": genome_info.get("name", genome_id),
        "species": genome_info.get("species", ""),
        "build": genome_info.get("build", ""),
        "url": genome_info.get("url", ""),
        "output_dir": "/datasets/reference_genome"
    })
    
    pipeline_job = await db_service.create_pipeline_job(
        pipeline_name="genome_indexing",
        parameters=parameters
    )
    
    async def generate_logs():
        try:
            # Update job status to running
            await db_service.update_pipeline_job_status(
                job_id=pipeline_job.id,
                status="running",
                started_at=datetime.now()
            )
            
            yield f"data: {json.dumps({'type': 'job', 'job_id': pipeline_job.id, 'status': 'running'})}\n\n"
            yield f"data: {json.dumps({'type': 'log', 'message': f'🚀 Starting Nextflow genome indexing pipeline for {genome_id}...'})}\n\n"
            yield f"data: {json.dumps({'type': 'log', 'message': f'📦 Job ID: {pipeline_job.id}'})}\n\n"
            yield f"data: {json.dumps({'type': 'log', 'message': '📂 Processing in temporary directory, files will be uploaded to MinIO'})}\n\n"
            
            # Start Nextflow pipeline
            job_info = nextflow_runner.run_genome_indexing(
                genome_id=genome_id,
                genome_url=genome_info["url"],
                output_dir=None,  # Use temporary directory
                job_id=str(pipeline_job.id),
                minio_bucket=reference_bucket,
                minio_prefix="reference_genome",
                read_length=read_length
            )
            
            # Update job with log file path
            log_file = job_info.get("log_file")
            if log_file:
                await db_service.update_pipeline_job_status(
                    job_id=pipeline_job.id,
                    status="running",
                    logs_path=log_file
                )
            
            # Track pipeline stages
            current_stage = "initializing"
            stage_start_time = datetime.now()
            
            def detect_stage(message: str) -> str:
                """Detect current pipeline stage from log message"""
                # Ignore summary lines
                if "Generated files:" in message or re.match(r'^\d+\.\s', message.strip()):
                    return None
                
                message_lower = message.lower()
                
                # Download stage
                if "⬇️" in message or "downloading" in message_lower:
                    return "downloading"
                
                # FASTA index stage
                if "📊 creating fasta index" in message_lower or "fai" in message_lower or "faidx" in message_lower:
                    return "creating_fai_index"
                
                # GZI index stage
                if "📊 verifying gzi index" in message_lower or "gzi" in message_lower:
                    return "creating_gzi_index"
                
                # Strobealign index stage
                if "🎯" in message or "strobealign" in message_lower:
                    return "creating_sti_index"
                
                # Completion stage
                if "✅ pipeline 1 complete" in message_lower or ("complete" in message_lower and "✅" in message):
                    return "completed"
                
                return None
            
            # Stream the logs
            pipeline_success = False
            pipeline_error_message = None
            
            for log_line in nextflow_runner.stream_pipeline_logs(job_info):
                # Check if log_line is already in SSE format
                if log_line.startswith('data: '):
                    # Parse the JSON to get message
                    try:
                        data = json.loads(log_line[6:].strip())
                        message = data.get('message', '')
                        msg_type = data.get('type', '')
                        
                        # Detect pipeline completion or error
                        if msg_type == 'complete':
                            pipeline_success = True
                        elif msg_type == 'error':
                            pipeline_success = False
                            pipeline_error_message = message
                        
                        # Detect stage changes
                        new_stage = detect_stage(message)
                        if new_stage and new_stage != current_stage:
                            current_stage = new_stage
                            stage_duration = (datetime.now() - stage_start_time).total_seconds()
                            stage_start_time = datetime.now()
                            
                            # Emit stage change event
                            yield f"data: {json.dumps({'type': 'stage', 'stage': new_stage, 'duration': stage_duration, 'message': f'Entering stage: {new_stage}'})}\n\n"
                        
                        # Forward the log line
                        yield log_line
                    except:
                        yield log_line
                else:
                    # Legacy format, just forward as log
                    yield log_line
            
            # Update job status based on pipeline success
            if pipeline_success:
                await db_service.update_pipeline_job_status(
                    job_id=pipeline_job.id,
                    status="completed",
                    finished_at=datetime.now()
                )
                yield f"data: {json.dumps({'type': 'job', 'job_id': pipeline_job.id, 'status': 'completed'})}\n\n"
                yield f"data: {json.dumps({'type': 'complete', 'message': 'Pipeline completed successfully'})}\n\n"
                
                # Create/update reference genome record in database with MinIO URLs
                try:
                    minio_service = get_minio_service()
                    bucket = minio_service.get_bucket("reference")
                    prefix = f"reference_genome/{genome_id}"
                    
                    # Build MinIO URLs
                    bgzip_url = f"s3://{bucket}/{prefix}/{genome_id}.fa.gz"
                    fai_url = f"s3://{bucket}/{prefix}/{genome_id}.fa.gz.fai"
                    gzi_url = f"s3://{bucket}/{prefix}/{genome_id}.fa.gz.gzi"
                    sti_url = f"s3://{bucket}/{prefix}/{genome_id}.fa.gz.sti"
                    
                    # Check if reference genome already exists
                    existing_genome = await db_service.get_reference_genome_by_name(genome_info["name"])
                    
                    if existing_genome:
                        # Update existing record with MinIO URLs
                        await db_service.update_reference_genome_status(
                            genome_id=existing_genome.id,
                            status="ready",
                            gz_path=bgzip_url,
                            fai_path=fai_url,
                            gzi_path=gzi_url,
                            sti_path=sti_url
                        )
                        yield f"data: {json.dumps({'type': 'log', 'message': f'✅ Updated reference genome record with MinIO URLs'})}\n\n"
                    else:
                        # Create new record
                        await db_service.create_reference_genome(
                            name=genome_info["name"],
                            species=genome_info["species"],
                            build=genome_info["build"],
                            file_path=bgzip_url  # Store MinIO URL as file_path
                        )
                        # Update with additional paths
                        existing = await db_service.get_reference_genome_by_name(genome_info["name"])
                        if existing:
                            await db_service.update_reference_genome_status(
                                genome_id=existing.id,
                                status="ready",
                                gz_path=bgzip_url,
                                fai_path=fai_url,
                                gzi_path=gzi_url,
                                sti_path=sti_url
                            )
                        yield f"data: {json.dumps({'type': 'log', 'message': f'✅ Created reference genome record with MinIO URLs'})}\n\n"
                except Exception as db_error:
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to update database with MinIO URLs: {db_error}")
                    yield f"data: {json.dumps({'type': 'log', 'message': f'⚠️ Database update failed: {db_error}'})}\n\n"
            else:
                # Pipeline failed
                await db_service.update_pipeline_job_status(
                    job_id=pipeline_job.id,
                    status="failed",
                    finished_at=datetime.now()
                )
                yield f"data: {json.dumps({'type': 'job', 'job_id': pipeline_job.id, 'status': 'failed'})}\n\n"
                error_msg = pipeline_error_message or "Pipeline failed"
                yield f"data: {json.dumps({'type': 'error', 'message': f'❌ {error_msg}'})}\n\n"
        except Exception as e:
            # Update job status to failed
            try:
                await db_service.update_pipeline_job_status(
                    job_id=pipeline_job.id,
                    status="failed",
                    finished_at=datetime.now()
                )
                yield f"data: {json.dumps({'type': 'job', 'job_id': pipeline_job.id, 'status': 'failed'})}\n\n"
            except:
                pass
            
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(generate_logs(), media_type="text/event-stream")


# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/api/auth/login", tags=["Authentication"], summary="User login")
async def login(
    request: LoginRequest,
    user_agent: Optional[str] = None
):
    """Authenticate user and return JWT tokens"""
    auth_service = get_auth_service()
    
    # Get IP address (simplified - in production use request.client.host)
    ip_address = None
    
    user = await auth_service.authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create login session
    session = await auth_service.create_login_session(
        user=user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return session

@app.post("/api/auth/refresh", tags=["Authentication"], summary="Refresh access token")
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    auth_service = get_auth_service()
    
    new_access_token = await auth_service.refresh_access_token(request.refresh_token)
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    return {"access_token": new_access_token, "token_type": "bearer"}

@app.post("/api/auth/logout", tags=["Authentication"], summary="User logout")
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_agent: Optional[str] = None
):
    """Log user logout event"""
    auth_service = get_auth_service()
    await auth_service.logout(current_user["id"])
    return {"message": "Logged out successfully"}

@app.get("/api/auth/me", tags=["Authentication"], summary="Get current user info")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get information about the currently authenticated user"""
    return current_user

# ==================== SETTINGS ENDPOINTS ====================

# Genome References
@app.get("/api/settings/genome-references", tags=["Settings"], summary="Get genome references")
async def get_genome_references(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all genome references"""
    db_service = get_database_service()
    references = await db_service.get_genome_references()
    return [GenomeReferenceResponse(**ref.__dict__) for ref in references]

@app.post("/api/settings/genome-references", tags=["Settings"], summary="Create genome reference")
async def create_genome_reference(
    request: GenomeReferenceRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Create a new genome reference (admin only)"""
    db_service = get_database_service()
    
    # Check if key already exists
    existing = await db_service.get_genome_reference_by_key(request.key)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Genome reference with key '{request.key}' already exists"
        )
    
    # Create reference
    reference = await db_service.create_genome_reference(
        key=request.key,
        name=request.name,
        url=request.url,
        species=request.species,
        build=request.build,
        is_active=request.is_active,
        created_by=current_user["id"]
    )
    
    # Log action
    auth_service = get_auth_service()
    await auth_service.log_auth_event(
        user_id=current_user["id"],
        action="create_genome_reference",
        details={"key": request.key, "name": request.name}
    )
    
    return GenomeReferenceResponse(**reference.__dict__)

@app.put("/api/settings/genome-references/{ref_id}", tags=["Settings"], summary="Update genome reference")
async def update_genome_reference(
    ref_id: int,
    request: GenomeReferenceRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Update a genome reference (admin only)"""
    db_service = get_database_service()
    
    # Check if reference exists
    existing = await db_service.get_genome_reference(ref_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genome reference not found"
        )
    
    # Check if key already exists (if changing key)
    if request.key != existing.key:
        key_exists = await db_service.get_genome_reference_by_key(request.key)
        if key_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Genome reference with key '{request.key}' already exists"
            )
    
    # Update reference
    reference = await db_service.update_genome_reference(
        ref_id=ref_id,
        key=request.key,
        name=request.name,
        url=request.url,
        species=request.species,
        build=request.build,
        is_active=request.is_active
    )
    
    if not reference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genome reference not found after update"
        )
    
    # Log action
    auth_service = get_auth_service()
    await auth_service.log_auth_event(
        user_id=current_user["id"],
        action="update_genome_reference",
        details={"ref_id": ref_id, "key": request.key, "name": request.name}
    )
    
    return GenomeReferenceResponse(**reference.__dict__)

@app.delete("/api/settings/genome-references/{ref_id}", tags=["Settings"], summary="Delete genome reference")
async def delete_genome_reference(
    ref_id: int,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Delete a genome reference and associated index files (admin only)"""
    db_service = get_database_service()
    
    # Get reference before deletion
    reference = await db_service.get_genome_reference(ref_id)
    if not reference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genome reference not found"
        )
    
    # Delete associated index files for any genome (built-in or custom)
    deleted_index_info = None
    if reference.key:
        try:
            # Call the genome index deletion endpoint
            import asyncio
            # We'll use the existing delete_genome_index function logic
            minio_service = get_minio_service()
            base_dir = "/datasets/reference_genome"
            files_to_delete = [
                f"{reference.key}.fa.gz",
                f"{reference.key}.fa.gz.fai",
                f"{reference.key}.fa.gz.gzi",
                f"{reference.key}.fa.gz.sti"
            ]
            
            # Delete MinIO objects
            bucket = minio_service.get_bucket("reference")
            prefix = f"reference_genome/{reference.key}"
            
            for filename in files_to_delete:
                object_name = f"{prefix}/{filename}"
                try:
                    exists = await minio_service.object_exists(bucket, object_name)
                    if exists:
                        await minio_service.delete_object(bucket, object_name)
                except Exception:
                    pass  # Silently fail for MinIO deletions
            
            # Delete local files
            for filename in files_to_delete:
                path = os.path.join(base_dir, filename)
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except Exception:
                    pass
            
            # Delete database records
            existing_genome = await db_service.get_reference_genome_by_name(reference.name)
            if existing_genome:
                await db_service.delete_reference_genome(existing_genome.id)
            
            # Delete pipeline jobs
            await db_service.delete_pipeline_jobs_by_genome(reference.key)
            
            # Delete genome directory if exists
            genome_dir = os.path.join("/datasets/reference_genome", reference.key)
            if os.path.exists(genome_dir):
                import shutil
                shutil.rmtree(genome_dir, ignore_errors=True)
            
            deleted_index_info = {
                "genome_key": reference.key,
                "deleted_files": True
            }
        except Exception as e:
            deleted_index_info = {
                "genome_key": reference.key,
                "deleted_files": False,
                "error": str(e)
            }
    
    # Delete the genome reference
    deleted = await db_service.delete_genome_reference(ref_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genome reference not found or could not be deleted"
        )
    
    # Log action
    auth_service = get_auth_service()
    await auth_service.log_auth_event(
        user_id=current_user["id"],
        action="delete_genome_reference",
        details={"ref_id": ref_id, "key": reference.key, "name": reference.name}
    )
    
    return {
        "message": "Genome reference deleted successfully",
        "deleted_index": deleted_index_info is not None,
        "index_deletion_info": deleted_index_info
    }

@app.post("/api/settings/genome-references/{ref_id}/test", tags=["Settings"], summary="Test genome reference URL")
async def test_genome_reference(
    ref_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Test genome reference URL connectivity and validity"""
    db_service = get_database_service()
    reference = await db_service.get_genome_reference(ref_id)
    if not reference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Genome reference not found"
        )
    
    # TODO: Implement actual URL testing with HEAD request and validation
    # For now, return mock response
    return {
        "url": reference.url,
        "reachable": True,
        "content_type": "application/gzip",
        "content_length": 841000000,
        "valid": True,
        "message": "URL appears valid (mock response)"
    }

# Pipeline Settings
@app.get("/api/settings/pipeline", tags=["Settings"], summary="Get pipeline settings")
async def get_pipeline_settings(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all pipeline settings"""
    db_service = get_database_service()
    settings = await db_service.get_pipeline_settings()
    
    # Convert to dictionary format for frontend
    result = {}
    for setting in settings:
        result[setting.setting_key] = {
            "value": setting.setting_value,
            "data_type": setting.data_type,
            "description": setting.description,
            "validation_rules": setting.validation_rules
        }
    
    return result

@app.put("/api/settings/pipeline/{key}", tags=["Settings"], summary="Update pipeline setting")
async def update_pipeline_setting(
    key: str,
    request: PipelineSettingUpdate,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Update a pipeline setting (admin only)"""
    db_service = get_database_service()
    
    setting = await db_service.update_pipeline_setting(
        key=key,
        setting_value=request.setting_value,
        data_type=request.data_type,
        validation_rules=request.validation_rules,
        description=request.description
    )
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pipeline setting '{key}' not found"
        )
    
    # Log action
    auth_service = get_auth_service()
    await auth_service.log_auth_event(
        user_id=current_user["id"],
        action="update_pipeline_setting",
        details={"key": key, "value": request.setting_value}
    )
    
    return {
        "key": setting.setting_key,
        "value": setting.setting_value,
        "data_type": setting.data_type,
        "description": setting.description
    }

# AI Provider Settings
@app.get("/api/settings/ai-providers", tags=["Settings"], summary="Get AI provider settings")
async def get_ai_provider_settings(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all AI provider settings"""
    db_service = get_database_service()
    settings = await db_service.get_ai_provider_settings()
    
    # Return without exposing encrypted API keys
    result = []
    for setting in settings:
        result.append({
            "provider": setting.provider,
            "model": setting.model,
            "base_url": setting.base_url,
            "is_active": setting.is_active,
            "has_api_key": bool(setting.api_key_encrypted)
        })
    
    return result

@app.post("/api/settings/ai-providers/test", tags=["Settings"], summary="Test AI provider connection")
async def test_ai_provider(
    provider: str,
    model: str,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Test AI provider API connection (admin only)"""
    db_service = get_database_service()
    setting = await db_service.get_ai_provider_setting(provider, model)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI provider setting not found for {provider}/{model}"
        )
    
    # TODO: Implement actual API test with provided credentials
    # For now, return mock response
    return {
        "provider": provider,
        "model": model,
        "reachable": True,
        "valid": True,
        "message": "Connection test successful (mock response)"
    }

# UI Preferences
@app.get("/api/settings/ui-preferences", tags=["Settings"], summary="Get UI preferences")
async def get_ui_preferences(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get UI preferences for current user"""
    db_service = get_database_service()
    preferences = await db_service.get_ui_preferences(current_user["id"])
    
    if not preferences:
        # Return defaults
        return {
            "language": "en",
            "timezone": "UTC",
            "theme": "light",
            "display_options": {}
        }
    
    return {
        "language": preferences.language,
        "timezone": preferences.timezone,
        "theme": preferences.theme,
        "display_options": preferences.display_options
    }

@app.put("/api/settings/ui-preferences", tags=["Settings"], summary="Update UI preferences")
async def update_ui_preferences(
    request: UIPreferenceUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update UI preferences for current user"""
    db_service = get_database_service()
    
    preferences = await db_service.update_ui_preferences(
        user_id=current_user["id"],
        language=request.language,
        timezone=request.timezone,
        theme=request.theme,
        display_options=request.display_options
    )
    
    return {
        "language": preferences.language,
        "timezone": preferences.timezone,
        "theme": preferences.theme,
        "display_options": preferences.display_options
    }

# System Health
@app.get("/api/settings/system-health", tags=["Settings"], summary="Get system health status")
async def get_system_health(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get system health information"""
    db_service = get_database_service()
    
    try:
        # Test database connection
        stats = await db_service.get_statistics()
        db_healthy = True
    except Exception as e:
        db_healthy = False
        stats = {}
    
    # TODO: Test other services (MinIO, Neo4j, Nextflow)
    
    return {
        "database": {
            "healthy": db_healthy,
            "stats": stats if db_healthy else None
        },
        "minio": {"healthy": True},  # Mock
        "neo4j": {"healthy": True},  # Mock
        "nextflow": {"healthy": True},  # Mock
        "api": {"healthy": True},
        "timestamp": datetime.now().isoformat()
    }

# Audit Logs
@app.get("/api/settings/audit-logs", tags=["Settings"], summary="Get audit logs")
async def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Get audit logs (admin only)"""
    db_service = get_database_service()
    logs = await db_service.get_audit_logs(
        limit=limit,
        offset=offset,
        user_id=user_id,
        action=action
    )
    
    # Format response
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    
    return result


# ==================== STORAGE ENDPOINTS ====================

@app.get("/storage/genomes", tags=["Storage"], summary="List genomes from MinIO storage")
async def get_storage_genomes(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List all genomes available in MinIO storage"""
    minio_service = get_minio_service()
    
    try:
        # List all objects with metadata in the reference genomes bucket
        bucket_name = minio_service.get_bucket("reference")
        objects = await minio_service.list_objects_with_info(bucket=bucket_name, prefix="")
        
        # Group objects by genome name (handling prefixes: genomes/ or reference_genome/)
        genomes_map = {}
        for obj in objects:
            obj_name = obj["object_name"]
            parts = obj_name.split('/')
            
            # Determine genome name based on prefix
            genome_name = None
            if len(parts) >= 2:
                if parts[0] in ["genomes", "reference_genome"]:
                    genome_name = parts[1]
                else:
                    # Treat first part as genome name (flat structure)
                    genome_name = parts[0]
            else:
                # Single part object, treat as genome name (no files)
                genome_name = parts[0] if parts else "unknown"
            
            if not genome_name:
                continue
            
            if genome_name not in genomes_map:
                genomes_map[genome_name] = []
            
            # Determine file type based on extension
            ext = obj_name.split('.')[-1].lower() if '.' in obj_name else "unknown"
            file_type = ext if ext in ['fa', 'fasta', 'fai', 'sti', 'gz', 'bgz', 'bam', 'cram', 'vcf'] else "unknown"
            
            genomes_map[genome_name].append({
                "object": obj_name,
                "size": obj["size"],
                "type": file_type
            })
        
        # Build response
        genomes = []
        for genome_name, files in genomes_map.items():
            total_size = sum(f["size"] for f in files)
            has_fasta = any(f["object"].endswith('.fa') or f["object"].endswith('.fasta') or f["object"].endswith('.fa.gz') for f in files)
            has_fai = any(f["object"].endswith('.fai') for f in files)
            has_sti = any(f["object"].endswith('.sti') for f in files)
            
            genomes.append({
                "name": genome_name,
                "files": files,
                "total_size": total_size,
                "has_fasta": has_fasta,
                "has_fai": has_fai,
                "has_sti": has_sti
            })
        
        return {"genomes": genomes}
    
    except Exception as e:
        logger.error(f"Error listing genomes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/storage/genomes/{genome_name}/status", tags=["Storage"], summary="Get sync status for a genome")
async def get_genome_status(
    genome_name: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get sync status for a specific genome (MinIO vs local vs database)"""
    minio_service = get_minio_service()
    db_service = get_database_service()
    
    # Check MinIO presence - search under both possible prefixes
    minio_objects = []
    for prefix in [f"genomes/{genome_name}/", f"reference_genome/{genome_name}/"]:
        bucket_name = minio_service.get_bucket("reference")
        objects = await minio_service.list_objects_with_info(bucket=bucket_name, prefix=prefix)
        minio_objects.extend(objects)
    minio_present = len(minio_objects) > 0
    
    # Check database presence
    db_present = False
    db_status = None
    db_path = None
    try:
        ref_genome = await db_service.get_reference_genome_by_name(genome_name)
        if ref_genome:
            db_present = True
            db_status = ref_genome.status
            db_path = ref_genome.file_path
    except Exception as e:
        logger.warning(f"Error checking database for genome {genome_name}: {e}")
    
    # Check local filesystem presence
    local_present = False
    local_path = os.getenv("DATASETS_DIR", "/datasets")
    genome_local_dir = os.path.join(local_path, "reference_genome", genome_name)
    if os.path.exists(genome_local_dir):
        # Check for any files
        local_files = os.listdir(genome_local_dir)
        local_present = len(local_files) > 0
    
    # Determine overall status
    if minio_present and db_present and local_present:
        status = "synced"
    elif minio_present and not db_present and not local_present:
        status = "minio_only"
    elif not minio_present and db_present and local_present:
        status = "local_only"
    elif minio_present and db_present and not local_present:
        status = "minio_db"
    else:
        status = "partial"
    
    # Build files list
    files = []
    for obj in minio_objects:
        files.append({
            "source": "minio",
            "object": obj["object_name"],
            "size": obj["size"]
        })
    
    # Add local files if directory exists
    if os.path.exists(genome_local_dir):
        for filename in os.listdir(genome_local_dir):
            filepath = os.path.join(genome_local_dir, filename)
            if os.path.isfile(filepath):
                files.append({
                    "source": "local",
                    "path": filepath,
                    "size": os.path.getsize(filepath)
                })
    
    return {
        "name": genome_name,
        "minio": minio_present,
        "database": db_present,
        "local": local_present,
        "files": files,
        "status": status,
        "db_status": db_status,
        "db_path": db_path
    }


@app.post("/storage/sync/genomes", tags=["Storage"], summary="Sync genomes between MinIO and local storage")
async def sync_genomes(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Trigger sync of genomes from MinIO to local storage"""
    minio_service = get_minio_service()
    local_path = os.getenv("DATASETS_DIR", "/datasets")
    ref_genome_dir = os.path.join(local_path, "reference_genome")
    
    uploaded = 0
    skipped = 0
    failed = 0
    
    try:
        # Ensure MinIO bucket exists
        bucket_name = minio_service.get_bucket("reference")
        minio_service._ensure_bucket(bucket_name)
        
        # Check if local reference genome directory exists
        if not os.path.exists(ref_genome_dir):
            return {
                "success": True,
                "uploaded": 0,
                "skipped": 0,
                "failed": 0,
                "error": f"Local reference genome directory not found: {ref_genome_dir}"
            }
        
        # List local genomes
        local_genomes = [d for d in os.listdir(ref_genome_dir) if os.path.isdir(os.path.join(ref_genome_dir, d))]
        
        for genome_name in local_genomes:
            genome_dir = os.path.join(ref_genome_dir, genome_name)
            # List files in genome directory
            for filename in os.listdir(genome_dir):
                filepath = os.path.join(genome_dir, filename)
                if not os.path.isfile(filepath):
                    continue
                
                # Check if file already exists in MinIO
                minio_object_name = f"reference_genome/{genome_name}/{filename}"
                exists = await minio_service.object_exists(bucket_name, minio_object_name)
                if exists:
                    skipped += 1
                    continue
                
                # Upload file to MinIO
                try:
                    result = await minio_service.upload_file(filepath, bucket=bucket_name, object_name=minio_object_name)
                    if result["status"] == "success":
                        uploaded += 1
                    else:
                        failed += 1
                        logger.error(f"Failed to upload {filepath}: {result['message']}")
                except Exception as e:
                    failed += 1
                    logger.error(f"Error uploading {filepath}: {e}")
        
        return {
            "success": True,
            "uploaded": uploaded,
            "skipped": skipped,
            "failed": failed
        }
        
    except Exception as e:
        logger.error(f"Error during sync: {e}")
        return {
            "success": False,
            "uploaded": uploaded,
            "skipped": skipped,
            "failed": failed,
            "error": str(e)
        }


@app.post("/storage/genomes/{genome_name}/download", tags=["Storage"], summary="Download genome files from MinIO to local storage")
async def download_genome(
    genome_name: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Download genome files from MinIO to local storage"""
    minio_service = get_minio_service()
    local_path = os.getenv("DATASETS_DIR", "/datasets")
    genome_local_dir = os.path.join(local_path, "reference_genome", genome_name)
    
    downloaded = 0
    skipped = 0
    failed = 0
    
    try:
        # Ensure local directory exists
        os.makedirs(genome_local_dir, exist_ok=True)
        
        # List objects for this genome in MinIO - check both prefixes
        bucket_name = minio_service.get_bucket("reference")
        objects = []
        for prefix in [f"genomes/{genome_name}/", f"reference_genome/{genome_name}/"]:
            objs = await minio_service.list_objects_with_info(bucket=bucket_name, prefix=prefix)
            objects.extend(objs)
        
        for obj in objects:
            object_name = obj["object_name"]
            filename = os.path.basename(object_name)
            local_filepath = os.path.join(genome_local_dir, filename)
            
            # Check if local file already exists and size matches
            if os.path.exists(local_filepath) and os.path.getsize(local_filepath) == obj["size"]:
                skipped += 1
                continue
            
            # Download file from MinIO
            try:
                result = await minio_service.download_file(bucket_name, object_name, local_filepath)
                if result["status"] == "success":
                    downloaded += 1
                else:
                    failed += 1
                    logger.error(f"Failed to download {object_name}: {result['message']}")
            except Exception as e:
                failed += 1
                logger.error(f"Error downloading {object_name}: {e}")
        
        return {
            "success": True,
            "downloaded": downloaded,
            "skipped": skipped,
            "failed": failed
        }
        
    except Exception as e:
        logger.error(f"Error during download: {e}")
        return {
            "success": False,
            "downloaded": downloaded,
            "skipped": skipped,
            "failed": failed,
            "error": str(e)
        }




# Keep only essential endpoints for viewing and downloading from MinIO

print("🚀 REGISTERING NEW STORAGE ENDPOINTS...")
logger.info("Registering endpoint: /storage/files/{bucket_type}")
@app.get("/storage/test", tags=["Storage"], summary="Test endpoint")
async def test_endpoint():
    return {"message": "Storage test endpoint works"}

@app.get("/storage/files/{bucket_type}", tags=["Storage"], summary="List files in MinIO bucket")
async def list_files_in_bucket(
    bucket_type: str,
    prefix: str = "",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List files in a MinIO bucket"""
    minio_service = get_minio_service()
    bucket_name = minio_service.get_bucket(bucket_type)
    
    try:
        objects = await minio_service.list_objects_with_info(bucket=bucket_name, prefix=prefix)
        
        # Format response
        files = []
        for obj in objects:
            files.append({
                "object_name": obj["object_name"],
                "size": obj["size"],
                "last_modified": obj["last_modified"],
                "content_type": obj.get("content_type", ""),
                "is_dir": obj.get("is_dir", False)
            })
        
        return {
            "bucket": bucket_name,
            "bucket_type": bucket_type,
            "prefix": prefix,
            "file_count": len(files),
            "files": files
        }
        
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


logger.info("Registering endpoint: /storage/presigned-url/{bucket_type}/{object_name:path}")
@app.get("/storage/presigned-url/{bucket_type}/{object_name:path}", tags=["Storage"], summary="Generate presigned URL for download")
async def generate_presigned_url(
    bucket_type: str,
    object_name: str,
    expires_seconds: int = 3600,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate a presigned URL for downloading a file from MinIO"""
    minio_service = get_minio_service()
    bucket_name = minio_service.get_bucket(bucket_type)
    
    try:
        url = await minio_service.presigned_get_url(
            bucket=bucket_name,
            object_name=object_name,
            expires_seconds=expires_seconds
        )
        
        return {
            "bucket": bucket_name,
            "object_name": object_name,
            "presigned_url": url,
            "expires_seconds": expires_seconds
        }
        
    except Exception as e:
        logger.error(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/storage/download/{bucket_type}/{object_name:path}", tags=["Storage"], summary="Download file from MinIO via backend")
async def download_file_via_backend(
    bucket_type: str,
    object_name: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Download a file from MinIO through backend (bypasses presigned URL issues)"""
    minio_service = get_minio_service()
    bucket_name = minio_service.get_bucket(bucket_type)
    
    try:
        # Get object info for content-type and size
        obj_info = await minio_service.get_object_info(bucket_name, object_name)
        
        # Get stream generator
        stream_generator = await minio_service.get_object_stream(bucket_name, object_name)
        
        # Determine filename for Content-Disposition
        filename = object_name.split('/')[-1] or "download"
        
        return StreamingResponse(
            stream_generator,
            media_type=obj_info.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "Content-Length": str(obj_info.get("size", 0))
            }
        )
        
    except S3Error as e:
        if e.code == "NoSuchKey":
            raise HTTPException(status_code=404, detail=f"File not found: {object_name}")
        logger.error(f"MinIO error downloading {bucket_name}/{object_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error downloading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
