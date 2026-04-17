FROM python:3.11-slim

# Install docker CLI for docker exec commands and Java for Nextflow
RUN apt-get update && apt-get install -y docker.io openjdk-21-jre-headless curl && rm -rf /var/lib/apt/lists/*

# Install Nextflow
RUN curl -fsSL https://get.nextflow.io | bash && \
    chmod +x nextflow && \
    mv nextflow /usr/local/bin/

WORKDIR /app

# Copy requirements first
COPY api/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY api /app
COPY services /app/services
COPY agents /app/agents

# Expose port
EXPOSE 8000

# Run application with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
