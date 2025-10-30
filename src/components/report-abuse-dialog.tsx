'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import EmailVerification from '@/components/email-verification';
import { reportAbuse } from '@/app/actions/abuse-actions';

interface ReportAbuseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  requestTitle: string;
}

const REASON_MAX_LENGTH = 500;

export default function ReportAbuseDialog({
  open,
  onOpenChange,
  requestId,
  requestTitle,
}: ReportAbuseDialogProps) {
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!verificationId) {
      setSubmitError('Verifica prima la tua email');
      return;
    }

    if (!reason.trim()) {
      setSubmitError('Inserisci il motivo della segnalazione');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await reportAbuse({
        requestId: requestId,
        reason: reason.trim(),
        verificationId: verificationId,
      });

      setIsSubmitting(false);

      if (result.success) {
        setSubmitSuccess(true);
        
        setTimeout(() => {
          // Reset form
          setReason('');
          setEmail('');
          setEmailVerified(false);
          setVerificationId(null);
          setSubmitSuccess(false);
          onOpenChange(false);
        }, 2000);
      } else {
        setSubmitError(result.error || 'Errore nell\'invio della segnalazione');
      }
    } catch (error) {
      console.error('Error submitting abuse report:', error);
      setSubmitError('Errore imprevisto durante l\'invio');
      setIsSubmitting(false);
    }
  };

  const isFormValid = reason.trim() && emailVerified;

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setSubmitSuccess(false);
      setSubmitError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Segnala abuso
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 pt-2">
            Stai segnalando: <span className="font-medium text-gray-900">&quot;{requestTitle}&quot;</span>
            <br />
            Utilizza questo modulo per segnalare contenuti inappropriati, offensivi o che violano le linee guida della piattaforma. La tua segnalazione verrà esaminata dal nostro team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo della segnalazione
              <span className="text-red-500 ml-1">*</span>
              <span className="text-gray-400 ml-2 font-normal">
                ({reason.length}/{REASON_MAX_LENGTH})
              </span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX_LENGTH))}
              placeholder="Es: Contenuto offensivo o inappropriato, Annuncio di test o spam, Budget irrealistico o volutamente troppo basso, Informazioni false o ingannevoli, Duplicato di altra richiesta, Contenuto fuori tema o non pertinente..."
              className="min-h-[100px] text-base"
              disabled={isSubmitting || submitSuccess}
            />
          </div>

          {/* Email Verification */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email di contatto
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-xs text-gray-600">
              Verifica la tua email per confermare la segnalazione. La tua email rimarrà privata.
            </p>
            <EmailVerification
              email={email}
              onEmailChange={setEmail}
              emailVerified={emailVerified}
              onEmailVerified={(verified, verId) => {
                setEmailVerified(verified);
                if (verId) setVerificationId(verId);
              }}
              disabled={isSubmitting || submitSuccess}
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-900">{submitError}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || submitSuccess}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting || submitSuccess}
            className={`${submitSuccess ? 'bg-green-600 hover:bg-green-600' : 'bg-orange-600 hover:bg-orange-700'} text-white disabled:opacity-50 transition-colors`}
          >
            {submitSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Segnalazione inviata!
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Invio in corso...
              </>
            ) : (
              'Invia segnalazione'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

