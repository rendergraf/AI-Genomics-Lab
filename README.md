# 🧬 AI Genomics Lab
AI-powered bioinformatics research platform for genomic analysis and disease detection.

<p align="center">
  <a href="https://github.com/rendergraf/AI-Genomics-Lab"><img src="https://img.shields.io/github/stars/rendergraf/AI-Genomics-Lab" alt="GitHub Stars"></a>
  <a href="https://github.com/rendergraf/AI-Genomics-Lab"><img src="https://img.shields.io/github/forks/rendergraf/AI-Genomics-Lab" alt="GitHub Forks"></a>
  <a href="https://github.com/rendergraf/AI-Genomics-Lab/blob/main/LICENSE"><img src="https://img.shields.io/github/license/rendergraf/AI-Genomics-Lab" alt="MIT license"></a>
</p>

## Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&style=flat" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&style=flat" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&style=flat" alt="Next.js">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&style=flat" alt="React">
  <img src="https://img.shields.io/badge/Neo4j-0181FF?logo=neo4j&style=flat" alt="Neo4j">
  <img src="https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&style=flat" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&style=flat" alt="Docker">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwindcss&style=flat" alt="Tailwind CSS">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/LangGraph-AI/LLM-blue" alt="LangGraph">
  <img src="https://img.shields.io/badge/OpenRouter-LLM-orange" alt="OpenRouter">
  <img src="https://img.shields.io/badge/Cytoscape.js-FF6F00?logo=cytoscape&style=flat" alt="Cytoscape.js">
  <img src="https://img.shields.io/badge/IGV.js-Genome%20Browser-green" alt="IGV.js">
  <img src="https://img.shields.io/badge/BWA-Bioinformatics-blue" alt="BWA">
  <img src="https://img.shields.io/badge/SAMtools-Bioinformatics-red" alt="SAMtools">
  <img src="https://img.shields.io/badge/bcftools-Bioinformatics-green" alt="bcftools">
  <img src="https://img.shields.io/badge/MinIO-Storage-orange" alt="MinIO">
</p>


## 📋 Description

AI Genomics Lab is a local-first platform for genomic analysis that combines Bioinformatics, AI, LLM, and Graph Databases. The system can analyze patient DNA, detect mutations, link them to diseases, and generate scientific reports using AI agents.

## 🧬 AI Genomics Research Platform

Bioinformatics system powered by AI to detect genetic diseases from a patient's DNA using:

- LLMs
- Graph Database
- Deep learning models for sequences
- Scientific agents
- Bioinformatics pipelines

## 🎯 Project Status

**Status: ✅ COMPLETED (100%)**

The project has reached all planned development phases:

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Docker Infrastructure | ✅ |
| Phase 2 | Bioinformatics Pipeline | ✅ |
| Phase 3 | Graph Database | ✅ |
| Phase 4 | LLM Integration | ✅ |
| Phase 5 | Agent System | ✅ |
| Phase 6 | Frontend | ✅ |

## 🚀 Features

- **Bioinformatics Pipeline**: FASTQ → BAM → VCF with BWA, SAMtools, bcftools, and GATK
- **Knowledge Graph**: Neo4j with Gene, Mutation, Disease, Protein, Drug, and Paper nodes
- **LLM Integration**: OpenRouter API for mutation explanation and report generation
- **AI Agents**: Multi-agent system (VariantAgent, GraphAgent, LiteratureAgent, ReportAgent)
- **Modern UI**: Next.js with Cytoscape.js visualization and IGV Genome Browser

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Input["📥 Data Input"]
        FASTQ[FASTQ Files]
        FASTA[FASTA Files]
        BAM[BAM Files]
    end

    subgraph Pipeline["🧬 Bioinformatics Pipeline"]
        QC[Quality Control]
        ALIGN[Alignment BWA-MEM]
        SORT[Sorting SAMtools]
        VAR[Variant Calling bcftools]
        VCF[VCF Output]
    end

    subgraph Storage["💾 Storage"]
        MINIO[MinIO Object Store]
        POSTGRES[PostgreSQL]
        NEO4J[Neo4j Graph DB]
    end

    subgraph AI["🤖 AI Layer"]
        VA[Variant Agent]
        GA[Graph Agent]
        LA[Literature Agent]
        RA[Report Agent]
        LLM[LLM OpenRouter]
    end

    subgraph API["⚡ API Layer"]
        FASTAPI[FastAPI Backend]
    end

    subgraph UI["🎨 User Interface"]
        NEXT[Next.js Frontend]
        GRAPH[Cytoscape.js Graph]
        TABLE[Variant Table]
        BROWSER[IGV Genome Browser]
    end

    FASTQ --> QC
    FASTA --> QC
    BAM --> QC
    QC --> ALIGN
    ALIGN --> SORT
    SORT --> VAR
    VAR --> VCF
    
    VCF --> NEO4J
    VCF --> POSTGRES
    FASTQ --> MINIO
    FASTA --> MINIO
    BAM --> MINIO

    NEO4J --> GA
    GA --> LLM
    VCF --> VA
    VA --> LLM
    LLM --> RA
    
    FASTAPI --> POSTGRES
    FASTAPI --> NEO4J
    FASTAPI --> MINIO
    FASTAPI --> LLM
    
    NEXT --> FASTAPI
    GRAPH --> NEO4J
    TABLE --> FASTAPI
