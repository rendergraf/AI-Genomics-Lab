// ============================================
// 🧬 AI Genomics Lab - Neo4j Schema
// Graph Database Schema for Genomic Knowledge
// ============================================

// ============================================
// CREATE CONSTRAINTS
// ============================================

// Unique constraints for primary identifiers
CREATE CONSTRAINT gene_id IF NOT EXISTS
FOR (g:Gene) REQUIRE g.id IS UNIQUE;

CREATE CONSTRAINT mutation_id IF NOT EXISTS
FOR (m:Mutation) REQUIRE m.id IS UNIQUE;

CREATE CONSTRAINT disease_id IF NOT EXISTS
FOR (d:Disease) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT protein_id IF NOT EXISTS
FOR (p:Protein) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT drug_id IF NOT EXISTS
FOR (dr:Drug) REQUIRE dr.id IS UNIQUE;

CREATE CONSTRAINT paper_id IF NOT EXISTS
FOR (pa:Paper) REQUIRE pa.id IS UNIQUE;


// ============================================
// NODE DEFINITIONS
// ============================================

// Gene node properties
// - id: Gene symbol (e.g., BRCA1, TP53)
// - name: Full gene name
// - chromosome: Chromosome location
// - start_position: Genomic start
// - end_position: Genomic end
// - strand: + or -
// - description: Gene description

// Mutation node properties
// - id: Mutation identifier (e.g., c.185delAG)
// - type: Type (SNP, indel, structural)
// - position: Genomic position
// - ref_allele: Reference allele
// - alt_allele: Alternate allele
// - pathogenicity: Pathogenicity classification
// - clinvar_id: ClinVar identifier

// Disease node properties
// - id: Disease identifier (e.g., OMIM:604370)
// - name: Disease name
// - description: Disease description
// - category: Disease category
// - inheritance: Inheritance pattern

// Protein node properties
// - id: UniProt identifier
// - name: Protein name
// - function: Molecular function
// - length: Amino acid length

// Drug node properties
// - id: DrugBank identifier
// - name: Drug name
// - mechanism: Mechanism of action
// - target: Drug target

// Paper node properties
// - id: PubMed ID
// - title: Paper title
// - authors: Author list
// - year: Publication year
// - journal: Journal name
// - abstract: Paper abstract


// ============================================
// RELATIONSHIP DEFINITIONS
// ============================================

// Gene -> Mutation relationships
// (Gene)-[:HAS_MUTATION]->(Mutation)
// Properties: discovery_date, population_frequency

// Mutation -> Disease relationships
// (Mutation)-[:CAUSES]->(Disease)
// Properties: evidence_level, mechanism

// Gene -> Disease relationships
// (Gene)-[:ASSOCIATED_WITH]->(Disease)
// Properties: evidence_type, odds_ratio

// Gene -> Protein relationships
// (Gene)-[:ENCODES]->(Protein)

// Protein -> Drug relationships
// (Protein)-[:TARGETED_BY]->(Drug)

// Gene -> Gene relationships (protein interactions)
// (Gene)-[:INTERACTS_WITH]->(Gene)
// Properties: interaction_type, source

// Gene -> Pathway relationships
// (Gene)-[:PART_OF]->(Pathway)

// Mutation -> Paper relationships
// (Mutation)-[:REPORTED_IN]->(Paper)

// Gene -> Paper relationships
// (Gene)-[:CITED_IN]->(Paper)


// ============================================
// SAMPLE DATA QUERIES
// ============================================

// Create sample gene
CREATE (g:Gene {
    id: 'BRCA1',
    name: 'BRCA1 DNA Repair Associated',
    chromosome: '17',
    start_position: 43044295,
    end_position: 43170245,
    strand: '+',
    description: 'BRCA1 repairs DNA and maintains genome stability'
})

CREATE (g2:Gene {
    id: 'TP53',
    name: 'Tumor Protein P53',
    chromosome: '17',
    start_position: 7661779,
    stop_position: 7687538,
    strand: '+',
    description: 'TP53 is a tumor suppressor gene'
})

// Create sample mutation
CREATE (m:Mutation {
    id: 'c.68_69delAG',
    type: 'indel',
    position: 43070976,
    ref_allele: 'AG',
    alt_allele: '-',
    pathogenicity: 'pathogenic',
    clinvar_id: 'CV0000456'
})

// Create sample disease
CREATE (d:Disease {
    id: 'OMIM:604370',
    name: 'Hereditary Breast and Ovarian Cancer',
    description: 'Hereditary cancer syndrome',
    category: 'cancer',
    inheritance: 'autosomal_dominant'
})

// Create relationships
MATCH (g:Gene {id: 'BRCA1'})
MATCH (m:Mutation {id: 'c.68_69delAG'})
CREATE (g)-[:HAS_MUTATION {discovery_date: '1994', population_frequency: '0.001'}]->(m)

MATCH (m:Mutation {id: 'c.68_69delAG'})
MATCH (d:Disease {id: 'OMIM:604370'})
CREATE (m)-[:CAUSES {evidence_level: 'strong', mechanism: 'loss_of_function'}]->(d)

MATCH (g:Gene {id: 'BRCA1'})
MATCH (g2:Gene {id: 'TP53'})
CREATE (g)-[:INTERACTS_WITH {interaction_type: 'co_complex', source: 'BioGRID'}]->(g2)


// ============================================
// SAMPLE QUERIES
// ============================================

// Find all mutations in a gene
MATCH (g:Gene)-[:HAS_MUTATION]->(m:Mutation)
WHERE g.id = 'BRCA1'
RETURN g.id, collect(m.id) as mutations

// Find disease-causing mutations
MATCH (m:Mutation)-[:CAUSES]->(d:Disease)
WHERE m.pathogenicity = 'pathogenic'
RETURN d.name, collect(m.id) as mutations
LIMIT 10

// Find gene interactions
MATCH (g1:Gene)-[:INTERACTS_WITH]->(g2:Gene)
RETURN g1.id, collect(g2.id) as interacting_genes
LIMIT 10

// Find drugs for a gene
MATCH (g:Gene)-[:ENCODES]->(p:Protein)-[:TARGETED_BY]->(dr:Drug)
RETURN g.id, collect(dr.name) as drugs
LIMIT 10
