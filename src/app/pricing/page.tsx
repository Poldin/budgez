'use client'
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SalesTeamDialog from '@/components/sales_dialog/salesteamdialog';
import { Toaster } from "sonner";
import Header from '@/components/header';
import Footer from '@/components/footer/footer';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Add animation keyframes
const gradientAnimation = `
@keyframes gradient-x {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient-x {
  background-size: 200% 100%;
  animation: gradient-x 3s ease infinite;
}
`;

export default function PricingPage() {
  const [showDemoDialog, setShowDemoDialog] = React.useState(false);

  // Add the animation styles to the document
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = gradientAnimation;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const faqItems = [
    {
      question: "Cos'è Budgez?",
      answer: "Budgez è un'applicazione web avanzata per la creazione, gestione e analisi di preventivi, che combina strumenti di calcolo rigorosi con l'intelligenza artificiale. La piattaforma ti permette di calcolare, creare e inviare preventivi ai tuoi clienti, monitorando quando vengono aperti, condivisi e accettati. Il nostro obiettivo è semplice: creare rapidamente preventivi che vendono."
    },
    {
      question: "Quali sono le funzionalità principali di Budgez?",
      answer: "Budgez offre strumenti avanzati per il calcolo preciso dei costi, la generazione di budget con l'AI, la gestione e condivisione di preventivi, il monitoraggio dello stato dei preventivi inviati e l'analisi delle performance per migliorare le stime future. Puoi anche utilizzare modelli predefiniti per accelerare la creazione di preventivi e collaborare con altri professionisti."
    },
    {
      question: "Come funziona la generazione di budget con l'AI?",
      answer: "Con Budgez, puoi semplicemente descrivere il tuo progetto all'intelligenza artificiale e ottenere una struttura di budget completa in pochi secondi. L'AI analizza la tua descrizione e genera una proposta di preventivo che puoi poi personalizzare e perfezionare secondo le tue esigenze specifiche."
    },
    {
      question: "Posso collaborare con altri professionisti per creare il preventivo?",
      answer: "Certo. Budgez supporta la collaborazione con diversi livelli di accesso (owner, editor, viewer). Puoi invitare chiunque sia iscritto a Budgez a collaborare ai tuoi preventivi. I collaboratori possono calcolare l'ammontare del preventivo, definire il copy, le immagini, i link e curare gli aspetti legali, tutto gratuitamente."
    },
    {
      question: "Chi è l'utente \"Owner\"? Cosa significa che gli altri utenti non pagano?",
      answer: "L'utente Owner è l'unico che può creare un nuovo budget (un nuovo preventivo), condividerlo internamente o inviarlo ai clienti. Tutti gli altri utenti possono collaborare gratuitamente: possono essere editor o viewer. Un Owner può invitare chiunque, gratuitamente, a lavorare insieme sui preventivi."
    },
    {
      question: "Come funziona il monitoraggio dei preventivi?",
      answer: "Budgez ti permette di tenere traccia di quando i preventivi vengono aperti, condivisi e accettati dai clienti. Puoi anche impostare reminder automatici per notificare i clienti sulla scadenza del preventivo. Questi dati ti aiutano a capire l'interesse del cliente e a pianificare i follow-up appropriati."
    },
    {
      question: "Come funziona il modello di pricing di Budgez?",
      answer: "Budgez è completamente gratuito da utilizzare. Non ci sono costi di abbonamento o limiti sul numero di preventivi che puoi creare. L'unico costo è una commissione dello 0,1% sul valore dei preventivi approvati dai tuoi clienti. Paghi solo quando vendi, non quando crei."
    },
    {
      question: "Quando viene addebitata la commissione?",
      answer: "La commissione viene addebitata solo quando un cliente accetta formalmente il preventivo attraverso la piattaforma Budgez. Non ci sono costi per i preventivi in attesa di risposta o rifiutati."
    },
    {
      question: "Esistono piani enterprise per volumi elevati?",
      answer: "Sì. Per aziende con un volume elevato di preventivi approvati o con ticket medi significativi, offriamo piani enterprise personalizzati con commissioni ridotte. Contatta il nostro team commerciale per discutere le tue esigenze specifiche."
    },
    {
      question: "Come posso analizzare le performance dei miei preventivi?",
      answer: "Budgez offre strumenti di analisi che ti permettono di valutare l'accuratezza delle tue stime e migliorare i preventivi futuri. Puoi visualizzare dati storici, confrontare preventivi accettati e rifiutati, e identificare pattern che possono aiutarti a perfezionare il tuo processo di preventivazione."
    }
  ];

  const features = [
    {
      name: "Collaborazione",
      description: "Invita editor e viewer esterni a collaborare ai tuoi preventivi senza costi aggiuntivi"
    },
    {
      name: "Calcolo del budget",
      description: "Strumenti avanzati per calcolare costi, margini e sconti con precisione"
    },
    {
      name: "Condivisione del preventivo",
      description: "Invia preventivi professionali ai clienti con un semplice link"
    },
    {
      name: "Raccolta automatica di KPI",
      description: "Monitora quando i preventivi vengono letti, condivisi e accettati"
    },
    {
      name: "Generazione AI",
      description: "Crea strutture di budget complete descrivendo il progetto all'intelligenza artificiale"
    },
    {
      name: "Analisi delle performance",
      description: "Migliora la precisione delle tue stime attraverso l'analisi dello storico"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      
      {/* Sticky Header */}
      <Header/>

      {/* Hero Section */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
            Paghi solo quando vendi.
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
            Usa Budgez per creare preventivi sexy: che vendono.
          </p>
        </div>
      </section>

      {/* Single Pricing Model */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border-2 border-gray-300 shadow-xl overflow-hidden">
            <div className="p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Modello di pricing semplice</h2>
              <p className="text-xl text-gray-600 mb-8">
                Utilizza Budgez gratuitamente. Paghi solo quando un cliente accetta un preventivo.
              </p>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">€0</div>
                  <p className="text-gray-600">Costo mensile</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl text-gray-900 mb-2">
                    <span className="font-bold">0,1</span><span className="font-normal">%</span>
                  </div>
                  <p className="text-gray-600">Commissione sui preventivi approvati</p>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-8">
                <p className="text-gray-800">
                  <span className="font-semibold">Per volumi elevati o ticket medi significativi:</span> Contatta il nostro team commerciale per discutere commissioni personalizzate.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button 
                  className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg relative overflow-hidden"
                  onClick={() => window.location.href = '/login'}
                >
                  <span className="relative z-10">Inizia gratis</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 opacity-80 animate-gradient-x"></span>
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-900 text-gray-900 hover:bg-gray-50 px-8 py-6 text-lg"
                  onClick={() => setShowDemoDialog(true)}
                >
                  Contatta il team commerciale
                </Button>
              </div>
            </div>
            
            <div className="px-8 py-8 bg-gray-50 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-6 text-center text-xl">Tutte le funzionalità incluse</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-gray-900 mr-2 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">{feature.name}</span>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Come funziona</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-900 font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Crea il tuo preventivo</h3>
              <p className="text-gray-600">Utilizza i nostri strumenti di calcolo o l&apos;AI per generare preventivi professionali in pochi minuti.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-900 font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Condividi con il cliente</h3>
              <p className="text-gray-600">Invia il preventivo al cliente e monitora quando viene letto e condiviso.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-900 font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Paga solo quando vendi</h3>
              <p className="text-gray-600">Quando il cliente accetta il preventivo, paghi lo 0,1% del valore.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Domande frequenti</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-lg border px-4 hover:bg-gray-100"
              >
                <AccordionTrigger className="font-medium py-2 text-base no-underline hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto a creare preventivi che vendono?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Inizia gratuitamente oggi stesso. Nessuna carta di credito richiesta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg"
              onClick={() => window.location.href = '/signup'}
            >
              Inizia gratuitamente
            </Button>
            <Button 
              variant="outline"
              className="border-gray-900 text-gray-900 hover:bg-gray-50 px-8 py-6 text-lg"
              onClick={() => setShowDemoDialog(true)}
            >
              Contatta il team commerciale
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Request Dialog */}
      <SalesTeamDialog 
        open={showDemoDialog}
        onOpenChange={setShowDemoDialog}
      />

      <Footer/>
    </div>
  );
}