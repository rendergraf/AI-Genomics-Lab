'use client'

/**
 * AI Genomics Lab - Graph View Component
 * Visualización del grafo de conocimiento con Cytoscape.js
 * 
 * Author: Xavier Araque
 * Email: xavieraraque@gmail.com
 * GitHub: https://github.com/rendergraf/AI-Genomics-Lab
 * Version: 0.1
 * License: MIT
 */

import { useEffect, useRef, useState } from 'react'
import cytoscape, { ElementDefinition } from 'cytoscape'

interface GraphViewProps {
  data?: {
    nodes: Array<{ id: string; label: string; type: string }>
    edges: Array<{ source: string; target: string; type: string }>
  }
}

export default function GraphView({ data }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current) return

    // Sample data for visualization
    const sampleElements: ElementDefinition[] = [
      { data: { id: 'BRCA1', label: 'BRCA1', type: 'gene' } },
      { data: { id: 'TP53', label: 'TP53', type: 'gene' } },
      { data: { id: 'm1', label: 'c.68_69delAG', type: 'mutation' } },
      { data: { id: 'm2', label: 'R273H', type: 'mutation' } },
      { data: { id: 'd1', label: 'Breast Cancer', type: 'disease' } },
      { data: { id: 'd2', label: 'Ovarian Cancer', type: 'disease' } },
      { data: { id: 'd3', label: 'Li-Fraumeni', type: 'disease' } },
      { data: { source: 'BRCA1', target: 'm1', type: 'has_mutation' } },
      { data: { source: 'TP53', target: 'm2', type: 'has_mutation' } },
      { data: { source: 'm1', target: 'd1', type: 'causes' } },
      { data: { source: 'm1', target: 'd2', type: 'causes' } },
      { data: { source: 'm2', target: 'd3', type: 'causes' } },
      { data: { source: 'BRCA1', target: 'TP53', type: 'interacts_with' } },
    ]

    // Use provided data or sample data
    let elements: ElementDefinition[] = sampleElements
    
    if (data?.nodes?.length) {
      elements = [
        ...data.nodes.map(n => ({ data: n })),
        ...data.edges.map(e => ({ data: e }))
      ] as ElementDefinition[]
    }

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy()
      cyRef.current = null
    }

    try {
      // Initialize Cytoscape
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node[type="gene"]',
            style: {
              'background-color': '#3b82f6',
              'label': 'data(label)',
              'color': '#fff',
              'font-size': '12px',
              'width': 60,
              'height': 60,
            },
          },
          {
            selector: 'node[type="mutation"]',
            style: {
              'background-color': '#ef4444',
              'label': 'data(label)',
              'color': '#fff',
              'font-size': '10px',
              'width': 40,
              'height': 40,
            },
          },
          {
            selector: 'node[type="disease"]',
            style: {
              'background-color': '#22c55e',
              'label': 'data(label)',
              'color': '#fff',
              'font-size': '11px',
              'width': 50,
              'height': 50,
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#94a3b8',
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
            },
          },
          {
            selector: 'edge[type="causes"]',
            style: {
              'line-color': '#ef4444',
              'target-arrow-color': '#ef4444',
            },
          },
          {
            selector: 'edge[type="interacts_with"]',
            style: {
              'line-color': '#8b5cf6',
              'target-arrow-color': '#8b5cf6',
              'line-style': 'dashed',
            },
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 3,
              'border-color': '#fbbf24',
            },
          },
        ],
        layout: {
          name: 'cose',
          animate: true,
          animationDuration: 500,
        },
      })

      cyRef.current = cy

      // Handle node tap
      cy.on('tap', 'node', (evt) => {
        const node = evt.target
        setSelectedNode(node.data('label'))
      })
    } catch (error) {
      console.error('Error initializing cytoscape:', error)
    }

    return () => {
      if (cyRef.current) {
        try {
          cyRef.current.destroy()
        } catch (e) {
          // Ignore cleanup errors
        }
        cyRef.current = null
      }
    }
  }, [data, isClient])

  if (!isClient) {
    return (
      <div className="w-full h-[400px] rounded-lg border bg-slate-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading graph...</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full h-[400px] rounded-lg border bg-slate-50"
      />
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg text-xs shadow-md">
        <div className="font-semibold mb-2">Legend</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Gene</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Mutation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Disease</span>
        </div>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg text-xs shadow-md">
          <div className="font-semibold">Selected: {selectedNode}</div>
        </div>
      )}
    </div>
  )
}
