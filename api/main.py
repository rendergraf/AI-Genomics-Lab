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
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
    description="Local-first platform for genomic analysis using Bioinformatics + AI + LLM + Graph Databases",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
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


@app.get("/health")
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

@app.post("/analysis/upload")
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


@app.post("/analysis/run")
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


@app.get("/analysis/status")
async def get_pipeline_status():
    """Get pipeline status and available files"""
    pipeline_client = get_bio_pipeline_client()
    return pipeline_client.get_pipeline_status()


# =======================
# Knowledge Graph Endpoints
# =======================

@app.get("/graph/genes/{gene_symbol}")
async def get_gene_info(gene_symbol: str):
    """
    Get gene information from knowledge graph
    """
    graph_agent = get_graph_agent()
    result = await graph_agent.query("gene", {"gene_id": gene_symbol})
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.get("/graph/mutations/{mutation_id}")
async def get_mutation_info(mutation_id: str):
    """
    Get mutation information from knowledge graph
    """
    graph_agent = get_graph_agent()
    result = await graph_agent.query("mutation", {"mutation_id": mutation_id})
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.get("/graph/diseases/{disease_id}")
async def get_disease_info(disease_id: str):
    """
    Get disease information from knowledge graph
    """
    graph_agent = get_graph_agent()
    result = await graph_agent.query("disease", {"disease_id": disease_id})
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.get("/graph/search")
async def search_genes(q: str):
    """Search genes in knowledge graph"""
    graph_agent = get_graph_agent()
    result = await graph_agent.query("search", {"search_term": q})
    return result


@app.get("/graph/statistics")
async def get_graph_statistics():
    """Get knowledge graph statistics"""
    neo4j_service = get_neo4j_service()
    return await neo4j_service.get_statistics()


# =======================
# AI Agent Endpoints
# =======================

@app.post("/agents/analyze")
async def analyze_variant(variant_id: str):
    """
    Run AI agent to analyze a specific variant
    """
    variant_agent = get_variant_agent()
    result = await variant_agent.analyze(variant_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@app.post("/agents/report")
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


@app.post("/agents/complete-analysis")
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

@app.post("/llm/explain")
async def explain_mutation(mutation: str, gene: str):
    """
    Use LLM to explain biological impact of mutation
    """
    llm_client = get_llm_client()
    result = await llm_client.explain_mutation(gene, mutation)
    
    return result


@app.post("/llm/generate")
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
