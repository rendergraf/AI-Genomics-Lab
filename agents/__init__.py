"""
🧬 AI Genomics Lab - Agent System
Sistema de agentes AI para análisis genómico

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from services.llm_client import get_llm_client, LLMClient
from services.neo4j_service import get_neo4j_service, Neo4jService
from services.bio_pipeline_client import get_bio_pipeline_client, BioPipelineClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VariantAgent:
    """Agente para análisis de variantes genéticas"""
    
    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        neo4j_service: Optional[Neo4jService] = None
    ):
        self.llm = llm_client or get_llm_client()
        self.neo4j = neo4j_service or get_neo4j_service()
    
    async def analyze(self, variant_id: str) -> Dict[str, Any]:
        """
        Analizar una variante específica
        
        Args:
            variant_id: Identificador de la variante
            
        Returns:
            Dict con el análisis de la variante
        """
        logger.info(f"VariantAgent: Analyzing variant {variant_id}")
        
        # Get variant info from graph
        mutation_data = await self.neo4j.get_mutation(variant_id)
        
        if not mutation_data:
            return {
                "success": False,
                "error": f"Variant {variant_id} not found in knowledge graph"
            }
        
        # Get gene info
        gene_id = mutation_data.get("gene")
        gene_data = await self.neo4j.get_gene(gene_id) if gene_id else None
        
        # Generate explanation with LLM
        llm_result = await self.llm.explain_mutation(
            gene=gene_id or "Unknown",
            mutation=variant_id,
            variant_data=mutation_data.get("m", {})
        )
        
        return {
            "success": True,
            "variant": variant_id,
            "gene": gene_id,
            "mutation_data": mutation_data.get("m", {}),
            "gene_data": gene_data.get("g", {}) if gene_data else {},
            "diseases": mutation_data.get("diseases", []),
            "papers": mutation_data.get("papers", []),
            "explanation": llm_result.get("content", ""),
            "timestamp": datetime.utcnow().isoformat()
        }


class GraphAgent:
    """Agente para consultas al grafo de conocimiento"""
    
    def __init__(self, neo4j_service: Optional[Neo4jService] = None):
        self.neo4j = neo4j_service or get_neo4j_service()
    
    async def query(self, query_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecutar consulta en el grafo de conocimiento
        
        Args:
            query_type: Tipo de consulta (gene, mutation, disease, search)
            parameters: Parámetros de la consulta
            
        Returns:
            Dict con resultados
        """
        logger.info(f"GraphAgent: Executing query type={query_type}")
        
        try:
            if query_type == "gene":
                gene_id = parameters.get("gene_id")
                gene_data = await self.neo4j.get_gene(gene_id)
                
                if not gene_data:
                    return {"success": False, "error": f"Gene {gene_id} not found"}
                
                mutations = await self.neo4j.get_gene_mutations(gene_id)
                diseases = await self.neo4j.get_gene_diseases(gene_id)
                interactions = await self.neo4j.get_gene_interactions(gene_id)
                
                return {
                    "success": True,
                    "gene": gene_data.get("g", {}),
                    "mutations": mutations,
                    "diseases": diseases,
                    "interactions": interactions
                }
            
            elif query_type == "mutation":
                mutation_id = parameters.get("mutation_id")
                mutation_data = await self.neo4j.get_mutation(mutation_id)
                
                if not mutation_data:
                    return {"success": False, "error": f"Mutation {mutation_id} not found"}
                
                return {
                    "success": True,
                    "mutation": mutation_data.get("m", {}),
                    "gene": mutation_data.get("gene"),
                    "diseases": mutation_data.get("diseases", []),
                    "papers": mutation_data.get("papers", [])
                }
            
            elif query_type == "disease":
                disease_id = parameters.get("disease_id")
                disease_data = await self.neo4j.get_disease(disease_id)
                
                if not disease_data:
                    return {"success": False, "error": f"Disease {disease_id} not found"}
                
                return {
                    "success": True,
                    "disease": disease_data.get("d", {}),
                    "mutations": disease_data.get("mutations", []),
                    "genes": disease_data.get("genes", [])
                }
            
            elif query_type == "search":
                search_term = parameters.get("search_term", "")
                genes = await self.neo4j.search_genes(search_term)
                
                return {
                    "success": True,
                    "genes": genes,
                    "search_term": search_term
                }
            
            else:
                return {
                    "success": False,
                    "error": f"Unknown query type: {query_type}"
                }
                
        except Exception as e:
            logger.error(f"GraphAgent error: {str(e)}")
            return {"success": False, "error": str(e)}


