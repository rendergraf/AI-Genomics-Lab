import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@fontsource/electrolize'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '🧬 AI Genomics Lab',
  description: 'Local-first platform for genomic analysis using Bioinformatics + AI + LLM + Graph Databases',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-electrolize">
        {/* Definiciones globales */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <clipPath id="btnClip" clipPathUnits="objectBoundingBox">
              <path
                d="
                M 0,0
                H 1
                V 0.65
                C 1,0.68 0.997,0.71 0.99,0.74
                L 0.95,0.90
                C 0.94,0.96 0.93,0.98 0.91,0.98
                H 0
                Z
              "
              />
            </clipPath>
          </defs>
        </svg>
        
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-primary">
                🧬 AI Genomics Lab
              </h1>
              <p className="text-sm text-muted-foreground">
                Genomic analysis platform with AI assistance
              </p>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
