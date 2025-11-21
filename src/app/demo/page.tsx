'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, Mail, AlertCircle } from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  date: string;
  originalContent: string;
  aiResponse: string;
}

const mockEmails: Email[] = [
  {
    id: '1',
    subject: 'Richiesta preventivo per sviluppo web',
    date: '2025-11-12',
    originalContent: `Buongiorno,

siamo una startup nel settore fintech e stiamo cercando un partner per lo sviluppo di una piattaforma web innovativa. Vorremmo ricevere un preventivo dettagliato per un progetto che include:

- Frontend React/Next.js
- Backend Node.js con database PostgreSQL
- Integrazione API di pagamento
- Dashboard amministrativa

Gradiremmo conoscere i tempi di realizzazione e i costi.

Cordiali saluti,
Marco Rossi
CTO - FinTech Solutions`,
    aiResponse: `Gentile Marco,

grazie per averci contattato. Siamo molto interessati al vostro progetto.

Sulla base delle vostre richieste, abbiamo preparato una stima preliminare:

**Sviluppo Frontend (React/Next.js)**: 80 ore - €6.400
**Sviluppo Backend (Node.js + PostgreSQL)**: 100 ore - €8.000
**Integrazione API Pagamento**: 40 ore - €3.200
**Dashboard Amministrativa**: 60 ore - €4.800

**Totale stimato**: €22.400 (IVA esclusa)
**Tempi di realizzazione**: 8-10 settimane

Siamo disponibili per un incontro per discutere i dettagli del progetto.

Cordiali saluti,
Il Team`
  },
  {
    id: '2',
    subject: 'Info corso formazione aziendale',
    date: '2025-11-11',
    originalContent: `Salve,

rappresento un'azienda con 25 dipendenti e vorremmo organizzare un corso di formazione interno su:
- Gestione del tempo
- Team building
- Comunicazione efficace

Potete fornirci informazioni su disponibilità e costi?

Grazie,
Laura Bianchi
HR Manager - TechCorp`,
    aiResponse: `Gentile Laura,

siamo lieti di proporvi il nostro percorso formativo personalizzato.

**Programma formativo per 25 partecipanti:**

Modulo 1: Gestione del tempo (4 ore) - €1.200
Modulo 2: Team building (6 ore) - €1.800
Modulo 3: Comunicazione efficace (4 ore) - €1.200

**Investimento totale**: €4.200 (IVA esclusa)
**Include**: Materiale didattico, coffee break, attestati di partecipazione

Possiamo organizzare le sessioni in presenza o modalità mista. Disponibilità a partire da dicembre 2025.

Restiamo a disposizione per personalizzare ulteriormente il programma.

Cordiali saluti,
Il Team Formazione`
  },
  {
    id: '3',
    subject: 'Consulenza marketing digitale',
    date: '2025-11-10',
    originalContent: `Buonasera,

gestiamo un e-commerce di prodotti artigianali e vorremmo migliorare la nostra presenza online. Cerchiamo supporto per:

- SEO e ottimizzazione sito
- Gestione social media
- Campagne Google Ads
- Email marketing

Quale sarebbe il vostro approccio?

Grazie,
Giuseppe Verdi
Owner - Artigianato Italiano`,
    aiResponse: `Gentile Giuseppe,

abbiamo analizzato le vostre esigenze e proponiamo un pacchetto di marketing digitale completo.

**Servizi mensili inclusi:**

✓ SEO e ottimizzazione (20 ore/mese) - €1.600
✓ Social Media Management - €800
✓ Campagne Google Ads (gestione) - €600
✓ Email Marketing (2 campagne/mese) - €400

**Investimento mensile**: €3.400 (IVA esclusa)
**Durata minima contratto**: 6 mesi
**Budget ADS non incluso**: da definire in base agli obiettivi

Prima fase: audit completo e strategia (€800 one-time)

Disponibili per presentarvi case study del settore artigianato.

Cordiali saluti,
Il Team Marketing`
  },
  {
    id: '4',
    subject: 'Manutenzione sito web esistente',
    date: '2025-11-09',
    originalContent: `Ciao,

abbiamo un sito WordPress che necessita di manutenzione ordinaria e aggiornamenti periodici. Cerchiamo un partner affidabile per:

- Aggiornamenti plugin e tema
- Backup settimanali
- Monitoraggio sicurezza
- Supporto tecnico
- Piccole modifiche contenuti

Offrite pacchetti di manutenzione?

Saluti,
Anna Neri
Digital Manager - Retail Plus`,
    aiResponse: `Ciao Anna,

certamente! Offriamo pacchetti di manutenzione WordPress su misura.

**Pacchetto Manutenzione Standard:**

• Aggiornamenti plugin e tema (settimanali)
• Backup automatici giornalieri
• Monitoraggio sicurezza 24/7
• Supporto tecnico (risposta entro 24h)
• 3 ore/mese per modifiche contenuti

**Canone mensile**: €280 (IVA esclusa)

**Servizi aggiuntivi disponibili:**
- Ottimizzazioni performance: €150/intervento
- Ore extra modifiche: €60/ora

Possiamo partire già dalla prossima settimana con un audit iniziale gratuito.

Fammi sapere se hai bisogno di chiarimenti!

Cordiali saluti,
Il Team Tecnico`
  }
];

