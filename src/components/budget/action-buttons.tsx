'use client'

import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { FileDown, Download, Copy, Check, Sparkles, Plus } from 'lucide-react';

interface ActionButtonsProps {
  configCopied: boolean;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  onExportJSON: () => void;
  onCopyConfig: () => void;
  onCreateInteractive: () => void;
  savingQuote?: boolean;
  isEditing?: boolean;
  onCreateNew?: () => void;
}

export default function ActionButtons({
  configCopied,
  onExportPDF,
  onExportDOCX,
  onExportJSON,
  onCopyConfig,
  onCreateInteractive,
  savingQuote = false,
  isEditing = false,
  onCreateNew
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center items-center mb-8">
      {/* Esporta con Select */}
      <Select onValueChange={(value) => {
        if (value === 'pdf') {
          onExportPDF();
        } else if (value === 'docx') {
          onExportDOCX();
        }
      }}>
        <SelectTrigger className="group h-11 overflow-hidden transition-all duration-300 w-11 hover:w-[140px] hover:gap-2 justify-center hover:justify-start bg-white border border-input hover:bg-accent hover:text-accent-foreground">
          <FileDown className="h-5 w-5 flex-shrink-0" />
          <span className="whitespace-nowrap opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto transition-all duration-300">
            Esporta
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="docx">DOCX</SelectItem>
        </SelectContent>
      </Select>

      {/* Salva config */}
      <Button 
        onClick={onExportJSON} 
        variant="outline"
        className="group h-11 overflow-hidden transition-all duration-300 w-11 hover:w-[160px] hover:gap-2 justify-center hover:justify-start"
      >
        <Download className="h-5 w-5 flex-shrink-0" />
        <span className="whitespace-nowrap opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto transition-all duration-300">
          Salva config
        </span>
      </Button>

      {/* Copia config */}
      <Button 
        onClick={onCopyConfig} 
        variant={configCopied ? "default" : "outline"} 
        className={`group h-11 overflow-hidden transition-all duration-300 hover: gap-2 justify-center hover:justify-start ${
          configCopied 
            ? 'bg-green-600 hover:bg-green-700 w-11' 
            : 'w-11 hover:w-[160px]'
        }`}
        disabled={configCopied}
      >
        {configCopied ? (
          <Check className="h-5 w-5 text-white flex-shrink-0" />
        ) : (
          <Copy className="h-5 w-5 flex-shrink-0" />
        )}
        <span className={`whitespace-nowrap transition-all duration-300 ${
          configCopied 
            ? 'opacity-0 w-0' 
            : 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto'
        }`}>
          Copia config
        </span>
      </Button>

      {/* CTA principale - Pagina interattiva */}
      <div className="flex items-center gap-3">
        {isEditing && onCreateNew && (
          <Button 
            onClick={onCreateNew} 
            size="lg" 
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            <Plus className="h-5 w-5 mr-2" />
            Crea nuovo preventivo
          </Button>
        )}
        <Button 
          onClick={onCreateInteractive} 
          size="lg" 
          variant="default"
          className="bg-gray-900 hover:bg-gray-800 text-white"
          disabled={savingQuote}
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {savingQuote 
            ? 'Salvataggio...' 
            : isEditing 
              ? 'Modifica' 
              : 'Crea e condividi'}
        </Button>
      </div>
    </div>
  );
}

