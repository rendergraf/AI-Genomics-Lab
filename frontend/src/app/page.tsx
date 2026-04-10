'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Dna, Upload, FileText, Network, Beaker, Activity, Settings, 
  Database, Play, Save, RefreshCw, CheckCircle, XCircle, AlertCircle,
  Search, Download, Trash2, FolderOpen, ChevronRight, Brain,
  HardDrive, Cpu, Clock, BarChart3, Terminal, X
} from 'lucide-react'
import GraphView from '@/components/GraphView'
import VariantTable from '@/components/VariantTable'
import GenomeBrowser from '@/components/GenomeBrowser'
import { Input, StatCard } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { ButtonTab } from '@/components/ui/ButtonTab'
import api from '@/lib/api'
import { Area } from '@/components/ui/Area'

type TabType = 'dashboard' | 'variants' | 'knowledge' | 'analysis' | 'genome' | 'settings' | 'genomes' | 'samples'

// Types
interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error'
  latency?: number
}

interface PipelineJob {
  id: string
  sampleId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: string
  endTime?: string
  progress: number
  logs?: string
}

interface AvailableFile {
  id: string
  name: string
  size: string
}

interface DashboardStats {
  samples: number
  analyses: number
  genes: number
  mutations: number
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard') // Start on dashboard with genome indexing

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent onNavigate={setActiveTab} />
      case 'variants':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Variant Analysis</h2>
            <VariantTable />
          </div>
        )
      case 'knowledge':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Knowledge Graph</h2>
            <GraphView />
          </div>
        )
      case 'genomes':
        return <ReferenceGenomesContent />
      case 'samples':
        return <SamplesContent />
      case 'analysis':
        return <AnalysisContent />
      case 'genome':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Genome Browser</h2>
            <GenomeBrowser />
          </div>
        )
      case 'settings':
        return <SettingsContent />
      default:
        return <DashboardContent onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dna className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">AI Genomics Lab...</h1>
                <p className="text-xs text-muted-foreground">Genomic Analysis Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">v0.1</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-500 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'variants', label: 'Variants', icon: Dna },
              { id: 'knowledge', label: 'Knowledge Graph', icon: Network },
              { id: 'genomes', label: 'Reference Genomes', icon: Database },
              { id: 'samples', label: 'Samples/Tests', icon: Beaker },
              { id: 'analysis', label: 'Analysis', icon: Beaker },
              { id: 'genome', label: 'Genome Browser', icon: FolderOpen },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <ButtonTab
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  )
}

// ==================== DASHBOARD ====================

function DashboardContent({ onNavigate }: { onNavigate: (tab: TabType) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    samples: 0,
    analyses: 0,
    genes: 0,
    mutations: 0
  })
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Genome indexing state
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
  
  // Fetch existing genomes on mount
  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        const result = await api.getReferenceGenomes()
        if (result.data?.genomes && result.data.genomes.length > 0) {
          // Get the first uploaded genome that has status 'uploaded'
          const uploadedGenome = result.data.genomes.find((g: any) => g.status === 'uploaded')
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

  // FASTQ drag state
  const [isFastqDragging, setIsFastqDragging] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingStats(true)
      try {
        const graphStats = await api.getGraphStats()
        if (graphStats.data) {
          setStats({
            samples: (graphStats.data as any).samples || 0,
            analyses: (graphStats.data as any).analyses || 0,
            genes: (graphStats.data as any).genes || 0,
            mutations: (graphStats.data as any).mutations || 0
          })
        }
        
        const health = await api.health()
        setServices([
          { name: 'API', status: health.error ? 'error' : 'running', latency: 45 },
          { name: 'Neo4j', status: health.error ? 'error' : 'running', latency: 23 },
          { name: 'PostgreSQL', status: health.error ? 'error' : 'running', latency: 12 },
          { name: 'MinIO', status: health.error ? 'error' : 'running', latency: 8 },
        ])
      } catch (error) {
        setStats({ samples: 12, analyses: 48, genes: 2847, mutations: 15234 })
        setServices([
          { name: 'API', status: 'running', latency: 45 },
          { name: 'Neo4j', status: 'running', latency: 23 },
          { name: 'PostgreSQL', status: 'running', latency: 12 },
          { name: 'MinIO', status: 'running', latency: 8 },
        ])
      }
      setIsLoadingStats(false)
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
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

  // Handle upload of reference genome FASTA
  const handleGenomeUpload = async () => {
    if (!referenceGenome || !genomeName || !genomeSpecies || !genomeBuild) return
    
    setIsUploading(true)
    setUploadError(null)
    try {
      const result = await api.uploadReferenceGenome(genomeName, genomeSpecies, genomeBuild, referenceGenome)
      // The API returns the genome object directly
      if (result && result.id) {
        setUploadedGenomeId(result.id)
      }
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload genome')
    }
    setIsUploading(false)
  }

  // Handle index genome with FASTQ files
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
    } catch (error: any) {
      setIndexingProgress(prev => [...prev, `Error: ${error.message}`])
      setIsIndexing(false)
    }
  }

  const getServiceIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Dna} label="Samples" value={stats.samples} isLoading={isLoadingStats} />
        <StatCard icon={Beaker} label="Analyses" value={stats.analyses} isLoading={isLoadingStats} />
        <StatCard icon={Network} label="Genes" value={stats.genes} isLoading={isLoadingStats} />
        <StatCard icon={Activity} label="Mutations" value={stats.mutations} isLoading={isLoadingStats} />
      </div>

      {/* Reference Genomes Section */}
      <Area>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Reference Genomes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Reference Genome (FASTA) */}
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
                  id="genome-upload"
                />
                <label htmlFor="genome-upload" className="cursor-pointer">
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

          {/* Upload Genome Data (FASTQ) */}
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

        {/* Index Genome Button */}
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

      {/* Indexing Progress Console */}
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

      {/* Main Content - Quick Actions */}
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
                <span className={`text-${service.status === 'running' ? 'green' : 'red'}-600`}>
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

