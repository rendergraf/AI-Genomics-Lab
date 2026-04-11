'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, RefreshCw, Play, Trash2, X, CheckCircle } from 'lucide-react'
import { Area } from '@/components/ui/Area'
import { Input } from '@/components/ui/Input'
import api from '@/lib/api'
import { ReferenceGenome, Sample } from '@/types'

export function SamplesSection() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [genomes, setGenomes] = useState<ReferenceGenome[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState<number | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(false)
  
  const [name, setName] = useState('')
  const [referenceGenomeId, setReferenceGenomeId] = useState<number | ''>('')
  const [r1File, setR1File] = useState<File | null>(null)
  const [r2File, setR2File] = useState<File | null>(null)

  const fetchData = useCallback(async () => {
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
  }, [])

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
  }, [fetchData])

  const readyGenomes = genomes.filter(g => g.status === 'ready')

  const resetForm = () => {
    setName('')
    setReferenceGenomeId('')
    setR1File(null)
    setR2File(null)
  }

  const handleUpload = async () => {
    if (!name || !referenceGenomeId || !r1File) return
    
    setUploading(true)
    try {
      await api.uploadSample(name, referenceGenomeId as number, r1File, r2File || undefined)
      setShowUpload(false)
      resetForm()
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