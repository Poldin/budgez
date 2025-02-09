"use client";

import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface SupabaseError {
  message: string;
  status?: number;
}



const AuthPage = () => {
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  //Stati per gestione mostra password
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Stati per form login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Stati per form registrazione
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userName, setUserName] = useState("");

  
  // Stati per validazione password
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasSpecialChar: false
  });
  
  // Stati comuni
  const [loading, setLoading] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [activeEmail, setActiveEmail] = useState("");

;
  const router = useRouter();

  // Controlla i requisiti della password
  useEffect(() => {
    setPasswordRequirements({
      minLength: signupPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(signupPassword),
      hasLowerCase: /[a-z]/.test(signupPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(signupPassword)
    });
  }, [signupPassword]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      });
  
      if (error) throw error;
  
      setResetEmailSent(true);
      toast.success("Email per il reset della password inviata!");
    } catch (error: unknown) {
      console.error("Errore reset password:", error);
      
      let errorMessage = "Errore nell'invio dell'email di reset";
      if (error instanceof Error) {
        if (error.message.includes("Email not found")) {
          errorMessage = "Email non trovata";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Troppi tentativi. Riprova più tardi";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResetDialog = () => {
    setShowForgotPasswordDialog(false);
    setResetEmailSent(false);
    setResetEmail("");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
  
    try {
      const {error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
  
      if (error) {
        let errorMessage = "";
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email o password non corretta";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email non confermata";
        } else {
          errorMessage = `Errore: ${error.message}`;
        }
        setLoginError(errorMessage);
        toast.error(errorMessage);
        return;
      }
  
      toast.success("Accesso effettuato con successo!");
      router.push("/budgets");
    } catch (error: unknown) {
      console.error("Errore completo:", error);
      toast.error("Si è verificato un errore durante il login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
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
  
    setLoading(true);

    
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: signupEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            password: signupPassword,
            user_name: userName, 
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
          }
        },
      });
  
      if (otpError) throw otpError;
  
      setActiveEmail(signupEmail);
      setShowOtpDialog(true);
      toast.success("Codice di verifica inviato via email.");
    } catch (error: unknown) {
      console.error("Errore completo:", error);
      
      let errorMessage = "Errore durante la registrazione";
      if (error && typeof error === 'object' && 'message' in error) {
        const supabaseError = error as SupabaseError;
        if (supabaseError.message.includes("User already registered")) {
          errorMessage = "Email già registrata";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verifichiamo l'OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email: activeEmail,
        token: otpCode,
        type: "email",
      });

      if (error) throw error;

      // Se la verifica è andata a buon fine, creiamo l'utente con la password
      if (data?.user) {
        const password = data?.user?.user_metadata?.password;
          delete data.user.user_metadata.password; 

          const { error: signUpError } = await supabase.auth.signUp({
            email: activeEmail,
            password,
            options: {
              data: {
                user_name: data.user.user_metadata.user_name,
                terms_accepted: data.user.user_metadata.terms_accepted,
                terms_accepted_at: data.user.user_metadata.terms_accepted_at
              }
            }
          });

        if (signUpError) throw signUpError;
        try {
          await supabase.rpc('update_link_budget_users_user_id');
        } catch (rpcError) {
          console.error('Errore durante l\'aggiornamento dei link:', rpcError);
        }
      }

      toast.success("Email verificata e registrazione completata con successo!");
      router.push("/budgets");
    } catch (error: unknown) {
      let errorMessage = "Errore durante la verifica";
      
      if (error && typeof error === 'object' && 'message' in error) {
        const supabaseError = error as SupabaseError;
        if (supabaseError.message.includes("Invalid OTP")) {
          errorMessage = "Codice OTP non valido";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4">
                <div>
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
                </div>
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
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordDialog(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Password dimenticata?
                  </button>
                </div>
                {loginError && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200 flex items-start">
                    <svg
                      className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
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

                  <div className="space-y-2 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-700">La password deve contenere:</p>
                    <ul className="space-y-1">
                      <li className="text-sm flex items-center">
                        {passwordRequirements.minLength ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 mr-2 text-red-500" />
                        )}
                        Almeno 8 caratteri
                      </li>
                      <li className="text-sm flex items-center">
                        {passwordRequirements.hasUpperCase ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 mr-2 text-red-500" />
                        )}
                        Almeno una lettera maiuscola
                      </li>
                      <li className="text-sm flex items-center">
                        {passwordRequirements.hasLowerCase ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 mr-2 text-red-500" />
                        )}
                        Almeno una lettera minuscola
                      </li>
                      <li className="text-sm flex items-center">
                        {passwordRequirements.hasSpecialChar ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 mr-2 text-red-500" />
                        )}
                        Almeno un carattere speciale (!@#$%^&*(),.?&quot;:{}|)
                      </li>
                    </ul>
                  </div>
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

      <Dialog open={showForgotPasswordDialog} onOpenChange={handleCloseResetDialog}>
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
                onClick={handleCloseResetDialog}
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
                {loading ? (
                  "Invio in corso..."
                ) : (
                  "Invia istruzioni di reset"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;