'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Copy, Check, Loader2, CheckCircle, Upload } from 'lucide-react';
import EmailVerification from '@/components/email-verification';
import { createRequest, uploadRequestPDF } from '@/app/actions/request-actions';

interface NewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCreated?: () => void;
}

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 1000;

export default function NewRequestDialog({
  open,
  onOpenChange,
  onRequestCreated,
}: NewRequestDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(0);
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [deadlineDays, setDeadlineDays] = useState('10');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [publishConfirmation, setPublishConfirmation] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleCopyAIPrompt = async () => {
    const prompt = `Devo redigere la descrizione dell'attività che vogliamo perseguire per pubblicare un annuncio sulla bacheca di Budgez.xyz: piattaforma che agevola l'incontro tra professionisti e aziende che offrono servizi progettuali di vario tipo (sviluppo software, marketing, edilizia interna o costruzioni, wedding planner, etc) e clienti che richiedono tali servizi.
L'annuncio dovrà servire per descrivere in modo dettagliato la mia esigenza e verrà letto dalla community di professionisti e fornitori di Budgez.xyz affinché qualcuno tra loro mi invii una proposta economica per l'esecuzione ed entri in contatto con me per offrirmi la soluzione operativa.
Mi aiuti a scrivere la descrizione con max 1000 caratteri?

Questa l'attività che ho bisogno di descrivere:`;

    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => {
        setPromptCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('Il file deve essere massimo 5MB');
        return;
      }
      if (file.type !== 'application/pdf') {
        alert('Solo file PDF sono accettati');
        return;
      }
      setAttachmentFile(file);
    }
  };

  const handlePublish = async () => {
    if (!publishConfirmation) {
      // First click: show confirmation warning
      setPublishConfirmation(true);
      return;
    }

    if (!verificationId) {
      setPublishError('Verifica prima la tua email');
      return;
    }

    // Second click: actually publish
    setIsPublishing(true);
    setPublishError(null);

    try {
      // Upload PDF if present
      let attachmentUrl: string | undefined = undefined;
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('file', attachmentFile);
        
        const uploadResult = await uploadRequestPDF(formData);
        
        if (!uploadResult.success || !uploadResult.url) {
          setPublishError(uploadResult.error || 'Errore nel caricamento del file');
          setIsPublishing(false);
          return;
        }
        
        attachmentUrl = uploadResult.url;
      }

      // Calcola la deadline
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(deadlineDays));

      const result = await createRequest({
        title: title.trim(),
        description: description.trim(),
        budget: budget > 0 ? budget : undefined,
        deadline: deadline.toISOString(),
        verificationId: verificationId,
        attachmentUrl: attachmentUrl,
      });

      setIsPublishing(false);

      if (result.success) {
        // Mostra successo per 2 secondi
        setPublishSuccess(true);
        
        setTimeout(() => {
          // Reset form
          setTitle('');
          setDescription('');
          setBudget(0);
          setEmail('');
          setEmailVerified(false);
          setVerificationId(null);
          setDeadlineDays('10');
          setAttachmentFile(null);
          setPublishConfirmation(false);
          setPublishSuccess(false);
          onOpenChange(false);
          
          // Reload only the requests data
          if (onRequestCreated) {
            onRequestCreated();
          }
        }, 2000);
      } else {
        setPublishError(result.error || 'Errore nella pubblicazione');
        setPublishConfirmation(false);
      }
    } catch (error) {
      console.error('Error publishing request:', error);
      setPublishError('Errore imprevisto durante la pubblicazione');
      setIsPublishing(false);
    }
  };

  const isFormValid = title.trim() && 
                      description.trim() && 
                      emailVerified &&
                      deadlineDays;

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset confirmation state when closing
      setPublishConfirmation(false);
      setPublishSuccess(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-[75vw] h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nuova richiesta di preventivo</DialogTitle>
          <DialogDescription>
            Compila i dettagli della tua richiesta. La tua email verrà verificata per garantire l&apos;autenticità della richiesta.

          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titolo della richiesta
              <span className="text-red-500 ml-1">*</span>
              <span className="text-gray-400 ml-2 font-normal">
                ({title.length}/{TITLE_MAX_LENGTH})
              </span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))}
              placeholder="Es: Sviluppo sito e-commerce"
              className="text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrizione dettagliata
                <span className="text-red-500 ml-1">*</span>
                <span className="text-gray-400 ml-2 font-normal">
                  ({description.length}/{DESCRIPTION_MAX_LENGTH})
                </span>
              </Label>
              
              {/* AI Prompt Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAIPrompt}
                className="flex items-center gap-2 whitespace-nowrap h-8 text-gray-700"
              >
                {promptCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>copia prompt AI</span>
                  </>
                )}
              </Button>
            </div>
            
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
              placeholder="Descrivi nel dettaglio cosa stai cercando, requisiti tecnici, obiettivi, etc."
              className="min-h-[120px] text-base"
            />
          </div>

          {/* Budget & Deadline */}
          <div className="flex gap-6 items-end">
            {/* Budget */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Budget (€)</Label>
              <NumberInput
                value={budget}
                onChange={setBudget}
                placeholder="Es: 5000"
                min={0}
                className="text-base w-40"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium">
                Scadenza annuncio
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select value={deadlineDays} onValueChange={setDeadlineDays}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Giorni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 giorni</SelectItem>
                  <SelectItem value="10">10 giorni</SelectItem>
                  <SelectItem value="20">20 giorni</SelectItem>
                  <SelectItem value="30">30 giorni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="attachment-file" className="text-sm font-medium">
              Allegato PDF (opzionale)
              <span className="text-gray-400 ml-2 font-normal">(max 5MB)</span>
            </Label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="attachment-file"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {attachmentFile ? attachmentFile.name : 'Scegli file PDF'}
                </span>
              </label>
              <input
                id="attachment-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Email Verification */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email di contatto
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-xs text-gray-600">
              La tua email è al sicuro e non sarà mai pubblicata. Riceverai una notifica da Budgez quando arriveranno proposte.
            </p>
            <EmailVerification
              email={email}
              onEmailChange={setEmail}
              emailVerified={emailVerified}
              onEmailVerified={(verified, verId) => {
                setEmailVerified(verified);
                if (verId) setVerificationId(verId);
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t">
          {/* Publish Error */}
          {publishError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-900">{publishError}</p>
            </div>
          )}

          {/* Confirmation Warning */}
          {publishConfirmation && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Attenzione
                </Badge>
                <p className="text-sm text-blue-900 flex-1">
                  Una volta pubblicata, la richiesta non potrà essere modificata. Clicca nuovamente su &quot;Conferma Pubblicazione&quot; per procedere.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (publishConfirmation) {
                  setPublishConfirmation(false);
                } else {
                  onOpenChange(false);
                }
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!isFormValid || isPublishing || publishSuccess}
              className={`${publishSuccess ? 'bg-green-600 hover:bg-green-600' : 'bg-gray-900 hover:bg-gray-800'} text-white disabled:opacity-50 transition-colors`}
            >
              {publishSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Richiesta pubblicata!
                </>
              ) : isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pubblicazione...
                </>
              ) : (
                publishConfirmation ? 'Conferma Pubblicazione' : 'Pubblica Richiesta'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

