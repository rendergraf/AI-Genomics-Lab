'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Dna, Upload, FileText, Network, Beaker, Activity, Settings, 
  Database, FolderOpen, HardDrive, LogOut, AlignCenter
} from 'lucide-react'
import api from '@/lib/api'
import GraphView from '@/components/GraphView'
import VariantTable from '@/components/VariantTable'
import GenomeBrowser from '@/components/GenomeBrowser'
import { ButtonTab } from '@/components/ui/ButtonTab'
import { DashboardSection } from '@/components/sections/DashboardSection'
import { AnalysisSection } from '@/components/sections/AnalysisSection'
import { ReferenceGenomesSection } from '@/components/sections/ReferenceGenomesSection'
import { SamplesSection } from '@/components/sections/SamplesSection'
import { StorageSection } from '@/components/sections/StorageSection/StorageSection'
import { AlignGenomeSection } from '@/components/sections/AlignGenomeSection'

type TabType = 'dashboard' | 'variants' | 'knowledge' | 'analysis' | 'genome' | 'align-genome' | 'genomes' | 'samples' | 'storage'

const tabs = [
  { id: 'dashboard', label: 'Home', icon: Activity },
  { id: 'variants', label: 'Variants', icon: Dna },
  { id: 'knowledge', label: 'Knowledge Graph', icon: Network },
  { id: 'genomes', label: 'Reference Genomes', icon: Database },
  { id: 'samples', label: 'Samples/Tests', icon: Beaker },
  { id: 'analysis', label: 'Analysis', icon: Beaker },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'genome', label: 'Genome Browser', icon: FolderOpen },
  { id: 'align-genome', label: 'Align Genome', icon: AlignCenter },
]

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken()
      if (!token) {
        router.push('/login')
        return
      }
      try {
        const result = await api.getCurrentUser()
        if (result.error) {
          throw new Error(result.error)
        }
        // User is authenticated
        setIsLoading(false)
      } catch (error) {
        api.removeToken()
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
  }

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
      case 'align-genome':
        return <AlignGenomeSection />
      default:
        return <DashboardSection />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
             <div 
               className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
               onClick={() => router.push('/')}
             >
               <Dna className="h-8 w-8 text-primary" />
               <div>
                 <h1 className="text-xl font-bold">Test</h1>
               </div>
             </div>
             <div className="flex items-center gap-4">
               <span className="text-sm text-muted-foreground">v0.1</span>
               <button
                 onClick={() => router.push('/settings')}
                 className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                 title="Settings"
               >
                 <Settings className="h-4 w-4" />
                 <span className="hidden sm:inline">Settings</span>
               </button>
               <button
                 onClick={async () => {
                   await api.logout()
                   api.removeToken()
                   router.push('/login')
                 }}
                 className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                 title="Sign out"
               >
                 <LogOut className="h-4 w-4" />
                 <span className="hidden sm:inline">Sign out</span>
               </button>
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