```

## 🔄 Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Pipeline
    participant Neo4j
    participant LLM

    User->>Frontend: Upload Genome File
    Frontend->>API: POST /analysis/upload
    API->>Pipeline: Store file
    Pipeline->>API: File stored
    
    User->>Frontend: Run Analysis
    Frontend->>API: POST /analysis/run
    API->>Pipeline: Execute pipeline
    Pipeline->>API: VCF results
    
    API->>Neo4j: Store variants
    User->>Frontend: View Graph
    Frontend->>API: GET /graph/genes/{gene}
    API->>Neo4j: Query graph
    Neo4j->>Frontend: Graph data
    
    User->>Frontend: AI Analysis
    Frontend->>API: POST /agents/analyze
    API->>Neo4j: Get context
    API->>LLM: Explain mutation
    LLM->>Frontend: Analysis result
    
    User->>Frontend: Generate Report
    Frontend->>API: POST /agents/report
    API->>LLM: Generate report
    LLM->>Frontend: Scientific report
```

## 📁 Project Structure

```
AI-Genomics-Lab/
├── api/                    # FastAPI backend
│   ├── main.py            # API endpoints (550 lines)
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # API container
├── agents/                # AI Agent System
│   └── __init__.py       # Multi-agent implementation (12,858 bytes)
├── services/              # Core services
│   ├── llm_client.py     # OpenRouter client
│   ├── neo4j_service.py  # Neo4j client
│   ├── bio_pipeline_client.py  # Pipeline client
│   └── cache_service.py  # Cache service
├── bio-pipeline/         # Bioinformatics pipeline
│   ├── Dockerfile        # Pipeline container
│   └── scripts/          # Pipeline scripts
│       └── pipeline.sh   # BWA, SAMtools, bcftools pipeline
├── graph/                # Graph database
│   └── schema.cypher     # Neo4j schema
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   │   ├── page.tsx       # Main dashboard
│   │   │   ├── layout.tsx     # Layout
│   │   │   └── globals.css    # Styles
│   │   └── components/   # React components
│   │       ├── GraphView.tsx    # Cytoscape.js visualization
│   │       ├── VariantTable.tsx # Variant table with filters
│   │       └── GenomeBrowser.tsx # IGV genome browser
│   └── package.json
├── docker/               # Docker configuration
│   └── docker-compose.yml
├── scripts/             # Data ingestion scripts
│   ├── ingest_sample_data.py
│   └── ingest_clinvar_data.py
└── README.md
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | FastAPI (Python 3.11+) |
| **Database** | PostgreSQL 15, Neo4j 5.14 |
| **Storage** | MinIO |
| **AI/LLM** | OpenRouter, LangGraph |
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Visualization** | Cytoscape.js, IGV.js, Recharts |
| **Bioinformatics** | BWA, SAMtools, bcftools, GATK |

## 🌐 Services and Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js UI |
| API | 8000 | FastAPI backend |
| Neo4j | 7474/7687 | Graph database |
| PostgreSQL | 5432 | Relational database |
| MinIO | 9000/9001 | Object storage |

## 📊 Data in Neo4j

### Loaded Nodes

| Type | Count | Examples |
|------|-------|----------|
| **Genes** | 6 | BRCA1, BRCA2, TP53, EGFR, KRAS, PIK3CA |
| **Mutations** | 6 | c.68_69delAG, c.5266dupC, R273H, L858R, G12D, E545K |
| **Diseases** | 5 | Breast Cancer, Ovarian Cancer, Li-Fraumeni, Lung Cancer, Colon Cancer |

### Relationships

```
(Gene)-[:HAS_MUTATION]->(Mutation)
(Mutation)-[:CAUSES]->(Disease)
(Gene)-[:INTERACTS_WITH]->(Gene)
```

## 🎨 Frontend Components

### GraphView
Interactive knowledge graph visualization using Cytoscape.js:
- Nodes: Genes (blue), Mutations (red), Diseases (green)
- Relationships: HAS_MUTATION, CAUSES, INTERACTS_WITH
- Interactive: click to select, zoom, pan

### VariantTable
Variant table with:
- Search by gene or position
- Filters by type (SNP, Indel, Structural)
- Pathogenicity classification (pathogenic, likely_pathogenic, uncertain, likely_benign, benign)
- Data export

### GenomeBrowser
IGV.js integration:
- Chromosomal locus navigation
- Quick navigation: BRCA1, TP53, EGFR, KRAS
- hg38 support

## 📡 API Endpoints

### Health
- `GET /` - API information
- `GET /health` - Health status

### Analysis
- `POST /analysis/upload` - Upload genome file
- `POST /analysis/run` - Run pipeline
- `GET /analysis/status` - Pipeline status

### Graph
- `GET /graph/genes/{gene}` - Gene information
- `GET /graph/mutations/{mutation}` - Mutation information
- `GET /graph/diseases/{disease}` - Disease information
- `GET /graph/search` - Search graph
- `GET /graph/statistics` - Graph statistics

### Agents
- `POST /agents/analyze` - Analyze variant
- `POST /agents/report` - Generate report
- `POST /agents/complete-analysis` - Complete analysis

### LLM
- `POST /llm/explain` - Explain mutation
- `POST /llm/generate` - Text generation

## 🚦 Getting Started

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 20+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rendergraf/AI-Genomics-Lab.git
cd AI-Genomics-Lab
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Start services:
```bash
cd docker
docker-compose up -d
```

4. Wait for services to be ready (about 30 seconds)

5. Verify services are running:
```bash
docker ps
curl http://localhost:8000/health
```

### Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **API Docs (Swagger)** | http://localhost:8000/docs | - |
| **Neo4j Browser** | http://localhost:7474 | neo4j / genomics |
| **MinIO Console** | http://localhost:9001 | genomics / genomics |
| **PostgreSQL** | localhost:5432 | genomics / genomics / genomics |

### Quick Test

```bash
# Check API health
curl http://localhost:8000/health
# Response: {"status":"healthy","api":"ok","database":"ok","graph":"ok","storage":"ok"}

