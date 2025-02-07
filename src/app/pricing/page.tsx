'use client'
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default function PricingPage() {
  const [showDemoDialog, setShowDemoDialog] = React.useState(false);

  

  //const monthlyPrice = 9.90;
  //const annualPrice = (monthlyPrice * 0.8).toFixed(2); // 20% discount

  const faqItems = [
    {
      question: "Cos è Budgez?",
      answer: "Budgez è la piattaforma che ti permette di calcolare, creare e inviare preventivi ai tuoi clienti. Quando invii il preventivo, raccogliamo i dati di utilizzo del preventivo: quante volte è stato aperto dal cliente, se il tuo cliente lo ha ricondiviso internamente e raccogliamo un feedback nel caso il tuo cliente non accettasse il preventivo. Il nostro obiettivo è semplice: creare rapidamente preventivi che vendono."
    },
    {
      question: "Posso collaborare con altri professionisti per creare il preventivo?",
      answer: "Certo. Puoi collaborare con chi vuoi, a patto che sia iscritto a Budgez. Permetterti di collaborare è in cima alle nostre priorità: i migliori risultati sono frutto di un lavoro di squadra. Per questo, i tuoi collaboratori possono collaborare gratis alla creazione del preventivo."
    },
    {
      question: "Chi è l'utente \"Owner\"? Cosa significa che gli altri utenti non pagano?",
      answer: "L'utente Owner è l'unico che può creare un nuovo budget (un nuovo preventivo), condividerlo internamente o inviarlo ai clienti. Tutti gli altri utenti possono collaborare: calcolare l'ammontare del preventivo, definire il copy del preventivo, le immagini, i link, curare gli aspetti legali, etc. Questi utenti collaboratori possono partecipare gratuitamente alle attività: possono comunque essere Owner a loro volta e creare i propri budget! Senza Owner non si possono creare budget ma un Owner può invitare chiunque, gratuitamente, a lavorarci insieme."
    },
    {
      question: "Cosa sono e come funzionano i reminder automatici?",
      answer: "I reminder sono promemoria automatici che ti aiutano a seguire l'andamento dei tuoi preventivi. Puoi impostare reminder personalizzati per notificare i clienti che è imminente la scadenza del preventivo e ricordare loro che aspetti una risposta. Così puoi combinare followup manuali a notifiche automatiche."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      
      {/* Sticky Header */}
      <Header/>

      {/* Hero Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-bold tracking-tight text-gray-900 mb-6">
            ROI. Paghi x, vendi per 1000x
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Siamo costantemente impegnati perché ogni centesimo che investi in noi, frutti di più alla tua azienda.
          </p>

          {/* Collaboration Message */}
          {/* <Alert className="bg-orange-50 border-orange-200 border-2 text-orange-800 mx-auto">
            <AlertDescription className="text-base">
              con Budgez possono collaborare diversi professionisti alla realizzazione di un preventivo: 
              paga solo chi crea il preventivo (noi lo chiamiamo Owner). Tutti gli altri collaborano gratis 😏
            </AlertDescription>
          </Alert> */}
          {/* Collaboration Message */}
          <Alert className="bg-blue-50 border-blue-200 border-2 text-blue-800 mx-auto mt-6">
            <AlertDescription className="text-base">
              Budgez è attualmente in beta pubblica gratuita: enjoy!!!😏
            </AlertDescription>
          </Alert>
        </div>
        
      </section>

      {/* Pricing Cards */}
      {/* <section className="pb-10 px-2">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Label htmlFor="billing-toggle" className="text-base font-medium">Mensile</Label>
          <div className="flex items-center gap-2">
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className="font-medium text-blue-600">
              Annuale (sconto 20%)
            </span>
          </div>
        </div>
          
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          
          <Card className="border-2">
            <CardHeader className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-6 w-6 text-gray-800" />
                    <h3 className="text-2xl font-bold">Pro</h3>
                  </div>
                  <p className="text-gray-600 mt-2">Per professionisti e piccole imprese</p>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">€{(isAnnual ? annualPrice : monthlyPrice).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-gray-600">/mese per utente Owner</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <ul className="space-y-4">
                {[
                  'Budget illimitati',
                  'Collabora con altri utenti Editor e Viewer',
                  'Editor a blocchi per costruire la grafica dei preventivi',
                  'Editor di lavorazione: per appunti e calcoli privati',
                  'Reminder illimitati',
                  'Template di reminder',
                  'Dashboard di monitoraggio dei preventivi',
                  'Meccanismo di sharing coi clienti avanzato'
                ].map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <Check className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0 flex flex-col gap-3">
              <Button size="lg" className="w-full font-bold" onClick={() => router.push('/login')}>
                Inizia gratis
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Attiva la prova gratuita di 14 giorni, senza impegno, senza carte di credito
              </p>
            </CardFooter>
          </Card>

         
          <Card className="border-2">
            <CardHeader className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-6 w-6 text-gray-800" />
                    <h3 className="text-2xl font-bold">Enterprise</h3>
                  </div>
                  <p className="text-gray-600 mt-2">Per grandi organizzazioni</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-base font-medium">Contattaci per un preventivo personalizzato</p>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <ul className="space-y-4">
                {[
                  'Tutto quello che c\'è in Pro',
                  'SSO',
                  'API (beta access)',
                  'Interfacce di calcolo personalizzate su use-case specifico'
                ].map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <Check className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button size="lg" variant="outline" className="w-full font-bold" onClick={handleDemoRequest}>
                Contattaci
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Questions & Answers</h2>
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
                <AccordionContent className="text-gray-600 pb-4 ">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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