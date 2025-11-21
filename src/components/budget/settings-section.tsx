import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, FileJson, Bot, Copy, Check, LayoutTemplate, Settings2, Calendar, X, Plus } from 'lucide-react';
import { NumberInput } from "@/components/ui/number-input";
import CurrencySelector from '@/components/currency-selector';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import { Switch } from "@/components/ui/switch";

interface SettingsSectionProps {
  budgetName: string;
  setBudgetName: (name: string) => void;
  budgetDescription: string;
  setBudgetDescription: (description: string) => void;
  budgetTags: string[];
  setBudgetTags: (tags: string[]) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  defaultVat: number;
  setDefaultVat: (vat: number) => void;
  expirationEnabled: boolean;
  setExpirationEnabled: (enabled: boolean) => void;
  expirationValue: number;
  setExpirationValue: (value: number) => void;
  expirationUnit: 'days' | 'weeks' | 'months';
  setExpirationUnit: (unit: 'days' | 'weeks' | 'months') => void;
  calculatedExpirationDate: Date;
  
  // Template selection
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  randomizedTags: string[];
  filteredTemplates: any[];
  loadConfiguration: (config: any, templateName?: string, templateDescription?: string, templateTags?: string[]) => void;
  budgetTemplatesLength: number;
  totalTemplatesInDb?: number;
  
  // Actions
  onOpenJsonDialog: () => void;
  
  translations: any;
}

