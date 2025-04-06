'use client'

import { useState, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Image, Upload } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import NextImage from 'next/image'

interface BlockMetadata {
  url?: string
  alt?: string
  width?: number
  height?: number
  fileName?: string
  storageKey?: string
}

interface BlockData {
  content: string
  metadata?: BlockMetadata
}

interface ImageBlockProps {
  block: {
    id: string
    content: string
    alignment: 'left' | 'center' | 'right'
    metadata?: BlockMetadata
  }
  onChange: (data: BlockData) => void
}

export default function ImageBlock({ block, onChange }: ImageBlockProps) {
  const [isEditing, setIsEditing] = useState(!block.metadata?.url)
  const [url, setUrl] = useState(block.metadata?.url || '')
  const [alt, setAlt] = useState(block.metadata?.alt || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const getAlignmentClasses = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'ml-0 mr-auto';
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto mr-0';
      default: return 'mx-auto';
    }
  }

  const handleSave = () => {
    onChange({
      content: url,
      metadata: {
        ...block.metadata,
        url,
        alt
      }
    })
    setIsEditing(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validazione del file
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Il file è troppo grande. La dimensione massima è 5MB.')
      return
    }
    
    if (!file.type.startsWith('image/')) {
      setUploadError('Il file deve essere un\'immagine.')
      return
    }
    
    setIsUploading(true)
    setUploadError('')
    setUploadProgress(0)
    
    try {
      // Generiamo un nome file unico
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const storageKey = `bella-images/${fileName}`
      
      // Upload del file a Supabase Storage
      const { error } = await supabase.storage
        .from('budget-files')
        .upload(storageKey, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // Aggiorniamo il progresso al 100% dopo l'upload completato
      setUploadProgress(100)
      
      // Ottenere l'URL pubblico del file
      const { data: publicUrlData } = supabase.storage
        .from('budget-files')
        .getPublicUrl(storageKey)
      
      const publicUrl = publicUrlData.publicUrl
      
      setUrl(publicUrl)
      
      // Aggiorniamo i metadati
      onChange({
        content: publicUrl,
        metadata: {
          ...block.metadata,
          url: publicUrl,
          alt: alt || file.name,
          fileName: file.name,
          storageKey
        }
      })
      
      setIsUploading(false)
      setIsEditing(false)
      
    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Errore durante l\'upload dell\'immagine'
      setUploadError(errorMessage)
      setIsUploading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="p-4 rounded-md border border-gray-200 w-full">
        <div className="space-y-4">
          <div>
            <Label className="font-bold mb-2 block">Immagine</Label>
            <div className="text-sm text-gray-500 mb-3">
              Scegli se inserire l&apos;URL di un&apos;immagine esistente oppure carica un&apos;immagine dal tuo dispositivo (max 5MB)
            </div>
            
            {/* File upload area */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-500">
                {isUploading 
                  ? `Upload in corso: ${uploadProgress}%` 
                  : 'Trascina qui un file o clicca per caricare'}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {uploadError && (
                <div className="text-sm text-red-500 mt-2">{uploadError}</div>
              )}
            </div>
            
            <div className="text-sm text-gray-500 text-center mb-3">
              oppure
            </div>
            
            {/* URL input */}
            <Label htmlFor={`image-url-${block.id}`}>URL Immagine</Label>
            <Input
              id={`image-url-${block.id}`}
              type="text"
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1"
              disabled={isUploading}
            />
          </div>
          
          <div>
            <Label htmlFor={`image-alt-${block.id}`}>Testo alternativo</Label>
            <Input
              id={`image-alt-${block.id}`}
              type="text"
              placeholder="Descrizione dell'immagine"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="mt-1"
              disabled={isUploading}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isUploading}
            >
              Annulla
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isUploading || !url}
            >
              {isUploading ? 'Caricamento...' : 'Salva'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!block.metadata?.url) {
    return (
      <div 
        className="p-8 border border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 w-full" 
        onClick={() => setIsEditing(true)}
      >
        <Image className="h-8 w-8 text-gray-400 mb-2" />
        <div className="text-sm text-gray-500">Click per aggiungere un&apos;immagine</div>
      </div>
    )
  }

  return (
    <div className="relative group">
      <NextImage 
        src={block.metadata.url} 
        alt={block.metadata.alt || 'Immagine del preventivo'} 
        className={`max-w-full rounded ${getAlignmentClasses(block.alignment)}`}
        style={{ maxHeight: '500px' }}
        width={block.metadata.width || 800}
        height={block.metadata.height || 600}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/80 backdrop-blur-sm"
          onClick={() => setIsEditing(true)}
        >
          Modifica
        </Button>
      </div>
      {block.metadata.alt && (
        <div className="text-sm text-gray-500 mt-1 italic text-center">
          {block.metadata.alt}
        </div>
      )}
    </div>
  )
} 