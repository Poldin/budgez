'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldCheck, DollarSign, ArrowRight, ArrowLeft, Upload, Loader2, Check } from 'lucide-react';
import EmailVerification from '@/components/email-verification';
import { uploadProposalPDF, createProposal } from '@/app/actions/proposal-actions';

interface RequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  title: string;
  description: string;
  budget: number | null;
  deadline: Date;
  email: string;
}

const PROPOSAL_TITLE_MAX_LENGTH = 100;
const PROPOSAL_DESCRIPTION_MAX_LENGTH = 1000;

export default function RequestDetailsDialog({
  open,
  onOpenChange,
  requestId,
  title,
  description,
  budget,
  deadline,
  email,
}: RequestDetailsDialogProps) {
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [proposalEmail, setProposalEmail] = useState('');
  const [proposalEmailVerified, setProposalEmailVerified] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Format budget for display
  const formatBudget = (budget: number | null): string => {
    if (!budget || budget === 0) return 'Da concordare';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Scaduto';
    if (diffDays === 0) return 'Scade oggi';
    if (diffDays === 1) return 'Scade domani';
    return `${diffDays} giorni rimanenti`;
  };

  const daysRemaining = getDaysRemaining();
  const isUrgent = (() => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  })();

  const handleCreateBudget = () => {
    window.open('/', '_blank');
  };

  const handleSendProposal = () => {
    setProposalTitle(`Proposta per ${title}`);
    setShowProposalForm(true);
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
      setProposalFile(file);
    }
  };

  const handleSubmitProposal = async () => {
    if (!verificationId || !proposalFile) {
      setSubmitError('Completa tutti i campi richiesti');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Upload PDF
      const formData = new FormData();
      formData.append('file', proposalFile);
      
      const uploadResult = await uploadProposalPDF(formData);
      
      if (!uploadResult.success || !uploadResult.url) {
        setSubmitError(uploadResult.error || 'Errore nel caricamento del file');
        setIsSubmitting(false);
        return;
      }

      // 2. Crea proposta
      const proposalResult = await createProposal({
        title: proposalTitle.trim(),
        description: proposalDescription.trim(),
        attachmentUrl: uploadResult.url,
        verificationId: verificationId,
        requestId: requestId,
        requestTitle: title,
        requestEmail: email,
      });

      setIsSubmitting(false);

      if (proposalResult.success) {
        // Mostra successo per 2 secondi
        setSubmitSuccess(true);
        
        setTimeout(() => {
          // Reset form
          setShowProposalForm(false);
          setProposalTitle('');
          setProposalDescription('');
          setProposalFile(null);
          setProposalEmail('');
          setProposalEmailVerified(false);
          setVerificationId(null);
          setSubmitSuccess(false);
          onOpenChange(false);
        }, 2000);
      } else {
        setSubmitError(proposalResult.error || 'Errore nell\'invio della proposta');
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      setSubmitError('Errore imprevisto durante l\'invio');
      setIsSubmitting(false);
    }
  };

  const isProposalFormValid = proposalTitle.trim() && 
                               proposalDescription.trim() && 
                               proposalFile &&
                               proposalEmailVerified;

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset to details view when closing
      setShowProposalForm(false);
      setProposalTitle('');
      setProposalDescription('');
      setProposalFile(null);
      setProposalEmail('');
      setProposalEmailVerified(false);
      setVerificationId(null);
      setSubmitError(null);
      setSubmitSuccess(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-[75vw] h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="">{showProposalForm ? 'Invia proposta' : 'Dettagli richiesta'}</DialogTitle>
          {showProposalForm && (
            <DialogDescription>
              Compila tutti i campi per inviare la tua proposta. Budgez notificherà il richiedente con tutti i dettagli, compreso il tuo indirizzo email per avviare l&apos;interlocuzione.
            </DialogDescription>
          )}
        </DialogHeader>

        {!showProposalForm ? (
          // Details View
          <>
            <div className="flex-1 overflow-y-auto pr-2">
              {/* Days Remaining Badge and Verified */}
              <div className="flex items-center gap-3 mb-3">
                <Badge 
                  variant={isUrgent ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {daysRemaining}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="font-medium">Verified</span>
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              </div>

              {/* Budget */}
              <div className="mb-6">
                <div className="flex items-center gap-3 text-lg">
                  <DollarSign className="h-6 w-6 text-gray-500" />
                  <span className="font-semibold text-gray-900">{formatBudget(budget)}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t">
              <div className="flex justify-start gap-3">
                <Button
                  onClick={handleCreateBudget}
                  variant="outline"
                  className="bg-white hover:bg-gray-900 hover:text-white transition-all duration-300 px-6"
                >
                  B) Crea preventivo
                </Button>
                <Button
                  onClick={handleSendProposal}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                >
                  Invia proposta
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Proposal Form View
          <>
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Reference to original request */}
              <div className="text-xs text-gray-500 pb-2 border-b">
                ref: <span className="text-gray-900 font-bold">{title}</span>
              </div>

              {/* Proposal Title */}
              <div className="space-y-2">
                <Label htmlFor="proposal-title" className="text-sm font-medium">
                  Titolo della proposta
                  <span className="text-red-500 ml-1">*</span>
                  <span className="text-gray-400 ml-2 font-normal">
                    ({proposalTitle.length}/{PROPOSAL_TITLE_MAX_LENGTH})
                  </span>
                </Label>
                <Input
                  id="proposal-title"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value.slice(0, PROPOSAL_TITLE_MAX_LENGTH))}
                  placeholder="Es: Proposta sviluppo e-commerce con React"
                  className="text-base"
                />
              </div>

              {/* Proposal Description */}
              <div className="space-y-2">
                <Label htmlFor="proposal-description" className="text-sm font-medium">
                  Descrizione della proposta
                  <span className="text-red-500 ml-1">*</span>
                  <span className="text-gray-400 ml-2 font-normal">
                    ({proposalDescription.length}/{PROPOSAL_DESCRIPTION_MAX_LENGTH})
                  </span>
                </Label>
                <Textarea
                  id="proposal-description"
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value.slice(0, PROPOSAL_DESCRIPTION_MAX_LENGTH))}
                  placeholder="Descrivi la tua proposta: approccio, tempistiche, esperienza rilevante, etc."
                  className="min-h-[120px] text-base"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="proposal-file" className="text-sm font-medium">
                  Allegato PDF
                  <span className="text-red-500 ml-1">*</span>
                  <span className="text-gray-400 ml-2 font-normal">(max 5MB)</span>
                </Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="proposal-file"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {proposalFile ? proposalFile.name : 'Scegli file PDF'}
                    </span>
                  </label>
                  <input
                    id="proposal-file"
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
                  La tua email non sarà mai pubblicata. Il richiedente riceverà una notifica da Budgez con i tuoi dati.
                </p>
                <EmailVerification
                  email={proposalEmail}
                  onEmailChange={setProposalEmail}
                  emailVerified={proposalEmailVerified}
                  onEmailVerified={(verified, verId) => {
                    setProposalEmailVerified(verified);
                    if (verId) setVerificationId(verId);
                  }}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t">
              {/* Submit Error */}
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-900">{submitError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowProposalForm(false)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alla richiesta
                </Button>
                <Button
                  onClick={handleSubmitProposal}
                  disabled={!isProposalFormValid || isSubmitting || submitSuccess}
                  className={`${submitSuccess ? 'bg-green-600 hover:bg-green-600' : 'bg-gray-900 hover:bg-gray-800'} text-white disabled:opacity-50 transition-colors`}
                >
                  {submitSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Proposta inviata!
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      Invia proposta
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

