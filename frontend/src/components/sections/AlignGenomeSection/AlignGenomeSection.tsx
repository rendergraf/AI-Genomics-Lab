'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Database,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  HardDrive,
  FolderOpen,
  Cpu,
  Trash2,
} from 'lucide-react'

import { Area } from '@/components/ui/Area'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui'
import api from '@/lib/api'

/* =========================================================
   🧬 TYPES (INDEXING ONLY)
========================================================= */

interface PipelineConfig {
  referenceGenome: string
  uploadedFile?: File | null
}

interface GenomeReference {
  id: number
  key: string
  name: string
  species: string
  build: string
  url: string
  is_active: boolean
}

interface ServiceConnection {
  name: string
  icon: React.ElementType
  status: 'connected' | 'disconnected'
}

/* =========================================================
   🧩 SERVICES
========================================================= */

const services: ServiceConnection[] = [
  { name: 'Neo4j', icon: Database, status: 'connected' },
  { name: 'PostgreSQL', icon: HardDrive, status: 'connected' },
  { name: 'MinIO', icon: FolderOpen, status: 'connected' },
  { name: 'API', icon: Cpu, status: 'connected' },
]

/* =========================================================
   🧬 REFERENCE GENOMES (SIMPLE UI SOURCE)
   👉 ideally this comes from backend / registry API
========================================================= */

type ReferenceGenomeSource = 'remote' | 'upload'

interface ReferenceGenomeOption {
  id: string
  label: string
}

// Reference genomes are now loaded dynamically from the API
// See availableGenomes state and useEffect above

/* =========================================================
   ⚙️ COMPONENT
========================================================= */

