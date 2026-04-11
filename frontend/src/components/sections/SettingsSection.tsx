'use client'

import { useState } from 'react'
import { Database, Settings, Save, RefreshCw, CheckCircle, HardDrive, FolderOpen, Cpu } from 'lucide-react'
import { Area } from '@/components/ui/Area'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface PipelineConfig {
  referenceGenome: string
  variantCaller: string
  qualityThreshold: string
  minCoverage: string
}

interface ServiceConnection {
  name: string
  icon: React.ElementType
}

const services: ServiceConnection[] = [
  { name: 'Neo4j', icon: Database },
  { name: 'PostgreSQL', icon: HardDrive },
  { name: 'MinIO', icon: FolderOpen },
  { name: 'API', icon: Cpu },
]

export function SettingsSection() {
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>({
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

  const updateConfig = (key: keyof PipelineConfig, value: string) => {
    setPipelineConfig(prev => ({ ...prev, [key]: value }))
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
            {services.map(({ name, icon: Icon }) => (
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
              <Select 
                value={pipelineConfig.referenceGenome} 
                onChange={(e) => updateConfig('referenceGenome', e.target.value)}
              >
                <option value="hg38">hg38 (GRCh38)</option>
                <option value="hg19">hg19 (GRCh37)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Variant Caller</label>
              <Select 
                value={pipelineConfig.variantCaller} 
                onChange={(e) => updateConfig('variantCaller', e.target.value)}
              >
                <option value="bcftools">bcftools (fast)</option>
                <option value="gatk">GATK (clinical)</option>
                <option value="freebayes">FreeBayes (population)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quality Threshold (Phred)</label>
              <Input 
                type="number" 
                value={pipelineConfig.qualityThreshold} 
                onChange={(e) => updateConfig('qualityThreshold', e.target.value)} 
                min="0" 
                max="60" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Coverage</label>
              <Input 
                type="number" 
                value={pipelineConfig.minCoverage} 
                onChange={(e) => updateConfig('minCoverage', e.target.value)} 
                min="1" 
              />
            </div>
          </div>
        </Area>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Configuration</>}
        </button>
        {saveMessage && <span className="text-green-600 text-sm">{saveMessage}</span>}
      </div>
    </div>
  )
}