# Check available samples
curl http://localhost:8000/analysis/status
```

### Stopping Services

```bash
cd docker
docker-compose down
```

### Pipeline Data

Place your genome files in the appropriate directories:

```bash
# FASTQ files (input)
mkdir -p datasets/fastq
# Place .fastq or .fastq.gz files here

# Reference genome (supports .fa or .fa.gz)
mkdir -p datasets/reference_genome
# Place Homo_sapiens.GRCh38.dna_sm.toplevel.fa.gz here

# Output directories (auto-created)
datasets/bam      # Aligned BAM files
datasets/vcf      # Variant call files
datasets/logs    # Pipeline logs
datasets/annotations  # Annotation files (e.g., clinvar.vcf)
```

### Development

#### API
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🧬 Bioinformatics Pipeline

### Pipeline Overview

The bioinformatics pipeline processes FASTQ files through the following steps:

```
FASTQ → BWA-MEM → SAM → BAM → sorted BAM → indexed BAM → bcftools mpileup → VCF → filtered VCF → annotated VCF
```

### Tools Used

| Tool | Purpose |
|------|---------|
| BWA-MEM | Sequence alignment |
| SAMtools | SAM/BAM processing and indexing |
| bcftools | Variant calling and filtering |
| GATK | Genome Analysis Toolkit (optional) |

### Pipeline Features

- **Streaming**: Uses pipes to avoid writing intermediate SAM files (saves disk space)
- **Parallel processing**: Uses 4 threads for BWA and samtools
- **Compressed reference**: Supports `.fa.gz` - automatically decompresses on first run
- **Smart indexing**: Only reindexes if indices don't exist
- **Detailed logging**: Each step logs to `/datasets/logs/{sample}_{tool}.log`

### Reference Genome

The pipeline supports both compressed and uncompressed reference genomes:

```bash
# Place in datasets/reference_genome/
Homo_sapiens.GRCh38.dna_sm.toplevel.fa.gz  # Recommended (3GB vs 60GB)
# or
Homo_sapiens.GRCh38.dna_sm.toplevel.fa
```

On first run, the compressed file will be decompressed automatically.

### Running Pipeline

```bash
# Via API
curl -X POST http://localhost:8000/analysis/run -H "Content-Type: application/json" \
  -d '{"sample_id": "sample_001"}'

