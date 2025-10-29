'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Mail, Loader2 } from 'lucide-react';
import { createAndSendOTP, verifyOTP, resendOTP } from '@/app/actions/otp-actions';

interface EmailVerificationProps {
  email: string;
  onEmailChange: (email: string) => void;
  emailVerified: boolean;
  onEmailVerified: (verified: boolean, verificationId?: string) => void;
  disabled?: boolean;
}

export default function EmailVerification({
  email,
  onEmailChange,
  emailVerified,
  onEmailVerified,
  disabled = false,
}: EmailVerificationProps) {
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
      setSuccessMessage(result.message || 'Codice inviato!');
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
      onEmailVerified(true, verificationId);
      setSuccessMessage(result.message || 'Email verificata!');
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
      setSuccessMessage(result.message || 'Nuovo codice inviato!');
    } else {
      setError(result.error || 'Errore nell\'invio del codice');
    }
  };

  return (
    <div className="space-y-2">
      {/* Messages */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="flex gap-2 items-start">
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="tua@email.com"
          disabled={emailVerified || disabled || isLoading}
          className="text-base w-80"
        />
        {!emailVerified && !disabled && (
          <Button
            onClick={handleSendOtp}
            disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || isLoading}
            variant="outline"
            className="whitespace-nowrap"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Verifica con OTP
          </Button>
        )}
        {emailVerified && (
          <div className="flex items-center gap-2 text-green-600 py-2 ">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* OTP Input */}
      {otpSent && !emailVerified && !disabled && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Label htmlFor="otp" className="text-sm font-medium">
            Codice OTP
          </Label>
          <p className="text-xs text-gray-600 mb-2">
            Abbiamo inviato un codice di verifica a {email}
          </p>
          <div className="flex gap-2 items-start">
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Inserisci il codice a 6 cifre"
              maxLength={6}
              disabled={isLoading}
              className="text-base w-64"
            />
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isLoading}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verifica'
              )}
            </Button>
          </div>
          <button
            onClick={handleResendOtp}
            disabled={isLoading}
            className="text-xs text-gray-600 hover:text-gray-900 underline mt-2 disabled:opacity-50"
          >
            Non hai ricevuto il codice? Invia di nuovo
          </button>
        </div>
      )}
    </div>
  );
}

