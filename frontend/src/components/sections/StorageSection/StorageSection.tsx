'use client'

import { useState, useEffect } from 'react'
import { HardDrive, Upload, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Area } from '@/components/ui/Area'
import { Button } from '@/components/ui'
import { Alert } from '@/components/ui/Alert'
import api from '@/lib/api'

interface GenomeFile {
  object: string
  size: number
  type: string
  status?: string
  reason?: string
}

interface Genome {
  name: string
  files: GenomeFile[]
  total_size: number
  has_fasta: boolean
  has_fai: boolean
  has_sti: boolean
}

interface SyncStatus {
  name: string
  minio: boolean
  database: boolean
  local: boolean
  files: Array<{
    source: string
    object?: string
    path?: string
    size: number
  }>
  status: string
  db_status?: string
  db_path?: string
}

export function StorageSection() {
  const [genomes, setGenomes] = useState<Genome[]>([])
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({})
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'genomes' | 'status'>('genomes')
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    loadGenomes()
  }, [])

  const loadGenomes = async () => {
    setAuthError(null)
    const token = api.getToken()
    if (!token) {
      console.warn('No access token found in localStorage')
      setAuthError('No authentication token found. Please login again.')
      setIsLoading(false)
      return
    }
    try {
      // Try new MinIO endpoint first
      const result = await api.listFilesInBucket('reference')
      if (result.data) {
        // Group files by genome
        const genomeMap: Record<string, Genome> = {}
        
        for (const file of result.data.files) {
          // Extract genome name from object path: reference_genome/{genome_name}/{file}
          const parts = file.object_name.split('/')
          if (parts.length >= 3 && parts[0] === 'reference_genome') {
            const genomeName = parts[1]
            const fileName = parts.slice(2).join('/')
            
            if (!genomeMap[genomeName]) {
              genomeMap[genomeName] = {
                name: genomeName,
                files: [],
                total_size: 0,
                has_fasta: false,
                has_fai: false,
                has_sti: false
              }
            }
            
            const genome = genomeMap[genomeName]
            const fileType = fileName.endsWith('.fa.gz') ? 'fasta' : 
                            fileName.endsWith('.fa.gz.fai') ? 'fai' :
                            fileName.endsWith('.fa.gz.gzi') ? 'gzi' :
                            fileName.endsWith('.fa.gz.sti') ? 'sti' : 'other'
            
            genome.files.push({
              object: file.object_name,
              size: file.size,
              type: fileType
            })
            genome.total_size += file.size
            
            if (fileType === 'fasta') genome.has_fasta = true
            if (fileType === 'fai') genome.has_fai = true
            if (fileType === 'sti') genome.has_sti = true
          }
        }
        
        const genomes = Object.values(genomeMap)
        setGenomes(genomes)
        
        // Load status for each genome
        const statuses: Record<string, SyncStatus> = {}
        for (const genome of genomes) {
          try {
            const statusResult = await api.getGenomeStatus(genome.name)
            if (statusResult.data) {
              statuses[genome.name] = statusResult.data
            }
          } catch (error) {
            console.error(`Error loading status for ${genome.name}:`, error)
          }
        }
        setSyncStatus(statuses)
      } else {
        console.error('Error loading MinIO files:', result.error)
        setAuthError(result.error || 'Failed to load files from MinIO')
      }
    } catch (error) {
      console.error('Error loading MinIO files:', error)
      // Fallback to old endpoint
      try {
        const result = await api.getStorageGenomes()
        if (result.data) {
          setGenomes(result.data.genomes)
          
          const statuses: Record<string, SyncStatus> = {}
          for (const genome of result.data.genomes) {
            try {
              const statusResult = await api.getGenomeStatus(genome.name)
              if (statusResult.data) {
                statuses[genome.name] = statusResult.data
              }
            } catch (error) {
              console.error(`Error loading status for ${genome.name}:`, error)
            }
          }
          setSyncStatus(statuses)
        } else {
          console.error('Error loading genomes:', result.error)
          setAuthError(result.error || 'Failed to load genomes')
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
        setAuthError('Network error loading genomes')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncToMinIO = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    
    try {
      const result = await api.syncStorageGenomes()
      if (result.data) {
        setSyncResult(result.data)
        
        if (result.data.success) {
          // Reload genomes after sync
          setTimeout(() => {
            loadGenomes()
          }, 1000)
        }
      } else {
        console.error('Error syncing to MinIO:', result.error)
        setSyncResult({
          success: false,
          error: result.error || 'Sync failed'
        })
      }
    } catch (error) {
      console.error('Error syncing to MinIO:', error)
      setSyncResult({
        success: false,
        error: 'Sync failed'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDownloadGenome = async (genomeName: string) => {
    try {
      const result = await api.downloadGenome(genomeName)
      if (result.data) {
        alert(`Download results for ${genomeName}:\nSuccess: ${result.data.success}\nDownloaded: ${result.data.downloaded}\nSkipped: ${result.data.skipped}\nFailed: ${result.data.failed}`)
        
        // Reload status
        const statusResult = await api.getGenomeStatus(genomeName)
        if (statusResult.data) {
          setSyncStatus(prev => ({
            ...prev,
            [genomeName]: statusResult.data
          }))
        }
      } else {
        console.error(`Error downloading ${genomeName}:`, result.error)
        alert(`Failed to download ${genomeName}: ${result.error}`)
      }
    } catch (error) {
      console.error(`Error downloading ${genomeName}:`, error)
      alert(`Failed to download ${genomeName}`)
    }
  }

  const handleDownloadFile = async (objectName: string) => {
    try {
      await api.downloadFile('reference', objectName)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (genomeName: string) => {
    const status = syncStatus[genomeName]
    if (!status) return null

    switch (status.status) {
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Complete
          </span>
        )
      case 'synced_minio_db':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3" />
            MinIO + DB
          </span>
        )
      case 'synced_minio_local':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3" />
            MinIO + Local
          </span>
        )
      case 'minio_only':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
            <AlertCircle className="h-3 w-3" />
            MinIO Only
          </span>
        )
      case 'local_only':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3" />
            Local Only
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3" />
            Missing
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Storage Management</h2>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Storage Management</h2>

      {authError && (
        <Alert variant="error">
          {authError}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'genomes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('genomes')}
        >
          Genomes in Storage
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'status' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('status')}
        >
          Sync Status
        </button>
      </div>

      {/* Sync Actions */}
      <Area>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5" />
            <h3 className="text-lg font-semibold">MinIO Object Storage</h3>
          </div>
          <Button
            onClick={handleSyncToMinIO}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Sync to MinIO
              </>
            )}
          </Button>
        </div>

        {syncResult && (
          <div className={`mb-4 p-3 rounded-md ${syncResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="font-medium">
                {syncResult.success ? 'Sync completed' : 'Sync failed'}
              </span>
            </div>
            {syncResult.success ? (
              <div className="mt-2 text-sm grid grid-cols-3 gap-2">
                <div className="text-green-700">Uploaded: {syncResult.uploaded}</div>
                <div className="text-yellow-700">Skipped: {syncResult.skipped}</div>
                <div className="text-red-700">Failed: {syncResult.failed}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm">{syncResult.error}</div>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Synchronizes reference genomes from local filesystem to MinIO object storage.
          Files are stored in the 'reference-genomes' bucket with metadata.
        </div>
      </Area>

      {/* Content based on active tab */}
      {activeTab === 'genomes' ? (
        <Area>
          <h3 className="text-lg font-semibold mb-4">Genomes in MinIO Storage</h3>
          
          {genomes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No genomes found in MinIO storage</p>
              <p className="text-sm mt-1">Use the "Sync to MinIO" button above to upload genomes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {genomes.map((genome) => (
                <div key={genome.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{genome.name}</h4>
                      {getStatusBadge(genome.name)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(genome.total_size)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadGenome(genome.name)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className={`text-center p-2 rounded ${genome.has_fasta ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-xs font-medium">FASTA</div>
                      <div className="text-sm">{genome.has_fasta ? '✓' : '✗'}</div>
                    </div>
                    <div className={`text-center p-2 rounded ${genome.has_fai ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-xs font-medium">FAI Index</div>
                      <div className="text-sm">{genome.has_fai ? '✓' : '✗'}</div>
                    </div>
                    <div className={`text-center p-2 rounded ${genome.has_sti ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-xs font-medium">STI Index</div>
                      <div className="text-sm">{genome.has_sti ? '✓' : '✗'}</div>
                    </div>
                    <div className="text-center p-2 rounded bg-gray-50 text-gray-700">
                      <div className="text-xs font-medium">Files</div>
                      <div className="text-sm">{genome.files.length}</div>
                    </div>
                  </div>

                  <div className="text-xs">
                    <div className="font-medium mb-1">Files:</div>
                     <div className="space-y-1 max-h-24 overflow-y-auto">
                       {genome.files.map((file, idx) => (
                         <div key={idx} className="flex justify-between items-center py-1 border-b">
                           <span className="truncate">{file.object}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                             <button
                               onClick={() => handleDownloadFile(file.object)}
                               className="p-1 text-blue-600 hover:text-blue-800"
                               title="Download file"
                             >
                               <Download className="h-3 w-3" />
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Area>
      ) : (
        <Area>
          <h3 className="text-lg font-semibold mb-4">Genome Synchronization Status</h3>
          
          {Object.keys(syncStatus).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sync status available</p>
              <p className="text-sm mt-1">Sync genomes to MinIO first to see status</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(syncStatus).map(([genomeName, status]) => (
                <div key={genomeName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{genomeName}</h4>
                    {getStatusBadge(genomeName)}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className={`text-center p-3 rounded ${status.minio ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-sm font-medium">MinIO</div>
                      <div className="text-lg">{status.minio ? '✓' : '✗'}</div>
                    </div>
                    <div className={`text-center p-3 rounded ${status.database ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-sm font-medium">Database</div>
                      <div className="text-lg">{status.database ? '✓' : '✗'}</div>
                    </div>
                    <div className={`text-center p-3 rounded ${status.local ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className="text-sm font-medium">Local</div>
                      <div className="text-lg">{status.local ? '✓' : '✗'}</div>
                    </div>
                  </div>

                  {status.database && status.db_status && (
                    <div className="mb-3 p-2 bg-blue-50 rounded">
                      <div className="text-xs font-medium text-blue-800">Database Status:</div>
                      <div className="text-sm">{status.db_status}</div>
                      {status.db_path && (
                        <div className="text-xs text-blue-600 truncate">{status.db_path}</div>
                      )}
                    </div>
                  )}

                  {status.files.length > 0 && (
                    <div className="text-xs">
                      <div className="font-medium mb-1">Files by source:</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {status.files.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 border-b">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${file.source === 'minio' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {file.source}
                              </span>
                              <span className="truncate">{file.object || file.path}</span>
                            </div>
                            <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Area>
      )}
    </div>
  )
}