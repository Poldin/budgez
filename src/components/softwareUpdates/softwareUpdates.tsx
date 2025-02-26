'use client'

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, CalendarDays, Zap, Star, Tag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

// Definizione dei tipi di dati
// Aggiornato per corrispondere ai tipi di variant disponibili in Badge
interface UpdateTag {
  id: string;
  name: string;
  color: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface SoftwareUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  fullDescription?: string;
  date: string;
  tags: UpdateTag[];
  image?: string;
  highlights?: string[];
  isNew?: boolean;
}

// Array di dati di esempio con i tipi di badge corretti
const UPDATES_DATA: SoftwareUpdate[] = [
    {
        id: '7',
        version: 'v0.2.2',
        title: 'migliorata la sezione del profilo, nuovo form di segnalazione bug e idee',
        description: 'abbiamo migliorato la sezione del profilo con info di username (ora modificabile) e di mail associate all\'utente. Introdotto anche il form di segnalazione di bug, intuizioni, migliorie e idee da parte degli utenti. Tutto quello che facciamo nasce da esigenze captate dagli utenti: finalmente potete dirci al volo le ideee che vi passano in mente',
        date: '25 feb 2025',
        tags: [
          
          { id: '1', name: 'Feedbacks', color: 'default' },
          
        ],
        image: '/images/template-engine.png',
        highlights: [
          'Migliorata sezione profilo',
          'Introdotto form di segnalazioni bug e idee!',
        ],
        isNew: true
      },{
        id: '6',
        version: 'v0.2.1',
        title: 'migliorato blocco di calcolo del budget',
        description: 'abbiamo migliorato il blocco di calcolo del budget: da oggi ricaviamo molte più metriche finali per dare un quadro immediato e completo all\'utente. Ad esempio aggreghiamo le ore di lavoro stimate e i costi fissi in quotazione. Migliorata anche la UX di gestione del blocco di calcolo del budget.',
        date: '15 feb 2025',
        tags: [
          
          { id: '1', name: 'metrics', color: 'default' },
          
        ],
        image: '/images/template-engine.png',
        highlights: [
          'Migliorato il blocco di calcolo del budget',
        ],
        isNew: false
      },{
        id: '5',
        version: 'v0.2.0',
        title: 'Share, Share, Share',
        description: 'Da oggi è possibile condividere un budget con i propri colleghi / partner. Abbiamo impostato 2 modalità di condivisione: viewer (può solo vedere il budget); editor (può modificare il documento). Prossimi passi: migliorare il blocco di quotazione dei progetti + introdurre blocchi di conferma del budget',
        date: '25 gen 2025',
        tags: [
          
          { id: '1', name: 'Share', color: 'default' },
          { id: '2', name: 'Resend', color: 'default' },
          
        ],
        image: '/images/template-engine.png',
        highlights: [
          'Rilasciata funzione di condivisione di un budget',
        ],
        isNew: false
      },
      {
        id: '4',
        version: 'v0.1.2',
        title: 'prima versione del blocco di calcolo del budget.',
        description: 'Abbiamo rilasciato il blocco di calcolo del budget per progetti a evento: è possibile oggi: 1) definire una sezione; 2) definire le risorse per il progetto; 3) definire le attività per sezione; 4) impostare un margine commerciale fisso o percentuale; 5) impostare uno sconto e vedere le metriche calcolate in automatico.',
        date: '12 gen 2025',
        tags: [
          
          { id: '1', name: 'budget computer', color: 'default' },
          
        ],
        image: '/images/template-engine.png',
        highlights: [
          'Rilasciato blocco di calcolo del budget',
        ],
        isNew: false
      },
      {
        id: '3',
        version: 'v0.1.1',
        title: 'Editor a blocchi impostato',
        description: 'Abbiamo rilasciato la prima versione dell\'editor a blocchi. Ad oggi si possono inserire Paragrafi, link, Header H1 e H2. prossimo passo: integrare il calcolatore del budget per progetti.',
        date: '8 gen 2025',
        tags: [
          
          { id: '1', name: 'dnd', color: 'default' },
          
        ],
        image: '/images/template-engine.png',
        highlights: [
          'Rilasciato editor a blocchi con p, H1 e H2 e parsing dei link',
        ],
        isNew: false
      },
    {
        id: '2',
        version: 'v0.1.0',
        title: 'Auth e budget personali',
        description: 'Abbiamo integrato login, registrazione e flussi di autenticazione',
        fullDescription: 'Uno dei principi fondamentali di Budgez è la riservatezza dei dati. Abbiamo scelto NextJS e Supabase come stack per prioritizzare performance, sicurezza, versatilità. Abbiamo compiuto il primo passo: blindare "chi può vedere e interagire con quali dati". Prossimo passo, lavoriamo sulla rapidità di creazione di un budget.',
        date: '6 gen 2025',
        tags: [
          { id: '1', name: 'Auth', color: 'default' },
          { id: '2', name: 'Login', color: 'default' },
        ],
        highlights: [
          'pubblicata login page e flussi di auth',
        ]
      },
    {
    id: '1',
    version: 'v0.0.1',
    title: 'Siamo LIVE su budgez.xyz!',
    description: 'CI SIAMO! Budgez è live. Obiettivo: evitare ore e ore passate a fare preventivi invece di fatturare e risolvere problemi ai clienti.',
    fullDescription: 'Partiamo con una filosofia chiara in mente: vogliamo misurare perché solo ciò che è misurabile è migliorabile. Quando qualcuno si ritrova a quotare una lavorazione a step, progettuale, è sempre troppo complesso e dispendioso immaginare tutto il percorso. Quindi? quindi si rinuncia: applicando buffer di fee esorbitanti (che di solito portano a perdere la commessa) oppure quotando a sentimento [chi lo dice bene dice "quotiamo in base all\'esperianza del manager]. Obiettivo di Budgez: rendere snello, flessibile e rapido il processo di quotazione.',
    date: '3 gen 2025',
    tags: [
      
      { id: '2', name: 'NextJS', color: 'default' },
      { id: '3', name: 'Supabase', color: 'default' },
    ],
    image: '/images/template-engine.png',
    highlights: [
      'Siamo Live',
      'Obiettivo: misurare per migliorare',
    ],
    isNew: false
  }
];

