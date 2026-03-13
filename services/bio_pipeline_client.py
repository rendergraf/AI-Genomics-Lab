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
import json
import logging
import subprocess
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BioPipelineClient:
    """Client for interacting with the bioinformatics pipeline"""
    
    def __init__(
        self,
        pipeline_dir: str = "/pipeline",
        datasets_dir: str = "/datasets",
        output_dir: str = "/output",
        reference_dir: str = "/reference"
    ):
        """Initialize pipeline client"""
        self.pipeline_dir = pipeline_dir
        self.datasets_dir = datasets_dir
        self.output_dir = output_dir
        self.reference_dir = reference_dir
        
        # Environment variables
        self.reference_genome = os.getenv("REFERENCE_GENOME", "/reference/hg38")
    
    def run_pipeline(
        self,
        input_file: str,
        sample_id: str,
        reference: Optional[str] = None
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
        reference = reference or self.reference_genome
        
        # Build environment
        env = os.environ.copy()
        env["REFERENCE_GENOME"] = reference
        env["INPUT_DIR"] = self.datasets_dir
        env["OUTPUT_DIR"] = self.output_dir
        
        pipeline_script = f"{self.pipeline_dir}/scripts/pipeline.sh"
        
        logger.info(f"Starting pipeline for sample: {sample_id}")
        logger.info(f"Input file: {input_file}")
        
        try:
            # Run pipeline script
            result = subprocess.run(
                ["/bin/bash", pipeline_script],
                env=env,
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout
            )
            
            if result.returncode == 0:
                logger.info(f"Pipeline completed successfully for {sample_id}")
                
                # Find output VCF file
                vcf_file = self._find_vcf_file(sample_id)
                
                return {
                    "success": True,
                    "sample_id": sample_id,
                    "vcf_file": vcf_file,
                    "output": result.stdout,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                logger.error(f"Pipeline failed: {result.stderr}")
                return {
                    "success": False,
                    "sample_id": sample_id,
                    "error": result.stderr,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except subprocess.TimeoutExpired:
            logger.error(f"Pipeline timeout for sample: {sample_id}")
            return {
                "success": False,
                "sample_id": sample_id,
                "error": "Pipeline execution timeout",
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
    
    def _find_vcf_file(self, sample_id: str) -> Optional[str]:
        """Find generated VCF file for sample"""
        output_path = Path(self.output_dir)
        
        if not output_path.exists():
            return None
        
        # Look for filtered VCF file
        vcf_files = list(output_path.glob(f"{sample_id}*_filtered.vcf"))
        
        if vcf_files:
            return str(vcf_files[0])
        
        # Look for any VCF file
        vcf_files = list(output_path.glob(f"{sample_id}*.vcf"))
        
        if vcf_files:
            return str(vcf_files[0])
        
        return None
    
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
            with open(vcf_file, 'r') as f:
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
        datasets_path = Path(self.datasets_dir)
        
        if not datasets_path.exists():
            return []
        
        samples = []
        for file in datasets_path.glob("*.fastq"):
            samples.append(file.stem)
        for file in datasets_path.glob("*.fq"):
            samples.append(file.stem)
        for file in datasets_path.glob("*.fastq.gz"):
            samples.append(file.stem.replace('.fastq.gz', ''))
        
        return sorted(set(samples))
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get pipeline status and available files"""
        return {
            "pipeline_dir": self.pipeline_dir,
            "datasets_dir": self.datasets_dir,
            "output_dir": self.output_dir,
            "reference_dir": self.reference_dir,
            "reference_genome": self.reference_genome,
            "available_samples": self.get_available_samples(),
            "output_files": self._list_output_files()
        }
    
    def _list_output_files(self) -> List[str]:
        """List output files"""
        output_path = Path(self.output_dir)
        
        if not output_path.exists():
            return []
        
        return [str(f) for f in output_path.iterdir()]


# Singleton instance
_bio_pipeline_client: Optional[BioPipelineClient] = None


def get_bio_pipeline_client() -> BioPipelineClient:
    """Get singleton pipeline client instance"""
    global _bio_pipeline_client
    if _bio_pipeline_client is None:
        _bio_pipeline_client = BioPipelineClient()
    return _bio_pipeline_client
