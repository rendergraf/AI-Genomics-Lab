'use client'

/**
 * AI Genomics Lab - Genome Browser Component
 * Visualización del genoma con IGV.js
 * 
 * Author: Xavier Araque
 * Email: xavieraraque@gmail.com
 * GitHub: https://github.com/rendergraf/AI-Genomics-Lab
 * Version: 0.1
 * License: MIT
 */

import { useEffect, useRef, useState } from 'react'
import { Search, ZoomIn, ZoomOut, RefreshCw, ChevronDown } from 'lucide-react'

interface GenomeBrowserProps {
  initialLocus?: string
  bamUrl?: string
  vcfUrl?: string
}

interface GeneLocus {
  name: string
  locus: string
  chrom: string
  start: number
  end: number
  description?: string
}

// Common cancer genes with their positions (hg38)
const CANCER_GENES: GeneLocus[] = [
  { name: 'BRCA1', locus: '17:43044295-43170245', chrom: '17', start: 43044295, end: 43170245, description: 'Breast Cancer 1' },
  { name: 'BRCA2', locus: '13:32315086-32400268', chrom: '13', start: 32315086, end: 32400268, description: 'Breast Cancer 2' },
  { name: 'TP53', locus: '17:7661779-7687538', chrom: '17', start: 7661779, end: 7687538, description: 'Tumor Protein P53' },
  { name: 'EGFR', locus: '7:55019017-55242528', chrom: '7', start: 55019017, end: 55242528, description: 'Epidermal Growth Factor Receptor' },
  { name: 'KRAS', locus: '12:25205246-25380203', chrom: '12', start: 25205246, end: 25380203, description: 'KRAS Proto-Oncogene' },
  { name: 'PIK3CA', locus: '3:178866311-178952498', chrom: '3', start: 178866311, end: 178952498, description: 'PI3K Catalytic Subunit Alpha' },
  { name: 'ALK', locus: '2:29192773-30144425', chrom: '2', start: 29192773, end: 30144425, description: 'Anaplastic Lymphoma Kinase' },
  { name: 'BRAF', locus: '7:140713327-140924929', chrom: '7', start: 140713327, end: 140924929, description: 'B-Raf Proto-Oncogene' },
  { name: 'ERBB2', locus: '17:39750535-39793776', chrom: '17', start: 39750535, end: 39793776, description: 'HER2/neu' },
  { name: 'PTEN', locus: '10:87863631-87971930', chrom: '10', start: 87863631, end: 87971930, description: 'Phosphatase and Tensin Homolog' },
  { name: 'CDH1', locus: '16:68771128-68835565', chrom: '16', start: 68771128, end: 68835565, description: 'Cadherin 1' },
  { name: 'STK11', locus: '19:1207009-1221857', chrom: '19', start: 1207009, end: 1221857, description: 'Serine/Threonine Kinase 11' },
  { name: 'CDKN2A', locus: '9:21967751-22014553', chrom: '9', start: 21967751, end: 22014553, description: 'Cyclin Dependent Kinase Inhibitor 2A' },
  { name: 'MLH1', locus: '3:37090048-37176548', chrom: '3', start: 37090048, end: 37176548, description: 'MutL Homolog 1' },
  { name: 'MSH2', locus: '2:47410465-47632558', chrom: '2', start: 47410465, end: 47632558, description: 'MutS Homolog 2' },
  { name: 'APC', locus: '5:112707498-112846239', chrom: '5', start: 112707498, end: 112846239, description: 'Adenomatous Polyposis Coli' },
]

