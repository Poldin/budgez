"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Check, X, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Costanti per i requisiti della password
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  patterns: {
    upperCase: /[A-Z]/,
    lowerCase: /[a-z]/,
    specialChar: /[!@#$%^&*(),.?":{}|<>]/
  }
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasSpecialChar: false
  });

  const router = useRouter();

  // Controlla se l'utente è già loggato
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     if (session) {
  //       router.push('/budgets');
  //     }
  //   };
  //   checkAuth();
  // }, [router]);

  // Verifica che il token sia valido all'avvio
  // useEffect(() => {
  //   // const validateToken = async () => {
  //   //   try {
  //   //     // Ottieni i parametri dall'URL
  //   //     const hashParams = new URLSearchParams(window.location.hash.substring(1));
  //   //     const accessToken = hashParams.get('access_token');
  //   //     const type = hashParams.get('type');

  //   //     console.log('hashParamsh', hashParams)
  //   //     console.log('accessToken', accessToken)
  //   //     console.log('typet', type)
        
  //   //     if (!accessToken) {
  //   //       setError("Token di reset non trovato");
  //   //       return;
  //   //     }

  //   //     // // Verifica che sia un token di tipo recovery
  //   //     if (type !== 'recovery') {
  //   //       setError("Tipo di token non valido");
  //   //       return;
  //   //     }

  //   //     // Imposta la sessione con Supabase
  //   //     const { error: sessionError } = await supabase.auth.setSession({
  //   //       access_token: accessToken,
  //   //       refresh_token: accessToken
  //   //     });

  //   //     if (sessionError) {
  //   //       console.error("Errore sessione:", sessionError);
  //   //       setError("Token non valido o scaduto");
  //   //       return;
  //   //     }

  //   //     // Verifica che l'utente sia valido
  //   //     const { data: { user }, error: userError } = await supabase.auth.getUser();

  //   //     if (userError || !user) {
  //   //       console.error("Errore utente:", userError);
  //   //       setError("Token non valido o scaduto");
  //   //       return;
  //   //     }

  //   //     setIsTokenValid(true);
  //   //   } catch (error) {
  //   //     console.error("Errore nella validazione del token:", error);
  //   //     setError("Errore nella validazione del token di reset");
  //   //   }
  //   // };

  //   // validateToken();
  // }, []);

  // Controlla i requisiti della password
  useEffect(() => {
    setPasswordRequirements({
      minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
      hasUpperCase: PASSWORD_REQUIREMENTS.patterns.upperCase.test(password),
      hasLowerCase: PASSWORD_REQUIREMENTS.patterns.lowerCase.test(password),
      hasSpecialChar: PASSWORD_REQUIREMENTS.patterns.specialChar.test(password)
    });
  }, [password]);

  const validatePassword = (): boolean => {
    return Object.values(passwordRequirements).every(Boolean);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    if (!validatePassword()) {
      setError("La password non soddisfa tutti i requisiti");
      return;
    }

    setLoading(true);
    setIsTokenValid(true)

    try {
      // Aggiorna la password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (updateError) {
        if (updateError.message.includes("Password should be")) {
          throw new Error("La password non rispetta i requisiti di sicurezza");
        } else if (updateError.message.includes("Token expired")) {
          throw new Error("Il link di reset è scaduto. Richiedi un nuovo link.");
        }
        throw updateError;
      }

      // Se l'aggiornamento ha successo
      setSuccess(true);
      toast.success("Password aggiornata con successo!");
      
      // Effettua il logout
      await supabase.auth.signOut();
      
      // Reindirizza al login
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: unknown) {
      console.error("Errore nel reset della password:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Errore durante il reset della password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-4 text-gray-600">Caricamento in corso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white rounded-lg shadow-lg p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {isTokenValid ? (success ? "Password Aggiornata" : "Reset Password") : "Link Non Valido"}
          </h1>
          <p className="text-gray-500">
            {isTokenValid
              ? success
                ? "La tua password è stata aggiornata con successo. Verrai reindirizzato alla pagina di login..."
                : "Inserisci la tua nuova password"
              : "Il link di reset password non è valido o è scaduto. Richiedi un nuovo link di reset."}
          </p>
        </div>

        {isTokenValid && !success ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Nuova password"
                    required
                    className="h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

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
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Conferma password"
                  required
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

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aggiornamento in corso...
                </>
              ) : (
                "Aggiorna Password"
              )}
            </Button>
          </form>
        ) : (
          <Button
            onClick={() => router.push("/login")}
            className="w-full h-12"
          >
            Torna al Login
          </Button>
        )}
      </div>
    </div>
  );
}