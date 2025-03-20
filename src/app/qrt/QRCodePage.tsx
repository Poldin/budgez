"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TicketResponse {
  ticket_code: string;
  ticket_encrypted_code: string;
}

export default function QRCodePage() {
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [authToken, setAuthToken] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const tid = searchParams.get("tid");

  // Utility functions from login component
  const showAlert = (type: "success" | "error", message: string) => {
    setAlertMessage({ type, message });
    setTimeout(() => setAlertMessage({ type: null, message: "" }), 5000);
  };

  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "; expires=" + date.toUTCString();
    document.cookie =
      name +
      "=" +
      (value || "") +
      expires +
      "; path=/; SameSite=Strict" +
      (window.location.protocol === "https:" ? "; Secure" : "");
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // Log della richiesta per debugging
  const logRequest = (message: string, details: unknown) => {
    console.log(`[QRCodePage] ${message}`, {
      tid,
      timestamp: new Date().toISOString(),
      details,
    });
  };

  const fetchTicket = async (token: string | null = null) => {
    if (!tid) {
      showAlert("error", "ID del ticket mancante nell'URL");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const currentToken = token || authToken || getCookie("auth_token");
    logRequest("Fetching ticket", { usingToken: !!currentToken });

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        accept: "application/json",
      };

      if (currentToken) {
        headers["Authorization"] = `Bearer ${currentToken}`;
        logRequest("Using authorization token", {
          tokenLength: currentToken.length,
        });
      }

      const response = await fetch(
        `https://xejn-1dw8-r0nq.f2.xano.io/api:Af7sIvHy/qrcode-page/${tid}/ticket`,
        {
          method: "POST",
          headers,
        }
      );

      logRequest("API response received", { status: response.status });

      if (response.status === 401) {
        logRequest("Authentication required", {});
        setNeedsLogin(true);
        showAlert("error", "Accesso richiesto. Per favore, effettua il login.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        logRequest("API error", { status: response.status, error: errorText });
        showAlert("error", `Errore dal server: ${response.status}`);
        setIsLoading(false);
        return;
      }

      const data: TicketResponse = await response.json();
      logRequest("Ticket data received", { hasTicketCode: !!data.ticket_code });

      if (!data.ticket_code) {
        logRequest("Missing ticket code", {});
        showAlert("error", "Il codice del ticket è mancante nella risposta.");
        setIsLoading(false);
        return;
      }

      setTicketCode(data.ticket_code);
      setNeedsLogin(false);
    } catch (error) {
      logRequest("Error fetching ticket", { error });
      showAlert(
        "error",
        "Si è verificato un errore durante il recupero del ticket."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://xejn-1dw8-r0nq.f2.xano.io/api:Af7sIvHy/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        logRequest("Login successful", { userId: data.userId });

        // Save the auth token in a cookie
        if (data.authToken) {
          setCookie("auth_token", data.authToken, 7);
          setAuthToken(data.authToken);

          // Call API route to set HTTP-only cookie if you have that endpoint
          try {
            await fetch("/api/set-auth-cookie", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: data.authToken }),
            });
          } catch (e) {
            // Se l'API non esiste, ignora silenziosamente
            console.log("API set-auth-cookie not available, skipping", e);
          }
        }

        // After successful login, fetch the ticket
        await fetchTicket(data.authToken);
      } else {
        logRequest("Login failed", { status: response.status });
        showAlert("error", "Email o password non validi. Per favore, riprova.");
      }
    } catch (err) {
      logRequest("Login error", { error: err });
      showAlert(
        "error",
        "Si è verificato un errore durante la connessione al server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setTicketCode(null);
    fetchTicket();
  };

  const handleRetry = () => {
    fetchTicket();
  };

  // Initial fetch on component mount
  useEffect(() => {
    const token = getCookie("auth_token");
    if (token) {
      setAuthToken(token);
    }
    fetchTicket(token);
  }, [tid]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md rounded-xl overflow-hidden">
        <CardHeader className="bg-white rounded-t-xl">
          <CardTitle className="text-2xl font-bold text-center">
            {needsLogin ? "Accedi per visualizzare il QR Code" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-white rounded-b-xl p-6">
          {alertMessage.type && (
            <Alert
              variant={
                alertMessage.type === "success" ? "default" : "destructive"
              }
            >
              <AlertDescription>{alertMessage.message}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <p className="mt-4 text-lg text-gray-600">Caricamento...</p>
            </div>
          ) : needsLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="nome@esempio.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  className="rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  disabled={isLoading}
                  className="rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                className="w-full mt-4 rounded-lg"
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accedi
              </Button>
            </form>
          ) : ticketCode ? (
            <div className="flex flex-col items-center space-y-6">
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <QRCodeSVG value={ticketCode} size={250} level="H" />
              </div>

              <p className="text-lg font-medium text-center text-gray-600">
                Codice: {ticketCode}
              </p>

              <Button
                onClick={handleNext}
                className="flex items-center justify-center w-full py-3 px-4"
              >
                Successivo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-red-700 mb-2">
                Errore di caricamento
              </h3>
              <p className="text-gray-700 mb-4 text-center">
                Impossibile caricare il QR code. Riprova più tardi.
              </p>
              <Button
                onClick={handleRetry}
                className="flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Riprova
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
