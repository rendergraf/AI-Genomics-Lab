'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Dna, Upload, FileText, Play, CheckCircle, RefreshCw, Trash2, X 
} from 'lucide-react'
import { Area } from '@/components/ui/Area'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard/StatCard'
import { useDashboardStats, useServicesStatus } from '@/hooks/useApi'
import api from '@/lib/api'

export function DashboardSection() {
  const { stats, isLoading: isLoadingStats } = useDashboardStats()
  const { services, isLoading: isLoadingServices, refetch: refetchServices } = useServicesStatus()

  const [referenceGenome, setReferenceGenome] = useState<File | null>(null)
  const [fastqFiles, setFastqFiles] = useState<File[]>([])
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexingProgress, setIndexingProgress] = useState<string[]>([])
  const [showIndexingConsole, setShowIndexingConsole] = useState(false)
  const [genomeName, setGenomeName] = useState('')
  const [genomeSpecies, setGenomeSpecies] = useState('')
  const [genomeBuild, setGenomeBuild] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedGenomeId, setUploadedGenomeId] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [isFastqDragging, setIsFastqDragging] = useState(false)

  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        const result = await api.getReferenceGenomes()
        if (result.data?.genomes && result.data.genomes.length > 0) {
          const uploadedGenome = result.data.genomes.find((g: { status: string }) => g.status === 'uploaded')
          if (uploadedGenome) {
            setUploadedGenomeId(uploadedGenome.id)
          }
        }
      } catch (error) {
        console.error('Error fetching genomes:', error)
      }
    }
    fetchGenomes()
  }, [])

  const handleFastqDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsFastqDragging(true)
  }, [])

  const handleFastqDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsFastqDragging(false)
  }, [])

  const handleFastqDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsFastqDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.name.endsWith('.fastq.gz') || f.name.endsWith('.fastq') || f.name.endsWith('.fq.gz') || f.name.endsWith('.fq')
    )
    setFastqFiles(prev => [...prev, ...files])
  }, [])

  const handleFastqFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => 
        f.name.endsWith('.fastq.gz') || f.name.endsWith('.fastq') || f.name.endsWith('.fq.gz') || f.name.endsWith('.fq')
      )
      setFastqFiles(prev => [...prev, ...files])
    }
  }

  const removeFastqFile = (index: number) => {
    setFastqFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenomeUpload = async () => {
    if (!referenceGenome || !genomeName || !genomeSpecies || !genomeBuild) return
    
    setIsUploading(true)
    setUploadError(null)
    try {
      const result = await api.uploadReferenceGenome(genomeName, genomeSpecies, genomeBuild, referenceGenome)
      if (result && result.id) {
        setUploadedGenomeId(result.id)
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      setUploadError(err.message || 'Failed to upload genome')
    }
    setIsUploading(false)
  }

  const handleIndexGenome = async () => {
    if (!uploadedGenomeId || fastqFiles.length === 0) return
    
    setIsIndexing(true)
    setShowIndexingConsole(true)
    setIndexingProgress([])
    
    try {
      const eventSource = await api.indexGenomeWithFastq(uploadedGenomeId, fastqFiles)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.message) {
            setIndexingProgress(prev => [...prev, data.message])
          }
          if (data.type === 'complete') {
            setIsIndexing(false)
          }
        } catch (e) {
          setIndexingProgress(prev => [...prev, event.data])
        }
      }
      
      eventSource.onerror = () => {
        setIsIndexing(false)
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      setIndexingProgress(prev => [...prev, `Error: ${err.message}`])
      setIsIndexing(false)
    }
  }

  const getServiceIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <X className="h-4 w-4 text-red-500" />
      default: return <RefreshCw className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Dna} label="Samples" value={stats.samples} isLoading={isLoadingStats} />
        <StatCard icon={Upload} label="Analyses" value={stats.analyses} isLoading={isLoadingStats} />
        <StatCard icon={FileText} label="Genes" value={stats.genes} isLoading={isLoadingStats} />
        <StatCard icon={Play} label="Mutations" value={stats.mutations} isLoading={isLoadingStats} />
      </div>

      <Area>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Reference Genomes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Upload Genome</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload reference genome FASTA file (e.g., hg38.fa)</p>
            <div className="space-y-3">
              <Input
                type="text"
                value={genomeName}
                onChange={(e) => setGenomeName(e.target.value)}
                placeholder="Name (e.g., hg38)"
              />
              <Input
                type="text"
                value={genomeSpecies}
                onChange={(e) => setGenomeSpecies(e.target.value)}
                placeholder="Species (e.g., Homo sapiens)"
              />
              <Input
                type="text"
                value={genomeBuild}
                onChange={(e) => setGenomeBuild(e.target.value)}
                placeholder="Build (e.g., GRCh38)"
              />
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Input
                  type="file"
                  accept=".fa,.fasta,.fa.gz,.fasta.gz"
                  onChange={(e) => setReferenceGenome(e.target.files?.[0] || null)}
                  className="hidden"
                  id="genome-upload-section"
                />
                <label htmlFor="genome-upload-section" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm">{referenceGenome ? referenceGenome.name : 'Click to upload FASTA file'}</p>
                  <p className="text-xs text-muted-foreground">{referenceGenome ? `${(referenceGenome.size / 1024 / 1024).toFixed(2)} MB` : 'Supported: .fa, .fasta'}</p>
                </label>
              </div>
              <button
                onClick={handleGenomeUpload}
                disabled={isUploading || !referenceGenome || !genomeName || !genomeSpecies || !genomeBuild}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
              >
                {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? 'Uploading...' : 'Upload Genome'}
              </button>
              {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
              {uploadedGenomeId && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Genome uploaded successfully!
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Upload Genome Data</h3>
            <p className="text-sm text-muted-foreground mb-4">Drop FASTQ files here for indexing</p>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isFastqDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleFastqDragOver}
              onDragLeave={handleFastqDragLeave}
              onDrop={handleFastqDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Drop genome files here</p>
              <p className="text-sm text-muted-foreground mb-4">Supported formats: FASTQ, FASTA</p>
              <label className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 cursor-pointer inline-block">
                Browse Files
                <Input type="file" multiple accept=".fastq,.fastq.gz,.fq,.fq.gz" onChange={handleFastqFileInput} className="hidden" />
              </label>
            </div>

            {fastqFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Selected Files ({fastqFiles.length})</h4>
                {fastqFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button onClick={() => removeFastqFile(index)} className="p-1 hover:bg-destructive/10 rounded">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button
            colorScheme="success"
            variant="solid"
            size="lg"
            loading={isIndexing}
            loadingText="Indexing..."
            disabled={!uploadedGenomeId || fastqFiles.length === 0}
            onClick={handleIndexGenome}
          >
            <Play className="h-5 w-5" />
            Index Genome
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            {!uploadedGenomeId ? 'Upload a reference genome first' : 
             fastqFiles.length === 0 ? 'Upload FASTQ files to enable indexing' : 
             'Ready to index genome with FASTQ data'}
          </p>
        </div>
      </Area>

      {showIndexingConsole && (
        <Area>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Indexing Progress</h3>
            <button onClick={() => setShowIndexingConsole(false)} className="p-1 hover:bg-accent rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-64 overflow-y-auto">
            {indexingProgress.length === 0 ? (
              <span className="text-gray-500">Indexing progress will appear here...</span>
            ) : (
              indexingProgress.map((line, i) => (
                <div key={i}>{line}</div>
              ))
            )}
          </div>
        </Area>
      )}

      <Area>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Services Status</h2>
          <button onClick={() => window.location.reload()} className="p-2 hover:bg-accent rounded-md">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((service) => (
            <div key={service.name} className="p-4 rounded-md bg-muted">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getServiceIcon(service.status)}
                  <p className="font-medium">{service.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={service.status === 'running' ? 'text-green-600' : 'text-red-600'}>
                  {service.status === 'running' ? 'Running' : 'Error'}
                </span>
                {service.latency && <span className="text-muted-foreground">{service.latency}ms</span>}
              </div>
            </div>
          ))}
        </div>
      </Area>
    </div>
  )
}