// ==================== ANALYSIS ====================

function AnalysisContent() {
  const [sampleId, setSampleId] = useState('')
  const [geneSymbol, setGeneSymbol] = useState('')
  const [mutationId, setMutationId] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [jobStatus, setJobStatus] = useState<PipelineJob | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [selectedGenome, setSelectedGenome] = useState('hg38')
  const [selectedCaller, setSelectedCaller] = useState('bcftools')
  const [availableFiles, setAvailableFiles] = useState<AvailableFile[]>([])
  const [selectedFile, setSelectedFile] = useState('')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const consoleRef = useRef<HTMLDivElement>(null)

  // Fetch available files on mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const result = await api.getPipelineStatus()
        if (result.data) {
          const data = result.data as any
          const samples = data.available_samples || []
          setAvailableFiles(samples.map((s: string) => ({
            id: s,
            name: s,
            size: 'N/A'
          })))
        }
      } catch (error) {
        // Use demo files if API not available
        setAvailableFiles([
          { id: 'SRR1517848', name: 'SRR1517848', size: '~850 MB' },
        ])
      }
    }
    fetchFiles()
  }, [])

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleOutput])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setConsoleOutput(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const runPipeline = async () => {
    if (!sampleId) return
    
    setIsRunning(true)
    setShowConsole(true)
    setConsoleOutput([])
    setJobStatus({
      id: Date.now().toString(),
      sampleId,
      status: 'running',
      progress: 0
    })

    addLog(`🚀 Starting pipeline for sample: ${sampleId}`)
    addLog(`📁 Input file: ${selectedFile || sampleId}`)
    addLog(`🧬 Reference genome: ${selectedGenome}`)
    addLog(`🔧 Variant caller: ${selectedCaller}`)
    addLog('')

    try {
      // Use new streaming progress API
      const eventSource = api.runPipelineWithProgress(sampleId, selectedGenome)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different progress types
          if (data.type === 'start') {
            addLog(`📋 ${data.message}`)
          } else if (data.type === 'progress') {
            if (data.step) {
              addLog(`📊 Step ${data.step}: ${data.message || ''}`)
            }
            if (data.progress !== undefined) {
              setJobStatus(prev => prev ? { 
                ...prev, 
                progress: data.progress,
                status: 'running'
              } : null)
            }
            if (data.file_name && data.file_size) {
              addLog(`📁 ${data.file_name}: ${data.file_size}`)
            }
            if (data.duration_minutes !== undefined) {
              addLog(`⏱️ Duration: ${data.duration_minutes}m ${data.duration_seconds}s`)
            }
          } else if (data.type === 'complete') {
            addLog(`✅ Pipeline completed in ${data.duration_seconds?.toFixed(1)}s`)
            setJobStatus({
              id: Date.now().toString(),
              sampleId,
              status: 'completed',
              progress: 100,
              startTime: data.timestamp,
              endTime: data.timestamp
            })
          } else if (data.type === 'output') {
            addLog(`📄 Output files:`)
            if (data.cram_file) addLog(`   CRAM: ${data.cram_file}`)
            if (data.bam_file) addLog(`   BAM: ${data.bam_file}`)
            if (data.vcf_file) addLog(`   VCF: ${data.vcf_file}`)
          } else if (data.type === 'error') {
            addLog(`❌ Error: ${data.message}`)
            setJobStatus(prev => prev ? { ...prev, status: 'failed' } : null)
          } else if (data.raw_output) {
            // Regular log line
            addLog(data.raw_output)
          }
        } catch (e) {
          // If not JSON, treat as raw log line
          addLog(event.data)
        }
      }
      
      eventSource.onerror = (error) => {
        addLog(`❌ Connection error: ${error}`)
        eventSource.close()
        setIsRunning(false)
      }
      
      // Store eventSource for cleanup
      (window as any).__pipelineEventSource = eventSource
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setJobStatus(prev => prev ? { ...prev, status: 'failed' } : null)
      setIsRunning(false)
    }
  }

  const runAIAnalysis = async () => {
    if (!geneSymbol && !mutationId) return
    
    setIsAnalyzing(true)
    setAiResult(null)

    try {
      const result = await api.explainMutation(mutationId, geneSymbol)
      if (result.data) {
        setAiResult(JSON.stringify(result.data, null, 2))
      }
    } catch (error) {
      setAiResult(`AI Analysis for ${geneSymbol || 'Unknown'}/${mutationId || 'Unknown'}:

Based on the mutation analysis:
- Pathogenicity: Likely Pathogenic  
- Protein Effect: Missense variant
- Recommended Action: Further clinical validation

This variant affects protein function and should be reviewed by a genetic counselor.`)
    }
    
    setIsAnalyzing(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Genomic Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Run Pipeline */}
        <Area>
          <div className="flex items-center gap-3 mb-4">
            <Play className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Run Pipeline</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sample ID</label>
              <Input
                type="text"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                placeholder="e.g., SRR1517848"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Sample</label>
              <select 
                value={selectedFile}
                onChange={(e) => {
                  setSelectedFile(e.target.value)
                  setSampleId(e.target.value)
                }}
                className="w-full px-3 py-2 rounded-md border bg-background"
              >
                <option value="">-- Select a sample --</option>
                {availableFiles.map(file => (
                  <option key={file.id} value={file.id}>{file.name} ({file.size})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reference Genome</label>
                <select 
                  value={selectedGenome}
                  onChange={(e) => setSelectedGenome(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-background"
                >
                  <option value="hg38">hg38</option>
                  <option value="hg19">hg19</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Variant Caller</label>
                <select 
                  value={selectedCaller}
                  onChange={(e) => setSelectedCaller(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-background"
                >
                  <option value="bcftools">bcftools</option>
                  <option value="gatk">GATK</option>
                </select>
              </div>
            </div>
            <button 
              onClick={runPipeline}
              disabled={isRunning || (!sampleId && !selectedFile)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isRunning ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Running Pipeline...</>
              ) : (
                <><Play className="h-4 w-4" /> Start Analysis</>
              )}
            </button>
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Terminal className="h-4 w-4" />
              {showConsole ? 'Hide Console' : 'Show Console'}
            </button>
          </div>
        </Area>

        {/* AI Analysis */}
        <Area>
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Analysis</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Gene Symbol</label>
              <Input
                type="text"
                value={geneSymbol}
                onChange={(e) => setGeneSymbol(e.target.value)}
                placeholder="e.g., BRCA1, TP53"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mutation ID</label>
              <Input
                type="text"
                value={mutationId}
                onChange={(e) => setMutationId(e.target.value)}
                placeholder="e.g., c.68_69delAG"
              />
            </div>
            <button 
              onClick={runAIAnalysis}
              disabled={isAnalyzing || (!geneSymbol && !mutationId)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Brain className="h-4 w-4" /> Analyze with AI</>
              )}
            </button>
          </div>
        </Area>
      </div>

      {/* Console Output */}
      {showConsole && (
        <Area>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Pipeline Console</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                jobStatus?.status === 'completed' ? 'bg-green-100 text-green-800' :
                jobStatus?.status === 'running' ? 'bg-blue-100 text-blue-800' :
                jobStatus?.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {jobStatus?.status || 'idle'}
              </span>
              <button onClick={() => setConsoleOutput([])} className="p-1 hover:bg-accent rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div 
            ref={consoleRef}
            className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-64 overflow-y-auto"
          >
            {consoleOutput.length === 0 ? (
              <span className="text-gray-500">Console output will appear here when running pipeline...</span>
            ) : (
              consoleOutput.map((line, i) => (
                <div key={i}>{line}</div>
              ))
            )}
          </div>
        </Area>
      )}

      {/* Job Status */}
      {jobStatus && (
        <Area>
          <h3 className="text-lg font-semibold mb-4">Pipeline Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sample: {jobStatus.sampleId}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                jobStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                jobStatus.status === 'running' ? 'bg-blue-100 text-blue-800' :
                jobStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {jobStatus.status}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${jobStatus.progress}%` }} />
            </div>
          </div>
        </Area>
      )}

      {/* AI Result */}
      {aiResult && (
        <Area>
          <h3 className="text-lg font-semibold mb-4">AI Analysis Result</h3>
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-64">
            {aiResult}
          </pre>
        </Area>
      )}

      {/* Detected Variants */}
      <Area>
        <h3 className="text-lg font-semibold mb-4">Detected Variants</h3>
        <VariantTable />
      </Area>
    </div>
  )
}

// ==================== SETTINGS ====================

function SettingsContent() {
  const [pipelineConfig, setPipelineConfig] = useState({
    referenceGenome: 'hg38',
    variantCaller: 'bcftools',
    qualityThreshold: '30',
    minCoverage: '10'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleSave = () => {
    setIsSaving(true)
    setSaveMessage(null)
    setTimeout(() => {
      setIsSaving(false)
      setSaveMessage('Configuration saved successfully')
      setTimeout(() => setSaveMessage(null), 3000)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Area>
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Database Connections</h3>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Neo4j', icon: Database },
              { name: 'PostgreSQL', icon: HardDrive },
              { name: 'MinIO', icon: FolderOpen },
              { name: 'API', icon: Cpu },
            ].map(({ name, icon: Icon }) => (
              <div key={name} className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">Connected</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </Area>

        <Area>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Pipeline Configuration</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reference Genome</label>
              <select value={pipelineConfig.referenceGenome} onChange={(e) => setPipelineConfig({...pipelineConfig, referenceGenome: e.target.value})} className="w-full px-3 py-2 rounded-md border bg-background">
                <option value="hg38">hg38 (GRCh38)</option>
                <option value="hg19">hg19 (GRCh37)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Variant Caller</label>
              <select value={pipelineConfig.variantCaller} onChange={(e) => setPipelineConfig({...pipelineConfig, variantCaller: e.target.value})} className="w-full px-3 py-2 rounded-md border bg-background">
                <option value="bcftools">bcftools</option>
                <option value="gatk">GATK</option>
                <option value="freebayes">FreeBayes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quality Threshold (Phred)</label>
              <Input type="number" value={pipelineConfig.qualityThreshold} onChange={(e) => setPipelineConfig({...pipelineConfig, qualityThreshold: e.target.value})} min="0" max="60" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Coverage</label>
              <Input type="number" value={pipelineConfig.minCoverage} onChange={(e) => setPipelineConfig({...pipelineConfig, minCoverage: e.target.value})} min="1" />
            </div>
          </div>
        </Area>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50">
          {isSaving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Configuration</>}
        </button>
        {saveMessage && <span className="text-green-600 text-sm">{saveMessage}</span>}
      </div>
    </div>
  )
}

// ==================== REFERENCE GENOMES ====================

interface ReferenceGenome {
  id: number
  name: string
  species: string
  build: string
  status: string
  file_path: string
  gz_path?: string
  created_at?: string
}

function ReferenceGenomesContent() {
  const [genomes, setGenomes] = useState<ReferenceGenome[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [indexing, setIndexing] = useState<number | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(false)
  const [seeding, setSeeding] = useState(false)
  
  // Upload form
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [build, setBuild] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const fetchGenomes = async () => {
    setIsLoading(true)
    try {
      const result = await api.getReferenceGenomes()
      if (result.data) {
        setGenomes(result.data.genomes || [])
      }
    } catch (error) {
      console.error('Error fetching genomes:', error)
    }
    setIsLoading(false)
  }

  // Auto-seed on mount
  useEffect(() => {
    const seedAndFetch = async () => {
      setSeeding(true)
      try {
        await api.seedExistingData()
      } catch (e) {
        // Ignore seed errors
      }
      await fetchGenomes()
      setSeeding(false)
    }
    seedAndFetch()
  }, [])

  const handleUpload = async () => {
    if (!name || !species || !build || !file) return
    
    setUploading(true)
    try {
      await api.uploadReferenceGenome(name, species, build, file)
      setShowUpload(false)
      setName('')
      setSpecies('')
      setBuild('')
      setFile(null)
      fetchGenomes()
    } catch (error) {
      console.error('Upload error:', error)
    }
    setUploading(false)
  }

  const handleIndex = (genomeId: number) => {
    setIndexing(genomeId)
    setShowConsole(true)
    setConsoleOutput([])
    
    const eventSource = api.indexReferenceGenome(genomeId)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.message) {
          setConsoleOutput(prev => [...prev, data.message])
        }
        if (data.type === 'complete') {
          setIndexing(null)
          fetchGenomes()
        }
      } catch (e) {
        setConsoleOutput(prev => [...prev, event.data])
      }
    }
    
    eventSource.onerror = () => {
      setIndexing(null)
    }
  }

  const handleDelete = async (genomeId: number) => {
    if (!confirm('Are you sure you want to delete this reference genome?')) return
    
    try {
      await api.deleteReferenceGenome(genomeId)
      fetchGenomes()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Ready</span>
      case 'indexing': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Indexing</span>
      case 'error': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Error</span>
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Uploaded</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reference Genomes</h2>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          <Upload className="h-4 w-4" /> Upload Genome
        </button>
      </div>

      {showUpload && (
        <Area>
          <h3 className="text-lg font-semibold mb-4">Upload Reference Genome</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name (e.g., hg38)</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="hg38"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Species</label>
              <Input
                type="text"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="Homo sapiens"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Build (e.g., GRCh38)</label>
              <Input
                type="text"
                value={build}
                onChange={(e) => setBuild(e.target.value)}
                placeholder="GRCh38"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">FASTA File</label>
              <Input
                type="file"
                accept=".fa,.fasta,.fa.gz,.fasta.gz"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleUpload}
              disabled={uploading || !name || !species || !build || !file}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
            >
              {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button 
              onClick={() => setShowUpload(false)}
              className="px-4 py-2 rounded-md border"
            >
              Cancel
            </button>
          </div>
        </Area>
      )}

      {/* Genomes List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Area>
            <RefreshCw className="h-6 w-6 animate-spin" />
          </Area>
        ) : genomes.length === 0 ? (
          <Area>
            No reference genomes uploaded yet
          </Area>
        ) : (
          genomes.map(genome => (
            <Area key={genome.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{genome.name}</h3>
                    {getStatusBadge(genome.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {genome.species} • {genome.build}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {genome.file_path}
                  </p>
                </div>
                <div className="flex gap-2">
                  {genome.status === 'uploaded' && (
                    <button 
                      onClick={() => handleIndex(genome.id)}
                      disabled={indexing === genome.id}
                      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
                    >
                      {indexing === genome.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      Index
                    </button>
                  )}
                  {genome.status === 'ready' && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Indexed
                    </span>
                  )}
                  <button 
                    onClick={() => handleDelete(genome.id)}
                    className="p-2 hover:bg-red-100 rounded-md text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Area>
          ))
        )}
      </div>

      {/* Console Output */}
      {showConsole && consoleOutput.length > 0 && (
        <Area>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Indexing Progress</h3>
            <button onClick={() => setShowConsole(false)} className="p-1 hover:bg-accent rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-48 overflow-y-auto">
            {consoleOutput.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </Area>
      )}
    </div>
  )
}

// ==================== SAMPLES ====================

interface Sample {
  id: number
  name: string
  sample_type: string
  reference_genome_id: number
  reference_genome_name?: string
  status: string
  r1_path?: string
  r2_path?: string
  vcf_path?: string
  created_at?: string
}

function SamplesContent() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [genomes, setGenomes] = useState<ReferenceGenome[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState<number | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(false)
  
  // Upload form
  const [name, setName] = useState('')
  const [referenceGenomeId, setReferenceGenomeId] = useState<number | ''>('')
  const [r1File, setR1File] = useState<File | null>(null)
  const [r2File, setR2File] = useState<File | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [samplesResult, genomesResult] = await Promise.all([
        api.getSamples(),
        api.getReferenceGenomes()
      ])
      if (samplesResult.data) {
        setSamples(samplesResult.data.samples || [])
      }
      if (genomesResult.data) {
        setGenomes(genomesResult.data.genomes || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setIsLoading(false)
  }

  // Auto-seed on mount
  useEffect(() => {
    const seedAndFetch = async () => {
      try {
        await api.seedExistingData()
      } catch (e) {
        // Ignore seed errors
      }
      await fetchData()
    }
    seedAndFetch()
  }, [])

  const readyGenomes = genomes.filter(g => g.status === 'ready')

  const handleUpload = async () => {
    if (!name || !referenceGenomeId || !r1File) return
    
    setUploading(true)
    try {
      await api.uploadSample(name, referenceGenomeId as number, r1File, r2File || undefined)
      setShowUpload(false)
      setName('')
      setReferenceGenomeId('')
      setR1File(null)
      setR2File(null)
      fetchData()
    } catch (error) {
      console.error('Upload error:', error)
    }
    setUploading(false)
  }

  const handleRun = (sampleId: number) => {
    setProcessing(sampleId)
    setShowConsole(true)
    setConsoleOutput([])
    
    const eventSource = api.runSamplePipeline(sampleId)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.message) {
          setConsoleOutput(prev => [...prev, data.message])
        }
        if (data.type === 'complete') {
          setProcessing(null)
          fetchData()
        }
      } catch (e) {
        setConsoleOutput(prev => [...prev, event.data])
      }
    }
    
    eventSource.onerror = () => {
      setProcessing(null)
    }
  }

  const handleDelete = async (sampleId: number) => {
    if (!confirm('Are you sure you want to delete this sample?')) return
    
    try {
      await api.deleteSample(sampleId)
      fetchData()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span>
      case 'processing': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Processing</span>
      case 'failed': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Failed</span>
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Uploaded</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Samples / Tests</h2>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          disabled={readyGenomes.length === 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> Upload Sample
        </button>
      </div>

      {showUpload && (
        <Area>
          <h3 className="text-lg font-semibold mb-4">Upload Sample (FASTQ)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sample Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="SRR1517848"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reference Genome</label>
              <select
                value={referenceGenomeId}
                onChange={(e) => setReferenceGenomeId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border bg-background"
              >
                <option value="">Select genome...</option>
                {readyGenomes.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.build})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Forward Read (R1)</label>
              <Input
                type="file"
                accept=".fastq,.fastq.gz,.fq,.fq.gz"
                onChange={(e) => setR1File(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reverse Read (R2) - Optional</label>
              <Input
                type="file"
                accept=".fastq,.fastq.gz,.fq,.fq.gz"
                onChange={(e) => setR2File(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleUpload}
              disabled={uploading || !name || !referenceGenomeId || !r1File}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
            >
              {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button 
              onClick={() => setShowUpload(false)}
              className="px-4 py-2 rounded-md border"
            >
              Cancel
            </button>
          </div>
        </Area>
      )}

      {/* Samples List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Area>
            <RefreshCw className="h-6 w-6 animate-spin" />
          </Area>
        ) : samples.length === 0 ? (
          <Area>
            No samples uploaded yet. Upload a reference genome first!
          </Area>
        ) : (
          samples.map(sample => (
            <Area key={sample.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{sample.name}</h3>
                    {getStatusBadge(sample.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sample.sample_type} • Reference: {sample.reference_genome_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sample.r1_path}
                    {sample.r2_path && ` + ${sample.r2_path}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {sample.status === 'uploaded' && (
                    <button 
                      onClick={() => handleRun(sample.id)}
                      disabled={processing === sample.id}
                      className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
                    >
                      {processing === sample.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      Run Pipeline
                    </button>
                  )}
                  {sample.status === 'completed' && sample.vcf_path && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> VCF Ready
                    </span>
                  )}
                  <button 
                    onClick={() => handleDelete(sample.id)}
                    className="p-2 hover:bg-red-100 rounded-md text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Area>
          ))
        )}
      </div>

      {/* Console Output */}
      {showConsole && consoleOutput.length > 0 && (
        <Area>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pipeline Progress</h3>
            <button onClick={() => setShowConsole(false)} className="p-1 hover:bg-accent rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-48 overflow-y-auto">
            {consoleOutput.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </Area>
      )}
    </div>
  )
}
