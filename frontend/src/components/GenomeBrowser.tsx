'use client'

/**
 * AI Genomics Lab - Genome Browser Component
 * Visualización del genoma con IGV
 * 
 * Author: Xavier Araque
 * Email: xavieraraque@gmail.com
 * GitHub: https://github.com/rendergraf/AI-Genomics-Lab
 * Version: 0.1
 * License: MIT
 */

import { useEffect, useRef, useState } from 'react'

interface GenomeBrowserProps {
  locus?: string
}

export default function GenomeBrowser({ locus = '17:43044295-43170245' }: GenomeBrowserProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocus, setCurrentLocus] = useState(locus)

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

        const config = {
          genome: 'hg38',
          locus: currentLocus,
        }

        // Create browser
        await igv.createBrowser(containerRef.current as HTMLElement, config as any)
        setIsLoading(false)
      } catch (err: any) {
        console.error('Error initializing IGV:', err)
        setError(err.message || 'Failed to load genome browser')
        setIsLoading(false)
      }
    }

    initBrowser()
  }, [isClient])

  if (!isClient) {
    return (
      <div className="w-full h-[600px] rounded-lg border bg-slate-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading genome browser...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Locus</label>
          <input
            type="text"
            value={currentLocus}
            onChange={(e) => setCurrentLocus(e.target.value)}
            placeholder="e.g., 17:43044295-43170245"
            className="w-full px-3 py-2 rounded-md border bg-background"
          />
        </div>
      </div>

      {/* Browser Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <p className="text-muted-foreground">Loading genome browser...</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
            {error}
          </div>
        )}
        
        <div 
          ref={containerRef} 
          className="w-full h-[600px] rounded-lg border bg-white"
        />
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { name: 'BRCA1', locus: '17:43044295-43170245' },
          { name: 'TP53', locus: '17:7661779-7687538' },
          { name: 'EGFR', locus: '7:55019017-55242528' },
          { name: 'KRAS', locus: '12:25205246-25380203' },
        ].map((gene) => (
          <button
            key={gene.name}
            onClick={() => setCurrentLocus(gene.locus)}
            className="px-3 py-2 rounded-md border bg-background hover:bg-accent text-sm"
          >
            {gene.name}
          </button>
        ))}
      </div>
    </div>
  )
}
