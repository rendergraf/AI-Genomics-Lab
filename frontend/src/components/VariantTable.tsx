'use client'

/**
 * AI Genomics Lab - Variant Table Component
 * Tabla de variantes genéticas con búsqueda, filtros y ordenamiento
 * 
 * Author: Xavier Araque
 * Email: xavieraraque@gmail.com
 * GitHub: https://github.com/rendergraf/AI-Genomics-Lab
 * Version: 0.1
 * License: MIT
 */

import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Download, ChevronUp, ChevronDown, RefreshCw, Eye, FileText } from 'lucide-react'
import api from '@/lib/api'

interface Variant {
  id: string
  gene: string
  position: number
  chrom?: string
  ref: string
  alt: string
  type: string
  pathogenicity: string
  qual?: number
  filter?: string
  dp?: number
  ad?: string
  geneId?: string
  disease?: string
}

interface VariantTableProps {
  variants?: Variant[]
  onVariantSelect?: (variant: Variant) => void
}

type SortField = 'gene' | 'position' | 'pathogenicity' | 'type' | 'qual'
type SortDirection = 'asc' | 'desc'

export default function VariantTable({ variants = [], onVariantSelect }: VariantTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterPathogenicity, setFilterPathogenicity] = useState('all')
  const [sortField, setSortField] = useState<SortField>('position')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Sample variants if none provided
  const sampleVariants: Variant[] = [
    { 
      id: 'chr17:43070976', 
      gene: 'BRCA1', 
      chrom: '17',
      position: 43070976, 
      ref: 'AG', 
      alt: '-', 
      type: 'indel', 
      pathogenicity: 'pathogenic',
      qual: 99.8,
      filter: 'PASS',
      dp: 150,
      ad: '0,150',
      disease: 'Breast Cancer'
    },
    { 
      id: 'chr17:7668402', 
      gene: 'TP53', 
      chrom: '17',
      position: 7668402, 
      ref: 'C', 
      alt: 'T', 
      type: 'SNP', 
      pathogenicity: 'pathogenic',
      qual: 98.5,
      filter: 'PASS',
      dp: 200,
      ad: '20,180',
      disease: 'Li-Fraumeni Syndrome'
    },
    { 
      id: 'chr13:32936741', 
      gene: 'BRCA2', 
      chrom: '13',
      position: 32936741, 
      ref: 'G', 
      alt: 'A', 
      type: 'SNP', 
      pathogenicity: 'likely_pathogenic',
      qual: 85.2,
      filter: 'PASS',
      dp: 180,
      ad: '45,135',
      disease: 'Breast Cancer'
    },
    { 
      id: 'chr7:117199683', 
      gene: 'EGFR', 
      chrom: '7',
      position: 117199683, 
      ref: 'T', 
      alt: 'G', 
      type: 'SNP', 
      pathogenicity: 'uncertain',
      qual: 45.6,
      filter: 'VQLOW',
      dp: 120,
      ad: '60,60',
      disease: 'Lung Cancer'
    },
    { 
      id: 'chr3:178936091', 
      gene: 'PIK3CA', 
      chrom: '3',
      position: 178936091, 
      ref: 'A', 
      alt: 'G', 
      type: 'SNP', 
      pathogenicity: 'likely_benign',
      qual: 25.3,
      filter: 'PASS',
      dp: 250,
      ad: '200,50',
    },
    { 
      id: 'chr12:25219940', 
      gene: 'KRAS', 
      chrom: '12',
      position: 25219940, 
      ref: 'G', 
      alt: 'T', 
      type: 'SNP', 
      pathogenicity: 'pathogenic',
      qual: 95.0,
      filter: 'PASS',
      dp: 300,
      ad: '30,270',
      disease: 'Pancreatic Cancer'
    },
    { 
      id: 'chr2:29416362', 
      gene: 'ALK', 
      chrom: '2',
      position: 29416362, 
      ref: 'T', 
      alt: 'C', 
      type: 'SNP', 
      pathogenicity: 'uncertain',
      qual: 55.8,
      filter: 'PASS',
      dp: 180,
      ad: '90,90',
    },
    { 
      id: 'chr10:87965023', 
      gene: 'PTEN', 
      chrom: '10',
      position: 87965023, 
      ref: '-', 
      alt: 'ATG', 
      type: 'indel', 
      pathogenicity: 'likely_pathogenic',
      qual: 88.4,
      filter: 'PASS',
      dp: 140,
      ad: '0,140',
      disease: 'Cowden Syndrome'
    },
  ]

  const displayVariants = variants.length ? variants : sampleVariants

  // Filter and sort variants
  const filteredVariants = useMemo(() => {
    let result = displayVariants.filter(v => {
      const matchesSearch = v.gene.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (v.disease?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      const matchesTypeFilter = filterType === 'all' || v.type === filterType
      const matchesPathFilter = filterPathogenicity === 'all' || v.pathogenicity === filterPathogenicity
      return matchesSearch && matchesTypeFilter && matchesPathFilter
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'gene':
          comparison = a.gene.localeCompare(b.gene)
          break
        case 'position':
          comparison = a.position - b.position
          break
        case 'pathogenicity':
          const pathOrder = ['pathogenic', 'likely_pathogenic', 'uncertain', 'likely_benign', 'benign']
          comparison = pathOrder.indexOf(a.pathogenicity) - pathOrder.indexOf(b.pathogenicity)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'qual':
          comparison = (a.qual || 0) - (b.qual || 0)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [displayVariants, searchTerm, filterType, filterPathogenicity, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleVariantSelection = (id: string) => {
    const newSelected = new Set(selectedVariants)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedVariants(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedVariants.size === filteredVariants.length) {
      setSelectedVariants(new Set())
    } else {
      setSelectedVariants(new Set(filteredVariants.map(v => v.id)))
    }
  }

  const exportVariants = async (format: 'csv' | 'vcf' | 'json') => {
    const variantsToExport = selectedVariants.size > 0 
      ? filteredVariants.filter(v => selectedVariants.has(v.id))
      : filteredVariants

    if (format === 'csv') {
      const headers = ['ID', 'Gene', 'Chrom', 'Position', 'Ref', 'Alt', 'Type', 'Pathogenicity', 'Quality', 'Filter']
      const rows = variantsToExport.map(v => [
        v.id, v.gene, v.chrom || '', v.position, v.ref, v.alt, v.type, v.pathogenicity, v.qual?.toString() || '', v.filter || ''
      ])
      
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `variants_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const getPathogenicityColor = (pathogenicity: string) => {
    switch (pathogenicity.toLowerCase()) {
      case 'pathogenic':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'likely_pathogenic':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'uncertain':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'likely_benign':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'benign':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by gene, position, or disease..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
            showFilters ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>

        <div className="flex gap-2">
          <button 
            onClick={() => exportVariants('csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button 
            onClick={() => exportVariants('json')}
            className="flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent"
          >
            <FileText className="h-4 w-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Variant Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-md border bg-background text-sm"
            >
              <option value="all">All Types</option>
              <option value="SNP">SNP</option>
              <option value="indel">Indel</option>
              <option value="structural">Structural</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pathogenicity</label>
            <select
              value={filterPathogenicity}
              onChange={(e) => setFilterPathogenicity(e.target.value)}
              className="px-3 py-1.5 rounded-md border bg-background text-sm"
            >
              <option value="all">All</option>
              <option value="pathogenic">Pathogenic</option>
              <option value="likely_pathogenic">Likely Pathogenic</option>
              <option value="uncertain">Uncertain</option>
              <option value="likely_benign">Likely Benign</option>
              <option value="benign">Benign</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterType('all')
                setFilterPathogenicity('all')
              }}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Selection Info */}
      {selectedVariants.size > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{selectedVariants.size} variant(s) selected</span>
          <button
            onClick={() => setSelectedVariants(new Set())}
            className="text-primary hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredVariants.length} of {displayVariants.length} variants
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedVariants.size === filteredVariants.length && filteredVariants.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th 
                className="px-3 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort('gene')}
              >
                <div className="flex items-center gap-1">
                  Gene <SortIcon field="gene" />
                </div>
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium">Chrom</th>
              <th 
                className="px-3 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort('position')}
              >
                <div className="flex items-center gap-1">
                  Position <SortIcon field="position" />
                </div>
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium">Ref → Alt</th>
              <th 
                className="px-3 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Type <SortIcon field="type" />
                </div>
              </th>
              <th 
                className="px-3 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80"
                onClick={() => handleSort('pathogenicity')}
              >
                <div className="flex items-center gap-1">
                  Pathogenicity <SortIcon field="pathogenicity" />
                </div>
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium">Disease</th>
              <th className="px-3 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVariants.map((variant) => (
              <tr key={variant.id} className="border-t hover:bg-accent/50">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedVariants.has(variant.id)}
                    onChange={() => toggleVariantSelection(variant.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-3 text-sm font-medium">{variant.gene}</td>
                <td className="px-3 py-3 text-sm font-mono">{variant.chrom || variant.id.split(':')[0].replace('chr', '')}</td>
                <td className="px-3 py-3 text-sm font-mono">{variant.position.toLocaleString()}</td>
                <td className="px-3 py-3 text-sm font-mono">
                  <span className="text-blue-600">{variant.ref}</span>
                  {' → '}
                  <span className="text-red-600">{variant.alt}</span>
                </td>
                <td className="px-3 py-3 text-sm">{variant.type}</td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPathogenicityColor(variant.pathogenicity)}`}>
                    {variant.pathogenicity.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm">
                  {variant.disease || '-'}
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    {onVariantSelect && (
                      <button
                        onClick={() => onVariantSelect(variant)}
                        className="p-1 hover:bg-accent rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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