class LiteratureAgent:
    """Agente para análisis de literatura científica"""
    
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or get_llm_client()
    
    async def analyze(self, gene: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Analizar literatura relacionada con un gen
        
        Args:
            gene: Símbolo del gen
            context: Contexto adicional
            
        Returns:
            Dict con análisis de literatura
        """
        logger.info(f"LiteratureAgent: Analyzing literature for {gene}")
        
        prompt = f"""Analyze the current state of research for the gene {gene}.

Please provide:
1. Key biological functions
2. Known disease associations
3. Recent research developments
4. Clinical significance

"""
        
        if context:
            prompt += f"Additional context: {context}"
        
        result = await self.llm.generate(prompt, system_message=
            """You are a bioinformatics expert with knowledge of 
            scientific literature and research trends.""")
        
        return {
            "success": True,
            "gene": gene,
            "analysis": result.get("content", ""),
            "timestamp": datetime.utcnow().isoformat()
        }


class ReportAgent:
    """Agente para generar informes científicos"""
    
    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        neo4j_service: Optional[Neo4jService] = None
    ):
        self.llm = llm_client or get_llm_client()
        self.neo4j = neo4j_service or get_neo4j_service()
        self.variant_agent = VariantAgent(llm_client, neo4j_service)
    
    async def generate(
        self,
        sample_id: str,
        variants: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generar informe científico para una muestra
        
        Args:
            sample_id: Identificador de la muestra
            variants: Lista de variantes detectadas
            
        Returns:
            Dict con el informe generado
        """
        logger.info(f"ReportAgent: Generating report for sample {sample_id}")
        
        # Collect gene-disease associations
        gene_associations: Dict[str, List[str]] = {}
        
        for variant in variants:
            gene_id = variant.get("gene")
            if not gene_id:
                continue
            
            # Get diseases for gene
            diseases = await self.neo4j.get_gene_diseases(gene_id)
            
            if gene_id not in gene_associations:
                gene_associations[gene_id] = []
            
            for disease in diseases:
                disease_name = disease.get("d", {}).get("name", "")
                if disease_name and disease_name not in gene_associations[gene_id]:
                    gene_associations[gene_id].append(disease_name)
        
        # Generate report with LLM
        report_result = await self.llm.generate_report(
            sample_id=sample_id,
            variants=variants,
            gene_associations=gene_associations
        )
        
        return {
            "success": True,
            "sample_id": sample_id,
            "variant_count": len(variants),
            "report": report_result.get("content", ""),
            "gene_associations": gene_associations,
            "timestamp": datetime.utcnow().isoformat()
        }


class AnalysisOrchestrator:
    """Orquestador principal para análisis genómicos"""
    
    def __init__(self):
        self.variant_agent = VariantAgent()
        self.graph_agent = GraphAgent()
        self.literature_agent = LiteratureAgent()
        self.report_agent = ReportAgent()
    
    async def run_complete_analysis(
        self,
        sample_id: str,
        variants: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Ejecutar análisis completo de una muestra
        
        Args:
            sample_id: Identificador de la muestra
            variants: Lista de variantes
            
        Returns:
            Dict con resultados completos del análisis
        """
        logger.info(f"Orchestrator: Running complete analysis for {sample_id}")
        
        results = {
            "sample_id": sample_id,
            "timestamp": datetime.utcnow().isoformat(),
            "variant_analyses": [],
            "gene_data": {},
            "literature_summaries": {},
            "report": None
        }
        
        # Analyze each variant
        unique_genes = set()
        for variant in variants:
            variant_id = variant.get("id") or f"{variant.get('chromosome')}:{variant.get('position')}"
            gene_id = variant.get("gene")
            
            if gene_id:
                unique_genes.add(gene_id)
            
            # Analyze variant
            analysis = await self.variant_agent.analyze(variant_id)
            results["variant_analyses"].append(analysis)
            
            # Get gene data
            if gene_id and gene_id not in results["gene_data"]:
                gene_result = await self.graph_agent.query(
                    "gene",
                    {"gene_id": gene_id}
                )
                if gene_result.get("success"):
                    results["gene_data"][gene_id] = gene_result
        
        # Get literature summaries for each gene
        for gene_id in unique_genes:
            lit_result = await self.literature_agent.analyze(gene_id)
            results["literature_summaries"][gene_id] = lit_result
        
        # Generate final report
        report = await self.report_agent.generate(sample_id, variants)
        results["report"] = report
        
        return results


# Singleton instances
_variant_agent: Optional[VariantAgent] = None
_graph_agent: Optional[GraphAgent] = None
_literature_agent: Optional[LiteratureAgent] = None
_report_agent: Optional[ReportAgent] = None
_orchestrator: Optional[AnalysisOrchestrator] = None


def get_variant_agent() -> VariantAgent:
    global _variant_agent
    if _variant_agent is None:
        _variant_agent = VariantAgent()
    return _variant_agent


def get_graph_agent() -> GraphAgent:
    global _graph_agent
    if _graph_agent is None:
        _graph_agent = GraphAgent()
    return _graph_agent


def get_literature_agent() -> LiteratureAgent:
    global _literature_agent
    if _literature_agent is None:
        _literature_agent = LiteratureAgent()
    return _literature_agent


def get_report_agent() -> ReportAgent:
    global _report_agent
    if _report_agent is None:
        _report_agent = ReportAgent()
    return _report_agent


def get_analysis_orchestrator() -> AnalysisOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AnalysisOrchestrator()
    return _orchestrator
