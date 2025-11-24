'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import HowToCarousel from '@/components/budget/how-to-carousel';

interface HowToCarouselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HowToCarouselDialog({ open, onOpenChange }: HowToCarouselDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 h-[95vh] flex flex-col">
        <VisuallyHidden>
          <DialogTitle>Guida: Come creare un preventivo</DialogTitle>
        </VisuallyHidden>
        
        <HowToCarousel 
          isDialog={true}
          isOpen={open}
          onLastSlideAction={handleClose}
          lastSlideButtonText="Inizia"
        />
      </DialogContent>
    </Dialog>
  );
}