// Componente principale
const SoftwareUpdates: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [expandedMeasurements, setExpandedMeasurements] = useState<Record<string, number>>({});
  const measurementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Funzione per espandere/collassare un item
  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Effetto per misurare l'altezza del contenuto espanso
  useEffect(() => {
    const newMeasurements: Record<string, number> = {};
    
    Object.keys(measurementRefs.current).forEach(id => {
      const el = measurementRefs.current[id];
      if (el) {
        newMeasurements[id] = el.scrollHeight;
      }
    });
    
    setExpandedMeasurements(newMeasurements);
  }, [UPDATES_DATA]);

  // Funzione per caricare più aggiornamenti
  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, UPDATES_DATA.length));
  };

  // Funzione per verificare se ci sono altri aggiornamenti da caricare
  const hasMoreUpdates = visibleCount < UPDATES_DATA.length;

  return (
    <section className="py-16 bg-gray-900 text-white overflow-hidden relative">
      {/* Titolo della sezione con animazione */}
      <div className="container mx-auto px-4 mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text bg-gradient-to-r text-gray-200">
            Evoluzioni.
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Scopri le novità che rendono Budgez migliore ogni giorno.
          </p>
        </motion.div>
      </div>

      {/* Lista aggiornamenti */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {UPDATES_DATA.slice(0, visibleCount).map((update, index) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl overflow-hidden"
            >
              <div 
                className={`bg-gray-800 border border-gray-700 rounded-xl transition-all duration-300 ${
                  expandedItems[update.id] ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : 'hover:border-gray-600'
                }`}
              >
                {/* Header dell'update */}
                <div 
                  className="p-6 cursor-pointer flex items-start justify-between"
                  onClick={() => toggleItem(update.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {/* Badge della versione */}
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 mr-2">
                        {update.version}
                      </div>
                      
                      {/* Data di pubblicazione */}
                      <div className="inline-flex items-center text-xs text-gray-400 ml-2">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        {update.date}
                      </div>
                      
                      {/* Badge "New" se è un aggiornamento recente */}
                      {update.isNew && (
                        <motion.span
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-300"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          New
                        </motion.span>
                      )}
                    </div>
                    
                    {/* Titolo dell'aggiornamento */}
                    <h3 className="text-xl font-bold mb-2 text-white flex items-center">
                      {update.title}
                    </h3>
                    
                    {/* Tag relativi all'aggiornamento */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {update.tags.map(tag => (
                        <Badge key={tag.id} variant={tag.color} className="flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Descrizione breve */}
                    <p className="text-gray-300">
                      {update.description}
                    </p>
                  </div>
                  
                  {/* Toggle expand/collapse */}
                  <div className="ml-4 flex-shrink-0">
                    <div className={`p-2 rounded-full bg-gray-700 transition-all duration-300 ${
                      expandedItems[update.id] ? 'bg-blue-600' : 'bg-gray-700'
                    }`}>
                      {expandedItems[update.id] ? (
                        <ChevronUp className="h-5 w-5 text-white" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Contenuto espandibile */}
                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{ 
                    height: expandedItems[update.id] 
                      ? expandedMeasurements[update.id] || 'auto' 
                      : '0px' 
                  }}
                >
                  <div
                    // Corretto l'errore del ref qui
                    ref={(el) => {
                      measurementRefs.current[update.id] = el;
                      return undefined;
                    }}
                    className="p-6 pt-0 border-t border-gray-700"
                  >
                    {/* Descrizione completa */}
                    <p className="text-gray-300 mb-6">
                      {update.fullDescription}
                    </p>
                    
                    {/* Immagine (se presente) */}
                    {update.image && (
                      <div className="relative h-64 mb-6 overflow-hidden rounded-lg">
                        <Image
                          src={update.image}
                          alt={update.title}
                          fill
                          className="object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    )}
                    
                    {/* Highlights dell'aggiornamento */}
                    {update.highlights && update.highlights.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-lg font-semibold mb-3 text-white">Highlights</h4>
                        <ul className="space-y-2">
                          {update.highlights.map((highlight, i) => (
                            <motion.li 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1, duration: 0.3 }}
                              className="flex items-start"
                            >
                              <div className="flex-shrink-0 mr-2 mt-1">
                                <Star className="h-4 w-4 text-blue-400" />
                              </div>
                              <span className="text-gray-300">{highlight}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Pulsante "Carica altri" */}
          {hasMoreUpdates && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mt-10"
            >
              <button
                onClick={loadMore}
                className="group relative px-6 py-3 overflow-hidden rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all duration-300"
              >
                <div className="absolute inset-0 w-3 bg-gradient-to-r from-gray-600 to-gray-800 transition-all duration-700 ease-in-out group-hover:w-full opacity-50"></div>
                <span className="relative flex items-center justify-center font-medium">
                  Carica altri aggiornamenti
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SoftwareUpdates;