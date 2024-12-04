"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  const checkExistingUser = async (email: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("email, terms_accepted")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the "not found" error
      throw error;
    }

    return data;
  };

  const handleInitialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const existingUser = await checkExistingUser(email);

      if (existingUser) {
        // Existing user - send OTP
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        setShowVerification(true);
        toast.success("Codice di verifica inviato!");
      } else {
        // New user - show signup dialog
        setShowSignupDialog(true);
      }
    } catch (error) {
      toast.error("Errore durante la verifica dell'email");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error("Devi accettare i termini e condizioni per continuare");
      return;
    }

    setLoading(true);
    try {
      // Send OTP for signup
      const { error: signupError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) throw signupError;

      // Create user profile with terms acceptance
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            email,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
          },
        ]);

      if (profileError) throw profileError;

      setShowSignupDialog(false);
      setShowVerification(true);
      toast.success("Codice di verifica inviato!");
    } catch (error) {
      toast.error("Errore durante la registrazione");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: "email",
      });

      if (error) throw error;

      toast.success("Accesso effettuato con successo!");
      router.push("/dashboard"); // Redirect to dashboard after successful login
    } catch (error: unknown) {
      toast.error(`Errore: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Accedi</h1>
          <p className="text-gray-600">Inserisci la tua email per continuare</p>
        </div>

        <form onSubmit={handleInitialSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@esempio.com"
              required
              disabled={loading}
              className="h-12"
            />
          </div>
          <Button type="submit" className="w-full h-12" disabled={loading}>
            <Mail className="mr-2 h-5 w-5" />
            {loading ? "Caricamento..." : "Continua"}
          </Button>
        </form>
      </div>

      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrati</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignupSubmit} className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Per registrarti, accetta i termini e condizioni
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => {
                  setAcceptedTerms(Boolean(checked));
                }}
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
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !acceptedTerms}
            >
              {loading ? "Caricamento..." : "Registrati"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifica Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVerification} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm">
                Inserisci il codice ricevuto via email
              </label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifica in corso..." : "Verifica"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
