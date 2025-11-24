'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Key, Info } from 'lucide-react';

export type AIProvider = 'anthropic' | 'openai' | 'gemini';

export type AIModel = 
  | 'claude-sonnet-4.5'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-micro'
  | 'gemini-3-pro'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash';

interface AIConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved?: () => void;
}

interface AIConfig {
  model: AIModel;
  provider: AIProvider;
  apiKey: string;
}

interface ModelInfo {
  id: AIModel;
  name: string;
  provider: AIProvider;
  providerName: string;
}

const MODELS: ModelInfo[] = [
  { id: 'claude-sonnet-4.5', name: 'Claude sonnet 4.5', provider: 'anthropic', providerName: 'Anthropic' },
  { id: 'gpt-5', name: 'GPT 5', provider: 'openai', providerName: 'OpenAI' },
  { id: 'gpt-5-mini', name: 'GPT 5 mini', provider: 'openai', providerName: 'OpenAI' },
  { id: 'gpt-5-micro', name: 'GPT 5 micro', provider: 'openai', providerName: 'OpenAI' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'gemini', providerName: 'Google AI' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', providerName: 'Google AI' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', providerName: 'Google AI' },
];

const PROVIDER_NAMES: Record<AIProvider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google AI'
};

const STORAGE_KEY = 'budgez_ai_config';

export default function AIConfigDialog({
  open,
  onOpenChange,
  onConfigSaved
}: AIConfigDialogProps) {
  const [model, setModel] = useState<AIModel>('claude-sonnet-4.5');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  // Carica configurazione salvata quando si apre il dialog
  useEffect(() => {
    if (open) {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        try {
          const config: any = JSON.parse(savedConfig);
          // Supporto retrocompatibilità: se c'è solo provider, usa il primo modello di quel provider
          if (config.model) {
            setModel(config.model);
          } else if (config.provider) {
            // Trova il primo modello del provider salvato
            const firstModel = MODELS.find(m => m.provider === config.provider);
            if (firstModel) {
              setModel(firstModel.id);
            }
          }
          setApiKey(config.apiKey || '');
        } catch (e) {
          console.error('Errore nel caricamento della configurazione AI:', e);
        }
      }
    }
  }, [open]);

  // Trova il modello selezionato per ottenere il provider
  const selectedModel = MODELS.find(m => m.id === model);
  const provider = selectedModel?.provider || 'anthropic';
  const providerName = selectedModel?.providerName || 'Anthropic';

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Inserisci una API key valida');
      return;
    }

    const config: AIConfig = {
      model,
      provider,
      apiKey: apiKey.trim()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setError('');
      onOpenChange(false);
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (e) {
      setError('Errore nel salvataggio della configurazione');
      console.error('Errore nel salvataggio:', e);
    }
  };

  const handleCancel = () => {
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">            <DialogTitle>Imposta l'AI</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Configura il provider AI e la tua API key per utilizzare la funzionalità di generazione automatica dei preventivi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm font-medium">
              Modello AI
            </Label>
            <Select value={model} onValueChange={(value) => setModel(value as AIModel)}>
              <SelectTrigger id="model">
                <SelectValue>
                  {selectedModel && (
                    <div className="flex items-center gap-2">
                      <span>{selectedModel.name}</span>
                      <span className="text-xs text-gray-500">{selectedModel.providerName}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((modelInfo) => (
                  <SelectItem key={modelInfo.id} value={modelInfo.id}>
                    <div className="flex items-center gap-2">
                      <span>{modelInfo.name}</span>
                      <span className="text-xs text-gray-500">{modelInfo.providerName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={`Inserisci la tua ${providerName} API key`}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              className="font-mono text-sm"
            />
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Puoi ottenere una API key dal sito ufficiale di {providerName}.
              </span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annulla
          </Button>
          <Button onClick={handleSave}>
            Salva configurazione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Funzione helper per ottenere la configurazione salvata
export function getAIConfig(): AIConfig | null {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      return JSON.parse(savedConfig) as AIConfig;
    }
  } catch (e) {
    console.error('Errore nel caricamento della configurazione AI:', e);
  }
  return null;
}

