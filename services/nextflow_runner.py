"""
🧬 AI Genomics Lab - Nextflow Pipeline Runner Service
Executes Nextflow pipelines in bio-pipeline container
"""

import os
import json
import subprocess
import uuid
import logging
import select
import time
from typing import Optional, Dict, Any, Generator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NextflowRunner:
    def __init__(self):
        pass
    
    def run_genome_indexing(self, genome_id: str, output_dir: str = "/datasets/reference_genome", job_id: Optional[str] = None) -> Dict[str, Any]:
        job_id = job_id if job_id is not None else str(uuid.uuid4())
        log_file = f"/datasets/logs/nextflow-{job_id}.log"
        reports_dir = f"/datasets/reports/{job_id}"
        
        # Ensure logs directory exists
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        os.makedirs(reports_dir, exist_ok=True)
        
        # Nextflow command to run in bio-pipeline container
        # Use test pipeline for hg38-test (chromosome 21), correct pipeline for full genomes
        if genome_id == "hg38-test":
            pipeline_file = "genome_index_test_small.nf"
        else:
            pipeline_file = "genome_index_correct.nf"
        
        nextflow_cmd = f"nextflow run /pipeline/{pipeline_file} -ansi-log false"
        nextflow_cmd += f" --genome_id {genome_id}"
        nextflow_cmd += f" --output_dir {output_dir}"
        nextflow_cmd += f" -work-dir /nextflow-work/{job_id}"
        
        # Execute Nextflow inside bio-pipeline container
        # Use unbuffered output with stdbuf to get real-time output
        cmd = [
            "docker", "exec", "ai-genomics-bio",
            "bash", "-c",
            f"mkdir -p {reports_dir} && cd /pipeline && stdbuf -o0 -e0 {nextflow_cmd} 2>&1"
        ]
        
        logger.info(f"Starting Nextflow genome indexing: {' '.join(cmd)}")
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        return {
            "job_id": job_id,
            "process": process,
            "log_file": log_file,
            "reports_dir": reports_dir,
            "genome_id": genome_id,
            "output_dir": output_dir,
            "status": "running",
            "pipeline": "nextflow"
        }
    
    def stream_pipeline_logs(self, job_info: Dict[str, Any]) -> Generator[str, None, None]:
        process = job_info.get("process")
        if not process:
            yield json.dumps({"type": "error", "message": "No process found"}) + "\n"
            return
        
        try:
            # Send initial status message
            yield f"data: {json.dumps({'type': 'log', 'message': '🔧 Nextflow process started...'})}\n\n"
            
            # Read output line by line
            import select
            import time
            
            start_time = time.time()
            last_message_time = start_time
            
            while process.poll() is None:
                # Check if there's output available
                ready_to_read, _, _ = select.select([process.stdout], [], [], 1.0)
                
                if ready_to_read:
                    line = process.stdout.readline()
                    if line:
                        yield f"data: {json.dumps({'type': 'log', 'message': line.strip()})}\n\n"
                        last_message_time = time.time()
                else:
                    # No output for 2 seconds, send heartbeat
                    if time.time() - last_message_time > 2:
                        elapsed = int(time.time() - start_time)
                        yield f"data: {json.dumps({'type': 'heartbeat', 'message': f'⏳ Still processing... ({elapsed}s elapsed)'})}\n\n"
                        last_message_time = time.time()
            
            # Read any remaining output
            for line in process.stdout.readlines():
                if line:
                    yield f"data: {json.dumps({'type': 'log', 'message': line.strip()})}\n\n"
            
            process.stdout.close()
            return_code = process.wait()
            
            if return_code == 0:
                yield f"data: {json.dumps({'type': 'complete', 'message': 'Pipeline completed successfully'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Pipeline failed with exit code {return_code}'})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    def check_pipeline_status(self, job_info: Dict[str, Any]) -> str:
        process = job_info.get("process")
        if process is None:
            return "unknown"
        
        if process.poll() is None:
            return "running"
        
        return "completed" if process.returncode == 0 else "failed"


_nextflow_runner: Optional[NextflowRunner] = None


def get_nextflow_runner() -> NextflowRunner:
    global _nextflow_runner
    if _nextflow_runner is None:
        _nextflow_runner = NextflowRunner()
    return _nextflow_runner
