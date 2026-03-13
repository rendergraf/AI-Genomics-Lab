"""
🧬 AI Genomics Lab - Cache Service
Servicio de cache para respuestas LLM

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import hashlib
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path

import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CacheService:
    """Simple file-based cache for LLM responses"""
    
    def __init__(self, cache_dir: str = "/tmp/llm_cache", ttl_hours: int = 24):
        """
        Initialize cache service
        
        Args:
            cache_dir: Directory to store cache files
            ttl_hours: Time-to-live for cache entries in hours
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = timedelta(hours=ttl_hours)
    
    def _get_cache_key(self, prompt: str, model: str, temperature: float) -> str:
        """Generate cache key from request parameters"""
        content = json.dumps({
            "prompt": prompt,
            "model": model,
            "temperature": temperature
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _get_cache_path(self, key: str) -> Path:
        """Get cache file path for key"""
        return self.cache_dir / f"{key}.json"
    
    def get(self, prompt: str, model: str = "default", temperature: float = 0.7) -> Optional[Dict[str, Any]]:
        """
        Get cached response if available and not expired
        
        Args:
            prompt: Original prompt
            model: Model used
            temperature: Temperature used
            
        Returns:
            Cached response or None
        """
        key = self._get_cache_key(prompt, model, temperature)
        cache_path = self._get_cache_path(key)
        
        if not cache_path.exists():
            return None
        
        try:
            with open(cache_path, 'r') as f:
                cached = json.load(f)
            
            # Check expiration
            cached_time = datetime.fromisoformat(cached.get("timestamp", "2000-01-01"))
            if datetime.now() - cached_time > self.ttl:
                logger.info(f"Cache expired for key: {key[:8]}...")
                cache_path.unlink()
                return None
            
            logger.info(f"Cache hit for key: {key[:8]}...")
            return cached.get("response")
            
        except Exception as e:
            logger.error(f"Error reading cache: {e}")
            return None
    
    def set(self, prompt: str, response: Dict[str, Any], model: str = "default", temperature: float = 0.7) -> None:
        """
        Store response in cache
        
        Args:
            prompt: Original prompt
            response: LLM response to cache
            model: Model used
            temperature: Temperature used
        """
        key = self._get_cache_key(prompt, model, temperature)
        cache_path = self._get_cache_path(key)
        
        try:
            cached = {
                "prompt": prompt,
                "model": model,
                "temperature": temperature,
                "timestamp": datetime.now().isoformat(),
                "response": response
            }
            
            with open(cache_path, 'w') as f:
                json.dump(cached, f, indent=2)
            
            logger.info(f"Cached response for key: {key[:8]}...")
            
        except Exception as e:
            logger.error(f"Error writing cache: {e}")
    
    def clear(self) -> int:
        """
        Clear all expired cache entries
        
        Returns:
            Number of entries cleared
        """
        cleared = 0
        now = datetime.now()
        
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                with open(cache_file, 'r') as f:
                    cached = json.load(f)
                
                cached_time = datetime.fromisoformat(cached.get("timestamp", "2000-01-01"))
                if now - cached_time > self.ttl:
                    cache_file.unlink()
                    cleared += 1
                    
            except Exception:
                # Remove corrupted files
                try:
                    cache_file.unlink()
                    cleared += 1
                except Exception:
                    pass
        
        logger.info(f"Cleared {cleared} expired cache entries")
        return cleared
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_size = 0
        file_count = 0
        expired_count = 0
        now = datetime.now()
        
        for cache_file in self.cache_dir.glob("*.json"):
            file_count += 1
            total_size += cache_file.stat().st_size
            
            try:
                with open(cache_file, 'r') as f:
                    cached = json.load(f)
                
                cached_time = datetime.fromisoformat(cached.get("timestamp", "2000-01-01"))
                if now - cached_time > self.ttl:
                    expired_count += 1
            except Exception:
                pass
        
        return {
            "total_entries": file_count,
            "expired_entries": expired_count,
            "total_size_bytes": total_size,
            "cache_dir": str(self.cache_dir),
            "ttl_hours": self.ttl.total_seconds() / 3600
        }


# Singleton instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get singleton cache service instance"""
    global _cache_service
    if _cache_service is None:
        cache_dir = os.getenv("LLM_CACHE_DIR", "/tmp/llm_cache")
        ttl_hours = int(os.getenv("LLM_CACHE_TTL_HOURS", "24"))
        _cache_service = CacheService(cache_dir, ttl_hours)
    return _cache_service
