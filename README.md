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

## 📋 Descripción

## 🧬 AI Genomics Research Platform

## Bioinformatics system powered by AI to detect genetic diseases from a patient’s DNA using:

- LLMs
- Graph Database
- Deep learning models for sequences
- Scientific agents
- Bioinformatics pipelines

## 🎯 Estado del Proyecto

**Estado: ✅ COMPLETADO (100%)**

El proyecto ha alcanzado todas las fases de desarrollo planificadas:

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 1 | Infraestructura Docker | ✅ |
| Fase 2 | Pipeline Bioinformático | ✅ |
| Fase 3 | Base de Datos Grafo | ✅ |
| Fase 4 | Integración LLM | ✅ |
| Fase 5 | Sistema de Agentes | ✅ |
| Fase 6 | Frontend | ✅ |

## 🚀 Características

- **Pipeline Bioinformático**: FASTQ → BAM → VCF con BWA, SAMtools, bcftools y GATK
- **Grafo de Conocimiento**: Neo4j con nodos Gene, Mutation, Disease, Protein, Drug y Paper
- **Integración LLM**: OpenRouter API para explicación de mutaciones y generación de informes
- **Agentes IA**: Sistema multi-agente (VariantAgent, GraphAgent, LiteratureAgent, ReportAgent)
- **UI Moderna**: Next.js con visualización Cytoscape.js e IGV Genome Browser
- **Deep Learning**: Modelos para análisis de secuencias genéticas
- **Deep Learning**: Modelos para análisis de secuencias genéticas

## 🏗️ Arquitectura

```mermaid
graph TB
    subgraph Input["📥 Entrada de Datos"]
        FASTQ[FASTQ Files]
        FASTA[FASTA Files]
        BAM[BAM Files]
    end

    subgraph Pipeline["🧬 Pipeline Bioinformático"]
        QC[Quality Control]
        ALIGN[Alignment BWA-MEM]
        SORT[Sorting SAMtools]
        VAR[Variant Calling bcftools]
        VCF[VCF Output]
    end

    subgraph Storage["💾 Almacenamiento"]
        MINIO[MinIO Object Store]
        POSTGRES[PostgreSQL]
        NEO4J[Neo4j Graph DB]
    end

    subgraph AI["🤖 Capa de IA"]
        VA[Variant Agent]
        GA[Graph Agent]
        LA[Literature Agent]
        RA[Report Agent]
        LLM[LLM OpenRouter]
    end

    subgraph API["⚡ API Layer"]
        FASTAPI[FastAPI Backend]
    end

    subgraph UI["🎨 Interfaz de Usuario"]
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

## 🔄 Flujo de Datos

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

## 📁 Estructura del Proyecto

```
AI-Genomics-Lab/
├── api/                    # FastAPI backend
│   ├── main.py            # API endpoints (550 líneas)
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # API container
├── agents/                # Sistema de Agentes IA
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

| Categoría | Tecnología |
|-----------|------------|
| **Backend** | FastAPI (Python 3.11+) |
| **Base de Datos** | PostgreSQL 15, Neo4j 5.14 |
| **Almacenamiento** | MinIO |
| **IA/LLM** | OpenRouter, LangGraph |
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Visualización** | Cytoscape.js, IGV.js, Recharts |
| **Bioinformática** | BWA, SAMtools, bcftools, GATK |

## 🌐 Servicios y Puertos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Frontend | 3000 | Next.js UI |
| API | 8000 | FastAPI backend |
| Neo4j | 7474/7687 | Graph database |
| PostgreSQL | 5432 | Relational database |
| MinIO | 9000/9001 | Object storage |

## 📊 Datos en Neo4j

### Nodos Cargados

| Tipo | Cantidad | Ejemplos |
|------|----------|----------|
| **Genes** | 6 | BRCA1, BRCA2, TP53, EGFR, KRAS, PIK3CA |
| **Mutaciones** | 6 | c.68_69delAG, c.5266dupC, R273H, L858R, G12D, E545K |
| **Enfermedades** | 5 | Breast Cancer, Ovarian Cancer, Li-Fraumeni, Lung Cancer, Colon Cancer |

### Relaciones

