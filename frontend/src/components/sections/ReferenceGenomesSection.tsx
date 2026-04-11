'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, RefreshCw, Play, Trash2, X, CheckCircle } from 'lucide-react'
import { Area } from '@/components/ui/Area'
import { Input } from '@/components/ui/Input'
import api from '@/lib/api'
import { ReferenceGenome } from '@/types'

export function ReferenceGenomesSection() {
  const [genomes, setGenomes] = useState<ReferenceGenome[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [indexing, setIndexing] = useState<number | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(false)
  const [seeding, setSeeding] = useState(false)
  
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [build, setBuild] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const fetchGenomes = useCallback(async () => {
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
  }, [])

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
  }, [fetchGenomes])

  const resetForm = () => {
    setName('')
    setSpecies('')
    setBuild('')
    setFile(null)
  }

  const handleUpload = async () => {
    if (!name || !species || !build || !file) return
    
    setUploading(true)
    try {
      await api.uploadReferenceGenome(name, species, build, file)
      setShowUpload(false)
      resetForm()
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

      <div className="grid gap-4">
        {isLoading || seeding ? (
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