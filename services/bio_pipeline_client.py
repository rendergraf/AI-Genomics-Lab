"""
🧬 AI Genomics Lab - Bioinformatics Pipeline Client
Cliente para ejecutar el pipeline bioinformático desde la API

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import os
import re
import logging
import subprocess
import threading
import time
from typing import Optional, List, Dict, Any, Callable, Generator
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import MinIO service
from services.minio_service import get_minio_service
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BioPipelineClient:
    """Client for interacting with the bioinformatics pipeline"""
    
    def __init__(
        self,
        datasets_dir: str = "/datasets",
        reference_dir: str = "/datasets/reference_genome",
        bam_dir: str = "/datasets/bam",
        vcf_dir: str = "/datasets/vcf",
        annotation_dir: str = "/datasets/annotations"
    ):
        """Initialize pipeline client"""
        self.datasets_dir = datasets_dir
        self.reference_dir = reference_dir
        self.bam_dir = bam_dir
        self.vcf_dir = vcf_dir
        self.annotation_dir = annotation_dir
        
        # Environment variables - support both compressed and uncompressed
        self.reference_genome_gz = os.getenv(
            "REFERENCE_GENOME_GZ", 
            f"{reference_dir}/Homo_sapiens.GRCh38.dna_sm.toplevel.fa.gz"
        )
        self.reference_genome = os.getenv(
            "REFERENCE_GENOME", 
            f"{reference_dir}/Homo_sapiens.GRCh38.dna_sm.toplevel.fa"
        )
        self.fastq_dir = os.getenv("FASTQ_DIR", f"{datasets_dir}/fastq")
    
    def _ensure_reference_genome(self, genome_name: str = "hg38") -> bool:
        """
        Ensure reference genome files exist locally, download from MinIO if needed.
        Returns True if all required files exist or were downloaded successfully.
        """
        try:
            # Determine which genome we need based on name
            # For simplicity, assume genome_name matches the MinIO prefix
            minio_service = get_minio_service()
            bucket = "genomics"
            prefix = f"reference_genome/{genome_name}"
            
            # Define required files
            required_files = [
                f"{genome_name}.fa.gz",
                f"{genome_name}.fa.gz.fai",
                f"{genome_name}.fa.gz.gzi",
                f"{genome_name}.fa.gz.sti"
            ]
            
            # Check local existence
            local_dir = Path(self.reference_dir)
            all_exist = True
            
            for filename in required_files:
                local_path = local_dir / filename
                if not local_path.exists():
                    all_exist = False
                    break
            
            if all_exist:
                logger.info(f"All reference genome files exist locally for {genome_name}")
                return True
            
            # Some files missing, try to download from MinIO
            logger.info(f"Downloading reference genome {genome_name} from MinIO...")
            
            # Run async download synchronously
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running (e.g., in async context), we need to use create_task
                # For simplicity, create a new event loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            downloaded_count = 0
            for filename in required_files:
                local_path = local_dir / filename
                object_name = f"{prefix}/{filename}"
                
                try:
                    # Check if object exists in MinIO
                    exists_future = minio_service.object_exists(bucket, object_name)
                    exists = loop.run_until_complete(exists_future)
                    
                    if exists:
                        # Download the file
                        download_future = minio_service.download_file(bucket, object_name, str(local_path))
                        result = loop.run_until_complete(download_future)
                        if result.get("status") == "success":
                            logger.info(f"Downloaded {filename} from MinIO")
                            downloaded_count += 1
                        else:
                            logger.warning(f"Failed to download {filename}: {result.get('message')}")
                    else:
                        logger.warning(f"File {object_name} not found in MinIO")
                except Exception as e:
                    logger.error(f"Error downloading {filename} from MinIO: {e}")
            
            # Return True if at least the main FASTA file was downloaded
            main_file = f"{genome_name}.fa.gz"
            main_path = local_dir / main_file
            if main_path.exists():
                logger.info(f"Reference genome {genome_name} is available locally")
                return True
            else:
                logger.error(f"Main reference genome file {main_file} not found locally or in MinIO")
                return False
                
        except Exception as e:
            logger.error(f"Error ensuring reference genome: {e}")
            return False
    
    def run_pipeline(
        self,
        input_file: str,
        sample_id: str,
        reference: Optional[str] = None,
        genome_name: str = "hg38"
    ) -> Dict[str, Any]:
        """
        Run the bioinformatics pipeline on input file
        
        Args:
            input_file: Path to input FASTQ file
            sample_id: Sample identifier
            reference: Optional reference genome path
            
        Returns:
            Dict with pipeline results
        """
        # Ensure reference genome files are available locally (download from MinIO if needed)
        if not self._ensure_reference_genome(genome_name):
            logger.warning(f"Reference genome {genome_name} may not be fully available locally")
        
        reference = reference or self.reference_genome
        
        # Check if compressed genome exists and decompress if needed
        # Only decompress if the BWA index doesn't exist (the real requirement)
        genome_gz_path = Path(self.reference_genome_gz)
        genome_path = Path(self.reference_genome)
        # Use string concatenation to avoid .with_suffix issues with .fasta files
        bwa_index_path = Path(str(genome_path) + ".bwt")
        
        if genome_gz_path.exists() and not bwa_index_path.exists():
            if not genome_path.exists():
                logger.info(f"Decompressing reference genome: {genome_gz_path}")
                import gzip
                import shutil
                # Use streaming to avoid loading entire genome into RAM
                with gzip.open(genome_gz_path, 'rb') as f_in:
                    with open(genome_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                logger.info("Reference genome decompressed successfully")
            else:
                logger.info("Reference genome exists but BWA index missing - will be indexed")
        
        # Build environment
        env = os.environ.copy()
        env["REFERENCE_GENOME"] = reference
        env["INPUT_DIR"] = self.fastq_dir
        env["OUTPUT_DIR"] = self.bam_dir
        env["VCF_OUTPUT_DIR"] = self.vcf_dir
        env["ANNOTATION_DIR"] = self.annotation_dir
        
        pipeline_script = "/bio-pipeline/scripts/pipeline.sh"
        
        # Validate pipeline script exists
        if not Path(pipeline_script).exists():
            # Try to find the script in alternative locations
            alternative_paths = [
                "/bio-pipeline/scripts/pipeline.sh",
                "/app/bio-pipeline/scripts/pipeline.sh",
                "./bio-pipeline/scripts/pipeline.sh",
                "../bio-pipeline/scripts/pipeline.sh",
            ]
            found = False
            for alt_path in alternative_paths:
                if Path(alt_path).exists():
                    pipeline_script = alt_path
                    found = True
                    break
            if not found:
                logger.error(f"Pipeline script not found in any location")
                return {
                    "success": False,
                    "sample_id": sample_id,
                    "error": f"Pipeline script not found. Searched in: {alternative_paths}",
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        logger.info(f"Starting pipeline for sample: {sample_id}")
        logger.info(f"Input file: {input_file}")
        logger.info(f"Reference genome: {reference}")
        
        try:
            # Run pipeline script - log to file to avoid RAM issues with large outputs
            # Use /datasets/logs instead of /tmp for persistence
            logs_dir = "/datasets/logs"
            os.makedirs(logs_dir, exist_ok=True)
            log_file = f"{logs_dir}/pipeline_{sample_id}.log"
            with open(log_file, 'w') as log_f:
                result = subprocess.run(
                    ["/bin/bash", pipeline_script],
                    env=env,
                    stdout=log_f,
                    stderr=log_f,  # Also redirect stderr to log file
                    timeout=43200  # 12 hours timeout for whole genome sequencing
                )
            
            # Read last 5000 chars of log to avoid loading huge files into memory
            with open(log_file, 'r') as log_f:
                log_f.seek(0, 2)  # Seek to end
                file_size = log_f.tell()
                if file_size > 5000:
                    log_f.seek(-5000, 2)  # Seek to 5000 chars before end
                output = log_f.read()
            
            # Clean up temporary log file
            try:
                os.remove(log_file)
            except OSError:
                pass
            
            if result.returncode == 0:
                logger.info(f"Pipeline completed successfully for {sample_id}")
                
                # Find output files
                bam_file = self._find_file(self.bam_dir, f"{sample_id}_sorted.bam")
                vcf_file = self._find_vcf_file(sample_id)
                
                return {
                    "success": True,
                    "sample_id": sample_id,
                    "bam_file": bam_file,
                    "vcf_file": vcf_file,
                    "output": output,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                # Read error from log file since stderr was redirected
                error_msg = "Pipeline failed - check log for details"
                logger.error(f"Pipeline failed for {sample_id}")
                return {
                    "success": False,
                    "sample_id": sample_id,
                    "error": error_msg,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except subprocess.TimeoutExpired:
            logger.error(f"Pipeline timeout for sample: {sample_id}")
            return {
                "success": False,
                "sample_id": sample_id,
                "error": "Pipeline execution timeout (12 hours)",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Pipeline error: {str(e)}")
            return {
                "success": False,
                "sample_id": sample_id,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _find_file(self, directory: str, filename: str) -> Optional[str]:
        """Find a file in directory"""
        path = Path(directory)
        if not path.exists():
            return None
        
        files = list(path.glob(filename))
        return str(files[0]) if files else None
    
    def _find_vcf_file(self, sample_id: str) -> Optional[str]:
        """Find generated VCF file for sample"""
        # Check for annotated VCF first
        vcf_file = self._find_file(self.vcf_dir, f"{sample_id}_annotated.vcf")
        if vcf_file:
            return vcf_file
        
        # Check for filtered VCF
        vcf_file = self._find_file(self.vcf_dir, f"{sample_id}_filtered.vcf")
        if vcf_file:
            return vcf_file
        
        # Check for any VCF file
        vcf_file = self._find_file(self.vcf_dir, f"{sample_id}*.vcf")
        return vcf_file
    
    def parse_vcf(self, vcf_file: str) -> List[Dict[str, Any]]:
        """
        Parse VCF file and extract variants
        
        Args:
            vcf_file: Path to VCF file
            
        Returns:
            List of variant dictionaries
        """
        variants = []
        
        try:
            # Support both .vcf and .vcf.gz files
            import gzip
            if vcf_file.endswith('.gz'):
                opener = gzip.open
            else:
                opener = open
                
            with opener(vcf_file, 'rt') as f:
                for line in f:
                    # Skip header lines
                    if line.startswith('#'):
                        continue
                    
                    fields = line.strip().split('\t')
                    
                    if len(fields) >= 5:
                        variant = {
                            "chromosome": fields[0],
                            "position": int(fields[1]),
                            "id": fields[2] if fields[2] != '.' else None,
                            "ref": fields[3],
                            "alt": fields[4],
                            "quality": float(fields[5]) if fields[5] != '.' else None,
                            "filter": fields[6] if len(fields) > 6 else None,
                            "info": fields[7] if len(fields) > 7 else {}
                        }
                        
                        # Parse INFO field
                        if variant["info"]:
                            info_dict = {}
                            for item in variant["info"].split(';'):
                                if '=' in item:
                                    key, value = item.split('=', 1)
                                    info_dict[key] = value
                            variant["info"] = info_dict
                        
                        variants.append(variant)
                        
        except Exception as e:
            logger.error(f"Error parsing VCF: {str(e)}")
        
        return variants
    
    def get_available_samples(self) -> List[str]:
        """Get list of available sample files"""
        fastq_path = Path(self.fastq_dir)
        
        if not fastq_path.exists():
            return []
        
        samples = set()
        
        # Helper function to normalize sample names
        def normalize_sample(name: str) -> str:
            # Remove _1/_2 suffix for paired-end using regex
            # Only matches at end of string to avoid sample_10 issues
            return re.sub(r'_1$', '', re.sub(r'_2$', '', name))
        
        # Handle .fastq files
        for file in fastq_path.glob("*.fastq"):
            sample_name = normalize_sample(file.stem)
            samples.add(sample_name)
        
        # Handle .fq files
        for file in fastq_path.glob("*.fq"):
            sample_name = normalize_sample(file.stem)
            samples.add(sample_name)
        
        # Handle .fastq.gz files
        for file in fastq_path.glob("*.fastq.gz"):
            name = file.name.replace('.fastq.gz', '')
            sample_name = normalize_sample(name)
            samples.add(sample_name)
        
        # Handle .fq.gz files
        for file in fastq_path.glob("*.fq.gz"):
            name = file.name.replace('.fq.gz', '')
            sample_name = normalize_sample(name)
            samples.add(sample_name)
        
        return sorted(samples)
    
    def run_pipeline_streaming(
        self,
        input_file: str,
        sample_id: str,
        reference: Optional[str] = None,
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Run the bioinformatics pipeline with real-time progress updates.
        
        Args:
            input_file: Path to input FASTQ file
            sample_id: Sample identifier
            reference: Optional reference genome path
            progress_callback: Optional callback for progress updates
            
        Yields:
            Dict with pipeline progress updates
        """
        reference = reference or self.reference_genome
        
        # Build environment
        env = os.environ.copy()
        env["REFERENCE_GENOME"] = reference
        env["INPUT_DIR"] = self.fastq_dir
        env["OUTPUT_DIR"] = self.bam_dir
        env["VCF_OUTPUT_DIR"] = self.vcf_dir
        env["ANNOTATION_DIR"] = self.annotation_dir
        
        pipeline_script = "/bio-pipeline/scripts/pipeline.sh"
        
        # Validate pipeline script exists
        if not Path(pipeline_script).exists():
            alternative_paths = [
                "/bio-pipeline/scripts/pipeline.sh",
                "/app/bio-pipeline/scripts/pipeline.sh",
                "./bio-pipeline/scripts/pipeline.sh",
                "../bio-pipeline/scripts/pipeline.sh",
            ]
            found = False
            for alt_path in alternative_paths:
                if Path(alt_path).exists():
                    pipeline_script = alt_path
                    found = True
                    break
            if not found:
                yield {
                    "type": "error",
                    "message": f"Pipeline script not found. Searched in: {alternative_paths}",
                    "timestamp": datetime.utcnow().isoformat()
                }
                return
        
        # Create logs directory
        logs_dir = "/datasets/logs"
        os.makedirs(logs_dir, exist_ok=True)
        
        start_time = datetime.utcnow()
        
        yield {
            "type": "start",
            "sample_id": sample_id,
            "message": f"Starting pipeline for sample: {sample_id}",
            "timestamp": start_time.isoformat()
        }
        
        try:
            # Use Popen for streaming
            process = subprocess.Popen(
                ["/bin/bash", pipeline_script],
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1  # Line buffered
            )
            
            # Read output line by line
            output_lines = []
            for line in process.stdout:
                output_lines.append(line.strip())
                
                # Parse progress from line
                progress_update = self._parse_pipeline_output(line, sample_id)
                if progress_update:
                    if progress_callback:
                        progress_callback(progress_update)
                    yield progress_update
            
            # Wait for process to complete
            return_code = process.wait()
            
            if return_code == 0:
                end_time = datetime.utcnow()
                duration = (end_time - start_time).total_seconds()
                
                yield {
                    "type": "complete",
                    "sample_id": sample_id,
                    "message": "Pipeline completed successfully",
                    "duration_seconds": duration,
                    "timestamp": end_time.isoformat()
                }
                
                # Find output files
                bam_file = self._find_file(self.bam_dir, f"{sample_id}_sorted.bam")
                cram_file = self._find_file(self.bam_dir, f"{sample_id}_sorted.cram")
                vcf_file = self._find_vcf_file(sample_id)
                
                yield {
                    "type": "output",
                    "sample_id": sample_id,
                    "bam_file": bam_file,
                    "cram_file": cram_file,
                    "vcf_file": vcf_file,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                yield {
                    "type": "error",
                    "sample_id": sample_id,
                    "message": f"Pipeline failed with return code {return_code}",
                    "output": "\n".join(output_lines[-50:]),  # Last 50 lines
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            yield {
                "type": "error",
                "sample_id": sample_id,
                "message": f"Pipeline error: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _parse_pipeline_output(self, line: str, sample_id: str) -> Optional[Dict[str, Any]]:
        """
        Parse pipeline output line to extract progress information.
        
        Expected formats from pipeline.sh:
        - [TIMESTAMP] 📊 STEP_N: message
        - [TIMESTAMP] 📈 PROGRESS: N%
        - [TIMESTAMP] 📁 FILE_SIZE: filename=size
        - [TIMESTAMP] ⏱️ DURATION: Nm Ns
        """
        result = {
            "type": "progress",
            "sample_id": sample_id,
            "raw_output": line.strip(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Parse STEP progress
        step_match = re.search(r'📊 STEP_(\d+): (.+)', line)
        if step_match:
            result["step"] = int(step_match.group(1))
            result["message"] = step_match.group(2)
            return result
        
        # Parse percentage progress
        progress_match = re.search(r'📈 PROGRESS: (\d+)%', line)
        if progress_match:
            result["progress"] = int(progress_match.group(1))
            return result
        
        # Parse file size
        file_match = re.search(r'📁 FILE_SIZE: (.+?)=(.+)', line)
        if file_match:
            result["file_name"] = file_match.group(1)
            result["file_size"] = file_match.group(2)
            return result
        
        # Parse duration
        duration_match = re.search(r'⏱️ DURATION: (\d+)m (\d+)s', line)
        if duration_match:
            result["duration_minutes"] = int(duration_match.group(1))
            result["duration_seconds"] = int(duration_match.group(2))
            return result
        
        # Return None if no pattern matched (regular log line)
        return None
    
    def _check_bwa_index_complete(self, genome_path: Path) -> bool:
        """Check if all BWA index files exist"""
        required_indices = [".bwt", ".ann", ".amb", ".pac", ".sa"]
        base_path = str(genome_path)
        return all(Path(base_path + ext).exists() for ext in required_indices)
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get pipeline status and available files"""
        genome_path = Path(self.reference_genome)
        bwa_index_complete = self._check_bwa_index_complete(genome_path)
        
        return {
            "datasets_dir": self.datasets_dir,
            "reference_dir": self.reference_dir,
            "reference_genome": self.reference_genome,
            "reference_genome_gz": self.reference_genome_gz,
            "fastq_dir": self.fastq_dir,
            "bam_dir": self.bam_dir,
            "vcf_dir": self.vcf_dir,
            "annotation_dir": self.annotation_dir,
            "reference_exists": genome_path.exists(),
            "reference_gz_exists": Path(self.reference_genome_gz).exists(),
            "bwa_index_complete": bwa_index_complete,
            "available_samples": self.get_available_samples(),
            "bam_files": self._list_files(self.bam_dir, "*.bam"),
            "vcf_files": self._list_files(self.vcf_dir, "*.vcf")
        }
    
    def _list_files(self, directory: str, pattern: str) -> List[str]:
        """List files in directory matching pattern"""
        path = Path(directory)
        if not path.exists():
            return []
        return [str(f) for f in path.glob(pattern)]


# Singleton instance
_bio_pipeline_client: Optional[BioPipelineClient] = None


def get_bio_pipeline_client() -> BioPipelineClient:
    """Get singleton pipeline client instance"""
    global _bio_pipeline_client
    if _bio_pipeline_client is None:
        _bio_pipeline_client = BioPipelineClient()
    return _bio_pipeline_client
