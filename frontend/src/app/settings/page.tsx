'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import {
  Dna,
  Settings,
  Database,
  Cpu,
  User,
  Shield,
  Activity,
  FileText,
  Globe,
  Key,
  Server,
  Users,
  Bell,
  Palette,
  Calendar,
  Network,
  HardDrive
} from 'lucide-react'
import { ButtonTab } from '@/components/ui/ButtonTab'
import { Area } from '@/components/ui/Area'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'

type SettingsTabType = 'genome-references' | 'pipeline' | 'ai-providers' | 'user-preferences' | 'audit-logs' | 'system-health' | 'user-management'

const tabs = [
  { id: 'genome-references', label: 'Genome References', icon: Dna },
  { id: 'pipeline', label: 'Pipeline Config', icon: Settings },
  { id: 'ai-providers', label: 'AI Providers', icon: Cpu },
  { id: 'user-preferences', label: 'User Preferences', icon: User },
  { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
  { id: 'system-health', label: 'System Health', icon: Activity },
  { id: 'user-management', label: 'User Management', icon: Users },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTabType>('genome-references')

  const [checkingAuth, setCheckingAuth] = useState(true)

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
        setCheckingAuth(false)
      } catch (error) {
        api.removeToken()
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  // Real API data
  const [genomeReferences, setGenomeReferences] = useState<any[]>([])
  const [pipelineSettings, setPipelineSettings] = useState<any>({})
  const [aiProvider, setAiProvider] = useState<any>({
    provider: 'openrouter',
    model: 'deepseek-chat',
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    isActive: false,
    has_api_key: false
  })
  const [userPreferences, setUserPreferences] = useState<any>({})
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState<any>({})
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Genome references form state
  const [showGenomeForm, setShowGenomeForm] = useState(false)
  const [editingGenome, setEditingGenome] = useState<any>(null)
  const [genomeFormData, setGenomeFormData] = useState({
    key: '',
    name: '',
    species: '',
    build: '',
    url: '',
    is_active: true
  })

  // Load data based on active tab
  useEffect(() => {
    if (checkingAuth) return
    
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        switch (activeTab) {
          case 'genome-references':
            const refs = await api.getGenomeReferences()
            if (refs.data) setGenomeReferences(refs.data)
            break
          case 'pipeline':
            const pipeline = await api.getPipelineSettings()
            if (pipeline.data) setPipelineSettings(pipeline.data)
            break
          case 'ai-providers':
            const providers = await api.getAIProviders()
            if (providers.data && providers.data.length > 0) {
              const first = providers.data[0]
              setAiProvider({
                provider: first.provider,
                model: first.model,
                apiKey: '', // Never expose actual API key
                baseUrl: first.base_url,
                isActive: first.is_active,
                has_api_key: first.has_api_key
              })
            }
            break
          case 'user-preferences':
            const prefs = await api.getUIPreferences()
            if (prefs.data) setUserPreferences(prefs.data)
            break
          case 'audit-logs':
            const logs = await api.getAuditLogs()
            if (logs.data) setAuditLogs(logs.data)
            break
          case 'system-health':
            const health = await api.getSystemHealth()
            if (health.data) setSystemHealth(health.data)
            break
          case 'user-management':
            // TODO: implement getUsers endpoint
            break
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [activeTab, checkingAuth])

  const handleTestConnection = async (type: 'genome' | 'ai-provider', id?: number) => {
    setLoading(true)
    try {
      if (type === 'genome' && id) {
        const result = await api.testGenomeReference(id)
        if (result.error) {
          alert(`Genome URL test failed: ${result.error}`)
        } else {
          alert(`Genome URL test: ${result.data?.message || 'Success'}`)
        }
      } else if (type === 'ai-provider') {
        const result = await api.testAIProvider(aiProvider.provider, aiProvider.model)
        if (result.error) {
          alert(`AI Provider test failed: ${result.error}`)
        } else {
          alert(`AI Provider test: ${result.data?.message || 'Success'}`)
        }
      }
    } catch (error: any) {
      alert(`Connection test failed: ${error.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  // Genome references CRUD handlers
  const handleAddGenomeReference = () => {
    setEditingGenome(null)
    setGenomeFormData({
      key: '',
      name: '',
      species: '',
      build: '',
      url: '',
      is_active: true
    })
    setShowGenomeForm(true)
  }

  const handleEditGenomeReference = (genome: any) => {
    setEditingGenome(genome)
    setGenomeFormData({
      key: genome.key,
      name: genome.name,
      species: genome.species || '',
      build: genome.build || '',
      url: genome.url,
      is_active: genome.is_active
    })
    setShowGenomeForm(true)
  }

  const handleDeleteGenomeReference = async (genomeId: number) => {
    if (!confirm('Are you sure you want to delete this genome reference? This will also delete any associated index files.')) {
      return
    }
    
    setLoading(true)
    try {
      const result = await api.deleteGenomeReference(genomeId)
      if (result.error) {
        alert(`Delete failed: ${result.error}`)
      } else {
        alert('Genome reference deleted successfully')
        // Refresh the list
        const refs = await api.getGenomeReferences()
        if (refs.data) setGenomeReferences(refs.data)
      }
    } catch (error: any) {
      alert(`Delete failed: ${error.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGenomeReference = async () => {
    if (!genomeFormData.key.trim() || !genomeFormData.name.trim() || !genomeFormData.url.trim()) {
      alert('Key, Name, and URL are required')
      return
    }
    
    setLoading(true)
    try {
      let result
      if (editingGenome) {
        result = await api.updateGenomeReference(editingGenome.id, genomeFormData)
      } else {
        result = await api.createGenomeReference(genomeFormData)
      }
      
      if (result.error) {
        alert(`Save failed: ${result.error}`)
      } else {
        alert(`Genome reference ${editingGenome ? 'updated' : 'created'} successfully`)
        setShowGenomeForm(false)
        // Refresh the list
        const refs = await api.getGenomeReferences()
        if (refs.data) setGenomeReferences(refs.data)
      }
    } catch (error: any) {
      alert(`Save failed: ${error.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (section: SettingsTabType) => {
    setLoading(true)
    try {
      switch (section) {
        case 'pipeline':
          // Update pipeline setting (only default_read_length)
          if (pipelineSettings.default_read_length) {
            await api.updatePipelineSetting('default_read_length', {
              setting_value: pipelineSettings.default_read_length.value.toString()
            })
            alert('Pipeline settings saved successfully')
          }
          break
        case 'ai-providers':
          // TODO: implement AI provider save
          alert('AI provider settings saved successfully (mock)')
          break
        case 'user-preferences':
          // Extract only fields that match the API model
          const { language, timezone, theme, display_options } = userPreferences
          await api.updateUIPreferences({
            language: language || 'en',
            timezone: timezone || 'UTC',
            theme: theme || 'light',
            display_options: display_options || {}
          })
          alert('User preferences saved successfully')
          break
        default:
          alert(`Settings for ${section} saved successfully (mock)`)
      }
    } catch (error: any) {
      alert(`Error saving settings: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'genome-references':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Genome References</h3>
               <Button size="lg" colorScheme="primary" onClick={handleAddGenomeReference} disabled={loading}>
                 Add New Reference
               </Button>
            </div>
            
            {showGenomeForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-card rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-semibold mb-4">{editingGenome ? 'Edit' : 'Add'} Genome Reference</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Key (unique identifier)</label>
                      <Input
                        value={genomeFormData.key}
                        onChange={(e) => setGenomeFormData({...genomeFormData, key: e.target.value})}
                        placeholder="e.g., hg38"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={genomeFormData.name}
                        onChange={(e) => setGenomeFormData({...genomeFormData, name: e.target.value})}
                        placeholder="e.g., Homo sapiens GRCh38"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Species</label>
                      <Input
                        value={genomeFormData.species}
                        onChange={(e) => setGenomeFormData({...genomeFormData, species: e.target.value})}
                        placeholder="e.g., Homo sapiens"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Build</label>
                      <Input
                        value={genomeFormData.build}
                        onChange={(e) => setGenomeFormData({...genomeFormData, build: e.target.value})}
                        placeholder="e.g., GRCh38"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL</label>
                      <Input
                        value={genomeFormData.url}
                        onChange={(e) => setGenomeFormData({...genomeFormData, url: e.target.value})}
                        placeholder="https://example.com/genome.fa.gz"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={genomeFormData.is_active}
                        onChange={(e) => setGenomeFormData({...genomeFormData, is_active: e.target.checked})}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium">Active</label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={() => setShowGenomeForm(false)} disabled={loading}>Cancel</Button>
                    <Button colorScheme="primary" onClick={handleSaveGenomeReference} disabled={loading}>
                      {loading ? 'Saving...' : (editingGenome ? 'Update' : 'Create')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading genome references...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                <p className="font-medium">Error loading genome references</p>
                <p className="text-sm">{error}</p>
                <Button 
                  size="sm" 
                  colorScheme="warning" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : genomeReferences.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-muted-foreground">No genome references found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {genomeReferences.map((genome) => (
                    <Card key={genome.id} colorPalette="brand-blue">
                      <CardHeader>
                        <CardTitle>{genome.key} - {genome.build}</CardTitle>
                        <CardDescription>{genome.species}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Name</label>
                          <Input value={genome.name} readOnly />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">URL</label>
                          <Input value={genome.url} readOnly />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${genome.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">{genome.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTestConnection('genome', genome.id)}
                            disabled={loading}
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Test URL
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                         <Button size="sm" onClick={() => handleEditGenomeReference(genome)} disabled={loading}>Edit</Button>
                         <Button size="sm" colorScheme="danger" onClick={() => handleDeleteGenomeReference(genome.id)} disabled={loading}>Delete</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                <Area>
                  <h4 className="text-lg font-semibold mb-4">URL Validation Rules</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>Allowed domains: ensembl.org, ucsc.edu, ncbi.nlm.nih.gov</li>
                    <li>Valid extensions: .fa.gz, .fasta.gz, .fna.gz</li>
                    <li>Maximum file size: 10GB</li>
                    <li>Checksum verification required for production use</li>
                  </ul>
                </Area>
              </>
            )}
          </div>
        )

      case 'pipeline':
        const PRESETS = [75, 100, 150, 250, 300];
        const currentValue = pipelineSettings.default_read_length?.value ?? 150;
        const isCustom = !PRESETS.includes(Number(currentValue)) || currentValue === '';
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Pipeline Configuration</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading pipeline settings...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                <p className="font-medium">Error loading pipeline settings</p>
                <p className="text-sm">{error}</p>
                <Button 
                  size="sm" 
                  colorScheme="warning" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Alignment Parameters</CardTitle>
                    <CardDescription>Settings for read alignment and variant calling</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Read Length (bp)</label>
                        <Select 
                          value={isCustom ? 'custom' : currentValue}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const newSettings = {...pipelineSettings};
                            if (!newSettings.default_read_length) newSettings.default_read_length = {};
                            if (newValue === 'custom') {
                              newSettings.default_read_length.value = '';
                            } else {
                              newSettings.default_read_length.value = Number(newValue);
                            }
                            setPipelineSettings(newSettings);
                          }}
                        >
                          <option value={75}>75</option>
                          <option value={100}>100</option>
                          <option value={150}>150</option>
                          <option value={250}>250</option>
                          <option value={300}>300</option>
                          <option value="custom">Custom</option>
                        </Select>
                      </div>
                      {isCustom && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Custom Value (bp)</label>
                          <Input
                            type="number"
                            value={currentValue}
                            onChange={(e) => {
                              const newSettings = {...pipelineSettings};
                              if (!newSettings.default_read_length) newSettings.default_read_length = {};
                              newSettings.default_read_length.value = e.target.value;
                              setPipelineSettings(newSettings);
                            }}
                            min={1}
                            max={1000}
                            placeholder="Enter custom read length"
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Select a standard read length or choose Custom to enter a specific value.</p>
                    </div>
                  </CardContent>
                   <CardFooter>
                    <Button 
                      colorScheme="primary"
                      onClick={() => handleSaveSettings('pipeline')}
                      loading={loading}
                      loadingText="Saving..."
                    >
                      Save Pipeline Settings
                    </Button>
                  </CardFooter>
                </Card>

                <Area>
                  <h4 className="text-lg font-semibold mb-4">Validation Rules</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>Read length can be a standard value (75, 100, 150, 250, 300) or any custom positive integer</li>
                    <li>Thread count is automatically determined based on available system cores</li>
                    <li>All numeric values must be positive integers</li>
                    <li>Changes require admin privileges</li>
                  </ul>
                </Area>
              </>
            )}
          </div>
        )

      case 'ai-providers':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">AI Provider Settings</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading AI provider settings...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                <p className="font-medium">Error loading AI provider settings</p>
                <p className="text-sm">{error}</p>
                <Button 
                  size="sm" 
                  colorScheme="warning" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{aiProvider.provider ? aiProvider.provider.charAt(0).toUpperCase() + aiProvider.provider.slice(1) : 'AI Provider'} Configuration</CardTitle>
                    <CardDescription>Configure LLM API access for variant interpretation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Provider</label>
                        <Select 
                          value={aiProvider.provider}
                          onChange={(e) => setAiProvider({...aiProvider, provider: e.target.value})}
                        >
                          <option value="openrouter">OpenRouter</option>
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="local">Local LLM</option>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Model</label>
                        <Select 
                          value={aiProvider.model}
                          onChange={(e) => setAiProvider({...aiProvider, model: e.target.value})}
                        >
                          <option value="deepseek-chat">DeepSeek Chat</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="claude-3">Claude 3</option>
                          <option value="llama-3">Llama 3</option>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API Key</label>
                      <Input 
                        type="password"
                        value={aiProvider.apiKey}
                        onChange={(e) => setAiProvider({...aiProvider, apiKey: e.target.value})}
                        placeholder={aiProvider.has_api_key ? "••••••••••••" : "sk-xxxxxxxxxxxxxxxx"}
                      />
                      <p className="text-xs text-muted-foreground">
                        API keys are encrypted and never stored in plain text
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Base URL</label>
                      <Input 
                        value={aiProvider.baseUrl}
                        onChange={(e) => setAiProvider({...aiProvider, baseUrl: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${aiProvider.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">{aiProvider.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => handleTestConnection('ai-provider')}
                        disabled={loading}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                   <CardFooter className="flex justify-between">
                     <Button 
                       colorScheme="primary"
                       onClick={() => handleSaveSettings('ai-providers')}
                       loading={loading}
                       loadingText="Saving..."
                     >
                       Save AI Settings
                     </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setAiProvider({...aiProvider, isActive: !aiProvider.isActive})}
                    >
                      {aiProvider.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </CardFooter>
                </Card>

                <Area>
                  <h4 className="text-lg font-semibold mb-4">Security Notes</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>API keys are encrypted using AES-256-GCM</li>
                    <li>Keys are never exposed in frontend responses</li>
                    <li>Connection tests validate keys without exposing them</li>
                    <li>Only superadmin users can modify API keys</li>
                  </ul>
                </Area>
              </>
            )}
          </div>
        )

      case 'user-preferences':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">User Preferences</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading user preferences...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                <p className="font-medium">Error loading user preferences</p>
                <p className="text-sm">{error}</p>
                <Button 
                  size="sm" 
                  colorScheme="warning" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <Card colorPalette="brand-blue">
                <CardHeader>
                  <CardTitle>Personalization Settings</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language</label>
                      <Select 
                        value={userPreferences.language || 'en'}
                        onChange={(e) => setUserPreferences({...userPreferences, language: e.target.value})}
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <Select 
                        value={userPreferences.timezone || 'UTC'}
                        onChange={(e) => setUserPreferences({...userPreferences, timezone: e.target.value})}
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={userPreferences.theme === 'light'}
                          onChange={(e) => setUserPreferences({...userPreferences, theme: e.target.value})}
                          className="text-primary"
                        />
                        <Palette className="h-4 w-4" />
                        <span>Light</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={userPreferences.theme === 'dark'}
                          onChange={(e) => setUserPreferences({...userPreferences, theme: e.target.value})}
                          className="text-primary"
                        />
                        <Palette className="h-4 w-4" />
                        <span>Dark</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="system"
                          checked={userPreferences.theme === 'system'}
                          onChange={(e) => setUserPreferences({...userPreferences, theme: e.target.value})}
                          className="text-primary"
                        />
                        <Palette className="h-4 w-4" />
                        <span>System</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPreferences.notifications || false}
                        onChange={(e) => setUserPreferences({...userPreferences, notifications: e.target.checked})}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Bell className="h-4 w-4" />
                      <span>Enable email notifications (local only)</span>
                    </label>
                  </div>
                </CardContent>
                 <CardFooter>
                   <Button 
                     colorScheme="primary"
                     onClick={() => handleSaveSettings('user-preferences')}
                     loading={loading}
                     loadingText="Saving..."
                   >
                     Save Preferences
                   </Button>
                 </CardFooter>
              </Card>
            )}
          </div>
        )

      case 'audit-logs':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Audit Logs</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                <p className="font-medium">Error loading audit logs</p>
                <p className="text-sm">{error}</p>
                <Button 
                  size="sm" 
                  colorScheme="warning" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <Area>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground">Track configuration changes and user actions</p>
                  <Button variant="outline" size="sm">
                    Export Logs
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No audit logs found</p>
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.details ? JSON.stringify(log.details) : 'No details'}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Area>
            )}
          </div>
        )

      case 'system-health':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">System Health</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading system health...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                <p className="font-medium">Error loading system health</p>
                <p className="text-sm">{error}</p>
                <Button 
                  size="sm" 
                  colorScheme="warning" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'database', name: 'PostgreSQL', icon: Database, description: 'Genomics database' },
                    { key: 'minio', name: 'MinIO', icon: HardDrive, description: 'Object storage' },
                    { key: 'neo4j', name: 'Neo4j', icon: Network, description: 'Knowledge graph' },
                    { key: 'nextflow', name: 'Nextflow', icon: Cpu, description: 'Pipeline engine' },
                    { key: 'api', name: 'API Server', icon: Server, description: 'FastAPI backend' },
                    { key: 'frontend', name: 'Frontend', icon: Globe, description: 'Next.js application' },
                  ].map((service) => {
                    const health = systemHealth[service.key]
                    const healthy = health?.healthy ?? false
                    const status = healthy ? 'healthy' : 'error'
                    return (
                      <Card key={service.key} colorPalette="brand-blue">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <service.icon className="h-5 w-5" />
                              <div>
                                <p className="font-medium">{service.name}</p>
                                <p className="text-xs text-muted-foreground">{service.description}</p>
                              </div>
                            </div>
                             <div className={`w-3 h-3 rounded-full ${
                               status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                             }`} />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <Area>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {systemHealth.timestamp ? new Date(systemHealth.timestamp).toLocaleString() : 'Unknown'}
                  </p>
                </Area>
              </>
            )}
          </div>
        )

      case 'user-management':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">User Management</h3>
              <Button size="lg" colorScheme="primary">
                <Users className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            
            <Area>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Roles</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Last Active</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 1, name: 'Admin User', email: 'admin@company.com', roles: ['admin'], status: 'active', lastActive: '2 hours ago' },
                      { id: 2, name: 'Researcher', email: 'researcher@lab.org', roles: ['researcher'], status: 'active', lastActive: '1 day ago' },
                      { id: 3, name: 'Analyst', email: 'analyst@lab.org', roles: ['analyst'], status: 'inactive', lastActive: '1 week ago' },
                      { id: 4, name: 'Viewer', email: 'viewer@lab.org', roles: ['viewer'], status: 'active', lastActive: '3 days ago' },
                    ].map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-3">{user.name}</td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            {user.roles.map(role => (
                              <span key={role} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">{user.lastActive}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button size="sm" >Edit</Button>
                            <Button size="sm" >Deactivate</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Area>
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Settings Dashboard</h3>
            <p className="text-muted-foreground">Select a category from the tabs above to manage settings.</p>
          </div>
        )
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
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
                 <h1 className="text-xl font-bold">Settings</h1>
               </div>
             </div>
            <div className="flex items-center gap-4">
              <Button 
                size="sm"
                onClick={() => router.push('/')}
              >
                Back to Dashboard
              </Button>
              <Button 
                size="sm"
                colorScheme="warning"
                onClick={async () => {
                  await api.logout()
                  api.removeToken()
                  router.push('/login')
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <ButtonTab
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTabType)}
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