```
(Gene)-[:HAS_MUTATION]->(Mutation)
(Mutation)-[:CAUSES]->(Disease)
(Gene)-[:INTERACTS_WITH]->(Gene)
```

## 🎨 Componentes del Frontend

### GraphView
Visualización interactiva del grafo de conocimiento usando Cytoscape.js:
- Nodos: Genes (azul), Mutaciones (rojo), Enfermedades (verde)
- Relaciones: HAS_MUTATION, CAUSES, INTERACTS_WITH
- Interactivo: click para seleccionar, zoom, pan

### VariantTable
Tabla de variantes con:
- Búsqueda por gen o posición
- Filtros por tipo (SNP, Indel, Structural)
- Clasificación de patogenicidad (pathogenic, likely_pathogenic, uncertain, likely_benign, benign)
- Exportación de datos

### GenomeBrowser
Integración con IGV.js:
- Navegación por locus cromosómico
- Quick navigation: BRCA1, TP53, EGFR, KRAS
- Soporte para hg38

## 📡 Endpoints de la API

### Health
- `GET /` - Información de la API
- `GET /health` - Estado de salud

### Analysis
- `POST /analysis/upload` - Subir archivo genómico
- `POST /analysis/run` - Ejecutar pipeline
- `GET /analysis/status` - Estado del pipeline

### Graph
- `GET /graph/genes/{gene}` - Información de gen
- `GET /graph/mutations/{mutation}` - Información de mutación
- `GET /graph/diseases/{disease}` - Información de enfermedad
- `GET /graph/search` - Buscar en el grafo
- `GET /graph/statistics` - Estadísticas del grafo

### Agents
- `POST /agents/analyze` - Analizar variante
- `POST /agents/report` - Generar informe
- `POST /agents/complete-analysis` - Análisis completo

### LLM
- `POST /llm/explain` - Explicar mutación
- `POST /llm/generate` - Generación de texto

## 🚦 Primeros Pasos

### Prerrequisitos

- Docker & Docker Compose
- Python 3.11+
- Node.js 20+

### Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/rendergraf/AI-Genomics-Lab.git
cd AI-Genomics-Lab
```

2. Configurar entorno:
```bash
cp .env.example .env
# Editar .env con tus API keys
```

3. Iniciar servicios:
```bash
cd docker
docker-compose up -d
```

4. Acceder a la aplicación:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - Neo4j: http://localhost:7474
   - API Docs: http://localhost:8000/docs

### Desarrollo

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

## 🤖 Sistema de Agentes

### VariantAgent
Analiza variantes específicas consultando el grafo de conocimiento y generando interpretaciones clínicas.

### GraphAgent
Realiza consultas al grafo Neo4j para recuperar información sobre genes, mutaciones y enfermedades.

### LiteratureAgent
Recupera y analiza literatura científica relevante para las variantes detectadas.

### ReportAgent
Genera informes científicos completos incluyendo resumen ejecutivo, metodología, análisis de variantes e interpretación clínica.

### AnalysisOrchestrator
Orquestador que coordina todos los agentes para análisis completos.

## 📈 Uso de la API

### Ejemplo: Análisis de Variante

```python
import requests

# Analizar variante
response = requests.post(
    "http://localhost:8000/agents/analyze",
    json={"variant_id": "R273H"}
)
print(response.json())

# Generar informe
response = requests.post(
    "http://localhost:8000/agents/report",
    json={
        "sample_id": "sample_001",
        "variants": ["BRCA1:c.68_69delAG", "TP53:R273H"]
    }
)
print(response.json())
```

## 📝 Configuración de Variables de Entorno

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

## 🔒 Seguridad

- Los datos genómicos son sensibles
- No almacenar claves API en código
- Usar variables de entorno
- Considerar principios GDPR

## 🧪 Testing

Los módulos críticos incluyen tests:
- Pipeline bioinformático
- Parser de variantes
- Ingestión del grafo

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!

## 📄 Licencia

MIT License - Ver LICENSE para detalles.

---

Author: Xavier Araque  
Email: xavieraraque@gmail.com  
GitHub: https://github.com/rendergraf/AI-Genomics-Lab  
Version: 0.1  
Location: Spain  
Date: March 2026  

---

*Generated by AI Genomics Lab*
