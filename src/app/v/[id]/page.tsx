'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getQuoteById } from '@/app/actions/quote-actions';
import type { Resource, Activity, GeneralDiscount } from '@/types/budget';
import type { PDFConfig } from '@/components/budget/pdf-html-generator';
import QuoteHeader from '@/components/quote/quote-header';
import QuoteTimeline from '@/components/quote/quote-timeline';
import QuoteContractTerms from '@/components/quote/quote-contract-terms';
import Footer from '@/components/footer/footer';
import SummaryTable from '@/components/budget/summary-table';
import QuoteSignOtpDialog from '@/components/quote/quote-sign-otp-dialog';
import { generateTableHTML } from '@/components/budget/table-html-generator';
import { translations, type Language } from '@/lib/translations';
import { signQuoteWithOTP } from '@/app/actions/quote-actions';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface QuoteData {
  id: string;
  name: string | null;
  created_at: string;
  metadata: any;
  is_template: boolean | null;
  deadline: string | null;
  verification_id: string | null;
  otp_verification?: {
    email: string;
    verified_at: string;
  } | null;
}

export default function QuoteViewPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const [language, setLanguage] = useState<Language>('it');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [budgetName, setBudgetName] = useState('');
  const [currency, setCurrency] = useState('€');
  const [resources, setResources] = useState<Resource[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState<GeneralDiscount>({
    enabled: false,
    type: 'percentage',
    value: 0,
    applyOn: 'taxable'
  });
  const [pdfConfig, setPdfConfig] = useState<PDFConfig | undefined>(undefined);
  const [tableCopied, setTableCopied] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<{ email: string; verifiedAt: string } | null>(null);

  const t = translations[language];

  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        setError('ID preventivo non valido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getQuoteById(quoteId);

        if (!result.success || !result.data) {
          setError(result.error || 'Preventivo non trovato');
          setLoading(false);
          return;
        }

        // Gestisci il caso in cui otp_verification possa essere un array o null
        const data = result.data as any;
        const quote: QuoteData = {
          ...data,
          otp_verification: Array.isArray(data.otp_verification) 
            ? (data.otp_verification.length > 0 ? data.otp_verification[0] : null)
            : data.otp_verification || null
        };
        setQuoteData(quote);

        // Estrai i dati dai metadata
        const metadata = quote.metadata || {};
        
        if (metadata.budgetName) setBudgetName(metadata.budgetName);
        else if (quote.name) setBudgetName(quote.name);
        else setBudgetName('Preventivo');

        if (metadata.currency) setCurrency(metadata.currency);
        if (metadata.resources) setResources(metadata.resources as Resource[]);
        if (metadata.activities) setActivities(metadata.activities as Activity[]);
        if (metadata.generalDiscount) {
          setGeneralDiscount(metadata.generalDiscount as GeneralDiscount);
        }

        // Estrai pdfConfig se presente
        if (metadata.pdfConfig) {
          setPdfConfig(metadata.pdfConfig as PDFConfig);
        }

        // Carica dati verifica OTP se presente
        if (quote.verification_id && quote.otp_verification) {
          setVerificationData({
            email: quote.otp_verification.email,
            verifiedAt: quote.otp_verification.verified_at
          });
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading quote:', err);
        setError('Errore nel caricamento del preventivo');
        setLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

  const copyTableToClipboard = async () => {
    try {
      const tableHTML = generateTableHTML(resources, activities, generalDiscount, currency, language);
      const richTextBlob = new Blob([tableHTML], { type: 'text/html' });
      const plainTextBlob = new Blob([tableHTML], { type: 'text/plain' });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': richTextBlob,
          'text/plain': plainTextBlob
        })
      ]);
      setTableCopied(true);
      setTimeout(() => setTableCopied(false), 3000);
    } catch {
      // Fallback for browsers that don't support ClipboardItem
      try {
        await navigator.clipboard.writeText(generateTableHTML(resources, activities, generalDiscount, currency, language));
        setTableCopied(true);
        setTimeout(() => setTableCopied(false), 3000);
      } catch (err2) {
        console.error('Errore nella copia:', err2);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento preventivo...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Errore</h1>
            <p className="text-gray-600">{error || 'Preventivo non trovato'}</p>
          </div>
        </main>
        <Footer language={language} onLanguageChange={setLanguage} />
      </div>
    );
  }

  // Formatta la scadenza se presente (data e ora senza minuti e secondi)
  const formattedDeadline = quoteData?.deadline 
    ? (() => {
        const deadlineDate = new Date(quoteData.deadline);
        const dateStr = deadlineDate.toLocaleDateString('it-IT', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
        const hourStr = deadlineDate.getHours().toString().padStart(2, '0');
        return `${dateStr} ${hourStr}:00`;
      })()
    : null;

  // Calcola giorni e ore rimanenti
  const getTimeRemaining = () => {
    if (!quoteData?.deadline) return null;
    
    const deadline = new Date(quoteData.deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return null; // Scaduta
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days, hours };
  };

  const timeRemaining = getTimeRemaining();

  const handleSignWithOTP = async (verificationId: string) => {
    try {
      const result = await signQuoteWithOTP(quoteId, verificationId);
      if (result.success && result.email && result.verifiedAt) {
        setVerificationData({
          email: result.email,
          verifiedAt: result.verifiedAt
        });
        // Ricarica i dati del quote
        const quoteResult = await getQuoteById(quoteId);
        if (quoteResult.success && quoteResult.data) {
          const data = quoteResult.data as any;
          const quote: QuoteData = {
            ...data,
            otp_verification: Array.isArray(data.otp_verification) 
              ? (data.otp_verification.length > 0 ? data.otp_verification[0] : null)
              : data.otp_verification || null
          };
          setQuoteData(quote);
        }
      }
    } catch (error) {
      console.error('Error signing quote:', error);
    }
  };

  // Formatta la data di firma
  const formatSignatureDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const hourStr = date.getHours().toString().padStart(2, '0');
    const minuteStr = date.getMinutes().toString().padStart(2, '0');
    return `${dateStr} alle ${hourStr}:${minuteStr}`;
  };

  // Gestisce la condivisione del preventivo
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/v/${quoteId}`;
    const shareText = `Preventivo: ${budgetName}\n\nVisualizza il preventivo completo qui: ${shareUrl}`;
    
    // Usa Web Share API se disponibile
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Preventivo: ${budgetName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // Utente ha annullato o errore
        console.log('Errore nella condivisione:', err);
      }
    } else {
      // Fallback: copia negli appunti
      try {
        await navigator.clipboard.writeText(shareUrl);
        // Potresti mostrare un toast qui se necessario
      } catch (err) {
        console.error('Errore nella copia:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header fisso con scadenza e firma */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto py-2 flex items-center justify-between">
            <div>
              {formattedDeadline && (
                <>
                  <div className="text-xs text-gray-600 font-medium">
                    Scadenza: {formattedDeadline}
                  </div>
                  {timeRemaining && (
                    <div className="text-xs text-gray-600 font-medium mt-0.5">
                      Mancano {timeRemaining.days} {timeRemaining.days === 1 ? 'giorno' : 'giorni'} e {timeRemaining.hours} {timeRemaining.hours === 1 ? 'ora' : 'ore'}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="text-right flex items-center gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Condividi
              </Button>
              {verificationData ? (
                <div className="text-xs text-gray-600 font-medium">
                  Firmato con OTP da {verificationData.email} il {formatSignatureDate(verificationData.verifiedAt)}
                </div>
              ) : (
                <Button
                  onClick={() => setSignDialogOpen(true)}
                  variant="default"
                  size="sm"
                  className="h-7 text-xs bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Firma con OTP
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Header con logo/company info */}
          <QuoteHeader pdfConfig={pdfConfig} />

          {/* Titolo preventivo */}
          <h1 className="text-2xl font-bold text-gray-900 pb-2 mb-5 border-b border-gray-300">
            {budgetName}
          </h1>

          {/* Tabella riepilogativa */}
          {activities.length > 0 && (
            <SummaryTable
              activities={activities}
              resources={resources}
              generalDiscount={generalDiscount}
              currency={currency}
              tableCopied={tableCopied}
              onCopy={copyTableToClipboard}
              translations={t}
            />
          )}

          {/* Timeline */}
          <QuoteTimeline activities={activities} />

          {/* Condizioni contrattuali */}
          {pdfConfig?.contractTerms && (
            <QuoteContractTerms contractTerms={pdfConfig.contractTerms} />
          )}
        </div>
      </main>

      <Footer language={language} onLanguageChange={setLanguage} />

      {/* Dialog Firma OTP */}
      <QuoteSignOtpDialog
        open={signDialogOpen}
        onOpenChange={setSignDialogOpen}
        onSigned={handleSignWithOTP}
      />
    </div>
  );
}

