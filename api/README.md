# 🧬 AI Genomics Lab - Genome Indexing API

FastAPI-based service for downloading and indexing reference genomes for bioinformatics analysis.

## Overview

The Genome Indexing API is a streamlined service that provides a single endpoint to download and index reference genomes from public sources (Ensembl/UCSC). It uses Nextflow workflows to create optimized genome indices for high-performance bioinformatics pipelines.

## Features

- **Multi-genome support**: hg38, hg38-test (chromosome 21), and hg19
- **Complete indexing**: BGZF compression, FASTA index, BGZF index, Strobealign index
- **Real-time monitoring**: Server-Sent Events (SSE) streaming with stage detection and heartbeat events
- **Persistent state management**: PostgreSQL-backed job tracking with status history
- **Genome status tracking**: API endpoints to check indexing status for all genomes
- **Index management**: Delete index files and re-index genomes as needed
- **Containerized execution**: Runs in Docker with isolated environments
- **Production-ready**: Health checks, CORS support, OpenAPI documentation, timeout handling

## Installation

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for development)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/rendergraf/AI-Genomics-Lab.git
cd AI-Genomics-Lab

# Start all services
cd docker
docker-compose up -d

# Wait for services to be ready (approximately 30 seconds)
curl http://localhost:8000/health
```

## API Endpoints

### GET `/`
**Root endpoint** - Welcome message with API information

**Response**:
```json
{
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
```

### GET `/health`
**Health check** - Verify all services are running

**Response**:
```json
{
  "status": "healthy",
  "api": "ok",
  "database": "ok",
  "graph": "ok",
  "storage": "ok"
}
```

### POST `/genome/index`
**Genome indexing** - Download and index a reference genome

**Parameters** (form data):
- `genome_id` (required): Genome identifier (`hg38`, `hg38-test`, or `hg19`)

**Response**: Streaming Server-Sent Events (SSE) with real-time progress logs

**Features**:
- **Persistent job tracking**: Each indexing job is stored in PostgreSQL with status (`pending`, `running`, `completed`, `failed`)
- **Real-time stage detection**: Automatically detects pipeline stages (downloading, creating_fai_index, creating_gzi_index, creating_sti_index, completed)
- **Heartbeat events**: Keep-alive messages every 2 seconds to maintain SSE connection
- **Timeout handling**: 300-second initial connection timeout to accommodate Nextflow startup

**Example**:
```bash
curl -X POST http://localhost:8000/genome/index \
  -F "genome_id=hg38"
```

### GET `/genome/indexed`
**Get indexing status** - Check indexing status for all available genomes

**Response**: JSON object with indexing status for each genome

**Example**:
```bash
curl http://localhost:8000/genome/indexed
```

**Response Example**:
```json
{
  "hg38": {
    "genome_id": "hg38",
    "indexed": true,
    "files": {
      "bgzip_fasta": true,
      "fai_index": true,
      "gzi_index": true,
      "sti_index": true
    },
    "paths": {
      "bgzip_fasta": "/datasets/reference_genome/hg38.fa.gz",
      "fai_index": "/datasets/reference_genome/hg38.fa.gz.fai",
      "gzi_index": "/datasets/reference_genome/hg38.fa.gz.gzi",
      "sti_index": "/datasets/reference_genome/hg38.fa.gz.sti"
    }
  }
}
```

### GET `/genome/status/{genome_id}`
**Get detailed indexing status** - Check detailed indexing status for a specific genome

**Parameters** (path):
- `genome_id` (required): Genome identifier (`hg38`, `hg38-test`, or `hg19`)

**Example**:
```bash
curl http://localhost:8000/genome/status/hg38
```

### DELETE `/genome/index/{genome_id}`
**Delete genome index** - Remove genome index files (bgzip, fai, gzi, sti)

**Parameters** (path):
- `genome_id` (required): Genome identifier (`hg38`, `hg38-test`, or `hg19`)

**Example**:
```bash
curl -X DELETE http://localhost:8000/genome/index/hg38
```

**Response**:
```json
{
  "genome_id": "hg38",
  "deleted": ["hg38.fa.gz", "hg38.fa.gz.fai", "hg38.fa.gz.gzi", "hg38.fa.gz.sti"],
  "errors": [],
  "success": true
}
```

### GET `/genome/jobs`
**List indexing jobs** - Get all genome indexing jobs from database

**Example**:
```bash
curl http://localhost:8000/genome/jobs
```

### GET `/genome/job/{job_id}`
**Get job details** - Get specific genome indexing job status and details

**Parameters** (path):
- `job_id` (required): Job ID (integer)

**Example**:
```bash
curl http://localhost:8000/genome/job/1
```

## Genome Details

| Genome ID | Description | Size | Source |
|-----------|-------------|------|--------|
| `hg38` | Human GRCh38 primary assembly | ~841 MB | Ensembl |
| `hg38-test` | Human GRCh38 chromosome 21 (test) | ~11 MB | Ensembl |
| `hg19` | Human GRCh37/hg19 | ~890 MB | UCSC |

## Generated Files

After successful indexing, the following files are created in `/datasets/reference_genome/`:

```
/datasets/reference_genome/
├── {genome_id}.fa.gz          # BGZF compressed genome
├── {genome_id}.fa.gz.fai      # FASTA index (samtools faidx)
├── {genome_id}.fa.gz.gzi      # BGZF index (random access)
└── {genome_id}.fa.gz.sti      # Strobealign index (fast alignment)
```

## Usage Examples

### Index hg38 genome
```bash
curl -X POST http://localhost:8000/genome/index \
  -F "genome_id=hg38"
```

### Stream logs with curl
```bash
# The API returns Server-Sent Events (SSE)
curl -N -X POST http://localhost:8000/genome/index \
  -F "genome_id=hg38-test"
```

### Using Python requests
```python
import requests

response = requests.post(
    "http://localhost:8000/genome/index",
    data={"genome_id": "hg38"},
    stream=True
)

for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

## Architecture

```mermaid
flowchart TD
    Client[Client Application] --> API[FastAPI Server]
    API --> Nextflow[Nextflow Runner]
    Nextflow --> Docker[Docker Container]
    Docker --> Pipeline[Genome Indexing Pipeline]
    Pipeline --> Output[Indexed Genome Files]
    
    subgraph "Pipeline Steps"
        Download[Download from Ensembl/UCSC]
        BGZF[BGZF Compression]
        FAI[FASTA Index]
        STI[Strobealign Index]
    end
    
    Download --> BGZF --> FAI --> STI --> Output
    
    %% State Management
    API --> PostgreSQL[(PostgreSQL)]
    PostgreSQL --> State[Job State Tracking]
    State --> Client
    
    %% Real-time Events
    Pipeline --> Events[Stage Detection]
    Events --> SSE[Server-Sent Events]
    SSE --> Client
```

## State Management & Real-time Monitoring

The API implements advanced state management and real-time monitoring capabilities:

### Persistent Job Tracking
- **PostgreSQL Integration**: All indexing jobs are stored in the `pipeline_jobs` table
- **Job States**: `pending`, `running`, `completed`, `failed`
- **Audit Trail**: Timestamps for job creation, start, and completion
- **Parameter Storage**: JSON serialization of pipeline parameters for reproducibility

### Real-time Progress Monitoring
- **Server-Sent Events (SSE)**: Stream real-time logs to clients
- **Stage Detection**: Automatic detection of pipeline stages from log messages:
  - `downloading`: Genome download from Ensembl/UCSC
  - `creating_fai_index`: FASTA index creation with samtools
  - `creating_gzi_index`: BGZF index creation
  - `creating_sti_index`: Strobealign index generation
  - `completed`: Pipeline completion
- **Heartbeat Events**: Keep-alive messages every 2 seconds to maintain SSE connections
- **Timeout Handling**: 300-second initial timeout for Nextflow startup

### Genome Status Management
- **File System Verification**: API endpoints check for actual index file existence
- **Multi-file Validation**: Verify all required index files (bgzip, fai, gzi, sti)
- **Delete Operations**: Safe deletion of index files with error reporting
- **Re-index Support**: Overwrite existing indices with new versions

### Event Flow
1. Client initiates indexing via `POST /genome/index`
2. API creates job record in PostgreSQL with `pending` status
3. Nextflow pipeline starts in Docker container
4. Real-time logs are streamed via SSE with stage detection
5. Job status updates to `running` then `completed`/`failed`
6. Client receives structured events (job, stage, complete, error)
7. Genome status automatically updated in file system

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://genomics:genomics@postgres:5432/genomics` |
| `NEO4J_URI` | Neo4j connection URI | `bolt://neo4j:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `genomics` |
| `MINIO_ENDPOINT` | MinIO storage endpoint | `minio:9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `genomics` |
| `MINIO_SECRET_KEY` | MinIO secret key | `genomics` |
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM | (required) |

### Docker Services

The API depends on several Docker services defined in `docker/docker-compose.yml`:

| Service | Port | Purpose |
|---------|------|---------|
| `api` | 8000 | FastAPI application |
| `postgres` | 5432 | PostgreSQL database |
| `neo4j` | 7474/7687 | Neo4j graph database |
| `minio` | 9000/9001 | MinIO object storage |
| `bio-pipeline` | - | Bioinformatics pipeline container |
| `frontend` | 3000 | Next.js frontend |

## Development

### Running the API locally
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI schema: http://localhost:8000/openapi.json

### Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test genome indexing (small test genome)
curl -X POST http://localhost:8000/genome/index \
  -F "genome_id=hg38-test"
```

## Monitoring

### Logs
```bash
# View API logs
docker logs ai-genomics-api -f

# View pipeline logs
docker logs ai-genomics-bio -f
```

### Metrics
The API includes built-in health checks and status monitoring. Use the `/health` endpoint to verify all services are running correctly.

## Troubleshooting

### Common Issues

1. **Docker containers not starting**
   ```bash
   cd docker
   docker-compose down
   docker-compose up -d
   ```

2. **Genome indexing fails**
   - Check internet connectivity for downloading genomes
   - Verify Docker has sufficient resources (CPU, memory)
   - Check logs: `docker logs ai-genomics-bio`

3. **API not responding**
   - Verify the API container is running: `docker ps | grep ai-genomics-api`
   - Check port 8000 is not in use

### Log Locations
- API logs: Docker container `ai-genomics-api`
- Pipeline logs: Docker container `ai-genomics-bio`
- Genome files: `/datasets/reference_genome/`
- Nextflow work directories: `/nextflow-work/`

## License

MIT License - See [LICENSE](../LICENSE) for details.

## Support

- GitHub Issues: https://github.com/rendergraf/AI-Genomics-Lab/issues
- Email: xavieraraque@gmail.com
- Author: Xavier Araque