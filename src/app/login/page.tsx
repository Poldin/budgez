"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import { Mail, UserPlus, LogIn, Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasSpecialChar: boolean;
}

const AuthPage = () => {
  const router = useRouter();
  
  // Dialog states
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Password validation
  const validatePassword = (password: string): PasswordRequirements => ({
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  });

  const passwordRequirements = validatePassword(signupPassword);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseUrl = window.location.origin;
      console.log(baseUrl)
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: resetEmail,
          redirectUrl: `${baseUrl}/auth/reset-password`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      setResetEmailSent(true);
      toast.success("Email per il reset della password inviata!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore nell'invio dell'email di reset");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
  
    try {
      console.log('Attempting login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
  
      if (error) {
        let errorMessage = "Errore durante il login";
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email o password non corretta";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email non confermata";
        }
        setLoginError(errorMessage);
        toast.error(errorMessage);
        return;
      }
  
      if (!data?.session) {
        throw new Error('Sessione non creata');
      }
  
      toast.success("Accesso effettuato con successo!");
      
      // Utilizziamo replace invece di push per evitare problemi con la cronologia
      router.replace("/budgets");
    } catch (error) {
      console.error("Errore completo:", error);
      toast.error("Si è verificato un errore durante il login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Starting signup process...', {
      email: signupEmail,
      userName,
      passwordLength: signupPassword.length,
      termsAccepted: acceptedTerms
    });
  
    // Validation checks
    if (!userName.trim()) {
      toast.error("Il nome utente è obbligatorio");
      return;
    }
    
    if (userName.length > 50) {
      toast.error("Il nome utente non può superare i 50 caratteri");
      return;
    }
    
    if (!acceptedTerms) {
      toast.error("Devi accettare i termini e le condizioni per continuare");
      return;
    }
  
    if (signupPassword !== confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }
  
    if (!Object.values(passwordRequirements).every(Boolean)) {
      toast.error("La password non soddisfa tutti i requisiti");
      return;
    }
  
    console.log('All validations passed, proceeding with signup...');
    setLoading(true);
  
    try {
      const baseUrl = window.location.origin;
      console.log('Base URL:', baseUrl);
      
      const signupData = {
        email: signupEmail,
        password: signupPassword,
        userName,
        termsAccepted: acceptedTerms,
        redirectUrl: `${baseUrl}/auth/callback`
      };
      
      console.log('Sending signup request with data:', {
        ...signupData,
        password: '***' // Nascondi la password nei log
      });
  
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });
  
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
  
      if (!response.ok) {
        // Gestione specifica per utente già registrato
        if (data.status === 'ALREADY_REGISTERED') {
          toast.error("Email già registrata. Procedi con il login");
          // Opzionale: switch automatico al tab di login
          const loginTab = document.querySelector('[value="login"]') as HTMLElement;
          if (loginTab) {
            loginTab.click();
          }
          return;
        }
        throw new Error(data.message || 'Errore durante la registrazione');
      }
  
      console.log('Signup successful, showing OTP dialog');
      setShowOtpDialog(true);
      toast.success("Codice di verifica inviato via email.");
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
        const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: signupEmail,
                otp: otpCode,
                password: signupPassword
            })
        })

        const data = await response.json()
        
        if (!response.ok) {
            throw new Error(data.message || 'Errore durante la verifica')
        }

        // La sessione è già stata impostata dal backend grazie a auth-helpers-nextjs
        toast.success("Verifica completata! Accesso in corso...")
        
        // Redirect to /budgets
        router.push("/budgets")

    } catch (error) {
        console.error('OTP verification error:', error)
        toast.error(error instanceof Error ? error.message : "Errore durante la verifica")
    } finally {
        setLoading(false)
    }
}

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Toaster position="top-center" richColors closeButton />
      <div className="w-full max-w-md space-y-8 bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Accedi a Budgez</h1>
          <p className="mt-2 text-gray-600">Accedi o registrati per continuare</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Accedi</TabsTrigger>
            <TabsTrigger value="signup">Registrati</TabsTrigger>
          </TabsList>
          
          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4">
                <Input
                  id="loginEmail"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginError("");
                  }}
                  placeholder="Email"
                  required
                  disabled={loading}
                  className={`h-12 ${loginError ? 'border-red-500' : ''}`}
                />
                <div className="relative">
                  <Input
                    id="loginPassword"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError("");
                    }}
                    placeholder="Password"
                    required
                    disabled={loading}
                    className={`h-12 ${loginError ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {/* Reset Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordDialog(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Password dimenticata?
                  </button>
                </div>
                {/* Error Display */}
                {loginError && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200 flex items-start">
                    <X className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    {loginError}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                <LogIn className="mr-2 h-5 w-5" />
                {loading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-4">
                <Input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Nome utente"
                  required
                  maxLength={50}
                  disabled={loading}
                  className="h-12"
                />
                <Input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Email"
                  required
                  disabled={loading}
                  className="h-12"
                />
                {/* Password Fields */}
                <div className="relative">
                  <Input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Password"
                    required
                    disabled={loading}
                    className="h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showSignupPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Conferma password"
                    required
                    disabled={loading}
                    className="h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {/* Password Requirements */}
                <div className="space-y-2 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700">La password deve contenere:</p>
                  <ul className="space-y-1">
                    {Object.entries(passwordRequirements).map(([requirement, isMet]) => (
                      <li key={requirement} className="text-sm flex items-center">
                        {isMet ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 mr-2 text-red-500" />
                        )}
                        {getRequirementText(requirement)}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Terms Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))}
                  />
                  <label htmlFor="terms" className="text-sm">
                    Accetto i{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      termini
                    </Link>{" "}
                    e le{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      condizioni
                    </Link>
                  </label>
                </div>
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                <UserPlus className="mr-2 h-5 w-5" />
                {loading ? "Registrazione in corso..." : "Registrati"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifica Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOtpVerification} className="space-y-4">
          <div className="space-y-2">
              <label htmlFor="otp" className="text-sm">
                Inserisci il codice di verifica ricevuto via email
              </label>
              <Input
                id="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                required
                disabled={loading}
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={loading}>
              <Mail className="mr-2 h-5 w-5" />
              {loading ? "Verifica in corso..." : "Verifica codice"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resetEmailSent ? "Email Inviata" : "Reset Password"}
            </DialogTitle>
          </DialogHeader>
          {resetEmailSent ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Abbiamo inviato le istruzioni per il reset della password alla tua email.
                Controlla la tua casella di posta e segui le istruzioni per reimpostare la password.
              </p>
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setShowForgotPasswordDialog(false);
                  setResetEmailSent(false);
                  setResetEmail("");
                }}
              >
                Chiudi
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="resetEmail" className="text-sm text-gray-700">
                  Inserisci la tua email
                </label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="La tua email"
                  required
                  disabled={loading}
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Invio in corso..." : "Invia istruzioni di reset"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to get requirement text
const getRequirementText = (requirement: string): string => {
  const requirements: Record<string, string> = {
    minLength: "Almeno 8 caratteri",
    hasUpperCase: "Almeno una lettera maiuscola",
    hasLowerCase: "Almeno una lettera minuscola", 
    hasSpecialChar: "Almeno un carattere speciale (!@#$%^&*(),.?\":{}|)"
  };
  return requirements[requirement] || requirement;
};

export default AuthPage;