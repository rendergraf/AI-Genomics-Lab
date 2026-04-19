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

- **Secure Authentication**: JWT-based authentication with Argon2 password hashing, role-based access control (admin, analyst, researcher, viewer)
- **Genome Indexing Pipeline**: Nextflow-based genome indexing pipeline creating .fai, .gzi, and .sti indexes for alignment
- **Reference Genome Management**: Web interface to manage genome references with URL download and MinIO synchronization
- **Bioinformatics Pipeline**: FASTQ → BAM → VCF with BWA, SAMtools, bcftools, and GATK
- **Knowledge Graph**: Neo4j with Gene, Mutation, Disease, Protein, Drug, and Paper nodes
- **LLM Integration**: OpenRouter API for mutation explanation and report generation
- **AI Agents**: Multi-agent system (VariantAgent, GraphAgent, LiteratureAgent, ReportAgent)
- **Modern UI**: Next.js dashboard with multiple sections (Alignment, Storage, Analysis, Samples, Reference Genomes)
- **Settings Management**: Comprehensive platform configuration with permission-based access control
- **MinIO Storage Integration**: Object storage for genome files with sync capabilities between local and cloud storage
- **Genome Sync Service**: Automated synchronization of genome files between local storage and MinIO buckets
- **Real-time Job Monitoring**: Live streaming of Nextflow pipeline logs with stage tracking and progress updates

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Input["📥 Data Input"]
        FASTQ[FASTQ Files]
        FASTA[FASTA Files]
        BAM[BAM Files]
        GENOME_URL[Genome URLs]
    end

    subgraph Indexing["🧬 Genome Indexing Pipeline"]
        NXF[Nextflow Runner]
        DOWNLOAD[Download Genome]
        FAI[Create .fai Index]
        GZI[Create .gzi Index]
        STI[Create .sti Index]
        UPLOAD[Upload to MinIO]
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
        ALIGN_UI[Align Genome]
        STORAGE_UI[Storage Manager]
        REF_UI[Reference Genomes]
        ANALYSIS_UI[Analysis Dashboard]
        GRAPH[Cytoscape.js Graph]
        BROWSER[IGV Genome Browser]
    end

    GENOME_URL --> NXF
    NXF --> DOWNLOAD
    DOWNLOAD --> FAI
    FAI --> GZI
    GZI --> STI
    STI --> UPLOAD
    UPLOAD --> MINIO

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
    MINIO --> ALIGN

    NEO4J --> GA
    GA --> LLM
    VCF --> VA
    VA --> LLM
    LLM --> RA
    
    FASTAPI --> POSTGRES
    FASTAPI --> NEO4J
    FASTAPI --> MINIO
    FASTAPI --> LLM
    FASTAPI --> NXF
    
    NEXT --> FASTAPI
    ALIGN_UI --> FASTAPI
    STORAGE_UI --> MINIO
    REF_UI --> FASTAPI
    ANALYSIS_UI --> FASTAPI
    GRAPH --> NEO4J
