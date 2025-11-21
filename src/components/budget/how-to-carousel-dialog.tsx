'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileText, Settings, Users, Share2, X } from 'lucide-react';

interface HowToCarouselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const slides = [
  {
    title: '1. Scegli un template',
    description: 'Inizia selezionando un template predefinito per il tuo settore oppure compila manualmente da zero. I template ti fanno risparmiare tempo fornendo una struttura già pronta con risorse e attività tipiche del tuo settore.',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: '2. Definisci Impostazioni, Risorse, Attività, Sconti',
    description: 'Configura le impostazioni generali (nome, valuta, IVA), aggiungi le risorse umane o materiali con i rispettivi costi, crea le attività del progetto assegnando le risorse necessarie, e applica eventuali sconti specifici per attività o generali.',
    icon: Settings,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: '3. Compila Mittente e Destinatario',
    description: 'Inserisci i dati della tua azienda (mittente) e del cliente (destinatario) nella sezione di configurazione PDF. Aggiungi informazioni aziendali, condizioni contrattuali, termini di pagamento e firma per rendere il preventivo completo e professionale.',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: '4. Crea Pagina Interattiva e Condividi',
    description: 'Una volta completato il preventivo, puoi esportarlo in PDF, copiare la configurazione in JSON per riutilizzarla, o creare una pagina interattiva da condividere con il cliente. La pagina interattiva permette al cliente di visualizzare tutti i dettagli in modo dinamico.',
    icon: Share2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export default function HowToCarouselDialog({ open, onOpenChange }: HowToCarouselDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleClose = () => {
    setCurrentSlide(0);
    onOpenChange(false);
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0">
        <VisuallyHidden>
          <DialogTitle>Guida: Come creare un preventivo</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none z-50"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Slide content with animation */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => {
              const SlideIcon = slide.icon;
              return (
                <div
                  key={index}
                  className="w-full flex-shrink-0 p-8"
                  style={{ minWidth: '100%' }}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`${slide.bgColor} p-4 rounded-full mb-6`}>
                      <SlideIcon className={`h-12 w-12 ${slide.color}`} />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {slide.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 text-base leading-relaxed max-w-xl">
                      {slide.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-6">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="h-9"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Indietro
          </Button>

          {/* Dots indicator */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-gray-900'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Vai alla slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Next button */}
          {currentSlide < slides.length - 1 ? (
            <Button
              variant="default"
              size="sm"
              onClick={nextSlide}
              className="h-9"
            >
              Avanti
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleClose}
              className="h-9"
            >
              Inizia
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

