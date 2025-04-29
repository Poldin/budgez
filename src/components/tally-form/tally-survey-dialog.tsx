'use client'

import React, { useEffect } from 'react'
import Script from 'next/script'

interface TallySurveyDialogProps {
  open: boolean
  onComplete: () => void
  onClose?: () => void
}

// Definisco un tipo specifico per il payload di Tally
interface TallyFormPayload {
  formId: string
  respondentId: string
  responseId: string
  data: Record<string, unknown>
}

export default function TallySurveyDialog({ 
  open, 
  onComplete,
  onClose 
}: TallySurveyDialogProps) {
  
  // Carica lo script di Tally e apri il popup quando richiesto
  useEffect(() => {
    // Solo se il popup è aperto e siamo nel browser
    if (!open || typeof window === 'undefined') return
    
    // Controlla se lo script Tally è già stato caricato
    const isTallyLoaded = typeof window.Tally !== 'undefined'
    
    if (isTallyLoaded && window.Tally) {
      // Se Tally esiste, apri direttamente il popup
      window.Tally.openPopup('np51bb', {
        layout: 'modal',
        width: 800,
        autoClose: 3000,
        onClose: () => {
          // Questa callback viene chiamata quando l'utente chiude il popup senza completare
          if (onClose) onClose();
        },
        onSubmit: (payload: TallyFormPayload) => {
          // Questa callback viene chiamata solo quando l'utente invia il form con successo
          console.log('Form completato con successo:', payload);
          onComplete();
        }
      })
    } else {
      // Se Tally non esiste ancora, crea lo script e ascolta il suo caricamento
      const script = document.createElement('script')
      script.src = 'https://tally.so/widgets/embed.js'
      script.async = true
      
      script.onload = () => {
        // Quando lo script è caricato, apri il popup
        if (window.Tally) {
          window.Tally.openPopup('np51bb', {
            layout: 'modal',
            width: 800,
            autoClose: 3000,
            onClose: () => {
              // Questa callback viene chiamata quando l'utente chiude il popup senza completare
              if (onClose) onClose();
            },
            onSubmit: (payload: TallyFormPayload) => {
              // Questa callback viene chiamata solo quando l'utente invia il form con successo
              console.log('Form completato con successo:', payload);
              onComplete();
            }
          })
        }
      }
      
      document.body.appendChild(script)
      
      // Clean up
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
        
        // Assicurati che il popup venga chiuso quando l'effetto viene pulito
        if (window.Tally) {
          window.Tally.closePopup('np51bb')
        }
      }
    }
  }, [open, onComplete, onClose])
  
  // Il componente non renderizza nulla visivamente, serve solo per gestire il popup di Tally
  return (
    <Script 
      src="https://tally.so/widgets/embed.js"
      strategy="lazyOnload"
    />
  )
}

// Declare Tally interface for TypeScript
declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: {
        key?: string
        layout?: 'default' | 'modal'
        width?: number
        alignLeft?: boolean
        hideTitle?: boolean
        overlay?: boolean
        emoji?: {
          text: string
          animation: 'none' | 'wave' | 'tada' | 'heart-beat' | 'spin' | 'flash' | 'bounce' | 'rubber-band' | 'head-shake'
        }
        autoClose?: number
        showOnce?: boolean
        doNotShowAfterSubmit?: boolean
        customFormUrl?: string
        hiddenFields?: Record<string, unknown>
        onOpen?: () => void
        onClose?: () => void
        onPageView?: (page: number) => void
        onSubmit?: (payload: TallyFormPayload) => void
      }) => void
      closePopup: (formId: string) => void
    }
  }
} 