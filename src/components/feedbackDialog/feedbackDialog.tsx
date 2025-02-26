'use client'

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FeedbackDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

type FeedbackType = 'malfunzionamento' | 'bug' | 'richiesta di modifica' | 'idea!' | 'integrazione';

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ 
  open, 
  onOpenChange,
  triggerButton 
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType | ''>('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType) {
      toast.error('Seleziona una tipologia di feedback');
      return;
    }

    if (!feedbackText.trim()) {
      toast.error('Inserisci un messaggio');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ottieni l'utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepara il body come jsonb con tipo e messaggio
      const bodyContent = {
        type: feedbackType,
        message: feedbackText
      };
      
      // Inserisci il feedback nel database secondo la struttura della tabella
      const { error } = await supabase
        .from('feedback')
        .insert([
          { 
            body: bodyContent,
            user_id: user?.id
          }
        ]);

      if (error) throw error;
      
      // Imposta lo stato a submitted (mostrerà il messaggio di ringraziamento)
      setIsSubmitted(true);
      
      // Dopo 3 secondi, chiudi il dialog e resetta lo stato
      setTimeout(() => {
        if (onOpenChange) {
          onOpenChange(false);
        }
        
        // Dopo che il dialog è chiuso, resetta lo stato per il prossimo utilizzo
        setTimeout(() => {
          setFeedbackType('');
          setFeedbackText('');
          setIsSubmitted(false);
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('Errore durante l\'invio del feedback:', error);
      toast.error('Si è verificato un errore durante l\'invio. Riprova più tardi.');
      setIsSubmitting(false);
    }
  };

  // Contenuto del dialog
  const dialogContent = (
    <DialogContent className="max-h-screen overflow-y-auto min-w-[60vw]">
      {!isSubmitted ? (
        <>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Invia feedback o segnalazioni</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="feedback-type" className="text-sm font-medium">
                Tipologia
              </label>
              <Select
                value={feedbackType}
                onValueChange={(value) => setFeedbackType(value as FeedbackType)}
              >
                <SelectTrigger id="feedback-type" className="w-fit">
                  <SelectValue placeholder="Seleziona una tipologia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="malfunzionamento">Malfunzionamento</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="richiesta di modifica">Richiesta di modifica</SelectItem>
                  <SelectItem value="idea!">Idea!</SelectItem>
                  <SelectItem value="integrazione">Integrazione</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="feedback-message" className="text-sm font-medium">
                Descrizione
              </label>
              <Textarea
                id="feedback-message"
                placeholder="Descrivi dettagliatamente il tuo feedback..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[150px] resize-y"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Invio in corso...' : 'Invia feedback'}
            </Button>
          </DialogFooter>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-green-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Grazie!</h2>
          <p className="text-gray-600 mb-1">
            Ogni feedback è davvero prezioso per noi.
          </p>
          <p className="text-gray-600">
            Se vuoi esporci meglio le tue idee o problematiche scrivici a<br/>
            <a href="mailto:support@budgez.xyz" className="text-blue-500 hover:underline">
              support@budgez.xyz
            </a>
          </p>
        </div>
      )}
    </DialogContent>
  );

  // Se viene fornito un trigger button personalizzato e nessun controllo aperto/chiuso
  if (triggerButton && !onOpenChange) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  // Se è controllato dall'esterno (open e onOpenChange forniti)
  if (onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  // Fallback con trigger button predefinito
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Feedback</span>
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
};

export default FeedbackDialog;