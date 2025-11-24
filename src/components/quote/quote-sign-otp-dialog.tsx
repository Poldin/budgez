'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from 'lucide-react';
import { createAndSendOTP, verifyOTP, resendOTP } from '@/app/actions/otp-actions';

interface QuoteSignOtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSigned: (verificationId: string) => void;
}

export default function QuoteSignOtpDialog({ open, onOpenChange, onSigned }: QuoteSignOtpDialogProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      onSigned(verificationId);
      onOpenChange(false);
      // Reset form
      setEmail('');
      setOtp('');
      setOtpSent(false);
      setVerificationId(null);
    } else {
      setError(result.error || 'Codice non valido');
    }
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
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Firma con OTP</DialogTitle>
          <DialogDescription>
            Inserisci la tua email per ricevere un codice OTP e firmare il preventivo.
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
                    'Verifica e Firma'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

