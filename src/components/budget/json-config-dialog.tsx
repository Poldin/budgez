'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface JsonConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (config: any) => void;
  translations: {
    loadCustomConfiguration: string;
    pasteYourJSON: string;
    load: string;
    cancel: string;
  };
}

export default function JsonConfigDialog({
  open,
  onOpenChange,
  onLoad,
  translations: t
}: JsonConfigDialogProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const handleLoadJson = () => {
    try {
      const config = JSON.parse(jsonInput);
      if (!config.currency || !config.resources || !config.activities) {
        setJsonError('Configurazione non valida. Assicurati che contenga currency, resources e activities.');
        return;
      }
      onLoad(config);
      onOpenChange(false);
      setJsonInput('');
      setJsonError('');
    } catch {
      setJsonError('JSON non valido. Verifica la sintassi.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[60vw] h-[100vh] max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.loadCustomConfiguration}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <Label>{t.pasteYourJSON}</Label>
            <Textarea
              placeholder='{"currency": "€", "resources": [...], "activities": [...]}'
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError('');
              }}
              className="font-mono text-xs mt-2 flex-1 resize-none"
            />
            {jsonError && (
              <p className="text-sm text-red-600 mt-2">{jsonError}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={handleLoadJson} className="w-fit">
              {t.load}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                setJsonInput('');
                setJsonError('');
              }}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

