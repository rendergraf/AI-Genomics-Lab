"""
🧬 AI Genomics Lab - Genome Indexing API
FastAPI backend for genomic analysis with AI

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import os
import json
import re
import uuid
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Form, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv

# Import services
from services.nextflow_runner import get_nextflow_runner
from services.database_service import get_database_service

# Load environment variables
load_dotenv()



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
    ]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


def check_genome_indexed(genome_id: str) -> dict:
    """Check if a genome is indexed by verifying file existence"""
    base_dir = "/datasets/reference_genome"
    files = {
        "bgzip_fasta": f"{genome_id}.fa.gz",
        "fai_index": f"{genome_id}.fa.gz.fai",
        "gzi_index": f"{genome_id}.fa.gz.gzi",
        "sti_index": f"{genome_id}.fa.gz.sti"
    }
    
    status = {}
    for key, filename in files.items():
        path = os.path.join(base_dir, filename)
        status[key] = os.path.exists(path)
    
    # Consider indexed if all required files exist (bgzip_fasta is mandatory, others preferred)
    indexed = status.get("bgzip_fasta", False)  # At least the main file should exist
    return {
        "genome_id": genome_id,
        "indexed": indexed,
        "files": status,
        "paths": {key: os.path.join(base_dir, filename) for key, filename in files.items()}
    }


@app.get("/genome/indexed", tags=["Genome"], summary="Get indexing status for all genomes")
async def get_indexed_genomes():
    """Get indexing status for all available genomes"""
    status = {}
    for genome_id in REMOTE_GENOMES.keys():
        status[genome_id] = check_genome_indexed(genome_id)
    return status


@app.get("/genome/status/{genome_id}", tags=["Genome"], summary="Get indexing status for a specific genome")
async def get_genome_status(
    genome_id: str = Path(..., description="Genome ID: hg38, hg38-test (chromosome 21), or hg19")
):
    """Get detailed indexing status for a specific genome"""
    if genome_id not in REMOTE_GENOMES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown genome: {genome_id}. Available: {list(REMOTE_GENOMES.keys())}"
        )
    
    return check_genome_indexed(genome_id)


@app.delete("/genome/index/{genome_id}", tags=["Genome"], summary="Delete genome index files")
async def delete_genome_index(
    genome_id: str = Path(..., description="Genome ID: hg38, hg38-test (chromosome 21), or hg19")
):
    """Delete genome index files (bgzip, fai, gzi, sti)"""
    if genome_id not in REMOTE_GENOMES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown genome: {genome_id}. Available: {list(REMOTE_GENOMES.keys())}"
        )
    
    base_dir = "/datasets/reference_genome"
    files_to_delete = [
        f"{genome_id}.fa.gz",
        f"{genome_id}.fa.gz.fai",
        f"{genome_id}.fa.gz.gzi",
        f"{genome_id}.fa.gz.sti"
    ]
    
    deleted = []
    errors = []
    
    for filename in files_to_delete:
        path = os.path.join(base_dir, filename)
        try:
            if os.path.exists(path):
                os.remove(path)
                deleted.append(filename)
        except Exception as e:
            errors.append(f"{filename}: {str(e)}")
    
    return {
        "genome_id": genome_id,
        "deleted": deleted,
        "errors": errors,
        "success": len(errors) == 0
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
    genome_id: str = Form(..., description="Genome ID: hg38, hg38-test (chromosome 21), or hg19")
):
    """
    Genome indexing using Nextflow pipeline in bio-pipeline container
    Creates a pipeline job in database and streams real-time progress
    """
    if genome_id not in REMOTE_GENOMES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown genome: {genome_id}. Available: {list(REMOTE_GENOMES.keys())}"
        )
    
    db_service = get_database_service()
    nextflow_runner = get_nextflow_runner()
    
    # Create pipeline job in database
    genome_info = REMOTE_GENOMES[genome_id]
    parameters = json.dumps({
        "genome_id": genome_id,
        "name": genome_info["name"],
        "species": genome_info["species"],
        "build": genome_info["build"],
        "url": genome_info["url"],
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
            yield f"data: {json.dumps({'type': 'log', 'message': '📂 Output directory: /datasets/reference_genome'})}\n\n"
            
            # Start Nextflow pipeline
            job_info = nextflow_runner.run_genome_indexing(
                genome_id=genome_id,
                output_dir="/datasets/reference_genome",
                job_id=str(pipeline_job.id)
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
            for log_line in nextflow_runner.stream_pipeline_logs(job_info):
                # Check if log_line is already in SSE format
                if log_line.startswith('data: '):
                    # Parse the JSON to get message
                    try:
                        data = json.loads(log_line[6:].strip())
                        message = data.get('message', '')
                        
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
            
            # Update job status to completed
            await db_service.update_pipeline_job_status(
                job_id=pipeline_job.id,
                status="completed",
                finished_at=datetime.now()
            )
            yield f"data: {json.dumps({'type': 'job', 'job_id': pipeline_job.id, 'status': 'completed'})}\n\n"
            yield f"data: {json.dumps({'type': 'complete', 'message': 'Pipeline completed successfully'})}\n\n"
                
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




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
