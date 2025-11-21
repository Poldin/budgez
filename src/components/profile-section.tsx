'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteUserQuotes } from '@/app/actions/quote-actions'
import { createClientSupabaseClient } from '@/lib/database/supabase-client'
import type { Language } from '@/lib/translations'

interface ProfileSectionProps {
  userEmail: string
  userId: string
  language: Language
  translations: any
  onAccountDeleted?: () => void
}

export default function ProfileSection({ 
  userEmail, 
  userId, 
  language, 
  translations: t,
  onAccountDeleted 
}: ProfileSectionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requiredText = 'delete permanently'
  const canDelete = confirmText === requiredText

  const handleDeleteAccount = async () => {
    if (!canDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      // Prima elimina i preventivi dell'utente
      const deleteQuotesResult = await deleteUserQuotes(userId)
      
      if (!deleteQuotesResult.success) {
        throw new Error(deleteQuotesResult.error || 'Errore nell\'eliminazione dei preventivi')
      }

      // Poi esegui il logout e notifica il componente padre
      // Nota: L'eliminazione dell'utente da auth.users richiede privilegi admin
      // e dovrebbe essere gestita tramite una funzione server-side o webhook Supabase
      const supabase = createClientSupabaseClient()
      await supabase.auth.signOut()

      // Se tutto è andato bene, chiudi il dialog e notifica il componente padre
      setDeleteDialogOpen(false)
      if (onAccountDeleted) {
        onAccountDeleted()
      }
    } catch (err: any) {
      setError(err.message || t.deleteAccountError)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="bg-white border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t.profileTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Section */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t.profileEmail}
            </label>
            <Input
              type="email"
              value={userEmail}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t.profileEmailDesc}
            </p>
          </div>

          {/* Delete Account Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                {t.deleteAccount}
              </h3>
              <p className="text-sm text-red-800 mb-4">
                {t.deleteAccountDesc}
              </p>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                {t.deleteAccountButton}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {t.deleteAccountConfirm}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t.deleteAccountDesc}</p>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {t.deleteAccountConfirmText}
                </label>
                <Input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t.deleteAccountPlaceholder}
                  className={confirmText && !canDelete ? 'border-red-500' : ''}
                />
                {confirmText && !canDelete && (
                  <p className="text-xs text-red-600 mt-1">
                    {t.deleteAccountConfirmText}
                  </p>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setConfirmText('')
                setError(null)
              }}
            >
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={!canDelete || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (t.loading || 'Eliminazione...') : t.deleteAccountButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

