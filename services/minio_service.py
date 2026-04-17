"""
MinIO Service for AI Genomics Lab
Real implementation for MinIO integration
"""

import os
import logging
from typing import Optional, Dict, Any, List
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
        self.bucket_default = "genomics"
        self.client = None
        self._executor = ThreadPoolExecutor(max_workers=4)
        self._initialize_client()
        self._ensure_bucket()
    
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
    
    def get_object_url(self, bucket: str, object_name: str) -> str:
        return f"s3://{bucket}/{object_name}"


_minio_service: Optional[MinioService] = None


def get_minio_service() -> MinioService:
    global _minio_service
    if _minio_service is None:
        _minio_service = MinioService()
    return _minio_service