# Check status
curl http://localhost:8000/analysis/status
```

### Pipeline Environment Variables

```env
REFERENCE_GENOME_GZ=/datasets/reference_genome/Homo_sapiens.GRCh38.dna_sm.toplevel.fa.gz
REFERENCE_GENOME=/datasets/reference_genome/Homo_sapiens.GRCh38.dna_sm.toplevel.fa
INPUT_DIR=/datasets/fastq
OUTPUT_DIR=/datasets/bam
VCF_OUTPUT_DIR=/datasets/vcf
LOGS_DIR=/datasets/logs
ANNOTATION_DIR=/datasets/annotations
```

### VariantAgent
Analyzes specific variants by querying the knowledge graph and generating clinical interpretations.

### GraphAgent
Performs queries to Neo4j to retrieve information about genes, mutations, and diseases.

### LiteratureAgent
Retrieves and analyzes relevant scientific literature for detected variants.

### ReportAgent
Generates complete scientific reports including executive summary, methodology, variant analysis, and clinical interpretation.

### AnalysisOrchestrator
Orchestrator that coordinates all agents for complete analysis.

## 📈 API Usage

### Example: Variant Analysis

```python
import requests

# Analyze variant
response = requests.post(
    "http://localhost:8000/agents/analyze",
    json={"variant_id": "R273H"}
)
print(response.json())

# Generate report
response = requests.post(
    "http://localhost:8000/agents/report",
    json={
        "sample_id": "sample_001",
        "variants": ["BRCA1:c.68_69delAG", "TP53:R273H"]
    }
)
print(response.json())
```

## 🤖 Agent System

### VariantAgent
Analyzes specific variants by querying the knowledge graph and generating clinical interpretations.

### GraphAgent
Performs queries to Neo4j to retrieve information about genes, mutations, and diseases.

### LiteratureAgent
Retrieves and analyzes relevant scientific literature for detected variants.

### ReportAgent
Generates complete scientific reports including executive summary, methodology, variant analysis, and clinical interpretation.

### AnalysisOrchestrator
Orchestrator that coordinates all agents for complete analysis.

## 📝 Environment Variables Configuration

```env
# Database
DATABASE_URL=postgresql://genomics:genomics@postgres:5432/genomics

# Neo4j
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=genomics

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=genomics
MINIO_SECRET_KEY=genomics

# LLM
OPENROUTER_API_KEY=your_api_key_here

# Pipeline (optional)
REFERENCE_GENOME=/datasets/reference_genome/Homo_sapiens.GRCh38.dna_sm.toplevel.fa
REFERENCE_GENOME_GZ=/datasets/reference_genome/Homo_sapiens.GRCh38.dna_sm.toplevel.fa.gz
```

## 🔒 Security

- Genomic data is sensitive
- Do not store API keys in code
- Use environment variables
- Consider GDPR principles

## 🧪 Testing

Critical modules include tests:
- Bioinformatics pipeline
- Variant parser
- Graph ingestion

## 🤝 Contributions

Contributions are welcome!

## 📄 License

MIT License - See LICENSE for details.

---

Author: Xavier Araque  
Email: xavieraraque@gmail.com  
GitHub: https://github.com/rendergraf/AI-Genomics-Lab  
Version: 0.1  
Location: Spain  
Date: March 2026  

---

*Generated by AI Genomics Lab*
