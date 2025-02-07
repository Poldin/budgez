'use client'
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Controlla se i cookies sono già stati accettati
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'false');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4"> 
      <Alert className=" mx-auto">
        <AlertTitle className="text-lg font-semibold">
          Utilizziamo i cookie
        </AlertTitle>
        <AlertDescription className="">
          <p className="mb-4">
            Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito. 
            Alcuni cookie sono necessari per il funzionamento del sito, mentre altri 
            ci aiutano a capire come interagisci con esso.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={acceptCookies}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Accetta tutti
            </Button>
            <Button 
              onClick={declineCookies}
              variant="outline"
              className="hover:bg-secondary"
            >
              Rifiuta non essenziali
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CookieBanner;