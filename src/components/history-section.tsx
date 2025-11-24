'use client'

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUserQuotes, deleteQuote, getQuoteCounts, getMonthlyStats } from '@/app/actions/quote-actions'
import { formatDateToLocal, formatNumber } from '@/lib/budget-utils'
import { Eye, Edit, Trash2, Share2 } from 'lucide-react'
import type { Language } from '@/lib/translations'
import {
  calculateGrandTotal,
  calculateGeneralDiscountAmount,
  calculateGrandVat
} from '@/lib/budget-calculations'
import type { Resource, Activity, GeneralDiscount } from '@/types/budget'

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
  verification_id: string | null
  otp_verification?: {
    email: string
    verified_at: string
  } | null
}

type FilterType = 'all' | 'expired' | 'notExpired' | 'signed'

export default function HistorySection({ userId, language, translations: t }: HistorySectionProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [counts, setCounts] = useState<{ all: number; expired: number; notExpired: number; signed: number }>({
    all: 0,
    expired: 0,
    notExpired: 0,
    signed: 0
  })
  const [monthlyStats, setMonthlyStats] = useState<{
    twoMonthsAgo: { created: number; signed: number; conversionRate: number }
    lastMonth: { created: number; signed: number; conversionRate: number }
    currentMonth: { created: number; signed: number; conversionRate: number }
  } | null>(null)

  const requiredText = 'elimina permanentemente'
  const canDelete = confirmText === requiredText

  // Carica i contatori e le statistiche mensili all'inizio e quando cambia userId
  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        const [countsResult, statsResult] = await Promise.all([
          getQuoteCounts(userId),
          getMonthlyStats(userId)
        ])
        
        if (countsResult.success && countsResult.data) {
          setCounts(countsResult.data)
        }
        
        if (statsResult.success && statsResult.data) {
          setMonthlyStats(statsResult.data)
        }
      }
    }

    loadData()
  }, [userId])

  useEffect(() => {
    const loadQuotes = async () => {
      setLoading(true)
      const result = await getUserQuotes(userId, filter)
      if (result.success && result.data) {
        // Gestisci il caso in cui otp_verification possa essere un array o null
        const quotes: Quote[] = (result.data as any[]).map((data: any) => ({
          ...data,
          otp_verification: Array.isArray(data.otp_verification) 
            ? (data.otp_verification.length > 0 ? data.otp_verification[0] : null)
            : data.otp_verification || null
        }))
        setQuotes(quotes)
      }
      setLoading(false)
    }

    if (userId) {
      loadQuotes()
    }
  }, [userId, filter])


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
      
      // Ricarica i contatori e le statistiche mensili
      const [countsResult, statsResult] = await Promise.all([
        getQuoteCounts(userId),
        getMonthlyStats(userId)
      ])
      
      if (countsResult.success && countsResult.data) {
        setCounts(countsResult.data)
      }
      
      if (statsResult.success && statsResult.data) {
        setMonthlyStats(statsResult.data)
      }
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

  const handleShare = async (quote: Quote) => {
    const shareUrl = `${window.location.origin}/v/${quote.id}`
    const quoteName = quote.name || t.unnamedQuote || 'Preventivo senza nome'
    const shareText = `Preventivo: ${quoteName}\n\nVisualizza il preventivo completo qui: ${shareUrl}`
    
    // Usa Web Share API se disponibile
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Preventivo: ${quoteName}`,
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        // Utente ha annullato o errore
        console.log('Errore nella condivisione:', err)
      }
    } else {
      // Fallback: copia negli appunti
      try {
        await navigator.clipboard.writeText(shareUrl)
        // Potresti mostrare un toast qui se necessario
      } catch (err) {
        console.error('Errore nella copia:', err)
      }
    }
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
      <div className="text-center py-8">
        <p className="text-gray-600 text-lg mb-2">{t.historyEmpty}</p>
        <p className="text-gray-500 text-sm">{t.historyEmptyDesc}</p>
      </div>
    )
  }

  return (
    <>
      {/* Filtri */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}
        >
          Tutti
          <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs font-medium">
            {counts.all}
          </span>
        </Button>
        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('expired')}
          className={filter === 'expired' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}
        >
          Scaduti
          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
            filter === 'expired' ? 'bg-white/20' : 'bg-gray-100 text-gray-700'
          }`}>
            {counts.expired}
          </span>
        </Button>
        <Button
          variant={filter === 'notExpired' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('notExpired')}
          className={filter === 'notExpired' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}
        >
          Non scaduti
          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
            filter === 'notExpired' ? 'bg-white/20' : 'bg-gray-100 text-gray-700'
          }`}>
            {counts.notExpired}
          </span>
        </Button>
        <Button
          variant={filter === 'signed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('signed')}
          className={filter === 'signed' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}
        >
          Firmati
          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
            filter === 'signed' ? 'bg-white/20' : 'bg-gray-100 text-gray-700'
          }`}>
            {counts.signed}
          </span>
        </Button>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg mb-2">Nessun preventivo trovato con questo filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const deadlineDate = quote.deadline ? new Date(quote.deadline) : null;
            const isExpired = deadlineDate && deadlineDate < new Date();
            
            // Calcola i valori finanziari se i dati sono disponibili
            const metadata = quote.metadata || {};
            const resources = metadata.resources as Resource[] || [];
            const activities = metadata.activities as Activity[] || [];
            const generalDiscount = metadata.generalDiscount as GeneralDiscount || {
              enabled: false,
              type: 'percentage',
              value: 0,
              applyOn: 'taxable'
            };
            const currency = metadata.currency || '€';
            const defaultVat = metadata.defaultVat || 22; // IVA di default
            
            let grandTotal = 0;
            let generalDiscountAmount = 0;
            let grandVat = 0;
            
            if (resources.length > 0 && activities.length > 0) {
              try {
                grandTotal = calculateGrandTotal(resources, activities, generalDiscount);
                generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount);
                grandVat = calculateGrandVat(resources, activities);
              } catch (error) {
                console.error('Error calculating totals for quote:', quote.id, error);
              }
            }
            
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
                      {deadlineDate && !(quote.verification_id && quote.otp_verification) && (
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
                      {quote.verification_id && quote.otp_verification && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Firmato da {quote.otp_verification.email} il {(() => {
                            const date = new Date(quote.otp_verification.verified_at);
                            const dateStr = date.toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            });
                            const hourStr = date.getHours().toString().padStart(2, '0');
                            const minuteStr = date.getMinutes().toString().padStart(2, '0');
                            return `${dateStr} alle ${hourStr}:${minuteStr}`;
                          })()}
                        </span>
                      )}
                    </div>
                    {/* Informazioni finanziarie */}
                    {grandTotal > 0 && (
                      <div className="mt-2 flex items-center gap-4 text-sm flex-wrap">
                        <span className="font-semibold text-gray-900">
                          Prezzo finale: {currency}{formatNumber(grandTotal)}
                        </span>
                        {grandVat > 0 && (
                          <span className="text-gray-600">
                            IVA ({defaultVat}%): {currency}{formatNumber(grandVat)}
                          </span>
                        )}
                        {generalDiscountAmount > 0 && (
                          <span className="text-amber-600 font-medium">
                            Sconto: -{currency}{formatNumber(generalDiscountAmount)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare(quote)}
                      className="h-9 w-9 bg-white hover:bg-gray-50"
                      title={t.shareQuote || 'Condividi preventivo'}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
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
      )}

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
    </>
  )
}

