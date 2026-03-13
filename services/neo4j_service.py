"""
🧬 AI Genomics Lab - Neo4j Service
Servicio para gestionar la base de datos de grafos de conocimiento genómico

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager

from neo4j import AsyncGraphDatabase, AsyncDriver
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Neo4jService:
    """Service for interacting with Neo4j graph database"""
    
    def __init__(
        self,
        uri: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None
    ):
        """Initialize Neo4j connection"""
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://neo4j:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "genomics")
        self._driver: Optional[AsyncDriver] = None
    
    async def connect(self) -> None:
        """Establish connection to Neo4j"""
        if self._driver is None:
            self._driver = AsyncGraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password)
            )
            logger.info(f"Connected to Neo4j at {self.uri}")
    
    async def close(self) -> None:
        """Close connection to Neo4j"""
        if self._driver:
            await self._driver.close()
            self._driver = None
            logger.info("Disconnected from Neo4j")
    
    @asynccontextmanager
    async def session(self):
        """Context manager for Neo4j sessions"""
        if self._driver is None:
            await self.connect()
        
        async with self._driver.session() as session:
            yield session
    
    async def execute_query(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Execute a Cypher query and return results"""
        async with self.session() as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            return records
    
    async def get_gene(self, gene_id: str) -> Optional[Dict[str, Any]]:
        """Get gene information by gene symbol"""
        query = """
        MATCH (g:Gene {id: $gene_id})
        OPTIONAL MATCH (g)-[:HAS_MUTATION]->(m:Mutation)
        OPTIONAL MATCH (g)-[:ASSOCIATED_WITH]->(d:Disease)
        OPTIONAL MATCH (g)-[:INTERACTS_WITH]->(g2:Gene)
        RETURN g, collect(DISTINCT m) as mutations, 
               collect(DISTINCT d) as diseases,
               collect(DISTINCT g2.id) as interactions
        """
        results = await self.execute_query(query, {"gene_id": gene_id})
        return results[0] if results else None
    
    async def get_mutation(self, mutation_id: str) -> Optional[Dict[str, Any]]:
        """Get mutation information by mutation ID"""
        query = """
        MATCH (m:Mutation {id: $mutation_id})
        OPTIONAL MATCH (g:Gene)-[:HAS_MUTATION]->(m)
        OPTIONAL MATCH (m)-[:CAUSES]->(d:Disease)
        OPTIONAL MATCH (m)-[:REPORTED_IN]->(p:Paper)
        RETURN m, g.id as gene, collect(DISTINCT d) as diseases,
               collect(DISTINCT p) as papers
        """
        results = await self.execute_query(query, {"mutation_id": mutation_id})
        return results[0] if results else None
    
    async def get_disease(self, disease_id: str) -> Optional[Dict[str, Any]]:
        """Get disease information"""
        query = """
        MATCH (d:Disease {id: $disease_id})
        OPTIONAL MATCH (m:Mutation)-[:CAUSES]->(d)
        OPTIONAL MATCH (g:Gene)-[:ASSOCIATED_WITH]->(d)
        RETURN d, collect(DISTINCT m) as mutations,
               collect(DISTINCT g.id) as genes
        """
        results = await self.execute_query(query, {"disease_id": disease_id})
        return results[0] if results else None
    
    async def get_gene_mutations(self, gene_id: str) -> List[Dict[str, Any]]:
        """Get all mutations for a gene"""
        query = """
        MATCH (g:Gene {id: $gene_id})-[:HAS_MUTATION]->(m:Mutation)
        RETURN m ORDER BY m.pathogenicity DESC
        """
        return await self.execute_query(query, {"gene_id": gene_id})
    
    async def get_gene_diseases(self, gene_id: str) -> List[Dict[str, Any]]:
        """Get all diseases associated with a gene"""
        query = """
        MATCH (g:Gene {id: $gene_id})-[:ASSOCIATED_WITH]->(d:Disease)
        RETURN d
        """
        return await self.execute_query(query, {"gene_id": gene_id})
    
    async def get_gene_interactions(self, gene_id: str) -> List[str]:
        """Get genes that interact with the given gene"""
        query = """
        MATCH (g1:Gene {id: $gene_id})-[:INTERACTS_WITH]->(g2:Gene)
        RETURN collect(g2.id) as interactions
        """
        results = await self.execute_query(query, {"gene_id": gene_id})
        return results[0].get("interactions", []) if results else []
    
    async def find_pathogenic_mutations(
        self,
        min_pathogenicity: str = "likely_pathogenic"
    ) -> List[Dict[str, Any]]:
        """Find pathogenic mutations"""
        query = """
        MATCH (m:Mutation)
        WHERE m.pathogenicity IN ['pathogenic', 'likely_pathogenic', 'uncertain_significance']
        OPTIONAL MATCH (g:Gene)-[:HAS_MUTATION]->(m)
        OPTIONAL MATCH (m)-[:CAUSES]->(d:Disease)
        RETURN m, g.id as gene, d.name as disease
        ORDER BY m.pathogenicity
        LIMIT 100
        """
        return await self.execute_query(query)
    
    async def search_genes(self, search_term: str) -> List[Dict[str, Any]]:
        """Search genes by name or symbol"""
        query = """
        MATCH (g:Gene)
        WHERE g.id CONTAINS $search_term OR g.name CONTAINS $search_term
        RETURN g
        LIMIT 20
        """
        return await self.execute_query(query, {"search_term": search_term})
    
    async def create_gene(
        self,
        gene_id: str,
        name: str,
        chromosome: str,
        start_position: int,
        end_position: int,
        description: str = ""
    ) -> Dict[str, Any]:
        """Create a new gene node"""
        query = """
        CREATE (g:Gene {
            id: $gene_id,
            name: $name,
            chromosome: $chromosome,
            start_position: $start_position,
            end_position: $end_position,
            description: $description,
            created_at: datetime()
        })
        RETURN g
        """
        results = await self.execute_query(query, {
            "gene_id": gene_id,
            "name": name,
            "chromosome": chromosome,
            "start_position": start_position,
            "end_position": end_position,
            "description": description
        })
        return results[0] if results else None
    
    async def create_mutation(
        self,
        mutation_id: str,
        gene_id: str,
        mutation_type: str,
        position: int,
        ref_allele: str,
        alt_allele: str,
        pathogenicity: str = "unknown",
        clinvar_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new mutation and link to gene"""
        query = """
        MATCH (g:Gene {id: $gene_id})
        CREATE (m:Mutation {
            id: $mutation_id,
            type: $mutation_type,
            position: $position,
            ref_allele: $ref_allele,
            alt_allele: $alt_allele,
            pathogenicity: $pathogenicity,
            clinvar_id: $clinvar_id,
            created_at: datetime()
        })
        CREATE (g)-[:HAS_MUTATION]->(m)
        RETURN m, g.id as gene
        """
        results = await self.execute_query(query, {
            "mutation_id": mutation_id,
            "gene_id": gene_id,
            "mutation_type": mutation_type,
            "position": position,
            "ref_allele": ref_allele,
            "alt_allele": alt_allele,
            "pathogenicity": pathogenicity,
            "clinvar_id": clinvar_id
        })
        return results[0] if results else None
    
    async def link_mutation_to_disease(
        self,
        mutation_id: str,
        disease_id: str,
        evidence_level: str = "moderate",
        mechanism: str = "unknown"
    ) -> bool:
        """Link a mutation to a disease"""
        query = """
        MATCH (m:Mutation {id: $mutation_id})
        MATCH (d:Disease {id: $disease_id})
        CREATE (m)-[:CAUSES {
            evidence_level: $evidence_level,
            mechanism: $mechanism,
            created_at: datetime()
        }]->(d)
        RETURN m, d
        """
        results = await self.execute_query(query, {
            "mutation_id": mutation_id,
            "disease_id": disease_id,
            "evidence_level": evidence_level,
            "mechanism": mechanism
        })
        return len(results) > 0
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get database statistics"""
        queries = {
            "genes": "MATCH (g:Gene) RETURN count(g) as count",
            "mutations": "MATCH (m:Mutation) RETURN count(m) as count",
            "diseases": "MATCH (d:Disease) RETURN count(d) as count",
            "proteins": "MATCH (p:Protein) RETURN count(p) as count",
            "papers": "MATCH (pa:Paper) RETURN count(pa) as count",
            "drugs": "MATCH (dr:Drug) RETURN count(dr) as count"
        }
        
        stats = {}
        for key, query in queries.items():
            result = await self.execute_query(query)
            stats[key] = result[0].get("count", 0) if result else 0
        
        return stats
    
    async def initialize_schema(self) -> None:
        """Initialize database constraints and indexes"""
        constraints = [
            "CREATE CONSTRAINT gene_id IF NOT EXISTS FOR (g:Gene) REQUIRE g.id IS UNIQUE",
            "CREATE CONSTRAINT mutation_id IF NOT EXISTS FOR (m:Mutation) REQUIRE m.id IS UNIQUE",
            "CREATE CONSTRAINT disease_id IF NOT EXISTS FOR (d:Disease) REQUIRE d.id IS UNIQUE",
            "CREATE CONSTRAINT protein_id IF NOT EXISTS FOR (p:Protein) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT drug_id IF NOT EXISTS FOR (dr:Drug) REQUIRE dr.id IS UNIQUE",
            "CREATE CONSTRAINT paper_id IF NOT EXISTS FOR (pa:Paper) REQUIRE pa.id IS UNIQUE"
        ]
        
        for constraint in constraints:
            try:
                await self.execute_query(constraint)
                logger.info(f"Created constraint: {constraint[:50]}...")
            except Exception as e:
                logger.debug(f"Constraint may already exist: {e}")
        
        logger.info("Neo4j schema initialized")


# Singleton instance
_neo4j_service: Optional[Neo4jService] = None


def get_neo4j_service() -> Neo4jService:
    """Get singleton Neo4j service instance"""
    global _neo4j_service
    if _neo4j_service is None:
        _neo4j_service = Neo4jService()
    return _neo4j_service
