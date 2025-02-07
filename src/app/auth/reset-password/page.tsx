"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasSpecialChar: false
  });

;
  const router = useRouter();

  // Verifica che il token sia valido all'avvio
  useEffect(() => {
    const validateToken = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setIsTokenValid(true);
        } else {
          setError("Link di reset password non valido o scaduto");
        }
      } catch (error) {
        console.error("Errore nella validazione del token:", error);
        setError("Errore nella validazione del token di reset");
      }
    };

    validateToken();
  }, []);

  // Controlla i requisiti della password
  useEffect(() => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
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

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Password aggiornata con successo!");
      
      // Breve delay per mostrare il messaggio di successo
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: unknown) {
      console.error("Errore nel reset della password:", error);
      setError("Errore nell'aggiornamento della password");
      toast.error("Errore nel reset della password");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white rounded-lg shadow-lg p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {isTokenValid ? "Reset Password" : "Link Non Valido"}
          </h1>
          <p className="text-gray-500">
            {isTokenValid
              ? "Inserisci la tua nuova password"
              : "Il link di reset password non è valido o è scaduto. Richiedi un nuovo link di reset."}
          </p>
        </div>

        {isTokenValid ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Nuova password"
                  required
                  className="h-12"
                />
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

              <div>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Conferma password"
                  required
                  className="h-12"
                />
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