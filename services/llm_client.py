"""
🧬 AI Genomics Lab - LLM Client Service
Cliente para integración con OpenRouter API

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import os
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMClient:
    """Client for interacting with LLM APIs via OpenRouter"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize LLM client with API key"""
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            logger.warning("OpenRouter API key not found in environment")
        
        self.base_url = "https://openrouter.ai/api/v1"
        self.default_model = "anthropic/claude-3-sonnet"
        self.max_retries = 3
        self.timeout = 60.0
    
    def _build_headers(self) -> Dict[str, str]:
        """Build HTTP headers for API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-genomics-lab.local",
            "X-Title": "AI Genomics Lab"
        }
    
    async def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """
        Generate response from LLM
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            model: Model to use (default: claude-3-sonnet)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict with response and metadata
        """
        model = model or self.default_model
        
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self._build_headers(),
                        json=payload
                    )
                    response.raise_for_status()
                    
                    data = response.json()
                    
                    return {
                        "success": True,
                        "content": data["choices"][0]["message"]["content"],
                        "model": model,
                        "usage": data.get("usage", {}),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error on attempt {attempt + 1}: {e}")
                    if attempt == self.max_retries - 1:
                        raise
                    
                except Exception as e:
                    logger.error(f"Error on attempt {attempt + 1}: {e}")
                    if attempt == self.max_retries - 1:
                        raise
        
        return {"success": False, "error": "Max retries exceeded"}
    
    async def explain_mutation(
        self,
        gene: str,
        mutation: str,
        variant_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Explain biological impact of a mutation using LLM
        
        Args:
            gene: Gene symbol (e.g., BRCA1)
            mutation: Mutation identifier (e.g., c.185delAG)
            variant_data: Optional additional variant information
            
        Returns:
            Dict with explanation
        """
        system_message = """You are an expert bioinformatics scientist specializing in 
genomic variant interpretation. You provide clear, scientifically accurate 
explanations of genetic mutations and their biological impacts."""
        
        prompt = f"""Analyze the following mutation:

Gene: {gene}
Mutation: {mutation}

"""
        
        if variant_data:
            prompt += f"""Additional variant data:
- Type: {variant_data.get('type', 'Unknown')}
- Position: {variant_data.get('position', 'Unknown')}
- Pathogenicity: {variant_data.get('pathogenicity', 'Unknown')}
- Population frequency: {variant_data.get('frequency', 'Unknown')}

"""
        
        prompt += """Please provide:
1. A brief biological explanation of this mutation
2. Its potential impact on protein function
3. Any known disease associations
4. Clinical significance if available"""

        return await self.generate(prompt, system_message)
    
    async def generate_report(
        self,
        sample_id: str,
        variants: List[Dict[str, Any]],
        gene_associations: Dict[str, List[str]]
    ) -> Dict[str, Any]:
        """
        Generate scientific report for genomic analysis
        
        Args:
            sample_id: Sample identifier
            variants: List of detected variants
            gene_associations: Gene-disease associations
            
        Returns:
            Dict with generated report
        """
        system_message = """You are a genomic research scientist who writes 
clear, comprehensive scientific reports on genomic analyses."""
        
        variants_text = "\n".join([
            f"- {v.get('gene', 'Unknown')}: {v.get('mutation', 'Unknown')} "
            f"({v.get('pathogenicity', 'Unknown')})"
            for v in variants
        ])
        
        associations_text = "\n".join([
            f"- {gene}: {', '.join(diseases)}"
            for gene, diseases in gene_associations.items()
        ])
        
        prompt = f"""Generate a scientific report for genomic analysis:

Sample ID: {sample_id}

Detected Variants:
{variants_text}

Gene-Disease Associations:
{associations_text}

Please structure the report with:
1. Executive Summary
2. Methodology
3. Variant Analysis
4. Clinical Interpretation
5. Conclusions and Recommendations

Write in a professional scientific style."""

        return await self.generate(prompt, system_message, temperature=0.5, max_tokens=3000)
    
    async def query_knowledge_graph(
        self,
        query: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Use LLM to help query the knowledge graph
        
        Args:
            query: User's natural language query
            context: Optional context from knowledge graph
            
        Returns:
            Dict with response
        """
        system_message = """You are a bioinformatics expert helping to query 
a genomic knowledge graph. Translate natural language queries into 
scientific insights."""
        
        prompt = query
        if context:
            prompt += f"\n\nRelevant knowledge graph data:\n{context}"
        
        return await self.generate(prompt, system_message)


# Singleton instance
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get singleton LLM client instance"""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
