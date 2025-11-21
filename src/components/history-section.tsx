'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUserQuotes, deleteQuote } from '@/app/actions/quote-actions'
import { formatDateToLocal } from '@/lib/budget-utils'
import { Eye, Edit, Trash2 } from 'lucide-react'
import type { Language } from '@/lib/translations'

interface HistorySectionProps {
  userId: string
  language: Language
  translations: any
}

interface Quote {
  id: string
  name: string | null
  created_at: string
  metadata: any
  is_template: boolean | null
  deadline: string | null
}

export default function HistorySection({ userId, language, translations: t }: HistorySectionProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const requiredText = 'elimina permanentemente'
  const canDelete = confirmText === requiredText

  useEffect(() => {
    const loadQuotes = async () => {
      setLoading(true)
      const result = await getUserQuotes(userId)
      if (result.success && result.data) {
        setQuotes(result.data as Quote[])
      }
      setLoading(false)
    }

    if (userId) {
      loadQuotes()
    }
  }, [userId])

  const handleDeleteClick = (quote: Quote) => {
    setQuoteToDelete(quote)
    setDeleteDialogOpen(true)
    setConfirmText('')
    setDeleteError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!canDelete || !quoteToDelete) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deleteQuote(quoteToDelete.id, userId)
      
      if (!result.success) {
        throw new Error(result.error || 'Errore nell\'eliminazione del preventivo')
      }

      // Rimuovi il preventivo dalla lista
      setQuotes(quotes.filter(q => q.id !== quoteToDelete.id))
      setDeleteDialogOpen(false)
      setQuoteToDelete(null)
      setConfirmText('')
    } catch (err: any) {
      setDeleteError(err.message || 'Errore nell\'eliminazione')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setQuoteToDelete(null)
    setConfirmText('')
    setDeleteError(null)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{t.loading || 'Caricamento...'}</p>
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <Card className="bg-white border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t.historyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg mb-2">{t.historyEmpty}</p>
            <p className="text-gray-500 text-sm">{t.historyEmptyDesc}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-2 border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{t.historyTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quotes.map((quote) => {
            const deadlineDate = quote.deadline ? new Date(quote.deadline) : null;
            const isExpired = deadlineDate && deadlineDate < new Date();
            
            return (
              <div
                key={quote.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {quote.name || t.unnamedQuote || 'Preventivo senza nome'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span>{formatDateToLocal(new Date(quote.created_at))}</span>
                      {deadlineDate && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isExpired 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isExpired ? 'Scaduto: ' : 'Scadenza: '}
                          {formatDateToLocal(deadlineDate)}
                        </span>
                      )}
                      {quote.is_template && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {t.historyTemplate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`/v/${quote.id}`, '_blank')}
                      className="h-9 w-9"
                      title={t.viewQuote || 'Visualizza preventivo'}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`/?qid=${quote.id}`, '_blank')}
                      className="h-9 w-9"
                      title={t.editQuote || 'Modifica preventivo'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(quote)}
                      className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title={t.deleteQuote || 'Elimina preventivo'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Dialog di conferma eliminazione */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteQuoteTitle || 'Elimina preventivo'}</DialogTitle>
            <DialogDescription>
              {t.deleteQuoteDescription || 'Questa azione non può essere annullata. Il preventivo verrà eliminato permanentemente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-text" className="text-sm font-medium">
              {t.deleteQuoteConfirmLabel || 'Digita "elimina permanentemente" per confermare:'}
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="elimina permanentemente"
              className="mt-2"
              disabled={isDeleting}
            />
            {deleteError && (
              <p className="text-sm text-red-600 mt-2">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              {t.cancel || 'Annulla'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!canDelete || isDeleting}
            >
              {isDeleting ? (t.deleting || 'Eliminazione...') : (t.delete || 'Elimina')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

