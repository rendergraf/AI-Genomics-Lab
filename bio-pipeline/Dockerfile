FROM ubuntu:22.04

LABEL maintainer="AI Genomics Lab"
LABEL description="Bioinformatics pipeline for genomic analysis"

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and bioinformatics tools
RUN apt-get update && apt-get install -y \
    # Build tools
    build-essential \
    wget \
    curl \
    git \
    # Python and pip
    python3 \
    python3-pip \
    python3-dev \
    # Bioinformatics tools
    bwa \
    samtools \
    bcftools \
    bedtools \
    # Other utilities
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/*

# Install GATK (Genome Analysis Toolkit)
RUN mkdir -p /opt/gatk && \
    cd /opt/gatk && \
    wget -q https://github.com/broadinstitute/gatk/releases/download/4.5.0.0/gatk-4.5.0.0.zip && \
    unzip gatk-4.5.0.0.zip && \
    rm gatk-4.5.0.0.zip

# Add GATK to PATH
ENV PATH="/opt/gatk/gatk-4.5.0.0:${PATH}"

# Install Python bioinformatics libraries
RUN pip3 install --no-cache-dir \
    biopython \
    pysam \
    cython \
    numpy

# Create working directories
RUN mkdir -p /pipeline /datasets /reference /output

WORKDIR /pipeline

# Copy pipeline scripts
COPY scripts/ /pipeline/scripts/
RUN chmod +x /pipeline/scripts/*.sh

# Default command
CMD ["/bin/bash"]