export default function GenomeBrowser({ 
  initialLocus = '17:43044295-43170245',
  bamUrl,
  vcfUrl 
}: GenomeBrowserProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const browserRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocus, setCurrentLocus] = useState(initialLocus)
  const [showGeneDropdown, setShowGeneDropdown] = useState(false)
  const [customLocusInput, setCustomLocusInput] = useState('')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    const initBrowser = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const igvModule = await import('igv')
        const igv = igvModule.default || igvModule

        // Build track configuration
        const tracks: any[] = [
          {
            name: 'Reference',
            type: 'annotation',
            format: 'refgene',
            sourceType: 'file',
            url: 'https://s3.amazonaws.com/igv.broadinstitute.org/annotations/hg38/genes/refGene.hg38.txt.gz',
            indexURL: 'https://s3.amazonaws.com/igv.broadinstitute.org/annotations/hg38/genes/refGene.hg38.txt.gz.tbi',
            displayMode: 'EXPANDED',
            height: 100,
          }
        ]

        // Add BAM track if provided
        if (bamUrl) {
          tracks.push({
            name: 'Alignments',
            type: 'bam',
            url: bamUrl,
            displayMode: 'EXPANDED',
            height: 300,
          })
        }

        // Add VCF track if provided
        if (vcfUrl) {
          tracks.push({
            name: 'Variants',
            type: 'vcf',
            url: vcfUrl,
            displayMode: 'COLLAPSED',
            height: 50,
          })
        }

        const config = {
          genome: 'hg38',
          locus: currentLocus,
          tracks,
        }

        // Create browser
        if (containerRef.current) {
          // Clear previous content
          containerRef.current.innerHTML = ''
          
          browserRef.current = await igv.createBrowser(containerRef.current as HTMLElement, config as any)
        }
        
        setIsLoading(false)
      } catch (err: any) {
        console.error('Error initializing IGV:', err)
        setError(err.message || 'Failed to load genome browser')
        setIsLoading(false)
      }
    }

    initBrowser()

    return () => {
      if (browserRef.current) {
        try {
          browserRef.current.destroy()
          browserRef.current = null
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [isClient, bamUrl, vcfUrl])

  const navigateToGene = (gene: GeneLocus) => {
    setCurrentLocus(gene.locus)
    setShowGeneDropdown(false)
    
    if (browserRef.current) {
      browserRef.current.search(gene.locus)
    }
  }

  const navigateToLocus = (locus?: string) => {
    const targetLocus = locus || customLocusInput
    if (!targetLocus) return
    
    setCurrentLocus(targetLocus)
    
    if (browserRef.current) {
      browserRef.current.search(targetLocus)
    }
  }

  const zoomIn = () => {
    if (browserRef.current) {
      browserRef.current.zoomIn()
    }
  }

  const zoomOut = () => {
    if (browserRef.current) {
      browserRef.current.zoomOut()
    }
  }

  const resetView = () => {
    setCurrentLocus(initialLocus)
    if (browserRef.current) {
      browserRef.current.search(initialLocus)
    }
  }

  if (!isClient) {
    return (
      <div className="w-full h-[600px] rounded-lg border bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading genome browser...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Gene Selector */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Go to Gene</label>
          <button
            onClick={() => setShowGeneDropdown(!showGeneDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-accent min-w-[160px] justify-between"
          >
            <span className="truncate">
              {CANCER_GENES.find(g => g.locus === currentLocus)?.name || 'Select Gene'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showGeneDropdown && (
            <div className="absolute z-10 mt-1 w-64 max-h-80 overflow-auto bg-background border rounded-md shadow-lg">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search genes..."
                  className="w-full px-2 py-1 text-sm border rounded mb-2"
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase()
                    // Filter is handled by CSS in real implementation
                  }}
                />
                {CANCER_GENES.map((gene) => (
                  <button
                    key={gene.name}
                    onClick={() => navigateToGene(gene)}
                    className="w-full text-left px-2 py-2 hover:bg-accent rounded flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">{gene.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">chr{gene.chrom}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom Locus Input */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Locus (chr:start-end)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customLocusInput}
              onChange={(e) => setCustomLocusInput(e.target.value)}
              placeholder="e.g., 17:43044295-43170245"
              className="flex-1 px-3 py-2 rounded-md border bg-background font-mono text-sm"
              onKeyPress={(e) => e.key === 'Enter' && navigateToLocus()}
            />
            <button 
              onClick={() => navigateToLocus()}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex gap-1">
          <button 
            onClick={zoomIn}
            className="p-2 rounded-md border bg-background hover:bg-accent"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button 
            onClick={zoomOut}
            className="p-2 rounded-md border bg-background hover:bg-accent"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button 
            onClick={resetView}
            className="p-2 rounded-md border bg-background hover:bg-accent"
            title="Reset View"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Current Position Display */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Current Position:</span>
        <code className="bg-muted px-2 py-1 rounded">{currentLocus}</code>
      </div>

      {/* Browser Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading genome data...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
            <p className="font-medium">Error loading genome browser</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div 
          ref={containerRef} 
          className="w-full h-[600px] rounded-lg border bg-white"
        />
      </div>

      {/* Quick Navigation - Gene Chips */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Quick Navigate</label>
        <div className="flex flex-wrap gap-2">
          {CANCER_GENES.slice(0, 8).map((gene) => (
            <button
              key={gene.name}
              onClick={() => navigateToGene(gene)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                currentLocus === gene.locus
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {gene.name}
            </button>
          ))}
          {CANCER_GENES.length > 8 && (
            <button
              onClick={() => setShowGeneDropdown(true)}
              className="px-3 py-1.5 rounded-full border text-sm bg-muted hover:bg-muted/80"
            >
              +{CANCER_GENES.length - 8} more
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
