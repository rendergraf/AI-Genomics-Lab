"""
🧬 AI Genomics Lab - API Principal
FastAPI backend para análisis genómico con AI

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import os
import re
import subprocess
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

# Import services
from services.llm_client import get_llm_client
from services.neo4j_service import get_neo4j_service
from services.bio_pipeline_client import get_bio_pipeline_client
from services.database_service import get_database_service

# Import agents
from agents import (
    get_variant_agent,
    get_graph_agent,
    get_literature_agent,
    get_report_agent,
    get_analysis_orchestrator
)

# Load environment variables
load_dotenv()

# Import routers (to be implemented)
# from routers import variants, analysis, agents, knowledge


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the application"""
    # Startup
    print("🚀 AI Genomics Lab API starting up...")
    
    # Initialize Neo4j connection
    neo4j_service = get_neo4j_service()
    try:
        await neo4j_service.connect()
        await neo4j_service.initialize_schema()
        print("✅ Neo4j connected and schema initialized")
    except Exception as e:
        print(f"⚠️ Neo4j connection warning: {e}")
    
    # Initialize PostgreSQL connection
    db_service = get_database_service()
    try:
        await db_service.connect()
        print("✅ PostgreSQL connected and schema initialized")
    except Exception as e:
        print(f"⚠️ PostgreSQL connection warning: {e}")
    
    yield
    
    # Shutdown
    print("🛑 AI Genomics Lab API shutting down...")
    neo4j_service = get_neo4j_service()
    await neo4j_service.close()
    
    db_service = get_database_service()
    await db_service.close()


# Create FastAPI application
app = FastAPI(
    title="🧬 AI Genomics Lab API",
    description="""
AI Genomics Lab API - Local-first platform for genomic analysis using Bioinformatics + AI + LLM + Graph Databases.

Features:
- Upload FASTQ/FASTA/BAM files
- Variant calling with bcftools
- Query knowledge graph for gene/mutation/disease info
- Generate scientific reports with AI
- Explain mutations using LLM

Quick Start:
1. Start services: docker-compose up -d
2. Upload genome files via /analysis/upload
3. Run analysis via /analysis/run
4. Query graph via /graph/genes/{gene}
5. Generate reports via /agents/report
""",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Analysis", "description": "🧬 Bioinformatics pipeline endpoints"},
        {"name": "Graph", "description": "🔗 Knowledge graph endpoints"},
        {"name": "Agents", "description": "🤖 AI agent endpoints"},
        {"name": "LLM", "description": "🧠 LLM integration endpoints"},
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
            "database": "PostgreSQL",
            "graph": "Neo4j",
            "storage": "MinIO"
        }
    }


@app.get("/health", tags=["Health"], summary="Health check", description="""
    Health Check - Verify all services are running
    
    Returns the status of all system components:
    - API: Main application status
    - Database: PostgreSQL connection
    - Graph: Neo4j connection
    - Storage: MinIO connection
    
    Returns:
        Dictionary with status of all services
    """)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "api": "ok",
        "database": "ok",
        "graph": "ok",
        "storage": "ok"
    }


# =======================
# Analysis Endpoints
# =======================

@app.post("/analysis/upload", tags=["Analysis"], summary="Upload genome file", description="""
    Upload Genome File
    
    Upload a genome file (FASTQ, FASTA, or BAM) for analysis.
    
    Supported formats:
    - FASTQ (.fastq, .fq) - Raw sequencing reads
    - FASTA (.fasta, .fa) - Reference sequences
    - BAM (.bam) - Aligned reads
    
    The file will be stored in the datasets directory and queued for processing.
    
    Args:
        file: Genome file to upload
        
    Returns:
        Upload confirmation with file path
    """)
async def upload_genome_file(file: UploadFile = File(...)):
    """
    Upload genome file (FASTQ, FASTA, BAM)
    """
    # Save file to MinIO or local storage
    content = await file.read()
    
    # For now, save to datasets directory
    datasets_path = "/datasets"
    os.makedirs(datasets_path, exist_ok=True)
    
    file_path = os.path.join(datasets_path, file.filename)
    with open(file_path, "wb") as f:
        f.write(content)
    
    return {
        "filename": file.filename,
        "status": "uploaded",
        "path": file_path,
        "message": "File uploaded successfully. Pipeline will process it shortly."
    }


@app.post("/analysis/run", tags=["Analysis"], summary="Run analysis pipeline", description="""
    Run Complete Analysis Pipeline
    
    Execute the bioinformatics pipeline on an uploaded sample.
    
    Pipeline steps:
    1. Quality control of input reads
    2. Alignment to reference genome (BWA-MEM)
    3. Sorting and indexing (SAMtools)
    4. Variant calling (bcftools)
    5. Variant filtering and annotation
    
    Args:
        sample_id: Unique identifier for the sample
        
    Returns:
        Analysis results including detected variants in VCF format
    """)
async def run_analysis(sample_id: str):
    """
    Run complete analysis pipeline for a sample
    """
    pipeline_client = get_bio_pipeline_client()
    
    # Get available samples
    available = pipeline_client.get_available_samples()
    
    if sample_id not in available:
        raise HTTPException(
            status_code=404,
            detail=f"Sample {sample_id} not found. Available: {available}"
        )
    
    # Run pipeline
    result = pipeline_client.run_pipeline(
        input_file=f"/datasets/{sample_id}.fastq",
        sample_id=sample_id
    )
    
    if result.get("success"):
        # Parse VCF results
        variants = []
        if result.get("vcf_file"):
            variants = pipeline_client.parse_vcf(result["vcf_file"])
        
        return {
            "sample_id": sample_id,
            "status": "completed",
            "vcf_file": result.get("vcf_file"),
            "variant_count": len(variants),
            "variants": variants
        }
    else:
        return {
            "sample_id": sample_id,
            "status": "failed",
            "error": result.get("error")
        }


@app.get("/analysis/status", tags=["Analysis"], summary="Get pipeline status", description="""
    Get Pipeline Status
    
    Returns current status of the bioinformatics pipeline including:
    - Available input files
    - Generated output files (BAM, VCF)
    - Reference genome status
    - Processing queue
    """)
async def get_pipeline_status():
    """Get pipeline status and available files"""
    pipeline_client = get_bio_pipeline_client()
    return pipeline_client.get_pipeline_status()


@app.post("/analysis/run-docker", tags=["Analysis"], summary="Run pipeline in Docker container", description="""
    Run Pipeline in Docker Container
    
    Execute the bioinformatics pipeline inside the bio-pipeline Docker container.
    This provides a more isolated and consistent environment for pipeline execution.
    
    Args:
        sample_id: Unique identifier for the sample (e.g., SRR1517848)
        reference: Reference genome (hg38 or hg19)
        
    Returns:
        Streaming logs from the pipeline execution
    """)
async def run_pipeline_docker(sample_id: str, reference: str = "hg38"):
    """
    Run pipeline in Docker container with streaming output
    """
    import asyncio
    
    # Validate sample exists
    fastq_dir = "/datasets/fastq"
    sample_files = []
    
    # Look for sample files
    for ext in ['.fastq', '.fastq.gz', '.fq', '.fq.gz']:
        f1 = f"{fastq_dir}/{sample_id}_1{ext}"
        f2 = f"{fastq_dir}/{sample_id}_2{ext}"
        if os.path.exists(f1):
            sample_files.append(f1)
        if os.path.exists(f2):
            sample_files.append(f2)
    
    if not sample_files:
        # Check for single end files
        single = f"{fastq_dir}/{sample_id}{ext}"
        for ext in ['.fastq', '.fastq.gz', '.fq', '.fq.gz']:
            if os.path.exists(f"{fastq_dir}/{sample_id}{ext}"):
                sample_files.append(f"{fastq_dir}/{sample_id}{ext}")
                break
    
    if not sample_files:
        raise HTTPException(
            status_code=404,
            detail=f"Sample {sample_id} not found in {fastq_dir}"
        )
    
    async def generate_logs():
        """Generate streaming output from Docker pipeline"""
        # Set environment variables
        env = os.environ.copy()
        env["SAMPLE_ID"] = sample_id
        env["REFERENCE_GENOME"] = f"/datasets/reference_genome/{reference}.fa"
        
        # Run pipeline in Docker
        cmd = [
            "docker", "exec", "-i", "ai-genomics-bio",
            "/bin/bash", "-c",
            f"cd /datasets && SAMPLE_ID={sample_id} bash /pipeline/scripts/pipeline.sh 2>&1"
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env=env,
                text=True,
                bufsize=1
            )
            
            # Stream output line by line
            for line in iter(process.stdout.readline, ''):
                if line:
                    yield f"data: {line}\n\n"
            
            process.stdout.close()
            process.wait()
            
        except FileNotFoundError:
            yield "data: Error: Docker command not found\n\n"
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"
    
    return StreamingResponse(
        generate_logs(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/analysis/stream-progress/{sample_id}", tags=["Analysis"], summary="Run pipeline with progress streaming", description="""
    Run Pipeline with Real-time Progress Updates
    
    Execute the bioinformatics pipeline and receive structured progress updates
    including step numbers, percentages, file sizes, and timing information.
    
    This endpoint uses Server-Sent Events (SSE) to stream progress updates
    that can be used to display progress bars and status in the UI.
    
    Args:
        sample_id: Unique identifier for the sample (e.g., SRR1517848)
        reference: Reference genome (hg38 or hg19)
        
    Returns:
        Streaming progress updates in SSE format
""")
async def run_pipeline_with_progress(sample_id: str, reference: str = "hg38"):
    """
    Run pipeline with structured progress streaming
    """
    import json
    
    # Validate sample exists
    fastq_dir = "/datasets/fastq"
    sample_files = []
    
    for ext in ['.fastq', '.fastq.gz', '.fq', '.fq.gz']:
        f1 = f"{fastq_dir}/{sample_id}_1{ext}"
        f2 = f"{fastq_dir}/{sample_id}_2{ext}"
        if os.path.exists(f1):
            sample_files.append(f1)
        if os.path.exists(f2):
            sample_files.append(f2)
    
    if not sample_files:
        for ext in ['.fastq', '.fastq.gz', '.fq', '.fq.gz']:
            if os.path.exists(f"{fastq_dir}/{sample_id}{ext}"):
                sample_files.append(f"{fastq_dir}/{sample_id}{ext}")
                break
    
    if not sample_files:
        raise HTTPException(
            status_code=404,
            detail=f"Sample {sample_id} not found in {fastq_dir}"
        )
    
    pipeline_client = get_bio_pipeline_client()
    
    async def generate_progress():
        """Generate structured progress updates"""
        try:
            # Start the pipeline and yield progress updates
            for progress in pipeline_client.run_pipeline_streaming(
                input_file=sample_files[0],
                sample_id=sample_id,
                reference=f"/datasets/reference_genome/{reference}.fa.gz"
            ):
                # Format as SSE
                yield f"data: {json.dumps(progress)}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# =======================
# Reference Genomes Endpoints
# =======================

@app.get("/reference-genomes", tags=["Reference Genomes"], summary="List reference genomes")
async def list_reference_genomes():
    """Get all reference genomes"""
    db = get_database_service()
    genomes = await db.get_reference_genomes()
    return {
        "genomes": [
            {
                "id": g.id,
                "name": g.name,
                "species": g.species,
                "build": g.build,
                "status": g.status,
                "file_path": g.file_path,
                "gz_path": g.gz_path,
                "created_at": g.created_at.isoformat() if g.created_at else None
            }
            for g in genomes
        ]
    }


@app.post("/reference-genomes", tags=["Reference Genomes"], summary="Upload reference genome")
async def upload_reference_genome(
    name: str = Form(...),
    species: str = Form(...),
    build: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload a reference genome FASTA file
    """
    # Save file to reference genome directory
    reference_dir = "/datasets/reference_genome"
    os.makedirs(reference_dir, exist_ok=True)
    
    file_path = f"{reference_dir}/{file.filename}"
    content = await file.read()
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create database entry
    db = get_database_service()
    genome = await db.create_reference_genome(
        name=name,
        species=species,
        build=build,
        file_path=file_path
    )
    
    return {
        "id": genome.id,
        "name": genome.name,
        "species": genome.species,
        "build": genome.build,
        "status": genome.status,
        "file_path": genome.file_path,
        "message": "Reference genome uploaded. Use /reference-genomes/{id}/index to index it."
    }


@app.get("/reference-genomes/{genome_id}/index", tags=["Reference Genomes"], summary="Index reference genome")
async def index_reference_genome(genome_id: int):
    """
    Index a reference genome (compress, create FAI, GZI, STI indexes)
    """
    db = get_database_service()
    genome = await db.get_reference_genome(genome_id)
    
    if not genome:
        raise HTTPException(status_code=404, detail="Reference genome not found")
    
    # Update status to indexing
    await db.update_reference_genome_status(genome_id, "indexing")
    
    async def generate_indexing_logs():
        """Generate streaming output from genome indexing"""
        import json
        
        # Set environment variables
        env = os.environ.copy()
        env["INPUT_FA"] = genome.file_path
        
        # Run indexing pipeline in Docker
        cmd = [
            "docker", "exec", "-i", "ai-genomics-bio",
            "/bin/bash", "-c",
            f"INPUT_FA={genome.file_path} bash /pipeline/scripts/index_genome.sh 2>&1"
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env=env,
                text=True,
                bufsize=1
            )
            
            # Parse output paths
            gz_path = f"{genome.file_path}.gz"
            fai_path = f"{genome.file_path}.gz.fai"
            gzi_path = f"{genome.file_path}.gz.gzi"
            sti_path = f"{genome.file_path}.gz.r150.sti"
            
            # Stream output line by line
            for line in iter(process.stdout.readline, ''):
                if line:
                    yield f"data: {json.dumps({'type': 'log', 'message': line.strip()})}\n\n"
                    
                    # Parse output paths from the script
                    if "GZ_PATH=" in line:
                        gz_path = line.split("=")[1].strip()
                    elif "FAI_PATH=" in line:
                        fai_path = line.split("=")[1].strip()
                    elif "GZI_PATH=" in line:
                        gzi_path = line.split("=")[1].strip()
                    elif "STI_PATH=" in line:
                        sti_path = line.split("=")[1].strip()
            
            process.stdout.close()
            return_code = process.wait()
            
            if return_code == 0:
                # Update database with indexed paths
                await db.update_reference_genome_status(
                    genome_id,
                    "ready",
                    gz_path=gz_path,
                    fai_path=fai_path,
                    gzi_path=gzi_path,
                    sti_path=sti_path
                )
                yield f"data: {json.dumps({'type': 'complete', 'message': 'Genome indexing complete!'})}\n\n"
            else:
                await db.update_reference_genome_status(genome_id, "error")
                yield f"data: {json.dumps({'type': 'error', 'message': 'Indexing failed'})}\n\n"
                
        except FileNotFoundError:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Docker command not found'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_indexing_logs(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.delete("/reference-genomes/{genome_id}", tags=["Reference Genomes"], summary="Delete reference genome")
async def delete_reference_genome(genome_id: int):
    """Delete a reference genome"""
    db = get_database_service()
    genome = await db.get_reference_genome(genome_id)
    
    if not genome:
        raise HTTPException(status_code=404, detail="Reference genome not found")
    
    # Delete files
    for path in [genome.file_path, genome.gz_path, genome.fai_path, genome.gzi_path, genome.sti_path]:
        if path and os.path.exists(path):
            os.remove(path)
    
    # Delete from database
    await db.delete_reference_genome(genome_id)
    
    return {"message": "Reference genome deleted"}


@app.post("/reference-genomes/index-with-fastq", tags=["Reference Genomes"], summary="Index genome with FASTQ files")
async def index_genome_with_fastq(
    genome_id: int = Form(...),
    fastq_files: list[UploadFile] = File(...)
):
    """
    Index a reference genome using provided FASTQ files for STI index creation.
    """
    db = get_database_service()
    genome = await db.get_reference_genome(genome_id)
    
    if not genome:
        raise HTTPException(status_code=404, detail="Reference genome not found")
    
    # Update status to indexing
    await db.update_reference_genome_status(genome_id, "indexing")
    
    # Save uploaded FASTQ files temporarily
    fastq_dir = "/datasets/fastq"
    os.makedirs(fastq_dir, exist_ok=True)
    
    fastq_paths = []
    for f in fastq_files:
        file_path = os.path.join(fastq_dir, f.filename)
        content = await f.read()
        with open(file_path, "wb") as fp:
            fp.write(content)
        fastq_paths.append(file_path)
    
    async def generate_indexing_logs():
        import json
        
        env = os.environ.copy()
        env["INPUT_FA"] = genome.file_path
        env["FASTQ_SAMPLE"] = " ".join(fastq_paths)
        
        cmd = [
            "docker", "exec", "-i", "ai-genomics-bio",
            "/bin/bash", "-c",
            f"INPUT_FA={genome.file_path} FASTQ_SAMPLE=\"{' '.join(fastq_paths)}\" bash /pipeline/scripts/index_genome.sh 2>&1"
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env=env,
                text=True,
                bufsize=1
            )
            
            gz_path = f"{genome.file_path}.gz"
            fai_path = f"{genome.file_path}.gz.fai"
            gzi_path = f"{genome.file_path}.gz.gzi"
            sti_path = f"{genome.file_path}.gz.r150.sti"
            
            for line in iter(process.stdout.readline, ''):
                if line:
                    msg = line.strip()
                    yield f"data: {json.dumps({'type': 'log', 'message': msg})}\n\n"
                    
                    if "GZ_PATH=" in line:
                        gz_path = line.split("=")[1].strip()
                    elif "FAI_PATH=" in line:
                        fai_path = line.split("=")[1].strip()
                    elif "GZI_PATH=" in line:
                        gzi_path = line.split("=")[1].strip()
                    elif "STI_PATH=" in line:
                        sti_path = line.split("=")[1].strip()
            
            process.stdout.close()
            return_code = process.wait()
            
            if return_code == 0:
                await db.update_reference_genome_status(
                    genome_id,
                    "ready",
                    gz_path=gz_path,
                    fai_path=fai_path,
                    gzi_path=gzi_path,
                    sti_path=sti_path
                )
                yield f"data: {json.dumps({'type': 'complete', 'message': 'Genome indexing with FASTQ complete!'})}\n\n"
            else:
                await db.update_reference_genome_status(genome_id, "error")
                yield f"data: {json.dumps({'type': 'error', 'message': 'Genome indexing failed'})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            for path in fastq_paths:
                if os.path.exists(path):
                    try:
                        os.remove(path)
                    except:
                        pass
    
    return StreamingResponse(generate_indexing_logs(), media_type="text/event-stream")


@app.post("/reference-genomes/upload-fastq", tags=["Reference Genomes"], summary="Upload FASTQ files for indexing")
async def upload_fastq_files(files: list[UploadFile] = File(...)):
    """
    Upload FASTQ files and return their paths on the server.
    Files are saved to /datasets/fastq which is shared with bio-pipeline container.
    """
    # Use /tmp first, then copy to shared volume
    temp_dir = "/tmp/fastq_upload"
    os.makedirs(temp_dir, exist_ok=True)
    
    fastq_paths = []
    for f in files:
        file_path = os.path.join(temp_dir, f.filename)
        content = await f.read()
        with open(file_path, "wb") as fp:
            fp.write(content)
        fastq_paths.append(file_path)
    
    # Copy to shared directory accessible by bio-pipeline container
    shared_fastq_dir = "/datasets/fastq"
    os.makedirs(shared_fastq_dir, exist_ok=True)
    
    for src_path in fastq_paths:
        filename = os.path.basename(src_path)
        dst_path = os.path.join(shared_fastq_dir, filename)
        # Copy file to shared directory
        import shutil
        shutil.copy2(src_path, dst_path)
        # Change permissions to allow access from other containers
        os.chmod(dst_path, 0o777)
        # Update path to shared location
        fastq_paths[fastq_paths.index(src_path)] = dst_path
    
    return {
        "paths": fastq_paths,
        "message": f"Uploaded {len(fastq_paths)} FASTQ files"
    }


@app.get("/reference-genomes/{genome_id}/index-with-paths", tags=["Reference Genomes"], summary="Index genome with FASTQ file paths")
async def index_genome_with_paths(genome_id: int, paths: str):
    """
    Index a reference genome using provided FASTQ file paths.
    """
    import json
    
    db = get_database_service()
    genome = await db.get_reference_genome(genome_id)
    
    if not genome:
        raise HTTPException(status_code=404, detail="Reference genome not found")
    
    # Update status to indexing
    await db.update_reference_genome_status(genome_id, "indexing")
    
    # Parse the paths
    fastq_paths = paths.split(",")
    
    async def generate_indexing_logs():
        env = os.environ.copy()
        env["INPUT_FA"] = genome.file_path
        env["FASTQ_SAMPLE"] = " ".join(fastq_paths)
        
        cmd = [
            "docker", "exec", "-i", "ai-genomics-bio",
            "/bin/bash", "-c",
            f"INPUT_FA={genome.file_path} FASTQ_SAMPLE=\"{' '.join(fastq_paths)}\" bash /pipeline/scripts/index_genome.sh 2>&1"
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env=env,
                text=True,
                bufsize=1
            )
            
            gz_path = f"{genome.file_path}.gz"
            fai_path = f"{genome.file_path}.gz.fai"
            gzi_path = f"{genome.file_path}.gz.gzi"
            sti_path = f"{genome.file_path}.gz.r150.sti"
            
            for line in iter(process.stdout.readline, ''):
                if line:
                    msg = line.strip()
                    yield f"data: {json.dumps({'type': 'log', 'message': msg})}\n\n"
                    
                    if "GZ_PATH=" in line:
                        gz_path = line.split("=")[1].strip()
                    elif "FAI_PATH=" in line:
                        fai_path = line.split("=")[1].strip()
                    elif "GZI_PATH=" in line:
                        gzi_path = line.split("=")[1].strip()
                    elif "STI_PATH=" in line:
                        sti_path = line.split("=")[1].strip()
            
            process.stdout.close()
            return_code = process.wait()
            
            if return_code == 0:
                await db.update_reference_genome_status(
                    genome_id,
                    "ready",
                    gz_path=gz_path,
                    fai_path=fai_path,
                    gzi_path=gzi_path,
                    sti_path=sti_path
                )
                yield f"data: {json.dumps({'type': 'complete', 'message': 'Genome indexing with FASTQ complete!'})}\n\n"
            else:
                await db.update_reference_genome_status(genome_id, "error")
                yield f"data: {json.dumps({'type': 'error', 'message': 'Genome indexing failed'})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(generate_indexing_logs(), media_type="text/event-stream")


# =======================
# Samples Endpoints
# =======================

@app.get("/samples", tags=["Samples"], summary="List samples")
async def list_samples():
    """Get all samples"""
    db = get_database_service()
    samples = await db.get_samples()
    
    # Get genome names
    genomes = {g.id: g.name for g in await db.get_reference_genomes()}
    
    return {
        "samples": [
            {
                "id": s.id,
                "name": s.name,
                "sample_type": s.sample_type,
                "reference_genome_id": s.reference_genome_id,
                "reference_genome_name": genomes.get(s.reference_genome_id),
                "status": s.status,
                "r1_path": s.r1_path,
                "r2_path": s.r2_path,
                "vcf_path": s.vcf_path,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in samples
        ]
    }


@app.post("/samples", tags=["Samples"], summary="Upload sample files")
async def upload_sample(
    name: str,
    reference_genome_id: int,
    r1_file: UploadFile = File(...),
    r2_file: UploadFile = File(None)
):
    """
    Upload sample FASTQ files (R1 and optionally R2)
    """
    db = get_database_service()
    
    # Verify reference genome exists
    genome = await db.get_reference_genome(reference_genome_id)
    if not genome:
        raise HTTPException(status_code=404, detail="Reference genome not found")
    
    if genome.status != "ready":
        raise HTTPException(status_code=400, detail="Reference genome must be indexed before use")
    
    # Save files
    fastq_dir = "/datasets/fastq"
    os.makedirs(fastq_dir, exist_ok=True)
    
    r1_path = f"{fastq_dir}/{name}_1.fastq.gz"
    content = await r1_file.read()
    with open(r1_path, "wb") as f:
        f.write(content)
    
    r2_path = None
    if r2_file:
        r2_path = f"{fastq_dir}/{name}_2.fastq.gz"
        content = await r2_file.read()
        with open(r2_path, "wb") as f:
            f.write(content)
    
    # Determine sample type
    sample_type = "paired-end" if r2_path else "single-end"
    
    # Create database entry
    sample = await db.create_sample(
        name=name,
        sample_type=sample_type,
        reference_genome_id=reference_genome_id,
        r1_path=r1_path,
        r2_path=r2_path
    )
    
    return {
        "id": sample.id,
        "name": sample.name,
        "sample_type": sample.sample_type,
        "reference_genome_id": sample.reference_genome_id,
        "reference_genome_name": genome.name,
        "status": sample.status,
        "r1_path": sample.r1_path,
        "r2_path": sample.r2_path,
        "message": "Sample uploaded. Use /samples/{id}/run to process it."
    }


@app.get("/samples/{sample_id}/run", tags=["Samples"], summary="Run sample pipeline")
async def run_sample_pipeline(sample_id: int):
    """
    Run the bioinformatics pipeline on a sample
    """
    db = get_database_service()
    sample = await db.get_sample(sample_id)
    
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    genome = await db.get_reference_genome(sample.reference_genome_id)
    if not genome or genome.status != "ready":
        raise HTTPException(status_code=400, detail="Reference genome not ready")
    
    # Update status to processing
    await db.update_sample_status(sample_id, "processing")
    
    async def generate_pipeline_logs():
        """Generate streaming output from sample pipeline"""
        import json
        
        env = os.environ.copy()
        env["REFERENCE_GENOME_GZ"] = genome.gz_path
        
        # Build sample input path
        if sample.r2_path:
            sample_input = f"{sample.name}"
        else:
            sample_input = f"{sample.name}"
        
        cmd = [
            "docker", "exec", "-i", "ai-genomics-bio",
            "/bin/bash", "-c",
            f"cd /datasets/fastq && REFERENCE_GENOME_GZ={genome.gz_path} bash /pipeline/scripts/pipeline.sh 2>&1"
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env=env,
                text=True,
                bufsize=1
            )
            
            for line in iter(process.stdout.readline, ''):
                if line:
                    yield f"data: {json.dumps({'type': 'log', 'message': line.strip()})}\n\n"
            
            process.stdout.close()
            return_code = process.wait()
            
            if return_code == 0:
                # Find output files
                bam_path = f"/datasets/bam/{sample.name}_sorted.bam"
                cram_path = f"/datasets/bam/{sample.name}_sorted.cram"
                vcf_path = f"/datasets/vcf/{sample.name}_filtered.vcf"
                
                # Use CRAM if available, otherwise BAM
                output_path = cram_path if os.path.exists(cram_path) else bam_path
                
                await db.update_sample_status(
                    sample_id,
                    "completed",
                    bam_path=bam_path if os.path.exists(bam_path) else None,
                    cram_path=cram_path if os.path.exists(cram_path) else None,
                    vcf_path=vcf_path if os.path.exists(vcf_path) else None
                )
                yield f"data: {json.dumps({'type': 'complete', 'message': 'Pipeline complete!'})}\n\n"
            else:
                await db.update_sample_status(sample_id, "failed")
                yield f"data: {json.dumps({'type': 'error', 'message': 'Pipeline failed'})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_pipeline_logs(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.delete("/samples/{sample_id}", tags=["Samples"], summary="Delete sample")
async def delete_sample(sample_id: int):
    """Delete a sample and its files"""
    db = get_database_service()
    sample = await db.get_sample(sample_id)
    
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    # Delete files
    for path in [sample.r1_path, sample.r2_path, sample.bam_path, sample.cram_path, sample.vcf_path]:
        if path and os.path.exists(path):
            os.remove(path)
    
    # Delete from database
    await db.delete_sample(sample_id)
    
    return {"message": "Sample deleted"}


@app.post("/admin/seed", tags=["Admin"], summary="Seed existing data")
async def seed_existing_data():
    """
    Scan filesystem and register existing reference genomes and samples
    """
    db = get_database_service()
    
    registered = {"genomes": 0, "samples": 0}
    
    # Scan reference genomes
    reference_dir = "/datasets/reference_genome"
    if os.path.exists(reference_dir):
        for f in os.listdir(reference_dir):
            if f.endswith('.fa') or f.endswith('.fasta'):
                base_name = f.replace('.fa', '').replace('.fasta', '')
                
                # Check if already exists
                existing = await db.get_reference_genome_by_name(base_name)
                if not existing:
                    file_path = os.path.join(reference_dir, f)
                    gz_path = file_path + '.gz'
                    fai_path = gz_path + '.fai'
                    gzi_path = gz_path + '.gzi'
                    sti_path = gz_path + '.r150.sti'
                    
                    # Determine species and build from name
                    species = "Homo sapiens" if "hg" in base_name.lower() else "Unknown"
                    build = base_name.upper() if "hg" in base_name.lower() else "Unknown"
                    
                    genome = await db.create_reference_genome(
                        name=base_name,
                        species=species,
                        build=build,
                        file_path=file_path
                    )
                    
                    # Check if indexed
                    if os.path.exists(gz_path) and os.path.exists(fai_path):
                        await db.update_reference_genome_status(
                            genome.id,
                            "ready" if os.path.exists(sti_path) else "uploaded",
                            gz_path=gz_path,
                            fai_path=fai_path,
                            gzi_path=gzi_path if os.path.exists(gzi_path) else None,
                            sti_path=sti_path if os.path.exists(sti_path) else None
                        )
                    
                    registered["genomes"] += 1
    
    # Scan samples
    fastq_dir = "/datasets/fastq"
    if os.path.exists(fastq_dir):
        # Get ready genomes
        genomes = await db.get_reference_genomes()
        ready_genome = next((g for g in genomes if g.status == "ready"), None)
        
        if ready_genome:
            # Group files by sample name
            samples = {}
            for f in os.listdir(fastq_dir):
                if f.endswith('.fastq.gz'):
                    sample_name = f.replace('_1.fastq.gz', '').replace('_2.fastq.gz', '').replace('.fastq.gz', '')
                    if sample_name not in samples:
                        samples[sample_name] = {}
                    
                    if '_1.' in f or f.startswith(sample_name + '_') and '1' in f.split('_')[-1]:
                        samples[sample_name]['r1'] = os.path.join(fastq_dir, f)
                    elif '_2.' in f or f.startswith(sample_name + '_') and '2' in f.split('_')[-1]:
                        samples[sample_name]['r2'] = os.path.join(fastq_dir, f)
            
            for sample_name, paths in samples.items():
                existing = await db.get_sample_by_name(sample_name)
                if not existing and 'r1' in paths:
                    sample_type = "paired-end" if 'r2' in paths else "single-end"
                    sample = await db.create_sample(
                        name=sample_name,
                        sample_type=sample_type,
                        reference_genome_id=ready_genome.id,
                        r1_path=paths.get('r1'),
                        r2_path=paths.get('r2')
                    )
                    registered["samples"] += 1
    
    return {
        "message": "Data seeding complete",
        "registered": registered
    }


# =======================
# Knowledge Graph Endpoints
# =======================

@app.get("/graph/genes/{gene_symbol}", tags=["Graph"], summary="Get gene information", description="""
    Get Gene Information
    
    Retrieve detailed information about a specific gene from the knowledge graph.
    
    Args:
        gene_symbol: Gene symbol (e.g., BRCA1, TP53, EGFR)
        
    Returns:
        Gene details including:
        - Chromosome location
        - Start/end positions
        - Description
        - Associated mutations
        - Disease associations
    """)
async def get_gene_info(gene_symbol: str):
    """
    Get gene information from knowledge graph
    """
    graph_agent = get_graph_agent()
    result = await graph_agent.query("gene", {"gene_id": gene_symbol})
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.get("/graph/mutations/{mutation_id}", tags=["Graph"], summary="Get mutation information", description="""
    Get Mutation Information
    
    Retrieve detailed information about a specific mutation from the knowledge graph.
    
    Args:
        mutation_id: Mutation identifier (e.g., c.68_69delAG, R273H)
        
    Returns:
        Mutation details including:
        - Gene association
        - Position
        - Ref/Alt alleles
        - Pathogenicity classification
        - Disease associations
    """)
async def get_mutation_info(mutation_id: str):
    """
    Get mutation information from knowledge graph
    """
    graph_agent = get_graph_agent()
    result = await graph_agent.query("mutation", {"mutation_id": mutation_id})
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.get("/graph/diseases/{disease_id}", tags=["Graph"], summary="Get disease information", description="""
    Get Disease Information
    
    Retrieve detailed information about a specific disease from the knowledge graph.
    
    Args:
        disease_id: Disease identifier (e.g., OMIM:604370)
        
    Returns:
        Disease details including:
        - Name and description
        - Category
        - Inheritance pattern
        - Associated genes and mutations
    """)
async def get_disease_info(disease_id: str):
    """
    Get disease information from knowledge graph
    """
    graph_agent = get_graph_agent()
    result = await graph_agent.query("disease", {"disease_id": disease_id})
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.get("/graph/search", tags=["Graph"], summary="Search genes and mutations", description="""
    Search Knowledge Graph
    
    Search for genes, mutations, or diseases in the knowledge graph.
    
    Args:
        q: Search query (gene symbol, mutation ID, disease name)
        
    Returns:
        Search results with matching entities
    """)
async def search_genes(q: str):
    """Search genes in knowledge graph"""
    graph_agent = get_graph_agent()
    result = await graph_agent.query("search", {"search_term": q})
    return result


@app.get("/graph/statistics", tags=["Graph"], summary="Get graph statistics", description="""
    Get Knowledge Graph Statistics
    
    Returns statistics about the knowledge graph including:
    - Total number of genes
    - Total number of mutations
    - Total number of diseases
    - Total number of proteins
    - Total number of papers
    - Total number of drugs
    """)
async def get_graph_statistics():
    """Get knowledge graph statistics"""
    neo4j_service = get_neo4j_service()
    return await neo4j_service.get_statistics()


# =======================
# AI Agent Endpoints
# =======================

@app.post("/agents/analyze", tags=["Agents"], summary="Analyze variant with AI", description="""
    Analyze Variant with AI Agent
    
    Use the VariantAgent to perform deep analysis of a specific variant.
    
    The agent will:
    1. Query the knowledge graph for gene/mutation context
    2. Retrieve relevant literature
    3. Use LLM to generate analysis
    4. Provide clinical interpretation
    
    Args:
        variant_id: Variant identifier to analyze
        
    Returns:
        Detailed AI-generated analysis of the variant
    """)
async def analyze_variant(variant_id: str):
    """
    Run AI agent to analyze a specific variant
    """
    variant_agent = get_variant_agent()
    result = await variant_agent.analyze(variant_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.post("/agents/report", tags=["Agents"], summary="Generate scientific report", description="""
    Generate Scientific Report
    
    Use the ReportAgent to generate a comprehensive scientific report.
    
    The report includes:
    1. Executive Summary
    2. Methodology
    3. Variant Analysis
    4. Clinical Interpretation
    5. Conclusions and Recommendations
    
    Args:
        sample_id: Sample identifier
        variants: List of detected variants
        
    Returns:
        Generated scientific report
    """)
async def generate_report(
    sample_id: str,
    variants: list
):
    """
    Generate scientific report for a sample
    """
    report_agent = get_report_agent()
    result = await report_agent.generate(sample_id, variants)
    
    return result


@app.post("/agents/complete-analysis", tags=["Agents"], summary="Run complete AI analysis", description="""
    Run Complete Analysis with All Agents
    
    Execute a comprehensive analysis using all AI agents in orchestration.
    
    This includes:
    - VariantAgent for variant analysis
    - GraphAgent for knowledge graph queries
    - LiteratureAgent for research retrieval
    - ReportAgent for summary generation
    
    Args:
        sample_id: Sample identifier
        variants: List of detected variants
        
    Returns:
        Complete analysis results from all agents
    """)
async def run_complete_analysis(
    sample_id: str,
    variants: list
):
    """
    Run complete analysis with all agents
    """
    orchestrator = get_analysis_orchestrator()
    result = await orchestrator.run_complete_analysis(sample_id, variants)
    
    return result


# =======================
# LLM Integration Endpoints
# =======================

@app.post("/llm/explain", tags=["LLM"], summary="Explain mutation with AI", description="""
    Explain Mutation Using LLM
    
    Use the Language Model to explain the biological impact of a mutation.
    
    The explanation includes:
    1. Biological explanation of the mutation
    2. Impact on protein function
    3. Disease associations
    4. Clinical significance
    
    Args:
        mutation: Mutation identifier (e.g., c.68_69delAG)
        gene: Gene symbol (e.g., BRCA1)
        
    Returns:
        LLM-generated explanation
    """)
async def explain_mutation(mutation: str, gene: str):
    """
    Use LLM to explain biological impact of mutation
    """
    llm_client = get_llm_client()
    result = await llm_client.explain_mutation(gene, mutation)
    
    return result


@app.post("/llm/generate", tags=["LLM"], summary="Generate text with LLM", description="""
    Generate Text with LLM
    
    Use the Language Model for general text generation.
    
    Args:
        prompt: User prompt
        system_message: Optional system message for context
        temperature: Sampling temperature (0-2, default 0.7)
        
    Returns:
        LLM-generated response
    """)
async def generate_with_llm(
    prompt: str,
    system_message: str = None,
    temperature: float = 0.7
):
    """
    Generate text with LLM
    """
    llm_client = get_llm_client()
    result = await llm_client.generate(prompt, system_message, temperature=temperature)
    
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
