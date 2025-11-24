'use client'

import React, { useState } from 'react';
import { translations, type Language } from '@/lib/translations';
import Footer from '@/components/footer/footer';
import HowToCarousel from '@/components/budget/how-to-carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Target, TrendingUp, Bell, CheckCircle2, Clock, AlertCircle, Mail, Calendar } from 'lucide-react';

export default function HowToPage() {
  const [language, setLanguage] = useState<Language>('it');
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">B) Budgez</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Buttons hidden */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-3">
              {t.howItWorksTitle}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              {t.howItWorksMainSubtitle}
            </p>
          </div>

          {/* Carousel */}
          <HowToCarousel />

          {/* Performance Section */}
          <div className="mt-16 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Velocità, Dettaglio e Performance
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Budgez è progettato per darti il controllo completo sulle tue performance. 
                Monitora ogni mese come stai performando con metriche chiare e dettagliate.
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Velocità</h3>
                  <p className="text-sm text-gray-600">
                    Crea preventivi professionali in pochi minuti grazie all'AI e ai template predefiniti
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Dettaglio</h3>
                  <p className="text-sm text-gray-600">
                    Ogni preventivo include tutte le informazioni necessarie con un livello di dettaglio professionale
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Performance</h3>
                  <p className="text-sm text-gray-600">
                    Monitora le tue performance mensili con metriche chiare e sempre aggiornate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Demo Stats Table */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Monitora le tue Performance Mensili
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm max-w-3xl mx-auto">
                <div className="grid grid-cols-3 gap-4">
                  {/* 2 mesi fa */}
                  {(() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 2);
                    const monthName = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                    return (
                      <div>
                        <div className="text-xs text-gray-500 mb-2 font-medium text-center">
                          {monthName}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-2xl font-bold text-gray-900">
                            8
                          </div>
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-500">
                              12
                            </div>
                            <div className="text-xs text-gray-500">
                              67%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Mese scorso */}
                  {(() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 1);
                    const monthName = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                    return (
                      <div className="border-l border-r border-gray-200 px-4">
                        <div className="text-xs text-gray-500 mb-2 font-medium text-center">
                          {monthName}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-2xl font-bold text-gray-900">
                            15
                          </div>
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-500">
                              20
                            </div>
                            <div className="text-xs text-gray-500">
                              75%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Mese attuale */}
                  {(() => {
                    const date = new Date();
                    const monthName = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                    return (
                      <div>
                        <div className="text-xs text-gray-500 mb-2 font-medium text-center">
                          {monthName}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-2xl font-bold text-gray-900">
                            10
                          </div>
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-500">
                              14
                            </div>
                            <div className="text-xs text-gray-500">
                              71%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="max-w-3xl mx-auto">
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <h4 className="font-bold text-lg mb-4 text-gray-900">
                    Cosa significano questi numeri?
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                        1
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Numero grande (es. 8, 15, 10):</span> 
                        <span className="ml-2">Rappresenta i <strong>preventivi firmati</strong> nel mese. Questi sono i preventivi che i tuoi clienti hanno accettato e firmato tramite OTP.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                        2
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Numero medio (es. 12, 20, 14):</span> 
                        <span className="ml-2">Rappresenta i <strong>preventivi totali creati</strong> nel mese. Include tutti i preventivi che hai generato, sia quelli firmati che quelli ancora in attesa.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                        3
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Percentuale (es. 67%, 75%, 71%):</span> 
                        <span className="ml-2">Rappresenta il <strong>tasso di conversione</strong>, calcolato come (preventivi firmati / preventivi creati) × 100. Ti dice quanti preventivi su 100 vengono effettivamente firmati dai clienti.</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Suggerimento:</strong> Un tasso di conversione elevato indica che i tuoi preventivi sono ben calibrati e attraenti per i clienti. 
                      Monitora questa metrica mensilmente per ottimizzare la tua strategia di pricing e presentazione.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Convenience Section */}
          <div className="mt-16 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Massima Comodità, Zero Stress
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Una volta creato il preventivo e condivisa la versione interattiva, 
                Budgez si occupa di tutto. Non devi più controllare manualmente lo stato dei tuoi preventivi.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        Notifiche Automatiche
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Ricevi una notifica immediata ogni volta che un cliente firma il preventivo. 
                        Non devi più controllare manualmente o ricordarti di seguire i clienti.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <strong>Crea il preventivo</strong> con tutte le informazioni necessarie
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                        <span className="text-purple-600 font-bold text-sm">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <strong>Condividi la versione interattiva</strong> con il cliente tramite link
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <span className="text-green-600 font-bold text-sm">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <strong>Budgez ti avvisa automaticamente</strong> quando il preventivo viene firmato o se il cliente non risponde
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white/80 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700">
                          <strong>Risultato:</strong> Puoi concentrarti sul tuo lavoro mentre Budgez tiene traccia di tutto. 
                          Non perderai mai un preventivo firmato e saprai sempre quando è il momento di seguire un cliente.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Weekly Summary Section */}
          <div className="mt-16 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Riepilogo Settimanale
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Ogni settimana ricevi un riepilogo completo via email con tutte le informazioni 
                necessarie per gestire al meglio i tuoi preventivi.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Demo Email Preview */}
              <Card className="bg-white border-2 border-gray-200 shadow-lg mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Riepilogo Settimanale Budgez</div>
                      <div className="text-xs text-gray-500">Ogni lunedì alle 9:00</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900 uppercase">In Attesa</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">12</div>
                        <div className="text-xs text-blue-700 mt-1">Preventivi in essere</div>
                      </div>

                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-semibold text-orange-900 uppercase">Da Risentire</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-900">5</div>
                        <div className="text-xs text-orange-700 mt-1">Clienti da seguire</div>
                      </div>

                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-semibold text-red-900 uppercase">Scaduti</span>
                        </div>
                        <div className="text-2xl font-bold text-red-900">3</div>
                        <div className="text-xs text-red-700 mt-1">Preventivi scaduti</div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-900 uppercase">Firmati Questa Settimana</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">8</div>
                      <div className="text-xs text-green-700 mt-1">Nuovi preventivi firmati</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Explanation */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <h4 className="font-bold text-lg mb-4 text-gray-900">
                    Cosa include il riepilogo settimanale?
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 mt-0.5">
                        <Clock className="h-3 w-3" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Preventivi in attesa:</span> 
                        <span className="ml-2">Tutti i preventivi che hai inviato e che sono ancora validi, in attesa della firma del cliente.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700 mt-0.5">
                        <AlertCircle className="h-3 w-3" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Clienti da risentire:</span> 
                        <span className="ml-2">Clienti che hanno ricevuto un preventivo ma non hanno ancora firmato. È il momento perfetto per un follow-up.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-700 mt-0.5">
                        <Calendar className="h-3 w-3" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Preventivi scaduti:</span> 
                        <span className="ml-2">Preventivi che hanno superato la data di scadenza. Potresti voler creare una nuova proposta o contattare il cliente.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 mt-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Preventivi firmati:</span> 
                        <span className="ml-2">Un riepilogo dei preventivi firmati durante la settimana, così puoi celebrare i tuoi successi!</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>📧 Ricevi il riepilogo ogni lunedì:</strong> Inizia la settimana con tutte le informazioni 
                      necessarie per gestire al meglio i tuoi preventivi e seguire i clienti al momento giusto.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer language={language} onLanguageChange={setLanguage} />
    </div>
  );
}