```

## 🔄 Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Nextflow
    participant MinIO
    participant Pipeline
    participant Neo4j
    participant LLM

    Note over User,LLM: Genome Indexing Workflow
    User->>Frontend: Add Genome Reference
    Frontend->>API: POST /api/settings/genome-references
    API->>Frontend: Reference saved
    
    User->>Frontend: Index Genome
    Frontend->>API: POST /genome/index
    API->>Nextflow: Execute Nextflow pipeline
    Nextflow->>Nextflow: Download genome
    Nextflow->>Nextflow: Create indexes (.fai, .gzi, .sti)
    Nextflow->>MinIO: Upload indexes
    Nextflow->>API: Streaming logs
    API->>Frontend: Real-time updates
    Nextflow->>API: Job completion
    API->>Frontend: Indexing complete
    
    Note over User,LLM: Storage Management
    User->>Frontend: Sync Genomes
    Frontend->>API: POST /storage/sync/genomes
    API->>MinIO: List genomes
    MinIO->>API: Genome list
    API->>Frontend: Sync status
    
    Note over User,LLM: Analysis Pipeline
    User->>Frontend: Upload Genome File
    Frontend->>API: POST /analysis/upload
    API->>MinIO: Store file
    MinIO->>API: File stored
    
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
├── api/                    # FastAPI backend (1,747 lines)
│   ├── main.py            # API endpoints with genome indexing, storage, settings
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # API container
├── agents/                # AI Agent System
│   └── __init__.py       # Multi-agent implementation (VariantAgent, GraphAgent, etc.)
├── services/              # Core services
│   ├── auth_service.py       # JWT authentication with Argon2 hashing
│   ├── database_service.py   # PostgreSQL database with 8 tables
│   ├── minio_service.py      # MinIO object storage client
│   ├── llm_client.py         # OpenRouter client
│   ├── neo4j_service.py      # Neo4j client
│   ├── bio_pipeline_client.py  # Pipeline client
│   ├── cache_service.py      # Cache service
│   ├── nextflow_runner.py    # Nextflow pipeline execution service
│   └── genome_sync_service.py # Genome synchronization between local and MinIO
├── bio-pipeline/         # Bioinformatics pipeline with Nextflow
│   ├── Dockerfile        # Pipeline container with Nextflow, BWA, SAMtools, bcftools, Strobealign
│   ├── genome_index_correct.nf  # Main Nextflow pipeline for genome indexing
│   ├── pipeline_1_genome_prep.nf # Genome preparation pipeline
│   ├── debug_bgzip.sh    # Debug scripts
│   └── scripts/          # Pipeline scripts
│       └── pipeline.sh   # BWA, SAMtools, bcftools pipeline
├── graph/                # Graph database
│   └── schema.cypher     # Neo4j schema
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   │   ├── page.tsx           # Main dashboard with tabs
│   │   │   ├── login/             # Authentication page
│   │   │   │   └── page.tsx       # Login form
│   │   │   ├── settings/          # Settings dashboard
│   │   │   │   └── page.tsx       # Settings with 7 tabs
│   │   │   ├── layout.tsx         # Layout with navigation
│   │   │   └── globals.css        # Styles
│   │   ├── lib/                  # Utilities and API client
│   │   │   └── api.ts            # API client with JWT management
│   │   └── components/           # React components
│   │       ├── sections/          # Page sections
│   │       │   ├── AlignGenomeSection/ # Genome alignment and indexing interface
│   │       │   ├── StorageSection/   # MinIO storage management
│   │       │   ├── AnalysisSection/  # Analysis dashboard
│   │       │   ├── DashboardSection/ # Main dashboard
│   │       │   ├── ReferenceGenomesSection/ # Genome reference management
│   │       │   └── SamplesSection/   # Sample management
│   │       ├── ui/                # UI component library
│   │       │   ├── Button/        # Button component with loading states
│   │       │   ├── Card/          # Card component
│   │       │   └── ...            # Other UI components
│   │       ├── GraphView.tsx      # Cytoscape.js visualization
│   │       ├── VariantTable.tsx   # Variant table with filters
│   │       └── GenomeBrowser.tsx  # IGV genome browser
│   └── package.json
├── docker/               # Docker configuration
│   └── docker-compose.yml  # Multi-service setup with API, frontend, databases, MinIO, pipeline
├── scripts/             # Data ingestion and utility scripts
│   ├── ingest_sample_data.py
│   ├── ingest_clinvar_data.py
│   └── init_database.py # Database initialization
├── datasets/            # Genomic data storage (not in version control)
│   ├── fastq/           # FASTQ input files
│   ├── bam/             # BAM aligned files
│   ├── vcf/             # VCF variant files
│   ├── logs/            # Pipeline logs
│   ├── reference_genome/ # Reference genome files
│   └── annotations/     # Annotation files
├── pipelines/           # Pipeline definitions (placeholder)
├── nextflow             # Nextflow executable (Linux)
├── test_pipeline.sh     # Pipeline testing script
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
| **Pipeline Orchestration** | Nextflow |
| **Bioinformatics** | BWA, SAMtools, bcftools, GATK, Strobealign |

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

### Dashboard Sections

#### AlignGenomeSection
Genome alignment and indexing interface:
- Reference genome selection with indexed status badges
- Read length configuration for alignment
- Real-time Nextflow pipeline execution with live log streaming
- Stage tracking (downloading, indexing, uploading)
- Cancel indexing and delete index functionality

#### StorageSection
MinIO storage management:
- List genomes available in MinIO buckets
- Sync genomes between local storage and MinIO
- Download genomes from MinIO to local storage
- Visual status indicators for sync progress

#### AnalysisSection
Analysis dashboard with pipeline controls:
- File upload for FASTQ/BAM/VCF files
- Pipeline execution controls
- Analysis status monitoring

#### ReferenceGenomesSection
Genome reference management:
- Add/edit/delete genome references with URL, species, build
- Test genome URL connectivity
- Manage active/inactive references

#### SamplesSection
Sample management interface:
- List and manage genomic samples
- Sample metadata editing

### Visualization Components

#### GraphView
Interactive knowledge graph visualization using Cytoscape.js:
- Nodes: Genes (blue), Mutations (red), Diseases (green)
- Relationships: HAS_MUTATION, CAUSES, INTERACTS_WITH
- Interactive: click to select, zoom, pan

#### VariantTable
Variant table with:
- Search by gene or position
- Filters by type (SNP, Indel, Structural)
- Pathogenicity classification (pathogenic, likely_pathogenic, uncertain, likely_benign, benign)
- Data export

#### GenomeBrowser
IGV.js integration:
- Chromosomal locus navigation
- Quick navigation: BRCA1, TP53, EGFR, KRAS
- hg38 support

## 📡 API Endpoints

### Health
- `GET /` - API information
- `GET /health` - Health status

### Authentication
- `POST /api/auth/login` - User login with JWT token generation
- `POST /api/auth/logout` - User logout and session cleanup
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/refresh` - Refresh access token

