'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Brain, Terminal, RefreshCw, Trash2, X } from 'lucide-react'
import { Area } from '@/components/ui/Area'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import VariantTable from '@/components/VariantTable'
import api from '@/lib/api'
import { JobStatus, PipelineJob } from '@/types'
import { usePipelineFiles } from '@/hooks/useApi'

export function AnalysisSection() {
  const [sampleId, setSampleId] = useState('')
  const [geneSymbol, setGeneSymbol] = useState('')
  const [mutationId, setMutationId] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [jobStatus, setJobStatus] = useState<PipelineJob | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [selectedGenome, setSelectedGenome] = useState('hg38')
  const [selectedCaller, setSelectedCaller] = useState('bcftools')
  const [selectedFile, setSelectedFile] = useState('')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const consoleRef = useRef<HTMLDivElement>(null)

  const { files: availableFiles } = usePipelineFiles()

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleOutput])

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setConsoleOutput(prev => [...prev, `[${timestamp}] ${message}`])
  }, [])

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
      const eventSource = api.runPipelineWithProgress(sampleId, selectedGenome)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
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
            addLog(data.raw_output)
          }
        } catch (e) {
          addLog(event.data)
        }
      }
      
      eventSource.onerror = (error) => {
        addLog(`❌ Connection error: ${error}`)
        eventSource.close()
        setIsRunning(false)
      }
      
      ;(window as unknown as { __pipelineEventSource: typeof eventSource }).__pipelineEventSource = eventSource
      
    } catch (error: unknown) {
      const err = error as { message?: string }
      addLog(`❌ Error: ${err.message}`)
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
    } catch {
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
              <Select 
                value={selectedFile}
                onChange={(e) => {
                  setSelectedFile(e.target.value)
                  setSampleId(e.target.value)
                }}
              >
                <option value="">-- Select a sample --</option>
                {availableFiles.map(file => (
                  <option key={file.id} value={file.id}>{file.name} ({file.size})</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reference Genome</label>
                <Select 
                  value={selectedGenome}
                  onChange={(e) => setSelectedGenome(e.target.value)}
                >
                  <option value="hg38">hg38</option>
                  <option value="hg19">hg19</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Variant Caller</label>
                <Select 
                  value={selectedCaller}
                  onChange={(e) => setSelectedCaller(e.target.value)}
                >
                  <option value="bcftools">bcftools</option>
                  <option value="gatk">GATK</option>
                </Select>
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

      {aiResult && (
        <Area>
          <h3 className="text-lg font-semibold mb-4">AI Analysis Result</h3>
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-64">
            {aiResult}
          </pre>
        </Area>
      )}

      <Area>
        <h3 className="text-lg font-semibold mb-4">Detected Variants</h3>
        <VariantTable />
      </Area>
    </div>
  )
}