export default function DemoPage() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(mockEmails[0]);
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>({});
  const [modifiedEmails, setModifiedEmails] = useState<Set<string>>(new Set());
  const [acceptedEmails, setAcceptedEmails] = useState<Set<string>>(new Set());

  const handleResponseChange = (emailId: string, newResponse: string) => {
    setEditedResponses(prev => ({
      ...prev,
      [emailId]: newResponse
    }));
    
    // Marca come modificato se diverso dall'originale
    const email = mockEmails.find(e => e.id === emailId);
    if (email && newResponse !== email.aiResponse) {
      setModifiedEmails(prev => new Set(prev).add(emailId));
    } else {
      setModifiedEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  const handleAccept = (emailId: string) => {
    setAcceptedEmails(prev => new Set(prev).add(emailId));
    // Qui si potrebbe inviare la risposta al backend
    setTimeout(() => {
      alert('Risposta accettata e inviata!');
    }, 300);
  };

  const getCurrentResponse = (email: Email) => {
    return editedResponses[email.id] ?? email.aiResponse;
  };

  const isModified = (emailId: string) => modifiedEmails.has(emailId);
  const isAccepted = (emailId: string) => acceptedEmails.has(emailId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Revisione Email AI</h1>
          <p className="text-gray-600 mt-2">
            Rivedi e modifica le risposte generate dall'intelligenza artificiale
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Colonna sinistra - Lista email */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Elaborate ({mockEmails.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-2">
                {mockEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedEmail?.id === email.id
                        ? 'border-gray-900 bg-gray-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                        {email.subject}
                      </h3>
                      {isAccepted(email.id) && (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{email.date}</p>
                    {isModified(email.id) && !isAccepted(email.id) && (
                      <Badge variant="outline" className="mt-2 text-xs bg-amber-50 border-amber-300 text-amber-700">
                        Modificata
                      </Badge>
                    )}
                    {isAccepted(email.id) && (
                      <Badge variant="outline" className="mt-2 text-xs bg-green-50 border-green-300 text-green-700">
                        Accettata
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Colonna destra - Dettaglio email */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            {selectedEmail ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                {/* Email originale */}
                <Card className="flex flex-col h-full">
                  <CardHeader className="pb-3 border-b bg-gray-50">
                    <CardTitle className="text-base">Email Originale</CardTitle>
                    <p className="text-sm text-gray-600 font-normal mt-1">
                      {selectedEmail.subject}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto pt-4">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                        {selectedEmail.originalContent}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Risposta AI */}
                <Card className="flex flex-col h-full">
                  <CardHeader className="pb-3 border-b bg-blue-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base">Risposta AI</CardTitle>
                        <p className="text-sm text-gray-600 font-normal mt-1">
                          {isModified(selectedEmail.id) 
                            ? 'Bozza modificata manualmente' 
                            : 'Bozza generata automaticamente'}
                        </p>
                      </div>
                      {isModified(selectedEmail.id) && !isAccepted(selectedEmail.id) && (
                        <div className="flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-md border border-amber-300">
                          <AlertCircle className="h-4 w-4 text-amber-700" />
                          <span className="text-xs font-medium text-amber-700">
                            Modifiche rilevate
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto pt-4 flex flex-col gap-3">
                    <Textarea
                      value={getCurrentResponse(selectedEmail)}
                      onChange={(e) => handleResponseChange(selectedEmail.id, e.target.value)}
                      className={`flex-1 resize-none font-sans text-sm leading-relaxed ${
                        isModified(selectedEmail.id) 
                          ? 'border-amber-300 bg-amber-50/30 focus:border-amber-400' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Modifica la risposta dell'AI..."
                      disabled={isAccepted(selectedEmail.id)}
                    />
                    
                    {isModified(selectedEmail.id) && !isAccepted(selectedEmail.id) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-amber-900">
                              Sistema di apprendimento attivo
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              Le tue modifiche verranno registrate per migliorare le future elaborazioni dell'AI
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => handleAccept(selectedEmail.id)}
                      disabled={isAccepted(selectedEmail.id)}
                      className={`w-fit self-end ${
                        isAccepted(selectedEmail.id) 
                          ? 'bg-green-600 hover:bg-green-600' 
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      size="lg"
                    >
                      {isAccepted(selectedEmail.id) ? (
                        <>
                          <Check className="h-5 w-5 mr-2" />
                          Accettata
                        </>
                      ) : (
                        'Accetta'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent>
                  <p className="text-gray-500 text-center">
                    Seleziona un'email dalla lista per visualizzare i dettagli
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

