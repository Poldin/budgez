'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, Download, Lock, FileText } from 'lucide-react';
import { createAndSendOTP, verifyOTP, resendOTP } from '@/app/actions/otp-actions';
import { generateCertificateHTML, type CertificateData } from '@/lib/certificate-generator';
import type { Resource, Activity, GeneralDiscount, GeneralMargin } from '@/types/budget';

interface QuoteSignOtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSigned: (verificationId: string) => void;
  quoteId: string;
  quoteName: string;
  quoteDescription?: string;
  resources?: Resource[];
  activities?: Activity[];
  generalDiscount?: GeneralDiscount;
  generalMargin?: GeneralMargin;
  currency?: string;
  defaultVat?: number;
  companyName?: string;
  companyInfo?: string;
  headerText?: string;
  createdAt?: string;
}

export default function QuoteSignOtpDialog({ 
  open, 
  onOpenChange, 
  onSigned,
  quoteId,
  quoteName,
  quoteDescription,
  resources = [],
  activities = [],
  generalDiscount = { enabled: false, type: 'percentage', value: 0, applyOn: 'taxable' },
  generalMargin,
  currency = '€',
  defaultVat,
  companyName,
  companyInfo,
  headerText,
  createdAt,
}: QuoteSignOtpDialogProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [signedSuccessfully, setSignedSuccessfully] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await createAndSendOTP(email);
    
    setIsLoading(false);

    if (result.success && result.verificationId) {
      setOtpSent(true);
      setVerificationId(result.verificationId);
      setSuccessMessage('Codice inviato! Controlla la tua email.');
    } else {
      setError(result.error || 'Errore nell\'invio del codice');
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationId) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await verifyOTP(verificationId, otp);
    
    setIsLoading(false);

    if (result.success) {
      // Mostra stato di successo invece di chiudere subito
      setSignedSuccessfully(true);
      setSignedAt(new Date().toISOString());
      onSigned(verificationId);
    } else {
      setError(result.error || 'Codice non valido');
    }
  };

  const handleDownloadCertificate = () => {
    if (!signedAt) return;
    
    const certificateHTML = generateCertificateHTML({
      quoteId,
      quoteName,
      quoteDescription,
      signerEmail: email,
      signedAt,
      createdAt,
      resources,
      activities,
      generalDiscount,
      generalMargin,
      currency,
      defaultVat,
      companyName,
      companyInfo,
      headerText,
    });
    
    // Crea e scarica il file HTML
    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificato-${quoteId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResendOtp = async () => {
    if (!verificationId) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await resendOTP(verificationId, email);
    
    setIsLoading(false);

    if (result.success) {
      setOtp('');
      setSuccessMessage('Nuovo codice inviato! Controlla la tua email.');
    } else {
      setError(result.error || 'Errore nell\'invio del codice');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form quando si chiude
    setTimeout(() => {
      setEmail('');
      setOtp('');
      setOtpSent(false);
      setVerificationId(null);
      setError(null);
      setSuccessMessage(null);
      setSignedSuccessfully(false);
      setSignedAt(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {signedSuccessfully ? (
          // Stato di successo con download certificato
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <DialogTitle className="text-green-700">Firma completata!</DialogTitle>
                  <DialogDescription className="text-green-600">
                    Il preventivo è stato firmato con successo
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Riepilogo firma */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Dettagli della firma</span>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data e ora:</span>
                    <span className="font-medium">
                      {signedAt && new Date(signedAt).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metodo:</span>
                    <span className="font-medium">OTP via email</span>
                  </div>
                </div>
              </div>

              {/* Download certificato */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-800">Certificato di firma</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Scarica il certificato digitale come prova della firma. Ti è stato anche inviato via email.
                </p>
                <Button
                  onClick={handleDownloadCertificate}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Scarica Certificato-{quoteId.slice(0, 8)}.html
                </Button>
              </div>

              {/* Nota email */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700">
                📧 Una copia del certificato è stata inviata a <strong>{email}</strong>
              </div>

              {/* Pulsante chiudi */}
              <Button
                onClick={handleClose}
                className="w-full"
              >
                Chiudi
              </Button>
            </div>
          </>
        ) : (
          // Stati normali: inserimento email e OTP
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-gray-600" />
                <DialogTitle>Firma con OTP</DialogTitle>
              </div>
              <DialogDescription>
                Inserisci la tua email per ricevere un codice OTP e firmare il preventivo in modo sicuro.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              {!otpSent ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tua@email.com"
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendOtp}
                        disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || isLoading}
                        variant="default"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Richiedi OTP
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Nota sicurezza */}
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3" />
                      <span>La firma OTP garantisce l'autenticità della tua approvazione</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    Abbiamo inviato un codice di verifica a {email}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Codice OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      disabled={isLoading}
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Invia nuovo codice'
                      )}
                    </Button>
                    <Button
                      onClick={handleVerifyOtp}
                      disabled={otp.length !== 6 || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Verifica e Firma
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


