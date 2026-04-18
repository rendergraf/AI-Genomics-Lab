"""
MinIO Service for AI Genomics Lab
Real implementation for MinIO integration
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
import asyncio
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MinioService:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "genomics")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "genomics")
        self.secure = False  # Use HTTP for internal communication
        self.public_endpoint = os.getenv("MINIO_PUBLIC_ENDPOINT", self.endpoint)
        self.bucket_default = "genomics"
        # Bucket configuration from environment variables
        self.buckets = {
            "fastq": os.getenv("MINIO_BUCKET_FASTQ", "fastq-files"),
            "bam": os.getenv("MINIO_BUCKET_BAM", "bam-files"),
            "vcf": os.getenv("MINIO_BUCKET_VCF", "vcf-files"),
            "reports": os.getenv("MINIO_BUCKET_REPORTS", "reports"),
            "annotations": os.getenv("MINIO_BUCKET_ANNOTATIONS", "annotations"),
            "reference": os.getenv("MINIO_BUCKET_REFERENCE", "reference-genomes"),
            "genomics": os.getenv("MINIO_BUCKET_GENOMICS", "genomics"),
        }
        self.client = None
        self._executor = ThreadPoolExecutor(max_workers=4)
        self._initialize_client()
        self._ensure_all_buckets()
    
    def _initialize_client(self):
        try:
            self.client = Minio(
                self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure
            )
            logger.info(f"MinIO client initialized for endpoint {self.endpoint}")
        except Exception as e:
            logger.error(f"Failed to initialize MinIO client: {e}")
            raise
    
    def _ensure_bucket(self, bucket_name: str = None):
        bucket = bucket_name or self.bucket_default
        try:
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)
                logger.info(f"Bucket '{bucket}' created")
            else:
                logger.debug(f"Bucket '{bucket}' already exists")
        except S3Error as e:
            logger.error(f"Error ensuring bucket '{bucket}': {e}")
            raise
    
    def _ensure_all_buckets(self):
        """Ensure all configured buckets exist"""
        for bucket_type, bucket_name in self.buckets.items():
            try:
                if not self.client.bucket_exists(bucket_name):
                    self.client.make_bucket(bucket_name)
                    logger.info(f"Bucket '{bucket_name}' ({bucket_type}) created")
                else:
                    logger.debug(f"Bucket '{bucket_name}' ({bucket_type}) already exists")
            except S3Error as e:
                logger.error(f"Error ensuring bucket '{bucket_name}' ({bucket_type}): {e}")
                raise
    
    def get_bucket(self, bucket_type: str = "genomics") -> str:
        """Get bucket name for a given type"""
        if bucket_type in self.buckets:
            return self.buckets[bucket_type]
        # If not found, use the provided bucket_type as bucket name
        logger.warning(f"Bucket type '{bucket_type}' not configured, using as bucket name")
        return bucket_type
    
    async def upload_file(self, file_path: str, bucket: str = None, object_name: str = None) -> Dict[str, Any]:
        bucket = bucket or self.bucket_default
        if object_name is None:
            object_name = os.path.basename(file_path)
        
        def _upload():
            try:
                self.client.fput_object(bucket, object_name, file_path)
                return {
                    "status": "success",
                    "message": f"File uploaded to {bucket}/{object_name}",
                    "bucket": bucket,
                    "object_name": object_name,
                    "file_path": file_path
                }
            except S3Error as e:
                logger.error(f"Failed to upload {file_path} to {bucket}/{object_name}: {e}")
                return {
                    "status": "error",
                    "message": str(e)
                }
            except Exception as e:
                logger.error(f"Unexpected error uploading file: {e}")
                return {
                    "status": "error",
                    "message": str(e)
                }
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _upload)
    
    async def download_file(self, bucket: str, object_name: str, file_path: str) -> Dict[str, Any]:
        def _download():
            try:
                self.client.fget_object(bucket, object_name, file_path)
                return {
                    "status": "success",
                    "message": f"File downloaded to {file_path}",
                    "bucket": bucket,
                    "object_name": object_name,
                    "file_path": file_path
                }
            except S3Error as e:
                logger.error(f"Failed to download {bucket}/{object_name} to {file_path}: {e}")
                return {
                    "status": "error",
                    "message": str(e)
                }
            except Exception as e:
                logger.error(f"Unexpected error downloading file: {e}")
                return {
                    "status": "error",
                    "message": str(e)
                }
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _download)
    
    async def list_objects(self, bucket: str = None, prefix: str = "") -> List[str]:
        bucket = bucket or self.bucket_default
        def _list():
            try:
                objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
                return [obj.object_name for obj in objects]
            except S3Error as e:
                logger.error(f"Failed to list objects in {bucket}: {e}")
                return []
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _list)
    
    async def list_objects_with_info(self, bucket: str = None, prefix: str = "") -> List[Dict[str, Any]]:
        """List objects with metadata (size, last_modified, etc.)"""
        bucket = bucket or self.bucket_default
        def _list():
            try:
                objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
                result = []
                for obj in objects:
                    result.append({
                        "object_name": obj.object_name,
                        "size": obj.size,
                        "last_modified": obj.last_modified,
                        "etag": obj.etag,
                        "content_type": obj.content_type,
                        "is_dir": obj.is_dir
                    })
                return result
            except S3Error as e:
                logger.error(f"Failed to list objects in {bucket}: {e}")
                return []
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _list)
    
    async def object_exists(self, bucket: str, object_name: str) -> bool:
        def _exists():
            try:
                self.client.stat_object(bucket, object_name)
                return True
            except S3Error as e:
                if e.code == "NoSuchKey":
                    return False
                logger.error(f"Error checking existence of {bucket}/{object_name}: {e}")
                return False
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _exists)
    
    async def get_object_info(self, bucket: str, object_name: str) -> Dict[str, Any]:
        """Get object metadata including size"""
        def _stat():
            try:
                stat = self.client.stat_object(bucket, object_name)
                return {
                    "size": stat.size,
                    "content_type": stat.content_type,
                    "last_modified": stat.last_modified,
                    "etag": stat.etag,
                    "metadata": stat.metadata
                }
            except S3Error as e:
                if e.code == "NoSuchKey":
                    raise
                logger.error(f"Error getting info for {bucket}/{object_name}: {e}")
                raise
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _stat)
    
    async def delete_object(self, bucket: str, object_name: str) -> Dict[str, Any]:
        def _delete():
            try:
                self.client.remove_object(bucket, object_name)
                return {
                    "status": "success",
                    "message": f"Deleted {bucket}/{object_name}"
                }
            except S3Error as e:
                logger.error(f"Failed to delete {bucket}/{object_name}: {e}")
                return {
                    "status": "error",
                    "message": str(e)
                }
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _delete)
    
    async def presigned_get_url(self, bucket: str, object_name: str, expires_seconds: int = 3600) -> str:
        """Generate a presigned URL for GET access"""
        def _generate():
            try:
                url = self.client.presigned_get_object(bucket, object_name, expires=timedelta(seconds=expires_seconds))
                # Replace internal endpoint with public endpoint for external access
                if self.endpoint != self.public_endpoint:
                    url = url.replace(f"http://{self.endpoint}", f"http://{self.public_endpoint}")
                return url
            except S3Error as e:
                logger.error(f"Failed to generate presigned GET URL for {bucket}/{object_name}: {e}")
                raise
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _generate)
    
    async def presigned_put_url(self, bucket: str, object_name: str, expires_seconds: int = 3600) -> str:
        """Generate a presigned URL for PUT upload"""
        def _generate():
            try:
                url = self.client.presigned_put_object(bucket, object_name, expires=timedelta(seconds=expires_seconds))
                # Replace internal endpoint with public endpoint for external access
                if self.endpoint != self.public_endpoint:
                    url = url.replace(f"http://{self.endpoint}", f"http://{self.public_endpoint}")
                return url
            except S3Error as e:
                logger.error(f"Failed to generate presigned PUT URL for {bucket}/{object_name}: {e}")
                raise
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _generate)
    
    async def upload_from_bytes(self, bucket: str, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> Dict[str, Any]:
        """Upload data directly from bytes"""
        def _upload():
            try:
                from io import BytesIO
                data_stream = BytesIO(data)
                self.client.put_object(bucket, object_name, data_stream, len(data), content_type=content_type)
                return {
                    "status": "success",
                    "message": f"Uploaded {len(data)} bytes to {bucket}/{object_name}",
                    "bucket": bucket,
                    "object_name": object_name,
                    "size": len(data)
                }
            except S3Error as e:
                logger.error(f"Failed to upload bytes to {bucket}/{object_name}: {e}")
                return {
                    "status": "error",
                    "message": str(e)
                }
            except Exception as e:
                logger.error(f"Unexpected error uploading bytes: {e}")
                return {
                    "status": "error",
                    "message": str(e)
                }
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, _upload)
    
    async def get_object_stream(self, bucket: str, object_name: str):
        """Get object as a stream for streaming response"""
        def _get():
            try:
                return self.client.get_object(bucket, object_name)
            except S3Error as e:
                logger.error(f"Failed to get object {bucket}/{object_name}: {e}")
                raise
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(self._executor, _get)
        
        # Create an async generator that yields chunks and closes the response
        async def stream_generator():
            try:
                while True:
                    chunk = response.read(8192)  # 8KB chunks
                    if not chunk:
                        break
                    yield chunk
            finally:
                response.close()
                response.release_conn()
        
        return stream_generator()
    
    def get_object_url(self, bucket: str, object_name: str) -> str:
        return f"s3://{bucket}/{object_name}"


_minio_service: Optional[MinioService] = None


def get_minio_service() -> MinioService:
    global _minio_service
    if _minio_service is None:
        _minio_service = MinioService()
    return _minio_service