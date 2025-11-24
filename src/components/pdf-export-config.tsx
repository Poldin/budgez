'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, FileCheck, ExternalLink } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { contractTemplates } from '@/lib/contract-templates';

interface PDFConfig {
  companyLogo?: string;
  companyName: string;
  companyInfo: string;
  headerText: string;
  contractTerms: string;
  signatureSection: {
    companyName: string;
    signerName: string;
    signerRole: string;
    date: string;
    place: string;
  };
}

interface PDFExportConfigProps {
  pdfConfig: PDFConfig;
  setPdfConfig: React.Dispatch<React.SetStateAction<PDFConfig>>;
  logoPreview: string | null;
  setLogoPreview: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function PDFExportConfig({
  pdfConfig,
  setPdfConfig,
  logoPreview,
  setLogoPreview,
}: PDFExportConfigProps) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setPdfConfig({ ...pdfConfig, companyLogo: result, companyName: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setPdfConfig({ ...pdfConfig, companyLogo: undefined });
  };

  const handleCompanyNameChange = (value: string) => {
    if (value) {
      setLogoPreview(null);
      setPdfConfig({ ...pdfConfig, companyName: value, companyLogo: undefined });
    } else {
      setPdfConfig({ ...pdfConfig, companyName: value });
    }
  };

  return (
    <div className="mb-8">
      <Accordion type="multiple" defaultValue={["header", "terms"]} className="mb-8">
        {/* Intestazione Section */}
        <AccordionItem value="header">
          <div className="flex items-center justify-between gap-4 mb-4">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Intestazione
              </div>
            </AccordionTrigger>
          </div>

          <AccordionContent>
            <div className="space-y-6">
            {/* Layout controlli: Mittente Sx | Destinatario Dx */}
            <div className="grid grid-cols-2 gap-6">
              {/* Colonna Sinistra - Mittente */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Mittente</Label>
                
                {/* Nome Azienda o Logo */}
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">Nome Azienda</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="companyName"
                      value={pdfConfig.companyName}
                      onChange={(e) => handleCompanyNameChange(e.target.value)}
                      placeholder="Es. ABC Solutions S.r.l."
                      disabled={!!logoPreview}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500">o</span>
                    {logoPreview ? (
                      <div className="relative flex-shrink-0">
                        <div className="border-2 border-gray-200 rounded p-1 bg-white flex items-center justify-center w-20 h-10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={logoPreview} 
                            alt="Logo" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0"
                          onClick={removeLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-shrink-0">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                          disabled={!!pdfConfig.companyName}
                        />
                        <label 
                          htmlFor="logo-upload" 
                          className={`cursor-pointer flex items-center gap-1 px-2 py-2 border-2 border-dashed rounded transition-colors ${pdfConfig.companyName ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-600">Logo</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dati Azienda */}
                <div className="space-y-2">
                  <Label htmlFor="companyInfo" className="text-sm font-medium">Dati Azienda</Label>
                  <Textarea
                    id="companyInfo"
                    value={pdfConfig.companyInfo}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, companyInfo: e.target.value })}
                    placeholder="P. IVA, Indirizzo, Contatti..."
                    rows={8}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Colonna Destra - Destinatario */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Destinatario</Label>
                
                {/* Textarea Destinatario */}
                <div className="space-y-2">
                  <Label htmlFor="headerText" className="text-sm font-medium">Testo</Label>
                  <Textarea
                    id="headerText"
                    value={pdfConfig.headerText}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, headerText: e.target.value })}
                    placeholder="Inserisci destinatario..."
                    rows={8}
                    className="text-xs font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Anteprima sotto */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-center block">Anteprima Intestazione</Label>
              <div className="border-2 border-gray-900 rounded-lg bg-white p-6 shadow-lg">
                <div className="flex justify-between items-start gap-8">
                  {/* Sezione Mittente (Sinistra) - Allineato a sinistra */}
                  <div className="flex-shrink-0 w-[40%] space-y-2 text-left">
                    {logoPreview && (
                      <div className="mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={logoPreview} 
                          alt="Logo" 
                          className="max-w-[150px] max-h-[60px] object-contain"
                        />
                      </div>
                    )}
                    {pdfConfig.companyName && (
                      <div>
                        <p className="font-bold text-base text-gray-900">{pdfConfig.companyName}</p>
                      </div>
                    )}
                    {pdfConfig.companyInfo && (
                      <div>
                        <pre className="font-sans text-xs text-gray-600 whitespace-pre-wrap">{pdfConfig.companyInfo}</pre>
                      </div>
                    )}
                    {!logoPreview && !pdfConfig.companyName && (
                      <div className="text-gray-400 text-xs italic py-8">
                        Inserisci logo o nome azienda
                      </div>
                    )}
                  </div>

                  {/* Sezione Destinatario (Destra) - Senza bordo */}
                  <div className="flex-1 text-right">
                    <pre className="font-sans text-xs whitespace-pre-wrap text-right text-gray-700">{pdfConfig.headerText}</pre>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Condizioni Contrattuali Section */}
        <AccordionItem value="terms">
          <div className="flex items-center justify-between gap-4 mb-4">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-1">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-gray-500" />
                Condizioni Contrattuali
              </div>
            </AccordionTrigger>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-600"
              onClick={(e) => {
                e.stopPropagation();
                window.open('https://www.lexdo.it/prodotti/', '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Consulenza Legale
            </Button>
          </div>

          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contractTerms" className="text-base font-semibold">
                  Condizioni Contrattuali
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Scegli un template o personalizza le condizioni
                </p>
              </div>

              {/* Template e Textarea affiancati */}
              <div className="flex gap-3">
                {/* Template verticali a sinistra */}
                <div className="flex-shrink-0 w-40 space-y-1">
                  {contractTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="w-full h-auto py-2 px-2 text-xs justify-start"
                      onClick={() => setPdfConfig({ ...pdfConfig, contractTerms: template.content })}
                      title={template.description}
                    >
                      <span className="font-medium truncate">{template.name}</span>
                    </Button>
                  ))}
                </div>

                {/* Textarea a destra */}
                <Textarea
                  id="contractTerms"
                  value={pdfConfig.contractTerms}
                  onChange={(e) => setPdfConfig({ ...pdfConfig, contractTerms: e.target.value })}
                  placeholder="Scegli un template o scrivi le tue condizioni personalizzate..."
                  className="flex-1 font-mono text-xs resize-y min-h-[400px] max-h-[600px]"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

