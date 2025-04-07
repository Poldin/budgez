'use client'

import { useParams } from 'next/navigation'
import BellaPreview from '../components/bella/preview'

export default function PreviewPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white py-4 px-6 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold">Budget Preview</h1>
        </div>
      </header>
      
      <main>
        <BellaPreview id={id} />
      </main>
    </div>
  )
} 