export default function SettingsSection({
  budgetName,
  setBudgetName,
  budgetDescription,
  setBudgetDescription,
  budgetTags,
  setBudgetTags,
  currency,
  setCurrency,
  defaultVat,
  setDefaultVat,
  expirationEnabled,
  setExpirationEnabled,
  expirationValue,
  setExpirationValue,
  expirationUnit,
  setExpirationUnit,
  calculatedExpirationDate,
  searchQuery,
  setSearchQuery,
  selectedTags,
  toggleTag,
  randomizedTags,
  filteredTemplates,
  loadConfiguration,
  budgetTemplatesLength,
  totalTemplatesInDb,
  onOpenJsonDialog,
  translations: t
}: SettingsSectionProps) {
  const [promptCopied, setPromptCopied] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [templatesToShow, setTemplatesToShow] = useState(12); // Mostra 12 template inizialmente

  // Reset templatesToShow quando cambiano i filtri
  React.useEffect(() => {
    setTemplatesToShow(12);
  }, [searchQuery, selectedTags]);

  const copyAiPrompt = async () => {
    const prompt = `Agisci come un generatore di JSON per l'app di preventivi Budgez.
Genera un oggetto JSON valido con questa struttura completa:

{
  "budgetName": "Nome del preventivo",
  "currency": "€",
  "defaultVat": 22,
  "resources": [
    {
      "id": "1",
      "name": "Nome Risorsa",
      "costType": "hourly",
      "pricePerHour": 50
    }
  ],
  "activities": [
    {
      "id": "1",
      "name": "Nome Attività",
      "description": "Descrizione dettagliata",
      "vat": 22,
      "startDate": "2024-01-15",
      "endDate": "2024-01-30",
      "resources": [
        {
          "resourceId": "1",
          "hours": 10,
          "fixedPrice": 0
        }
      ],
      "discount": {
        "enabled": false,
        "type": "percentage",
        "value": 0,
        "applyOn": "taxable"
      }
    }
  ],
  "generalDiscount": {
    "enabled": false,
    "type": "percentage",
    "value": 0,
    "applyOn": "taxable"
  },
  "expiration": {
    "enabled": true,
    "value": 2,
    "unit": "weeks"
  },
  "pdfConfig": {
    "companyName": "La tua Azienda S.r.l.",
    "companyInfo": "P. IVA 12345678901\\nVia Esempio 123\\n00100 Roma (RM)\\nTel. 06-1234567\\nwww.tuodominio.it\\ninfo@tuodominio.it",
    "headerText": "Spett.le\\n[NOME CLIENTE]\\n[INDIRIZZO]\\n[CAP] [CITTÀ]\\nCF/P.IVA: [CODICE FISCALE]\\n\\nAlla cortese attenzione di [REFERENTE]",
    "contractTerms": "CONDIZIONI DI PAGAMENTO:\\n• Acconto del 30% alla firma\\n• Saldo alla consegna\\n• Bonifico bancario entro 30 giorni\\n\\nVALIDITÀ OFFERTA: 30 giorni\\n\\nTERMINI DI CONSEGNA:\\n• Completamento previsto entro [TEMPO] dalla firma",
    "signatureSection": {
      "companyName": "[NOME AZIENDA]",
      "signerName": "[NOME COGNOME]",
      "signerRole": "[RUOLO]",
      "date": "2024-01-15",
      "place": "[CITTÀ]"
    }
  }
}

Note importanti:
- "costType" può essere: "hourly" (orario), "quantity" (quantità), "fixed" (fisso)
- Per risorse "fixed", il prezzo va specificato in "fixedPrice" nell'activity
- "discount" e "generalDiscount" sono opzionali - metti "enabled": false se non servono
- "startDate" ed "endDate" sono opzionali per le attività (formato ISO: YYYY-MM-DD)
- "applyOn" può essere "taxable" (imponibile) o "withVat" (totale con IVA)
- "expiration.unit" può essere "days", "weeks" o "months"
- "pdfConfig" include i dati di mittente (companyName, companyInfo), destinatario (headerText) e condizioni contrattuali (contractTerms)

L'utente vuole un preventivo per: [INSERISCI QUI LA TUA RICHIESTA]`;

    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy prompt', err);
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd MMMM yyyy', { locale: it });
  };

  const handleAddTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !budgetTags.includes(trimmedTag)) {
      setBudgetTags([...budgetTags, trimmedTag]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setBudgetTags(budgetTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              <CardTitle className="text-lg">{t.chooseTemplate}</CardTitle>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyAiPrompt}
                className="flex-1 md:flex-none"
              >
                {promptCopied ? <Check className="h-4 w-4 mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
                {promptCopied ? t.promptCopied : t.useAi}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onOpenJsonDialog}
                className="flex-1 md:flex-none"
              >
                <FileJson className="h-4 w-4 mr-2" />
                {t.manualSetup}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              {/* Search and Tags */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={`Cerca tra ${budgetTemplatesLength} template...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {randomizedTags.slice(0, 8).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Template Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.slice(0, templatesToShow).map((template) => (
                  <div 
                    key={template.id}
                    className="bg-white p-3 rounded-lg border hover:shadow-md cursor-pointer transition-all group"
                    onClick={() => loadConfiguration(template.config, template.name, template.description, template.tags)}
                  >
                    <div className="font-semibold text-sm mb-1 group-hover:text-primary">{template.name}</div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{template.description}</p>
                    <div className="flex gap-1">
                      {template.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mostra di più button */}
              {filteredTemplates.length > templatesToShow && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTemplatesToShow(prev => prev + 12)}
                    className="w-full sm:w-auto"
                  >
                    Mostra altri template ({filteredTemplates.length - templatesToShow} rimanenti)
                  </Button>
                </div>
              )}
              
              {/* Mostra se ci sono più template nel DB rispetto a quelli filtrati */}
              {totalTemplatesInDb !== undefined && totalTemplatesInDb > filteredTemplates.length && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  Mostrando {filteredTemplates.length} di {totalTemplatesInDb} template disponibili
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Settings Form */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
          <Settings2 className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-lg">{t.settings}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget Name */}
          <div className="col-span-2">
            <Label htmlFor="budgetName" className="text-sm font-medium text-gray-700 mb-1.5 block">
              {t.budgetName}
            </Label>
            <Input
              id="budgetName"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              placeholder="Preventivo..."
              className="max-w-xl"
            />
          </div>

          {/* Budget Description */}
          <div className="col-span-2">
            <Label htmlFor="budgetDescription" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Descrizione Generale
            </Label>
            <Textarea
              id="budgetDescription"
              value={budgetDescription}
              onChange={(e) => setBudgetDescription(e.target.value)}
              placeholder="Inserisci una descrizione generale del preventivo..."
              className="max-w-xl min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Budget Tags */}
          <div className="col-span-2">
            <Label htmlFor="budgetTags" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Tag
            </Label>
            <div className="space-y-2 max-w-xl">
              {/* Input per aggiungere nuovi tag */}
              <div className="flex gap-2">
                <Input
                  id="budgetTags"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Inserisci un tag e premi Invio..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTagInput.trim() || budgetTags.includes(newTagInput.trim())}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Lista dei tag esistenti */}
              {budgetTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {budgetTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-sm px-3 py-1 flex items-center gap-1.5 font-light"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                        aria-label={`Rimuovi tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Currency & VAT */}
          <div className="grid grid-cols-2 gap-4 col-span-2">
            <CurrencySelector
              value={currency}
              onChange={setCurrency}
              label={t.currency}
            />
            
            <div>
              <Label htmlFor="defaultVat" className="text-sm font-medium text-gray-700 mb-1.5 block">
                {t.defaultVat}
              </Label>
              <NumberInput
                id="defaultVat"
                value={defaultVat}
                onChange={setDefaultVat}
                placeholder="22"
                min={0}
                max={100}
                className="max-w-24"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Switch
                checked={expirationEnabled}
                onCheckedChange={setExpirationEnabled}
              />
              <Label className="text-sm font-medium text-gray-700 block">
                {t.expirationDate}
              </Label>
            </div>
            <div className={`transition-opacity duration-200 ${expirationEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex items-center gap-2">
                <div className="w-24">
                  <NumberInput
                    value={expirationValue}
                    onChange={setExpirationValue}
                    min={1}
                    disabled={!expirationEnabled}
                  />
                </div>
                <Select 
                  value={expirationUnit} 
                  onValueChange={(v: any) => setExpirationUnit(v)}
                  disabled={!expirationEnabled}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">{t.expirationDays}</SelectItem>
                    <SelectItem value="weeks">{t.expirationWeeks}</SelectItem>
                    <SelectItem value="months">{t.expirationMonths}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(calculatedExpirationDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