### Settings (Authenticated)
- `GET /api/settings/genome-references` - Get genome references (admin only)
- `POST /api/settings/genome-references` - Create genome reference (admin only)
- `PUT /api/settings/genome-references/{ref_id}` - Update genome reference (admin only)
- `DELETE /api/settings/genome-references/{ref_id}` - Delete genome reference (admin only)
- `POST /api/settings/genome-references/{ref_id}/test` - Test genome reference URL (admin only)
- `GET /api/settings/pipeline` - Get pipeline settings (admin only)
- `PUT /api/settings/pipeline/{key}` - Update pipeline setting (admin only)
- `GET /api/settings/ai-providers` - Get AI provider configurations
- `POST /api/settings/ai-providers/test` - Test AI provider connection (admin only)
- `GET /api/settings/ui-preferences` - Get user UI preferences
- `PUT /api/settings/ui-preferences` - Update user UI preferences
- `GET /api/settings/audit-logs` - View audit logs (admin only)
- `GET /api/settings/system-health` - Get system health status

### Genome (Authenticated)
- `GET /genome/indexed` - Get indexing status for all genomes
- `GET /genome/status/{genome_id}` - Get indexing status for a specific genome
- `POST /genome/index` - Start genome indexing using Nextflow pipeline
- `DELETE /genome/index/{genome_id}` - Delete genome index files
- `GET /genome/jobs` - Get all genome indexing jobs
- `GET /genome/job/{job_id}` - Get genome indexing job status

### Storage (Authenticated)
- `GET /storage/genomes` - List genomes from MinIO storage
- `POST /storage/sync/genomes` - Sync local genomes to MinIO
- `GET /storage/genomes/{genome_name}/status` - Get sync status for a genome
- `POST /storage/genomes/{genome_name}/download` - Download genome from MinIO to local storage
- `GET /storage/test` - Test storage connectivity

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
| **Frontend** | http://localhost:3000 | `admin@company.com` / `admin123` |
| **API Docs (Swagger)** | http://localhost:8000/docs | (Authentication required for protected endpoints) |
| **Neo4j Browser** | http://localhost:7474 | neo4j / genomics |
| **MinIO Console** | http://localhost:9001 | genomics / genomics |
| **PostgreSQL** | localhost:5432 | genomics / genomics / genomics |

### Quick Test

```bash
# Check API health
curl http://localhost:8000/health
# Response: {"status":"healthy","api":"ok","database":"ok","graph":"ok","storage":"ok"}

# Test authentication
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123","remember_me":false}'
# Response: {"access_token":"eyJhbGciOiJ...","refresh_token":"...","token_type":"bearer","expires_in":1800}

# Test authenticated endpoint (using the token from above)
TOKEN="your_access_token_here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/auth/me
# Response: {"id":1,"email":"admin@company.com","name":"Administrator","is_active":true,"roles":["admin"]}

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

## 🧬 Genome Indexing Pipeline

### Overview
The genome indexing pipeline uses Nextflow to download reference genomes and create necessary indexes for alignment (.fai, .gzi, .sti). The pipeline runs in a Docker container and uploads results to MinIO for persistent storage.

### Nextflow Pipeline
- **Input**: Genome ID and optional URL
- **Processes**: Download, FASTA index (.fai), BGZIP index (.gzi), Strobealign index (.sti)
- **Output**: Index files uploaded to MinIO bucket
- **Real-time monitoring**: Live log streaming via Server-Sent Events (SSE)

### Index Types
- **.fai**: FASTA index for random access to sequences
- **.gzi**: BGZIP index for compressed FASTA files
- **.sti**: Strobealign index for fast read alignment

### Usage via API
```bash
# Start genome indexing
curl -X POST http://localhost:8000/genome/index \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "genome_id=hg38&read_length=150"

# Check indexing status
curl http://localhost:8000/genome/indexed

# Stream logs for a job
# (Implemented via SSE in frontend)
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

- **Authentication System**: JWT-based authentication with Argon2 password hashing (GPU/ASIC-resistant)
- **Role-Based Access Control**: Admin, analyst, researcher, viewer roles with granular permissions
- **Secure Configuration**: Environment variables for secrets, no hardcoded credentials
- **Genomic Data Protection**: Sensitive genomic data requires proper access controls
- **API Security**: CORS configuration, rate limiting, SQL injection prevention
- **Audit Logging**: Comprehensive logging of authentication events and configuration changes
- **GDPR Compliance**: Consider data privacy regulations for genomic information

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
Date: April 2026  

---

*Generated by AI Genomics Lab*
