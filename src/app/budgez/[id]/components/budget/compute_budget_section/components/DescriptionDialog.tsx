import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlignLeft } from "lucide-react";

export interface DescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  itemName: string;
  onSave: (updatedName: string, updatedDescription: string) => void;
  dialogTitle: string;
}

const DescriptionDialog: React.FC<DescriptionDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  itemName,
  onSave,
  dialogTitle
}) => {
  const [nameValue, setNameValue] = React.useState(title);
  const [descriptionValue, setDescriptionValue] = React.useState(description);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setNameValue(title);
      setDescriptionValue(description);
    }
  }, [isOpen, title, description]);

  const handleSave = () => {
    onSave(nameValue, descriptionValue);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[60%]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlignLeft className="h-5 w-5" />
            {dialogTitle} {itemName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Nome</label>
            <Input
              id="name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Inserisci un nome"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Descrizione</label>
            <Textarea
              id="description"
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Inserisci una descrizione"
              className="min-h-[150px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleSave}>Salva</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DescriptionDialog; 