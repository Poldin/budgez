'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClientSupabaseClient } from '@/lib/database/supabase-client';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import type { Language } from '@/lib/translations';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  translations: {
    login: string;
    signUp: string;
    email: string;
    password: string;
    forgotPassword: string;
    notRegisteredYet: string;
    alreadyHaveAccount: string;
    loginTitle: string;
    signUpTitle: string;
    loginButton: string;
    signUpButton: string;
    passwordRequirements: string;
    passwordMinLength: string;
    passwordUppercase: string;
    passwordLowercase: string;
    passwordNumber: string;
    passwordSpecial: string;
    resetPassword: string;
    resetPasswordDescription: string;
    sendResetLink: string;
    backToLogin: string;
    enterOTP: string;
    otpSent: string;
    verifyOTP: string;
    resendOTP: string;
    otpPlaceholder: string;
    verifying: string;
  };
}

interface PasswordRequirements {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export default function AuthDialog({ open, onOpenChange, language, translations: t }: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [signupStep, setSignupStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const supabase = createClientSupabaseClient();

  const validatePassword = (pwd: string) => {
    setPasswordRequirements({
      minLength: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    });
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === 'signup') {
      validatePassword(value);
    }
  };

  const isPasswordValid = () => {
    return Object.values(passwordRequirements).every(req => req === true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSuccess('Login effettuato con successo!');
      setTimeout(() => {
        onOpenChange(false);
        setEmail('');
        setPassword('');
        setMode('login');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid()) {
      setError('La password non soddisfa tutti i requisiti');
      return;
    }

    setLoading(true);

    try {
      // Invia OTP via email
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) throw otpError;

      setSuccess(t.otpSent);
      setSignupStep('otp');
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'invio del codice OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Verifica OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      // Se l'OTP è verificato ma l'utente non esiste ancora, crea l'account con password
      if (data.user) {
        // Aggiorna la password dell'utente
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) throw updateError;

        setSuccess('Registrazione completata con successo!');
        setTimeout(() => {
          onOpenChange(false);
          setEmail('');
          setPassword('');
          setOtp('');
          setMode('login');
          setSignupStep('credentials');
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Codice OTP non valido');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) throw otpError;

      setSuccess(t.otpSent);
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'invio del codice OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess('Email di reset inviata! Controlla la tua casella di posta.');
      setTimeout(() => {
        setEmail('');
        setMode('login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'invio dell\'email di reset');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setOtp('');
    setError('');
    setSuccess('');
    setSignupStep('credentials');
    setPasswordRequirements({
      minLength: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });
  };

  const handleModeChange = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' && t.loginTitle}
            {mode === 'signup' && t.signUpTitle}
            {mode === 'forgot' && t.resetPassword}
          </DialogTitle>
        </DialogHeader>

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-gray-600">{t.resetPasswordDescription}</p>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">{t.email}</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleModeChange('login')}
                className="flex-1"
              >
                {t.backToLogin}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Invio...' : t.sendResetLink}
              </Button>
            </div>
          </form>
        ) : mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">{t.email}</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">{t.password}</Label>
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Accesso...' : t.loginButton}
            </Button>
            <div className="text-center text-sm text-gray-600">
              {t.notRegisteredYet}{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {t.signUp}
              </button>
            </div>
          </form>
        ) : signupStep === 'credentials' ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t.email}</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">{t.password}</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              {password && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">{t.passwordRequirements}:</p>
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.minLength ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>{t.passwordMinLength}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.uppercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>{t.passwordUppercase}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.lowercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>{t.passwordLowercase}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.number ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>{t.passwordNumber}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.special ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>{t.passwordSpecial}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading || !isPasswordValid()} className="w-full">
              {loading ? 'Invio OTP...' : t.signUpButton}
            </Button>
            <div className="text-center text-sm text-gray-600">
              {t.alreadyHaveAccount}{' '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {t.login}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-sm text-gray-600">{t.enterOTP}</p>
            <div className="space-y-2">
              <Label htmlFor="otp-code">Codice OTP</Label>
              <Input
                id="otp-code"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t.otpPlaceholder}
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOTP}
                disabled={loading}
                className="flex-1"
              >
                {t.resendOTP}
              </Button>
              <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1">
                {loading ? t.verifying : t.verifyOTP}
              </Button>
            </div>
            <div className="text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => {
                  setSignupStep('credentials');
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Modifica email o password
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

