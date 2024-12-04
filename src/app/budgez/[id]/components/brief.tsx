'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, X, Link as LinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BudgetData {
  brief: {
    description: string
    documents: Array<{
      id: string
      name: string
      size: string
      url: string
    }>
    links: Array<{
      id: string
      url: string
      name: string
    }>
  }
}

export default function BriefTab({ id }: { id: string }) {
  
  const [description, setDescription] = useState('')
  const [documents, setDocuments] = useState<BudgetData['brief']['documents']>([])
  const [links, setLinks] = useState<BudgetData['brief']['links']>([])
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrief()
  }, [id])

  const fetchBrief = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('body')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data?.body?.brief) {
        setDescription(data.body.brief.description || '')
        setDocuments(data.body.brief.documents || [])
        setLinks(data.body.brief.links || [])
      }
    } catch (error) {
      console.error('Error fetching brief:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateDatabase = async (briefData: BudgetData['brief']) => {
    try {
      const { data: currentBudget, error: fetchError } = await supabase
        .from('budgets')
        .select('body')
        .eq('id', id)
        .single()
  
      if (fetchError) throw fetchError
  
      const currentBody = currentBudget?.body || {}
      const newBody = {
        ...currentBody,
        brief: briefData
      }
  
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ 
          body: newBody,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
  
      if (updateError) throw updateError
    } catch (error) {
      console.error('Error updating brief:', error)
    }
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    updateDatabase({
      description: value,
      documents,
      links
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files[0]) {
      const file = files[0]
      try {
        const newDoc = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name.split('.').slice(0, -1).join('.'),
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          url: URL.createObjectURL(file)
        }
        const updatedDocuments = [...documents, newDoc]
        setDocuments(updatedDocuments)
        await updateDatabase({
          description,
          documents: updatedDocuments,
          links
        })
      } catch (error) {
        console.error('Error uploading file:', error)
      }
      event.target.value = ''
    }
  }

  const updateDocumentName = async (id: string, newName: string) => {
    const updatedDocuments = documents.map(doc =>
      doc.id === id ? { ...doc, name: newName } : doc
    )
    setDocuments(updatedDocuments)
    await updateDatabase({
      description,
      documents: updatedDocuments,
      links
    })
  }

  const removeDocument = async (id: string) => {
    const doc = documents.find(d => d.id === id)
    if (doc?.url) URL.revokeObjectURL(doc.url)
    const updatedDocuments = documents.filter(doc => doc.id !== id)
    setDocuments(updatedDocuments)
    await updateDatabase({
      description,
      documents: updatedDocuments,
      links
    })
  }

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newUrl) {
      const formattedUrl = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
      const newLink = {
        id: Math.random().toString(36).substr(2, 9),
        url: formattedUrl,
        name: new URL(formattedUrl).hostname
      }
      const updatedLinks = [...links, newLink]
      setLinks(updatedLinks)
      await updateDatabase({
        description,
        documents,
        links: updatedLinks
      })
      setNewUrl('')
    }
  }

  const updateLinkName = async (id: string, newName: string) => {
    const updatedLinks = links.map(link =>
      link.id === id ? { ...link, name: newName } : link
    )
    setLinks(updatedLinks)
    await updateDatabase({
      description,
      documents,
      links: updatedLinks
    })
  }

  const removeLink = async (id: string) => {
    const updatedLinks = links.filter(link => link.id !== id)
    setLinks(updatedLinks)
    await updateDatabase({
      description,
      documents,
      links: updatedLinks
    })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Descrizione</h2>
        <Textarea
          placeholder="Inserisci una descrizione..."
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="w-full"
          rows={4}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Documenti</h2>
        <Input
          id="file-upload"
          type="file"
          onChange={handleFileUpload}
          className="w-full max-w-md"
        />
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={doc.name}
                  onChange={(e) => updateDocumentName(doc.id, e.target.value)}
                  className="max-w-xs"
                />
                <span className="text-sm text-muted-foreground">{doc.size}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  Visualizza
                </a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(doc.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Link di riferimento</h2>
        <form onSubmit={addLink} className="flex gap-3">
          <Input
            placeholder="URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 max-w-md"
          />
          <Button type="submit" variant="outline">
            <LinkIcon className="h-4 w-4 mr-2" />
            Aggiungi
          </Button>
        </form>
        <div className="space-y-2">
          {links.map(link => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={link.name}
                  onChange={(e) => updateLinkName(link.id, e.target.value)}
                  className="max-w-xs"
                />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  {link.url}
                </a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeLink(link.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}