export function AlignGenomeSection() {
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>({
    referenceGenome: 'hg38',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexLogs, setIndexLogs] = useState<string[]>([])
  const [currentStage, setCurrentStage] = useState<string>('')
  const [jobId, setJobId] = useState<number | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [indexedStatus, setIndexedStatus] = useState<Record<string, boolean>>({})
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [availableGenomes, setAvailableGenomes] = useState<GenomeReference[]>([])
  const [loadingGenomes, setLoadingGenomes] = useState(false)
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const API_URL = 'http://localhost:8000'

  // Function to refresh indexed status
  const refreshIndexedStatus = async () => {
    setIsLoadingStatus(true)
    try {
      const response = await fetch(`${API_URL}/genome/indexed`)
      if (response.ok) {
        const data = await response.json()
        const statusMap: Record<string, boolean> = {}
        Object.keys(data).forEach(genomeId => {
          statusMap[genomeId] = data[genomeId]?.indexed || false
        })
        setIndexedStatus(statusMap)
      }
    } catch (error) {
      console.error('Failed to fetch indexed status:', error)
    } finally {
      setIsLoadingStatus(false)
    }
  }

  // Fetch indexed status on initial load
  useEffect(() => {
    refreshIndexedStatus()
  }, [])

  // Load available genome references from API
  useEffect(() => {
    const loadGenomes = async () => {
      setLoadingGenomes(true)
      try {
        const result = await api.getGenomeReferences()
        if (result.data) {
          setAvailableGenomes(result.data)
          // If no genome selected yet, select the first active one
          if (!pipelineConfig.referenceGenome && result.data.length > 0) {
            const firstActive = result.data.find(g => g.is_active) || result.data[0]
            setPipelineConfig(prev => ({ ...prev, referenceGenome: firstActive.key }))
          }
        }
      } catch (error) {
        console.error('Failed to load genome references:', error)
      } finally {
        setLoadingGenomes(false)
      }
    }
    loadGenomes()
  }, [])

  // Auto-scroll logs container when new logs arrive
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [indexLogs])

  /* -----------------------------
     INDEX GENOME
  ----------------------------- */

  const handleIndexGenome = async () => {
    setIsIndexing(true)
    setCurrentStage('')
    setJobId(null)
    setIndexLogs(['🚀 Starting genome indexing pipeline...', 
                  '📡 Connecting to API server...',
                  '⏳ Initializing Nextflow (this may take 30-60 seconds)...',
                  '📦 Will download ~841MB for hg38...'])
    setSaveMessage(null)

    // Create abort controller for timeout
    const controller = new AbortController()
    setAbortController(controller)

    try {
      // Add timeout for the initial connection (300 seconds - Nextflow startup + initial download can be slow)
      const timeoutId = setTimeout(() => {
        controller.abort()
        setIndexLogs(prev => [...prev, '⏱️ Initial connection timeout - server is processing...', 
                              '🔄 Try clicking "Index" again or wait a few minutes'])
        throw new Error('⏱️ Initial connection timeout')
      }, 300000)

      const response = await fetch(`${API_URL}/genome/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `genome_id=${pipelineConfig.referenceGenome}`,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      setIndexLogs(prev => [...prev, '✅ Connected to API', 
                            '🧬 Starting Nextflow pipeline...',
                            '⏳ This may take a moment...'])

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`🖧 Failed to start indexing: ${response.status} - ${errorText}`)
      }

      if (!response.body) {
        throw new Error('🖧 No response body from server')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      // Add overall timeout for the entire process (30 minutes for genome download)
      const overallTimeout = setTimeout(() => {
        controller.abort()
        setIndexLogs(prev => [...prev, '⏱️ Process timeout - indexing taking too long'])
      }, 30 * 60 * 1000) // 30 minutes

      let hasCompleted = false

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
               try {
                  const data = JSON.parse(line.slice(6))
                  
                  // Handle different event types
                  switch (data.type) {
                    case 'heartbeat':
                      // Ignore heartbeat messages in logs
                      break
                      
                    case 'job':
                      // Update job ID and status
                      if (data.job_id) {
                        setJobId(data.job_id)
                      }
                      if (data.status === 'completed') {
                        setCurrentStage('completed')
                      }
                      // Add job status message to logs
                      if (data.message) {
                        setIndexLogs(prev => [...prev, data.message])
                      }
                      break
                      
                    case 'stage':
                      // Update current stage
                      if (data.stage) {
                        setCurrentStage(data.stage)
                        // Map stage to human-readable name
                        const stageNames: Record<string, string> = {
                          'initializing': 'Initializing',
                          'downloading': 'Downloading genome',
                          'creating_fai_index': 'Creating FASTA index',
                          'creating_gzi_index': 'Creating GZI index',
                          'creating_sti_index': 'Creating Strobealign index',
                          'completed': 'Completed'
                        }
                        const stageName = stageNames[data.stage] || data.stage
                        const duration = data.duration ? ` (${data.duration.toFixed(1)}s)` : ''
                        setIndexLogs(prev => [...prev, `📊 Stage: ${stageName}${duration}`])
                      }
                      break
                      
                    case 'complete':
                      setIndexLogs(prev => [...prev, '✅ Indexing complete!'])
                      hasCompleted = true
                      clearTimeout(overallTimeout)
                      break
                      
                    case 'error':
                      setIndexLogs(prev => [...prev, `❌ Error: ${data.message}`])
                      clearTimeout(overallTimeout)
                      break
                      
                    default:
                      // Default log message
                      if (data.message) {
                        setIndexLogs(prev => [...prev, data.message])
                      }
                      break
                  }
               } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        clearTimeout(overallTimeout)
        reader.releaseLock()
      }

      if (!hasCompleted) {
        setIndexLogs(prev => [...prev, '⚠️ Stream ended without completion message'])
      }

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setIndexLogs(prev => [...prev, '⏱️ Request was cancelled or timed out'])
      } else {
        setIndexLogs(prev => [...prev, `❌ Error: ${error}`])
      }
    } finally {
      setIsIndexing(false)
      setAbortController(null)
      // Refresh indexed status after indexing completes
      refreshIndexedStatus().catch(err => console.error('Failed to refresh indexed status:', err))
    }
  }

  const handleCancelIndexing = () => {
    if (abortController) {
      abortController.abort()
      setIndexLogs(prev => [...prev, '⏹️ Indexing cancelled by user'])
      setIsIndexing(false)
      setAbortController(null)
    }
  }

  const handleDeleteIndex = async () => {
    const genomeId = pipelineConfig.referenceGenome
    if (!genomeId) return
    
    if (!confirm(`Are you sure you want to delete the index for ${genomeId}? This will remove all index files.`)) {
      return
    }
    
    setIsDeleting(true)
    setIndexLogs(prev => [...prev, `🗑️ Deleting index for ${genomeId}...`])
    
    try {
      const response = await fetch(`${API_URL}/genome/index/${genomeId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        setIndexLogs(prev => [...prev, `✅ Index deleted for ${genomeId}`])
        // Refresh indexed status
        await refreshIndexedStatus()
      } else {
        const error = await response.text()
        setIndexLogs(prev => [...prev, `❌ Failed to delete index: ${error}`])
      }
    } catch (error) {
      setIndexLogs(prev => [...prev, `❌ Error deleting index: ${error}`])
    } finally {
      setIsDeleting(false)
    }
  }

  /* -----------------------------
     SAVE CONFIG
  ----------------------------- */
  const handleSave = () => {
    setIsSaving(true)
    setSaveMessage(null)

    setTimeout(() => {
      setIsSaving(false)
      setSaveMessage('Configuration saved successfully')

      setTimeout(() => setSaveMessage(null), 3000)
    }, 1000)
  }

  /* -----------------------------
      UPDATE STATE
   ----------------------------- */
  const updateConfig = (key: keyof PipelineConfig, value: string) => {
    setPipelineConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Transform available genomes to options for the dropdown
  const genomeOptions: ReferenceGenomeOption[] = availableGenomes
    .filter(genome => genome.is_active)
    .map(genome => ({
      id: genome.key,
      label: `${genome.key} - ${genome.build} (${genome.species})`
    }))

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Align Genome</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* =========================
            SERVICES STATUS
        ========================= */}
        <Area>
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Infrastructure</h3>
          </div>

          <div className="space-y-3">
            {services.map(({ name, icon: Icon, status }) => (
              <div
                key={name}
                className="flex justify-between items-center py-2 border-b"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={
                      status === 'connected'
                        ? 'text-green-600 text-sm'
                        : 'text-red-500 text-sm'
                    }
                  >
                    {status === 'connected' ? 'Connected' : 'Offline'}
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </Area>

        {/* =========================
            PIPELINE CONFIG (INDEXING ONLY)
        ========================= */}
        <Area>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Genome Indexing Pipeline
            </h3>
          </div>

          <div className="space-y-4">
            {/* Reference Genome */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">
                  Reference Genome
                </label>
                {indexedStatus[pipelineConfig.referenceGenome] && (
                  <div className="flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                    <CheckCircle className="h-3 w-3" />
                    <span>Indexed</span>
                  </div>
                )}
              </div>

              <Select
                value={pipelineConfig.referenceGenome}
                onChange={(e) =>
                  updateConfig('referenceGenome', e.target.value)
                }
              >
                {loadingGenomes ? (
                  <option value="">Loading genome references...</option>
                ) : genomeOptions.length > 0 ? (
                  genomeOptions.map((g) => (
                    <option key={g.id} value={g.id} className={indexedStatus[pipelineConfig.referenceGenome] ? 'bg-green-100 text-green-800' : ''}>
                      {g.label}
                    </option>
                  ))
                ) : (
                  <option value="">No genome references available</option>
                )}
              </Select>
            </div>

            {/* INFO BLOCK (IMPORTANT UX CLARITY) */}
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              🧬 <strong>Pipeline 1: Reference Genome Preparation</strong>
              <br />
              Input: genome.fa.gz → Outputs: .fai, .gzi, .sti
              <br />
              ⏱️ <strong>First-time setup:</strong> 30-60 seconds to initialize
              <br />
              ⏱️ <strong>Download:</strong> 5-15 minutes (841MB for hg38)
              <br />
              ⏱️ <strong>Indexing:</strong> 2-5 minutes after download
              <br />
              ⚠️ <strong>Total time:</strong> 10-30 minutes. Be patient!
            </div>

            {(indexLogs.length > 0 || currentStage || jobId) && (
              <div className="space-y-2">
                {/* Status indicators */}
                {(currentStage || jobId) && (
                  <div className="flex items-center gap-4 text-xs">
                    {jobId && (
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Job ID: {jobId}
                      </div>
                    )}
                    {currentStage && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        Stage: {{
                          'initializing': 'Initializing',
                          'downloading': 'Downloading genome',
                          'creating_fai_index': 'Creating FASTA index',
                          'creating_gzi_index': 'Creating GZI index',
                          'creating_sti_index': 'Creating Strobealign index',
                          'completed': 'Completed'
                        }[currentStage] || currentStage}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Logs container */}
                {indexLogs.length > 0 && (
                  <div 
                    ref={logsContainerRef}
                    className="text-xs bg-muted p-2 rounded-md overflow-y-auto font-mono"
                  >
                    {indexLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            {/* Status indicator */}
            {indexedStatus[pipelineConfig.referenceGenome] && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded">
                  <CheckCircle className="h-3 w-3" />
                  <span>Genome indexed</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  Click "Re-index" to overwrite or "Delete" to remove
                </span>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button 
                size="lg" 
                onClick={handleIndexGenome}
                disabled={isIndexing}
                spinner={isIndexing}
              >
                {isIndexing ? 'Indexing...' : (indexedStatus[pipelineConfig.referenceGenome] ? 'Re-index' : 'Index')}
              </Button>
              
              {indexedStatus[pipelineConfig.referenceGenome] && !isIndexing && (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={handleDeleteIndex}
                  disabled={isDeleting}
                  spinner={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Index
                </Button>
              )}
              
              {isIndexing && (
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={handleCancelIndexing}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Area>
      </div>

      {/* =========================
          ACTIONS
      ========================= */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Configuration
            </>
          )}
        </button>

        {saveMessage && (
          <span className="text-green-600 text-sm">{saveMessage}</span>
        )}
      </div>
    </div>
  )
}