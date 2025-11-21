'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, Settings, User, Share2, Sparkles, Play, Pause, CheckCircle2 } from 'lucide-react';

interface HowToCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const slides = [
  {
    type: 'title' as const,
    title: "1. Scegli un template",
    shortInfo: "Inizia rapidamente con un template predefinito o crea da zero",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
  },
  {
    type: 'steps' as const,
    title: "Come scegliere il template",
    steps: [
      "Clicca su 'Nuovo Preventivo' dalla dashboard",
      "Sfoglia i template disponibili nella libreria",
      "Seleziona il template più adatto al tuo progetto",
      "Oppure scegli 'Preventivo vuoto' per iniziare da zero"
    ],
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
  },
  {
    type: 'title' as const,
    title: "2. Configura il preventivo",
    shortInfo: "Definisci impostazioni, risorse, attività e sconti",
    icon: Settings,
    color: "from-purple-500 to-pink-500",
  },
  {
    type: 'steps' as const,
    title: "Cosa configurare",
    steps: [
      "Impostazioni: scegli valuta, lingua e IVA",
      "Risorse: aggiungi persone, strumenti e materiali",
      "Attività: definisci le fasi del progetto con ore e costi",
      "Sconti: applica eventuali riduzioni sul totale"
    ],
    icon: Settings,
    color: "from-purple-500 to-pink-500",
  },
  {
    type: 'title' as const,
    title: "3. Inserisci i dati",
    shortInfo: "Compila i dati di mittente e destinatario",
    icon: User,
    color: "from-orange-500 to-red-500",
  },
  {
    type: 'steps' as const,
    title: "Dati da inserire",
    steps: [
      "Mittente: nome azienda, indirizzo, P.IVA, contatti",
      "Destinatario: dati del cliente e riferimenti",
      "Informazioni progetto: titolo, descrizione, validità",
      "Note aggiuntive: termini di pagamento e condizioni"
    ],
    icon: User,
    color: "from-orange-500 to-red-500",
  },
  {
    type: 'title' as const,
    title: "4. Condividi il preventivo",
    shortInfo: "Genera una pagina interattiva e inviala al cliente",
    icon: Share2,
    color: "from-green-500 to-emerald-500",
  },
  {
    type: 'steps' as const,
    title: "Come condividere",
    steps: [
      "Clicca su 'Genera Link' per creare la pagina interattiva",
      "Copia il link generato da condividere",
      "Oppure esporta il preventivo in PDF",
      "Invia al cliente via email o messaggio"
    ],
    icon: Share2,
    color: "from-green-500 to-emerald-500",
  },
];

export default function HowToCreateDialog({ open, onOpenChange }: HowToCreateDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const AUTO_PLAY_INTERVAL = 4000; // 4 secondi per slide

  useEffect(() => {
    if (!open) {
      setCurrentSlide(0);
      setIsPlaying(true);
      setProgress(0);
      return;
    }

    if (!isPlaying) {
      setProgress(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (AUTO_PLAY_INTERVAL / 50));
      });
    }, 50);

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      setProgress(0);
    }, AUTO_PLAY_INTERVAL);

    return () => {
      clearInterval(slideInterval);
      clearInterval(progressInterval);
    };
  }, [isPlaying, open]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setProgress(0);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:p-0 max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden border-0 h-[95vh] w-[95vw]">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col max-h-[95vh] max-w-[95vw]">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              Come creare un preventivo
            </DialogTitle>
          </DialogHeader>

          <div className="relative px-4 sm:px-6 pb-4 sm:pb-6 flex-1 flex flex-col max-h-[95vh] max-w-[95vw] min-h-0">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-200 rounded-full mb-3 overflow-hidden flex-shrink-0">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Slide Container */}
            <div className="relative overflow-hidden rounded-xl shadow-xl flex-1 flex flex-col min-h-0">
              <div className="w-full h-full overflow-hidden">
                <div
                  className="flex h-full transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {slides.map((slide, index) => {
                    const Icon = slide.icon;
                    const isTitleSlide = slide.type === 'title';
                    const isActive = currentSlide === index;
                    
                    return (
                      <div
                        key={index}
                        className={`w-full flex-shrink-0 px-4 sm:px-8 py-6 sm:py-8 flex flex-col items-center justify-center text-center bg-gradient-to-br ${slide.color} overflow-y-auto`}
                      >
                        <div className={`mb-4 sm:mb-6 transition-all duration-700 ${
                          isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8'
                        }`}>
                          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                            <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                          </div>
                        </div>
                        
                        <h3 className={`font-bold text-white mb-3 sm:mb-4 transition-all duration-700 delay-100 ${
                          isTitleSlide ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                        } ${
                          isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}>
                          {slide.title}
                        </h3>
                        
                        {isTitleSlide ? (
                          <p className={`text-base sm:text-lg text-white/90 max-w-xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
                            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                          }`}>
                            {slide.shortInfo}
                          </p>
                        ) : (
                          <div className={`max-w-xl mx-auto space-y-2.5 sm:space-y-3 transition-all duration-700 delay-200 ${
                            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                          }`}>
                            {slide.steps?.map((step, stepIndex) => (
                              <div 
                                key={stepIndex}
                                className={`flex items-start gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 text-left transition-all duration-500 ${
                                  isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                                }`}
                                style={{ transitionDelay: `${300 + stepIndex * 100}ms` }}
                              >
                                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0 mt-0.5" />
                                <p className="text-white/95 text-sm sm:text-base leading-relaxed">
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-4 sm:mt-5 flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110 bg-white"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <div className="flex items-center gap-3 sm:gap-4">
                {/* Slide Indicators */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {slides.map((_, index) => {
                    if (index % 2 !== 0) return null;
                    const isActive = currentSlide === index || currentSlide === index + 1;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? 'w-8 sm:w-10 bg-gradient-to-r from-blue-500 to-purple-500 shadow-md'
                            : 'w-2 sm:w-2.5 bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Vai alla slide ${Math.floor(index / 2) + 1}`}
                      />
                    );
                  })}
                </div>

                {/* Play/Pause Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlayPause}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110 bg-white"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
                  )}
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110 bg-white"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Slide Counter */}
            <div className="text-center mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-gray-600 flex-shrink-0">
              Step {Math.floor(currentSlide / 2) + 1} di {slides.length / 2}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

