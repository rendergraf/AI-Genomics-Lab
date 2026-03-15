FROM ubuntu:22.04

LABEL maintainer="AI Genomics Lab"
LABEL description="Bioinformatics pipeline for genomic analysis (ADVANCED OPTIMIZED)"

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and bioinformatics tools
RUN apt-get update && apt-get install -y \
    # Build tools
    build-essential \
    cmake \
    autoconf \
    automake \
    libtool \
    pkg-config \
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
    # Compression tools
    gzip \
    # Parallel processing
    parallel \
    # Other utilities
    unzip \
    zip \
    libbz2-dev \
    liblzma-dev \
    libcurl4-gnutls-dev \
    libssl-dev \
    libisal-dev \
    && rm -rf /var/lib/apt/lists/*

# Install htslib 1.19 with submodules (for htscodecs compression)
RUN cd /tmp && \
    git clone --depth 1 --branch 1.19 --recurse-submodules https://github.com/samtools/htslib.git && \
    cd htslib && \
    autoreconf -i && \
    ./configure --enable-bz2 --enable-lzma --enable-libcurl && \
    make -j$(nproc) && \
    make install && \
    ldconfig && \
    cd / && rm -rf /tmp/htslib

# Install vmtouch (RAM cache preloading)
RUN cd /tmp && \
    git clone https://github.com/hoytech/vmtouch.git && \
    cd vmtouch && \
    make && \
    cp vmtouch /usr/local/bin/ && \
    cd / && rm -rf /tmp/vmtouch

# Install strobealign (modern aligner, 5-8x faster than BWA-MEM)
RUN cd /tmp && \
    git clone --depth 1 https://github.com/ksahlin/strobealign.git && \
    cd strobealign && \
    mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc) && \
    make install && \
    cd / && rm -rf /tmp/strobealign

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
