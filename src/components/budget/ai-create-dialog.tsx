'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface AICreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (config: any) => void;
}

// Prompt completo per l'AI
const AI_PROMPT = `Sei un assistente specializzato nella creazione di preventivi professionali. Il tuo compito è generare un JSON strutturato che può essere importato in Budgez, un'applicazione per la gestione di preventivi.

## ISTRUZIONI

Analizza la descrizione del progetto fornita dall'utente e genera un JSON completo con:
1. Risorse (figure professionali o voci di costo)
2. Attività (attività del progetto)
3. Assegnazione delle risorse alle attività con ore stimate o quantità o costo fisso
4. Intestazione mittente e destinatario (opzionale, se l'utente fornisce i dati)
5. Condizioni contrattuali (opzionale)

## STRUTTURA JSON RICHIESTA

\`\`\`json
{
  "budgetName": "Nome del preventivo",
  "budgetDescription": "Descrizione generale del preventivo e del progetto",
  "budgetTags": ["tag1", "tag2", "tag3"],
  "currency": "€",
  "defaultVat": 22,
  "resources": [
    {
      "id": "res_1",
      "name": "Nome risorsa/figura professionale",
      "costType": "hourly",
      "pricePerHour": 50,
      "margin": 0
    }
  ],
  "activities": [
    {
      "id": "act_1",
      "name": "Nome attività",
      "description": "Descrizione dettagliata dell'attività",
      "vat": 22,
      "margin": 0,
      "resources": [
        {
          "resourceId": "res_1",
          "hours": 10,
          "fixedPrice": 0
        }
      ]
    }
  ],
  "generalDiscount": {
    "enabled": false,
    "type": "percentage",
    "value": 0,
    "applyOn": "taxable"
  },
  "generalMargin": {
    "enabled": false,
    "value": 0
  },
  "pdfConfig": {
    "companyName": "Nome Azienda Mittente",
    "companyInfo": "Nome Azienda\\nP. IVA 12345678901\\nVia Example 123\\n00100 - Roma (RM)\\nTel. 06 1234567\\nwww.example.it\\ninfo@example.it",
    "headerText": "Spett.le\\nNOME AZIENDA CLIENTE\\nVia Cliente 456\\n20100 MILANO (MI)\\nCF/P.IVA: 98765432109\\n\\nAlla cortese attenzione di Nome Referente",
    "contractTerms": "CONDIZIONI DI PAGAMENTO:\\n• Acconto del 30% alla firma del contratto\\n• Saldo alla consegna del progetto/servizio\\n• Pagamenti tramite bonifico bancario entro 30 giorni dalla data fattura\\n\\nVALIDITÀ DELL'OFFERTA:\\n• La presente offerta ha validità di 30 giorni dalla data di emissione\\n\\nTERMINI DI CONSEGNA:\\n• Il completamento del progetto è previsto entro 60 giorni dalla firma del contratto\\n• Eventuali ritardi dovuti a causa di forza maggiore non sono imputabili al fornitore\\n\\nGARANZIA:\\n• 12 mesi di garanzia su difetti di fabbricazione o malfunzionamenti",
    "signatureSection": {
      "companyName": "Nome Azienda",
      "signerName": "Nome e Cognome",
      "signerRole": "Ruolo/Titolo",
      "date": "",
      "place": "Città"
    }
  }
}
\`\`\`

## REGOLE IMPORTANTI

1. **ID univoci**: Ogni risorsa deve avere un \`id\` univoco (es: "res_1", "res_2") e ogni attività un \`id\` univoco (es: "act_1", "act_2")
2. **Collegamento risorse**: Il campo \`resourceId\` nelle attività deve corrispondere esattamente all'\`id\` di una risorsa definita
3. **costType**: Può essere:
   - \`"hourly"\`: tariffa oraria (usa \`pricePerHour\` per il costo e \`hours\` per le ore)
   - \`"quantity"\`: costo a quantità (usa \`pricePerHour\` per il costo unitario e \`hours\` per la quantità)
   - \`"fixed"\`: costo fisso (usa \`fixedPrice\` nell'assegnazione dell'attività)
4. **IVA**: Il campo \`vat\` è la percentuale IVA (22 per l'Italia, 0 per esenti)
5. **Margine**: I campi \`margin\` sono percentuali opzionali per il ricarico commerciale
6. **Date opzionali**: Puoi aggiungere \`startDate\` e \`endDate\` alle attività in formato ISO (es: "2025-01-15")
7. **budgetDescription**: Descrizione generale del preventivo/progetto (opzionale ma consigliata)
8. **budgetTags**: Array di tag per categorizzare il preventivo (es: ["web", "design", "consulenza"])
9. **pdfConfig** (opzionale): Contiene i dati per l'intestazione del documento PDF:
   - \`companyName\`: Nome dell'azienda mittente
   - \`companyInfo\`: Dati completi del mittente (P.IVA, indirizzo, contatti) - usa \\n per andare a capo
   - \`headerText\`: Dati del destinatario/cliente - usa \\n per andare a capo
   - \`contractTerms\`: Condizioni contrattuali, pagamento, garanzia - usa \\n per andare a capo
   - \`signatureSection\`: Dati per la sezione firma del documento

## ESEMPIO COMPLETO

\`\`\`json
{
  "budgetName": "Sviluppo Sito Web E-commerce",
  "budgetDescription": "Sviluppo completo di una piattaforma e-commerce con gestione prodotti, carrello, checkout e integrazione pagamenti. Include design responsive, pannello amministrativo e ottimizzazione SEO.",
  "budgetTags": ["e-commerce", "web development", "React", "Node.js"],
  "currency": "€",
  "defaultVat": 22,
  "resources": [
    {
      "id": "res_pm",
      "name": "Project Manager",
      "costType": "hourly",
      "pricePerHour": 75,
      "margin": 0
    },
    {
      "id": "res_dev",
      "name": "Sviluppatore Full Stack",
      "costType": "hourly",
      "pricePerHour": 55,
      "margin": 0
    },
    {
      "id": "res_design",
      "name": "UX/UI Designer",
      "costType": "hourly",
      "pricePerHour": 60,
      "margin": 0
    },
    {
      "id": "res_hosting",
      "name": "Hosting annuale",
      "costType": "fixed",
      "pricePerHour": 0,
      "margin": 0
    }
  ],
  "activities": [
    {
      "id": "act_1",
      "name": "Analisi e pianificazione",
      "description": "Raccolta requisiti, definizione architettura e pianificazione progetto",
      "vat": 22,
      "margin": 0,
      "resources": [
        { "resourceId": "res_pm", "hours": 16, "fixedPrice": 0 },
        { "resourceId": "res_dev", "hours": 8, "fixedPrice": 0 }
      ]
    },
    {
      "id": "act_2",
      "name": "Design UI/UX",
      "description": "Progettazione interfaccia utente, wireframe e mockup",
      "vat": 22,
      "margin": 0,
      "resources": [
        { "resourceId": "res_design", "hours": 40, "fixedPrice": 0 },
        { "resourceId": "res_pm", "hours": 8, "fixedPrice": 0 }
      ]
    },
    {
      "id": "act_3",
      "name": "Sviluppo Frontend",
      "description": "Implementazione interfaccia utente responsive con React/Next.js",
      "vat": 22,
      "margin": 0,
      "resources": [
        { "resourceId": "res_dev", "hours": 80, "fixedPrice": 0 }
      ]
    },
    {
      "id": "act_4",
      "name": "Sviluppo Backend e integrazione pagamenti",
      "description": "API, database, integrazione Stripe/PayPal per pagamenti",
      "vat": 22,
      "margin": 0,
      "resources": [
        { "resourceId": "res_dev", "hours": 60, "fixedPrice": 0 }
      ]
    },
    {
      "id": "act_5",
      "name": "Testing e deploy",
      "description": "Test funzionali, ottimizzazione performance e messa in produzione",
      "vat": 22,
      "margin": 0,
      "resources": [
        { "resourceId": "res_dev", "hours": 24, "fixedPrice": 0 },
        { "resourceId": "res_pm", "hours": 8, "fixedPrice": 0 }
      ]
    },
    {
      "id": "act_6",
      "name": "Infrastruttura hosting",
      "description": "Setup e configurazione hosting cloud per 1 anno",
      "vat": 22,
      "margin": 0,
      "resources": [
        { "resourceId": "res_hosting", "hours": 0, "fixedPrice": 480 }
      ]
    }
  ],
  "generalDiscount": {
    "enabled": false,
    "type": "percentage",
    "value": 0,
    "applyOn": "taxable"
  },
  "generalMargin": {
    "enabled": false,
    "value": 0
  },
  "pdfConfig": {
    "companyName": "WebDev Solutions Srl",
    "companyInfo": "WebDev Solutions Srl\\nP. IVA 12345678901\\nVia della Tecnologia 42\\n00144 - Roma (RM)\\nTel. 06 9876543\\nwww.webdevsolutions.it\\ninfo@webdevsolutions.it",
    "headerText": "Spett.le\\nACME COMMERCE SPA\\nVia del Commercio 100\\n20121 MILANO (MI)\\nCF/P.IVA: 98765432109\\n\\nAlla cortese attenzione di Mario Rossi",
    "contractTerms": "CONDIZIONI DI PAGAMENTO:\\n• Acconto del 30% alla firma del contratto\\n• 40% al completamento del design e sviluppo frontend\\n• Saldo del 30% alla consegna e messa online\\n• Pagamenti tramite bonifico bancario entro 30 giorni dalla data fattura\\n\\nVALIDITÀ DELL'OFFERTA:\\n• La presente offerta ha validità di 30 giorni dalla data di emissione\\n\\nTERMINI DI CONSEGNA:\\n• Il completamento del progetto è previsto entro 90 giorni dalla firma del contratto\\n• Eventuali ritardi dovuti a modifiche richieste dal cliente o causa di forza maggiore non sono imputabili al fornitore\\n\\nGARANZIA:\\n• 12 mesi di garanzia su bug e malfunzionamenti del software sviluppato\\n• Supporto tecnico via email incluso per 6 mesi dalla consegna",
    "signatureSection": {
      "companyName": "WebDev Solutions Srl",
      "signerName": "Giuseppe Bianchi",
      "signerRole": "Amministratore Delegato",
      "date": "",
      "place": "Roma"
    }
  }
}
\`\`\`

---

## DESCRIZIONE DEL PROGETTO DA PREVENTIVARE

[Inserisci qui la descrizione del progetto. Includi:
- Tipo di progetto/servizio richiesto
- Obiettivi principali
- Funzionalità desiderate
- Eventuali vincoli tecnici o di budget
- Timeline desiderata (se presente)
- Dati della tua azienda (mittente) se vuoi che vengano inclusi nell'intestazione
- Dati del cliente destinatario se disponibili
- Condizioni contrattuali specifiche (pagamento, garanzia, etc.) se diverse da quelle standard]

---

Genera SOLO il JSON, senza commenti o spiegazioni aggiuntive.`;

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateBudgetJson(json: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!json.currency) {
    errors.push('Campo "currency" mancante');
  }
  
  if (!Array.isArray(json.resources)) {
    errors.push('Campo "resources" mancante o non è un array');
  } else {
    // Validate resources
    const resourceIds = new Set<string>();
    json.resources.forEach((res: any, index: number) => {
      if (!res.id) {
        errors.push(`Risorsa ${index + 1}: manca il campo "id"`);
      } else {
        if (resourceIds.has(res.id)) {
          errors.push(`Risorsa ${index + 1}: id "${res.id}" duplicato`);
        }
        resourceIds.add(res.id);
      }
      if (!res.name) {
        warnings.push(`Risorsa ${index + 1}: manca il campo "name"`);
      }
      if (!res.costType) {
        errors.push(`Risorsa ${index + 1}: manca il campo "costType"`);
      } else if (!['hourly', 'quantity', 'fixed'].includes(res.costType)) {
        errors.push(`Risorsa ${index + 1}: costType "${res.costType}" non valido (usa: hourly, quantity, fixed)`);
      }
      if (res.pricePerHour === undefined && res.costType !== 'fixed') {
        warnings.push(`Risorsa ${index + 1}: manca il campo "pricePerHour"`);
      }
    });

    // Validate activities
    if (!Array.isArray(json.activities)) {
      errors.push('Campo "activities" mancante o non è un array');
    } else {
      const activityIds = new Set<string>();
      json.activities.forEach((act: any, index: number) => {
        if (!act.id) {
          errors.push(`Attività ${index + 1}: manca il campo "id"`);
        } else {
          if (activityIds.has(act.id)) {
            errors.push(`Attività ${index + 1}: id "${act.id}" duplicato`);
          }
          activityIds.add(act.id);
        }
        if (!act.name) {
          warnings.push(`Attività ${index + 1}: manca il campo "name"`);
        }
        if (act.vat === undefined) {
          warnings.push(`Attività ${index + 1}: manca il campo "vat" (IVA)`);
        }
        
        // Validate resource assignments
        if (Array.isArray(act.resources)) {
          act.resources.forEach((assign: any, assignIndex: number) => {
            if (!assign.resourceId) {
              errors.push(`Attività ${index + 1}, assegnazione ${assignIndex + 1}: manca "resourceId"`);
            } else if (!resourceIds.has(assign.resourceId)) {
              errors.push(`Attività ${index + 1}: resourceId "${assign.resourceId}" non corrisponde a nessuna risorsa definita`);
            }
          });
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export default function AICreateDialog({
  open,
  onOpenChange,
  onLoad
}: AICreateDialogProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setJsonInput('');
      setValidation(null);
      setParseError(null);
      setPromptCopied(false);
      setShowFullPrompt(false);
    }
  }, [open]);

  // Validate JSON in real-time
  const validateJson = useCallback((input: string) => {
    if (!input.trim()) {
      setValidation(null);
      setParseError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setParseError(null);
      const result = validateBudgetJson(parsed);
      setValidation(result);
    } catch (e: any) {
      setParseError(e.message || 'JSON non valido');
      setValidation(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      validateJson(jsonInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [jsonInput, validateJson]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 3000);
    } catch (err) {
      console.error('Errore nella copia:', err);
    }
  };

  const handleSubmit = () => {
    if (!validation?.isValid) return;
    
    try {
      const config = JSON.parse(jsonInput);
      onLoad(config);
      onOpenChange(false);
    } catch {
      // Should not happen as we already validated
    }
  };

  const canSubmit = validation?.isValid && !parseError && jsonInput.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[60vw] h-[95vh] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Crea con AI</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Usa ChatGPT, Claude, Gemini o altri AI per generare il tuo preventivo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
          {/* Step 1: Copy Prompt */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <Label className="text-base font-semibold">Copia il prompt</Label>
            </div>
            
            <div className="bg-gray-50 rounded-lg border">
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Copia questo prompt e incollalo su <strong>ChatGPT</strong>, <strong>Claude</strong>, <strong>Gemini</strong> o qualsiasi altro assistente AI.
                  Poi completa la sezione finale con la descrizione del tuo progetto.
                </p>
                
                <div className="bg-white rounded-lg border p-3 font-mono text-xs text-gray-700 max-h-48 overflow-auto">
                  {showFullPrompt ? (
                    <pre className="whitespace-pre-wrap">{AI_PROMPT}</pre>
                  ) : (
                    <>
                      <pre className="whitespace-pre-wrap">{AI_PROMPT.slice(0, 500)}...</pre>
                      <button
                        onClick={() => setShowFullPrompt(true)}
                        className="text-violet-600 hover:text-violet-800 mt-2 flex items-center gap-1 text-sm font-sans"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Mostra prompt completo
                      </button>
                    </>
                  )}
                  {showFullPrompt && (
                    <button
                      onClick={() => setShowFullPrompt(false)}
                      className="text-violet-600 hover:text-violet-800 mt-2 flex items-center gap-1 text-sm font-sans"
                    >
                      <ChevronUp className="h-4 w-4" />
                      Nascondi
                    </button>
                  )}
                </div>
              </div>
              
              <div className="border-t px-4 py-3 bg-gray-50 rounded-b-lg">
                <Button
                  onClick={handleCopyPrompt}
                  variant={promptCopied ? "default" : "outline"}
                  className={`w-full sm:w-auto transition-all ${
                    promptCopied 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : ''
                  }`}
                >
                  {promptCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copia prompt
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Paste JSON */}
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <Label className="text-base font-semibold">Incolla il JSON generato</Label>
            </div>
            
            <p className="text-sm text-gray-600">
              Una volta che l'AI ha generato il JSON, copialo e incollalo qui sotto. La validazione avviene in tempo reale.
            </p>

            <div className="flex-1 flex flex-col min-h-[200px]">
              <Textarea
                placeholder='{"budgetName": "...", "currency": "€", "resources": [...], "activities": [...]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="font-mono text-xs flex-1 resize-none min-h-[200px]"
              />
            </div>

            {/* Validation Status */}
            {(parseError || validation) && (
              <div className={`rounded-lg border p-3 ${
                parseError 
                  ? 'bg-red-50 border-red-200' 
                  : validation?.isValid 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-amber-50 border-amber-200'
              }`}>
                {parseError ? (
                  <div className="flex items-start gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Errore di sintassi JSON</p>
                      <p className="text-sm mt-1">{parseError}</p>
                    </div>
                  </div>
                ) : validation?.isValid ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-medium">JSON valido! Puoi procedere con l'importazione.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {validation?.errors && validation.errors.length > 0 && (
                      <div className="flex items-start gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Errori da correggere:</p>
                          <ul className="text-sm mt-1 list-disc list-inside space-y-1">
                            {validation.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {validation?.warnings && validation.warnings.length > 0 && (
                      <div className="flex items-start gap-2 text-amber-700 mt-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Avvisi (non bloccanti):</p>
                          <ul className="text-sm mt-1 list-disc list-inside space-y-1">
                            {validation.warnings.map((warn, i) => (
                              <li key={i}>{warn}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Submit */}
        <div className="border-t px-6 py-4 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`${
                canSubmit 
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700' 
                  : ''
              }`}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Importa preventivo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

