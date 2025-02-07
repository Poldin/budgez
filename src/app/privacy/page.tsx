import React from 'react';
import { Shield, Book } from 'lucide-react';

const PrivacyTerms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy e Termini</h1>
          <p className="mt-2 text-gray-600">Ultimo aggiornamento: 29 Gennaio 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 ">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-8 space-y-6 bg-white p-6 rounded-lg shadow-sm w-fit">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Informativa Privacy
                </h2>
                <ul className="mt-3 space-y-2">
                  <li><a href="#raccolta-dati" className="text-gray-600 hover:text-gray-900 text-sm">Raccolta dei dati</a></li>
                  <li><a href="#utilizzo-dati" className="text-gray-600 hover:text-gray-900 text-sm">Utilizzo dei dati</a></li>
                  <li><a href="#conservazione" className="text-gray-600 hover:text-gray-900 text-sm">Conservazione</a></li>
                  <li><a href="#diritti" className="text-gray-600 hover:text-gray-900 text-sm">I tuoi diritti</a></li>
                </ul>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Book className="h-5 w-5 text-blue-600" />
                  Termini e Condizioni
                </h2>
                <ul className="mt-3 space-y-2">
                  <li><a href="#servizi" className="text-gray-600 hover:text-gray-900 text-sm">Servizi offerti</a></li>
                  <li><a href="#registrazione" className="text-gray-600 hover:text-gray-900 text-sm">Registrazione</a></li>
                  <li><a href="#obblighi" className="text-gray-600 hover:text-gray-900 text-sm">Obblighi dell&apos;utente</a></li>
                  <li><a href="#limitazioni" className="text-gray-600 hover:text-gray-900 text-sm">Limitazioni</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-12">
            {/* Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informativa sulla Privacy</h2>
              
              <div className="space-y-8">
                <div id="raccolta-dati">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Raccolta dei dati</h3>
                  <p className="text-gray-600">Budgez raccoglie i dati personali necessari per fornirti i nostri servizi di gestione finanziaria. Questi includono:</p>
                  <ul className="mt-4 space-y-2 list-disc list-inside text-gray-600">
                    <li>Informazioni di registrazione (nome, email, password)</li>
                    <li>Dati finanziari per l&apos;analisi del budget</li>
                    <li>Informazioni sul dispositivo e sull&apos;utilizzo del servizio</li>
                  </ul>
                </div>

                <div id="utilizzo-dati">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Utilizzo dei dati</h3>
                  <p className="text-gray-600">I tuoi dati vengono utilizzati per:</p>
                  <ul className="mt-4 space-y-2 list-disc list-inside text-gray-600">
                    <li>Fornire e migliorare i nostri servizi</li>
                    <li>Personalizzare la tua esperienza</li>
                    <li>Comunicare aggiornamenti e offerte rilevanti</li>
                    <li>Garantire la sicurezza del tuo account</li>
                  </ul>
                </div>

                <div id="conservazione">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Conservazione dei dati</h3>
                  <p className="text-gray-600">Conserviamo i tuoi dati personali per il tempo necessario a fornirti i nostri servizi e rispettare gli obblighi legali. Implementiamo misure di sicurezza tecniche e organizzative per proteggere i tuoi dati.</p>
                </div>

                <div id="diritti">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">I tuoi diritti</h3>
                  <p className="text-gray-600">Hai il diritto di:</p>
                  <ul className="mt-4 space-y-2 list-disc list-inside text-gray-600">
                    <li>Accedere ai tuoi dati personali</li>
                    <li>Richiedere la rettifica o la cancellazione</li>
                    <li>Opporti al trattamento</li>
                    <li>Richiedere la portabilità dei dati</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Terms and Conditions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Termini e Condizioni</h2>
              
              <div className="space-y-8">
                <div id="servizi">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Servizi offerti</h3>
                  <p className="text-gray-600">Budgez offre una piattaforma per la gestione del budget personale e aziendale. I nostri servizi includono:</p>
                  <ul className="mt-4 space-y-2 list-disc list-inside text-gray-600">
                    <li>Tracciamento delle spese e delle entrate</li>
                    <li>Analisi finanziaria e reportistica</li>
                    <li>Gestione degli obiettivi finanziari</li>
                    <li>Strumenti di pianificazione del budget</li>
                  </ul>
                </div>

                <div id="registrazione">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Registrazione e Account</h3>
                  <p className="text-gray-600">Per utilizzare Budgez, devi:</p>
                  <ul className="mt-4 space-y-2 list-disc list-inside text-gray-600">
                    <li>Avere almeno 18 anni</li>
                    <li>Fornire informazioni accurate e complete</li>
                    <li>Mantenere la sicurezza delle credenziali</li>
                    <li>Essere responsabile per tutte le attività sul tuo account</li>
                  </ul>
                </div>

                <div id="obblighi">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Obblighi dell&apos;utente</h3>
                  <p className="text-gray-600">Utilizzando Budgez, ti impegni a:</p>
                  <ul className="mt-4 space-y-2 list-disc list-inside text-gray-600">
                    <li>Non violare leggi o regolamenti</li>
                    <li>Non interferire con il servizio</li>
                    <li>Non condividere contenuti inappropriati</li>
                    <li>Rispettare i diritti di altri utenti</li>
                  </ul>
                </div>

                <div id="limitazioni">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Limitazioni di responsabilità</h3>
                  <p className="text-gray-600">Budgez fornisce i servizi &quot;così come sono&quot;. Non garantiamo che:</p>
                  <ul className="mt-4 space-y-2 list-disc list-inside text-gray-600">
                    <li>Il servizio sarà sempre disponibile</li>
                    <li>I risultati saranno accurati al 100%</li>
                    <li>Il servizio sarà privo di errori</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contattaci</h3>
              <p className="text-gray-600">Per qualsiasi domanda sulla privacy o sui termini di servizio, contattaci:</p>
              <ul className="mt-4 space-y-2 text-gray-600">
                <li>Email: support@budgez.xyz</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyTerms;