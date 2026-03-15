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
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

# Import services
from services.llm_client import get_llm_client
from services.neo4j_service import get_neo4j_service
from services.bio_pipeline_client import get_bio_pipeline_client

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
    
    yield
    
    # Shutdown
    print("🛑 AI Genomics Lab API shutting down...")
    neo4j_service = get_neo4j_service()
    await neo4j_service.close()


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
