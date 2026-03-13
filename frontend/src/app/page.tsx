'use client'

import { useState } from 'react'
import { Dna, Upload, FileText, Network, Beaker, Activity, Settings, Database } from 'lucide-react'
import GraphView from '@/components/GraphView'
import VariantTable from '@/components/VariantTable'

type TabType = 'dashboard' | 'variants' | 'knowledge' | 'analysis' | 'settings'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />
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
      case 'analysis':
        return <AnalysisContent />
      case 'settings':
        return <SettingsContent />
      default:
        return <DashboardContent />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dna className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">AI Genomics Lab</h1>
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
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'variants', label: 'Variants', icon: Dna },
              { id: 'knowledge', label: 'Knowledge Graph', icon: Network },
              { id: 'analysis', label: 'Analysis', icon: Beaker },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
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

function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-4">
            <Dna className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Samples</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-4">
            <Beaker className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Analyses</p>
              <p className="text-2xl font-bold">48</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-4">
            <Network className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Genes</p>
              <p className="text-2xl font-bold">2,847</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Mutations</p>
              <p className="text-2xl font-bold">15,234</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="md:col-span-2">
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Upload Genome Data</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop genome files here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supported formats: FASTQ, FASTA, BAM
              </p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                Browse Files
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors">
                <FileText className="h-5 w-5" />
                <span>New Analysis</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors">
                <Network className="h-5 w-5" />
                <span>Explore Genes</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors">
                <Dna className="h-5 w-5" />
                <span>View Mutations</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="p-6 bg-card rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Services Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-md bg-muted">
            <p className="font-medium">API</p>
            <p className="text-sm text-green-600">Running</p>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <p className="font-medium">Neo4j</p>
            <p className="text-sm text-green-600">Ready</p>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <p className="font-medium">PostgreSQL</p>
            <p className="text-sm text-green-600">Ready</p>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <p className="font-medium">MinIO</p>
            <p className="text-sm text-green-600">Ready</p>
          </div>
        </div>
      </div>

      {/* Knowledge Graph Preview */}
      <div className="p-6 bg-card rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Knowledge Graph</h2>
        <GraphView />
      </div>
    </div>
  )
}

function AnalysisContent() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Genomic Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Run Pipeline</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sample ID</label>
              <input
                type="text"
                placeholder="Enter sample ID"
                className="w-full px-3 py-2 rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Input File</label>
              <select className="w-full px-3 py-2 rounded-md border bg-background">
                <option>sample_001.fastq</option>
                <option>sample_002.fastq</option>
              </select>
            </div>
            <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
              Start Analysis
            </button>
          </div>
        </div>

        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">AI Analysis</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Gene Symbol</label>
              <input
                type="text"
                placeholder="e.g., BRCA1, TP53"
                className="w-full px-3 py-2 rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mutation ID</label>
              <input
                type="text"
                placeholder="e.g., c.68_69delAG"
                className="w-full px-3 py-2 rounded-md border bg-background"
              />
            </div>
            <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
              Analyze with AI
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Detected Variants</h3>
        <VariantTable />
      </div>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Database Connections</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Neo4j</span>
              <span className="text-sm text-green-600">Connected</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">PostgreSQL</span>
              <span className="text-sm text-green-600">Connected</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">MinIO</span>
              <span className="text-sm text-green-600">Connected</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Pipeline Configuration</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reference Genome</label>
              <select className="w-full px-3 py-2 rounded-md border bg-background">
                <option>hg38</option>
                <option>hg19</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Variant Caller</label>
              <select className="w-full px-3 py-2 rounded-md border bg-background">
                <option>bcftools</option>
                <option>GATK</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
