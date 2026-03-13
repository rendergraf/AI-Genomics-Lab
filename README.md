---
project: AI Genomics Lab
author: Xavier Araque
email: xavieraraque@gmail.com
github: https://github.com/rendergraf/AI-Genomics-Lab
version: 0.1
country: Spain
date: March 2026
license: MIT
---

# 🧬 AI Genomics Lab

AI-powered bioinformatics research platform for genomic analysis and disease detection.

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

4. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - Neo4j: http://localhost:7474
   - API Docs: http://localhost:8000/docs

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
