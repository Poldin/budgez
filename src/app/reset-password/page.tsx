'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/database/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import AppHeader from '@/components/app-header';
import { translations, type Language } from '@/lib/translations';

interface PasswordRequirements {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export default function ResetPasswordPage() {
  const [language, setLanguage] = useState<Language>('it');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const t = translations[language];

  // Verifica se c'è una sessione di recovery valida
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Aspetta un po' per permettere a Supabase di processare l'hash dalla URL
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Ascolta i cambiamenti di auth state per catturare il recovery token
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            setIsValidSession(true);
            subscription.unsubscribe();
          }
        });

        // Verifica anche la sessione corrente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setIsValidSession(false);
          setError('Sessione non valida. Richiedi un nuovo link di reset password.');
          subscription.unsubscribe();
          return;
        }

        // Se c'è già una sessione, potrebbe essere valida
        if (session) {
          setIsValidSession(true);
          subscription.unsubscribe();
        } else {
          // Se non c'è sessione, aspetta un po' di più per permettere a Supabase di processare l'hash
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setIsValidSession(true);
            } else {
              setIsValidSession(false);
              setError('Link non valido o scaduto. Richiedi un nuovo link di reset password.');
            }
            subscription.unsubscribe();
          }, 500);
        }
      } catch (err) {
        setIsValidSession(false);
        setError('Errore durante la verifica della sessione.');
      }
    };

    checkSession();
  }, []);

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
    validatePassword(value);
  };

  const isPasswordValid = () => {
    return Object.values(passwordRequirements).every(req => req === true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid()) {
      setError('La password non soddisfa tutti i requisiti');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess('Password aggiornata con successo! Reindirizzamento...');
      
      // Reindirizza alla home dopo 1.5 secondi
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'aggiornamento della password');
    } finally {
      setLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AppHeader 
          language={language}
          onLanguageChange={setLanguage}
          translations={t}
        />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card className="bg-white border-2 border-gray-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Verifica del link in corso...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AppHeader 
          language={language}
          onLanguageChange={setLanguage}
          translations={t}
        />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader>
                <CardTitle>Link non valido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                    {error}
                  </div>
                )}
                <Button 
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Torna alla home
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader 
        language={language}
        onLanguageChange={setLanguage}
        translations={t}
      />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="bg-white border-2 border-gray-200">
            <CardHeader>
              <CardTitle>Reimposta Password</CardTitle>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm mb-4">
                  {success}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nuova Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
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
                      <p className="text-xs font-semibold text-gray-700 mb-2">Requisiti password:</p>
                      <div className="space-y-1.5">
                        <div className={`flex items-center gap-2 text-xs ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordRequirements.minLength ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Almeno 8 caratteri</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordRequirements.uppercase ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Almeno una lettera maiuscola</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordRequirements.lowercase ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Almeno una lettera minuscola</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordRequirements.number ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Almeno un numero</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordRequirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordRequirements.special ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Almeno un carattere speciale</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !isPasswordValid()} 
                  className="w-full"
                >
                  {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

