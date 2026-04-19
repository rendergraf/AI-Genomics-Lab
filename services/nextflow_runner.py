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
import shlex
from typing import Optional, Dict, Any, Generator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NextflowRunner:
    def __init__(self):
        pass
    
    def run_genome_indexing(self, genome_id: str, output_dir: Optional[str] = None, job_id: Optional[str] = None, minio_bucket: str = "genomics", minio_prefix: str = "reference_genome", read_length: Optional[int] = None, genome_url: Optional[str] = None) -> Dict[str, Any]:
        job_id = job_id if job_id is not None else str(uuid.uuid4())
        log_file = f"/datasets/logs/nextflow-{job_id}.log"
        reports_dir = f"/datasets/reports/{job_id}"
        
        # Ensure logs directory exists
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        os.makedirs(reports_dir, exist_ok=True)
        
        # Use temporary directory for genome output if not specified
        if output_dir is None:
            output_dir = f"/nextflow-work/{job_id}/genome_output"
        
        # Nextflow command to run in bio-pipeline container
        # Use correct pipeline for all genomes (includes MinIO upload)
        pipeline_file = "genome_index_correct.nf"
        
        nextflow_cmd = f"nextflow run /bio-pipeline/{pipeline_file} -ansi-log false"
        nextflow_cmd += f" --genome_id {genome_id}"
        if genome_url:
            nextflow_cmd += f" --genome_url {shlex.quote(genome_url)}"
        nextflow_cmd += f" --output_dir {output_dir}"
        nextflow_cmd += f" --minio_bucket {minio_bucket}"
        nextflow_cmd += f" --minio_prefix {minio_prefix}"
        if read_length is not None:
            nextflow_cmd += f" --read_length {read_length}"
        nextflow_cmd += f" -work-dir /nextflow-work/{job_id}"
        
        # Execute Nextflow inside bio-pipeline container
        # Use unbuffered output with stdbuf to get real-time output
        cmd = [
            "docker", "exec", "ai-genomics-bio",
            "bash", "-c",
            f"mkdir -p {reports_dir} && mkdir -p {output_dir} && cd /bio-pipeline && stdbuf -o0 -e0 {nextflow_cmd} 2>&1"
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
        job_id = job_info.get("job_id")
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
        finally:
            # Clean up work directory regardless of success or failure
            if job_id:
                self._cleanup_work_dir(job_id)
    
    def check_pipeline_status(self, job_info: Dict[str, Any]) -> str:
        process = job_info.get("process")
        if process is None:
            return "unknown"
        
        if process.poll() is None:
            return "running"
        
        return "completed" if process.returncode == 0 else "failed"

    def _cleanup_work_dir(self, job_id: str):
        """Clean up Nextflow work directory for a given job ID"""
        try:
            work_dir = f"/nextflow-work/{job_id}"
            cmd = ["docker", "exec", "ai-genomics-bio", "rm", "-rf", work_dir]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to clean work directory {work_dir}: {result.stderr}")
            else:
                logger = logging.getLogger(__name__)
                logger.info(f"Cleaned work directory: {work_dir}")
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error cleaning work directory: {e}")


_nextflow_runner: Optional[NextflowRunner] = None


def get_nextflow_runner() -> NextflowRunner:
    global _nextflow_runner
    if _nextflow_runner is None:
        _nextflow_runner = NextflowRunner()
    return _nextflow_runner
