'use client'

/**
 * AI Genomics Lab - Variant Table Component
 * Tabla de variantes genéticas con búsqueda y filtros
 * 
 * Author: Xavier Araque
 * Email: xavieraraque@gmail.com
 * GitHub: https://github.com/rendergraf/AI-Genomics-Lab
 * Version: 0.1
 * License: MIT
 */

import { useState } from 'react'
import { Search, Filter, Download } from 'lucide-react'

interface Variant {
  id: string
  gene: string
  position: number
  ref: string
  alt: string
  type: string
  pathogenicity: string
}

interface VariantTableProps {
  variants?: Variant[]
}

export default function VariantTable({ variants = [] }: VariantTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  
  // Sample variants if none provided
  const sampleVariants: Variant[] = [
    { id: 'chr17:43070976', gene: 'BRCA1', position: 43070976, ref: 'AG', alt: '-', type: 'indel', pathogenicity: 'pathogenic' },
    { id: 'chr17:7668402', gene: 'TP53', position: 7668402, ref: 'C', alt: 'T', type: 'SNP', pathogenicity: 'pathogenic' },
    { id: 'chr13:32936741', gene: 'BRCA2', position: 32936741, ref: 'G', alt: 'A', type: 'SNP', pathogenicity: 'likely_pathogenic' },
    { id: 'chr7:117199683', gene: 'EGFR', position: 117199683, ref: 'T', alt: 'G', type: 'SNP', pathogenicity: 'uncertain' },
    { id: 'chr3:178936091', gene: 'PIK3CA', position: 178936091, ref: 'A', alt: 'G', type: 'SNP', pathogenicity: 'likely_benign' },
  ]

  const displayVariants = variants.length ? variants : sampleVariants
  
  const filteredVariants = displayVariants.filter(v => {
    const matchesSearch = v.gene.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || v.type === filterType
    return matchesSearch && matchesFilter
  })

  const getPathogenicityColor = (pathogenicity: string) => {
    switch (pathogenicity.toLowerCase()) {
      case 'pathogenic':
        return 'bg-red-100 text-red-800'
      case 'likely_pathogenic':
        return 'bg-orange-100 text-orange-800'
      case 'uncertain':
        return 'bg-yellow-100 text-yellow-800'
      case 'likely_benign':
        return 'bg-blue-100 text-blue-800'
      case 'benign':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by gene or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-md border bg-background"
        >
          <option value="all">All Types</option>
          <option value="SNP">SNP</option>
          <option value="indel">Indel</option>
          <option value="structural">Structural</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Gene</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Ref → Alt</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Pathogenicity</th>
            </tr>
          </thead>
          <tbody>
            {filteredVariants.map((variant) => (
              <tr key={variant.id} className="border-t hover:bg-accent/50">
                <td className="px-4 py-3 text-sm">{variant.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{variant.gene}</td>
                <td className="px-4 py-3 text-sm">{variant.position.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-mono">{variant.ref} → {variant.alt}</td>
                <td className="px-4 py-3 text-sm">{variant.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPathogenicityColor(variant.pathogenicity)}`}>
                    {variant.pathogenicity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredVariants.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No variants found matching your criteria
        </div>
      )}
    </div>
  )
}
