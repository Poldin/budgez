import React from 'react';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface InfoDialogProps {
  title: string;
  description: string;
  videoUrl?: string;
}



export const InfoDialog = ({ 
  title, 
  description, 
  videoUrl 
}: InfoDialogProps) => {
  const [open, setOpen] = React.useState(false);
  
  // Extract video ID from YouTube URL
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return '';
  };

  return (
    <>
      <Info 
        className="h-4 w-4 text-gray-500 hover:text-black rounded-lg cursor-pointer" 
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-2">{title}</DialogTitle>
            <DialogDescription className="text-base text-gray-700">
              {description}
            </DialogDescription>
          </DialogHeader>
          {videoUrl && (
            <div className="aspect-video w-full mt-4">
              <iframe
                className="w-full h-full rounded-lg"
                src={getYouTubeEmbedUrl(videoUrl)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper object with predefined content for each section
export const INFO_CONTENT = {
  brief: {
    title: "Come usare il Brief",
    description: "Il brief è uno strumento fondamentale per raccogliere tutte le informazioni sulle lavorazioni: inserisci descrizioni, link e usa i componenti per calcolare il budget necessario. [goditi The Silence finchè non sarà disponibile il nostro tutorial]",
    videoUrl: "https://www.youtube.com/watch?v=8ui9umU0C2g&list=RD8ui9umU0C2g&start_radio=1&ab_channel=manchesterorchVEVO"
  },
  budget: {
    title: "Come usare il Calcolatore",
    description: "Il calcolatore ti permette di stimare i costi del progetto in modo preciso. Puoi aggiungere risorse, attività e gestire i margini commerciali.",
    videoUrl: "https://www.youtube.com/watch?v=8ui9umU0C2g&list=RD8ui9umU0C2g&start_radio=1&ab_channel=manchesterorchVEVO"
  },
  external: {
    title: "Come vendere il tuo Budget",
    description: "Questa sezione ti permette di presentare il tuo preventivo in modo professionale. Personalizza il layout e condividi con i tuoi clienti.",
    videoUrl: "https://www.youtube.com/watch?v=8ui9umU0C2g&list=RD8ui9umU0C2g&start_radio=1&ab_channel=manchesterorchVEVO"
  },
  stats: {
    title: "Analizza le tue Performance",
    description: "Monitora l'andamento dei tuoi preventivi, analizza le conversioni e ottimizza le tue strategie di pricing.",
    videoUrl: "https://www.youtube.com/watch?v=8ui9umU0C2g&list=RD8ui9umU0C2g&start_radio=1&ab_channel=manchesterorchVEVO"
  }
} as const;

export default InfoDialog;