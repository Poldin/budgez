'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getQuoteById } from '@/app/actions/quote-actions';
import type { Resource, Activity, GeneralDiscount } from '@/types/budget';
import type { PDFConfig } from '@/components/budget/pdf-html-generator';
import QuoteHeader from '@/components/quote/quote-header';
import QuoteActivitiesTable from '@/components/quote/quote-activities-table';
import QuoteSummary from '@/components/quote/quote-summary';
import QuoteTimeline from '@/components/quote/quote-timeline';
import QuoteContractTerms from '@/components/quote/quote-contract-terms';
import AppHeader from '@/components/app-header';
import Footer from '@/components/footer/footer';
import { translations, type Language } from '@/lib/translations';

interface QuoteData {
  id: string;
  name: string | null;
  created_at: string;
  metadata: any;
  is_template: boolean | null;
  deadline: string | null;
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

        const quote = result.data as QuoteData;
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

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading quote:', err);
        setError('Errore nel caricamento del preventivo');
        setLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

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
        <AppHeader 
          language={language}
          onLanguageChange={setLanguage}
          translations={t}
          user={null}
          onLoginClick={() => {}}
          onLogout={async () => {}}
        />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader 
        language={language}
        onLanguageChange={setLanguage}
        translations={t}
        user={null}
        onLoginClick={() => {}}
        onLogout={async () => {}}
      />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Header con logo/company info */}
          <QuoteHeader pdfConfig={pdfConfig} />

          {/* Titolo preventivo */}
          <h1 className="text-2xl font-bold text-gray-900 pb-2 mb-5 border-b border-gray-300">
            {budgetName}
          </h1>

          {/* Tabella attività */}
          {activities.length > 0 && (
            <QuoteActivitiesTable
              resources={resources}
              activities={activities}
              currency={currency}
              language={language}
            />
          )}

          {/* Riepilogo totale */}
          {activities.length > 0 && (
            <QuoteSummary
              resources={resources}
              activities={activities}
              generalDiscount={generalDiscount}
              currency={currency}
              language={language}
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
    </div>
  );
}

