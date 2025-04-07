'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SalesTeamDialog from '@/components/sales_dialog/salesteamdialog';
import { Toaster } from "sonner";
import Header from '@/components/header';
import Footer from '@/components/footer/footer';
import DemoBudgetCalculator from '@/components/tabs/calcola';
import AiBudgetGenerator from '@/components/tabs/aiBudgetGenerator';
import SoftwareUpdates from '@/components/softwareUpdates/softwareUpdates';

export default function LandingPage() {
  const router = useRouter();
  const [showDemoDialog, setShowDemoDialog] = React.useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Toaster />

      {/* Sticky Header */}
      <Header/>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-left">
              <h1 className="text-6xl font-bold tracking-tight text-gray-900">
                Quotazioni che hanno senso. Con l&apos;AI.
              </h1>
              <p className="text-xl text-gray-600 mb-2 leading-relaxed">
                Quota nuovi preventivi in modo rapido, rigoroso, preciso.
                Tieni lo storico e affina sempre più le tue capacità di previsione dei costi.
              </p>
              <div className="flex items-center space-x-4">
                <Button size="lg" onClick={() => router.push('/signup')} className="font-bold">
                  Inizia gratis
                </Button>
                <Link href="https://tally.so/r/wkJWVR" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className='bg-gray-600 hover:bg-gray-800 border-2 border-gray-00 animate-pulse text-white'>
                    Compila la survey!
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative h-96 md:h-[500px]">
              <Image
                src="/images/hero-calculation.jpg"
                alt="Financial calculation illustration"
                fill
                style={{ objectFit: 'contain' }}
                priority
                className="rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Video Demo Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Guarda come funziona Budgez</h2>
            <div className="relative" style={{ paddingBottom: '47.43991640543365%', height: 0 }}>
              <iframe 
                src="https://www.loom.com/embed/bb3bbf15aee8470586a44957fd68aa08?sid=a769dd11-e156-453d-a4ce-dc5d9792dad5" 
                frameBorder="0" 
                allowFullScreen 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                title="Budgez Demo Video"
              ></iframe>
            </div>
          </div>
        </section>

        {/* Feature Tabs Section */}
        <section className="container mx-auto px-4 py-2">
          <Tabs defaultValue="tab1" className="mx-auto">
          <div className="flex justify-center w-full mb-8">
            <TabsList className="grid w-[400px] grid-cols-2 bg-white">
              <TabsTrigger value="tab1" className="font-bold text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calcola
              </TabsTrigger>
              <TabsTrigger value="ai-budget" className="font-bold text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Budget [beta]
              </TabsTrigger>
            </TabsList>
            </div>

             {/* Contenuto delle tabs */}
             {/* Calcola */}
            <TabsContent value="tab1" className="mt-6">
              <div className="space-y-2">
                <div className="mx-auto text-center mb-2">
                  <h2 className="text-3xl font-bold tracking-tight">
                    Calcola il prezzo in modo rigoroso, preciso, rapido.
                  </h2>
                  <p className="mt-2 text-lg text-gray-600">
                    Calcola il prezzo delle attività e aggiungi le risorse che servono, includi margini commerciali e sconti. Psst.. un consiglio: parti da un template!
                  </p>
                </div>
                <DemoBudgetCalculator />
              </div>
            </TabsContent>

            {/* AI Budget */}
            <TabsContent value="ai-budget" className="mt-6">
              <div className="space-y-2">
                <div className="mx-auto text-center mb-2">
                  <h2 className="text-3xl font-bold tracking-tight">
                    Genera budget con l&apos;AI in pochi secondi.
                  </h2>
                  <p className="mt-2 text-lg text-gray-600">
                    Descrivi il tuo progetto all&apos;AI e ottieni una struttura di budget completa con risorse e attività. Poi raffina e personalizzala dialogando con l&apos;assistente.
                  </p>
                </div>
                <AiBudgetGenerator />
              </div>
            </TabsContent>

              {/* Crea */}
            <TabsContent value="tab2" className="mt-6">
              <div className="space-y-2">
                <div className="mx-auto text-center mb-2">
                  <h2 className="text-3xl font-bold tracking-tight">
                    Crea preventivi sexy.
                  </h2>
                  <p className="mt-2 text-lg text-gray-600">
                    Racconta il <b>valore</b> che puoi trasmettere al tuo cliente. Le persone amano conoscere il perché, non solo i numeri: con il <b>perché</b> si approvano i <b>numeri</b>. [Psst: Parti da un template!]
                  </p>
                </div>
              </div>
            </TabsContent>

              {/* Reminder */}
            <TabsContent value="tab3" className="mt-6">
              <div className="space-y-2">
                <div className="mx-auto text-center mb-2">
                  <h2 className="text-3xl font-bold tracking-tight">
                    Automatizzati la vita. Diventa scalabile
                  </h2>
                  <p className="mt-2 text-lg text-gray-600">
                    Bisogna saper fermarsi se non c&apos;è speranza di vendere: e un cliente che non ha mai aperto il preventivo non è un cliente a cui venderemo (con alta probabilità): Imposta i reminders e lascia che sia Budgez ad occuparsi dei clienti prima che tu investa il tuo tempo prezioso.
                  </p>
                </div>
                
              </div>
            </TabsContent>


          </Tabs>
        </section>

        <SoftwareUpdates />



      </main>

       {/* Demo Request Dialog */}
       <SalesTeamDialog 
        open={showDemoDialog}
        onOpenChange={setShowDemoDialog}
      />
      <Footer/>
    </div>
  );
}