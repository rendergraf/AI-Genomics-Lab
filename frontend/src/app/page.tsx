'use client'

import { useState } from 'react'
import { 
  Dna, Upload, FileText, Network, Beaker, Activity, Settings, 
  Database, FolderOpen, HardDrive
} from 'lucide-react'
import GraphView from '@/components/GraphView'
import VariantTable from '@/components/VariantTable'
import GenomeBrowser from '@/components/GenomeBrowser'
import { ButtonTab } from '@/components/ui/ButtonTab'
import { DashboardSection } from '@/components/sections/DashboardSection'
import { AnalysisSection } from '@/components/sections/AnalysisSection'
import { SettingsSection } from '@/components/sections/SettingsSection'
import { ReferenceGenomesSection } from '@/components/sections/ReferenceGenomesSection'
import { SamplesSection } from '@/components/sections/SamplesSection'
import { StorageSection } from '@/components/sections/StorageSection/StorageSection'

type TabType = 'dashboard' | 'variants' | 'knowledge' | 'analysis' | 'genome' | 'settings' | 'genomes' | 'samples' | 'storage'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'variants', label: 'Variants', icon: Dna },
  { id: 'knowledge', label: 'Knowledge Graph', icon: Network },
  { id: 'genomes', label: 'Reference Genomes', icon: Database },
  { id: 'samples', label: 'Samples/Tests', icon: Beaker },
  { id: 'analysis', label: 'Analysis', icon: Beaker },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'genome', label: 'Genome Browser', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardSection />
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
        return <ReferenceGenomesSection />
      case 'samples':
        return <SamplesSection />
      case 'analysis':
        return <AnalysisSection />
      case 'genome':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Genome Browser</h2>
            <GenomeBrowser />
          </div>
        )
      case 'storage':
        return <StorageSection />
      case 'storage':
        return <StorageSection />
      case 'settings':
        return <SettingsSection />
      default:
        return <DashboardSection />
    }
  }

  return (
    <div className="min-h-screen bg-background">
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

      <nav className=" bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
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

      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  )
}