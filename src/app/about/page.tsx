'use client'

import React from 'react';
import { Button } from "@/components/ui/button";
import SalesTeamDialog from '@/components/sales_dialog/salesteamdialog';
import { Toaster } from "sonner";
import Footer from '@/components/footer/footer';
import Header from '@/components/header';

export default function AboutPage() {

  const [showDemoDialog, setShowDemoDialog] = React.useState(false);


  return (
    <div className="min-h-screen bg-white">
      <Toaster />

      {/* Sticky Header */}
      <Header/>

      <main className="container mx-auto px-4 py-12">
        {/* Why we created Budgez Section */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Perché Budgez?
          </h2>
          <div className="prose prose-lg">
            <p className="text-gray-600 leading-relaxed mb-4">
              Nel 2023 offrivamo esclusivamente servizi di consulenza e sviluppo software: una piccola software house conto terzi. Nel 2023 abbiamo inviato 118 preventivi. Ogni preventivo è stato ragionato e ponderato (= ci abbiamo investito tempo) ma non siamo mai riusciti a 1) <b>identificare gli errori</b> di preventivazione e 2) <b>migiorare dagli errori</b>.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Non solo. Non riuscivamo neppure a limare il tempo investito per nuove quotazioni.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Budgez nasce per questo: rendere sempre più snello il processo di quotazione; migliorarne l&apos;output e garantire che il risultato porti a vendere.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Il calcolo dei costi è il primo passo. Poi bisogna vendere. Segui da questo link il piano di crescita di Budgez: <a className='bg-blue-200' href="https://larin-group.notion.site/Budgez-1fef28d84bd04252a45e6012e5b4783b?pvs=4">Piano di Crescita</a>
            </p>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="max-w-4xl mx-auto mb-20   rounded-xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            I nostri valori
          </h2>
          <div className="space-y-2">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <h3 className="text-base text-gray-600 mb-2">1. <b>Verità</b> e <b>Libertà</b>.</h3>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <h3 className="text-base text-gray-600 mb-2">2. Siamo <b>ossessionati dal ROI</b> di chi ci sceglie e investe in noi</h3>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <h3 className="text-base text-gray-600 mb-2">3. <b>Sono le persone a creare valore</b>. Non gli algoritmi.</h3>
              <p className="text-gray-400 text-sm">E quando la tecnologia è al servizio delle persone accade lo straordinario.</p>
            </div>
          </div>
        </section>

        {/* Larin Section */}
        <section className="max-w-4xl mx-auto">
          
          <div className="bg-gray-900  p-8 rounded-xl">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* <div className="relative w-full md:w-1/3 h-48">
              
              </div> */}
              <div className="">
              <h2 className="text-4xl font-bold text-gray-200 mb-8">
                    Le nostre origini: Larìn
                </h2>
                <div className="text-gray-200 mb-4">
                <p className="mb-4">
                    Budgez è nato all&apos;interno di Larin (si pronuncia <u>Larìn</u>), la full-stack agency per l&apos;era digitale: Marketing & Automation, Branding, Tech (in questa business unit è nata Budgez!).
                </p>
                <p className='text-4xl font-thin'>
                    Uniamo <b>creatività</b>, <b>marketing</b> e <b>tecnologia</b> per aiutare concretamente le organizzazioni a competere in un mondo sempre più complesso e centrare risultati di business.
                </p>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4 hover:bg-gray-800 hover:text-gray-200 mb-4"
                  onClick={() => window.open('https://larin.it', '_blank')}
                >
                  Visit <b>Larin.it</b>
                </Button>
                {/* <div className='w-full'>
                <Image
                  src="/images/larin_logo_wide.jpg"
                  alt="Larin logo"
                  width={900}
                  height={500}
                  style={{ objectFit: 'fill' }}
                  className="w-full h-auto object-cover rounded-lg"
                />
                </div> */}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Demo Request Dialog */}
      <SalesTeamDialog 
        open={showDemoDialog}
        onOpenChange={setShowDemoDialog}
      />
      <Footer />
    </div>
  );
}