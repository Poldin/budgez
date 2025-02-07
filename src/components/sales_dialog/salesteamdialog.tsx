'use client'

import React from 'react';
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface SalesTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  phoneNumber: string;
  companySize: string;
  companyName: string;
  details?: string;
  marketingConsent: boolean;
}

export default function SalesTeamDialog({ open, onOpenChange }: SalesTeamDialogProps) {
  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    workEmail: '',
    jobTitle: '',
    phoneNumber: '',
    companySize: '',
    companyName: '',
    details: '',
    marketingConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      companySize: value
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      marketingConsent: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('team_sales_request')
        .insert([
          { body: formData }
        ]);

      if (error) throw error;

      toast.success('Grazie per averci contattato! Ti risponderemo presto.');
      
      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        workEmail: '',
        jobTitle: '',
        phoneNumber: '',
        companySize: '',
        companyName: '',
        details: '',
        marketingConsent: false,
      });

      // Close dialog
      onOpenChange(false);

    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Si è verificato un errore. Per favore riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:min-w-[900px] max-h-screen overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Colonna sinistra - Testo */}
          <div className="flex flex-col justify-start p-2">
            <DialogHeader>
              <DialogTitle className="text-4xl font-bold mb-4">
                Contatta il nostro team commerciale
              </DialogTitle>
              <div className="space-y-2 text-base text-gray-600">
                <div>
                  Ricevi supporto sui prezzi e i piani, pianifica una demo, esplora i casi d&apos;uso per il tuo team e molto altro.
                </div>
                <div>
                  Per supporto tecnico o sul prodotto, inviaci una mail a{' '}
                  <a href="mailto:support@budgez.xyz" className="text-blue-600 hover:underline">
                    support@budgez.xyz
                  </a>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Colonna destra - Form */}
          <div className="flex flex-col overflow-y-auto p-2">
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input 
                  id="firstName" 
                  className="w-full"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Cognome *</Label>
                <Input 
                  id="lastName" 
                  className="w-full"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workEmail">Email aziendale *</Label>
                <Input 
                  id="workEmail" 
                  type="email"
                  className="w-full"
                  value={formData.workEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jobTitle">Ruolo *</Label>
                <Input 
                  id="jobTitle" 
                  className="w-full"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Numero di telefono *</Label>
                <Input 
                  id="phoneNumber" 
                  type="tel"
                  className="w-full"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companySize">Dimensione azienda *</Label>
                <Select onValueChange={handleSelectChange} value={formData.companySize} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 dipendenti</SelectItem>
                    <SelectItem value="11-50">11-50 dipendenti</SelectItem>
                    <SelectItem value="51-200">51-200 dipendenti</SelectItem>
                    <SelectItem value="201-500">201-500 dipendenti</SelectItem>
                    <SelectItem value="501+">501+ dipendenti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="companyName">Nome azienda *</Label>
                <Input 
                  id="companyName" 
                  className="w-full"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="details">Fornisci più dettagli (opzionale)</Label>
                <Textarea 
                  id="details" 
                  placeholder="Come vorresti utilizzare Budgez?"
                  className="h-32"
                  value={formData.details}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-span-2 flex items-start space-x-2">
                <Checkbox 
                  id="marketing" 
                  checked={formData.marketingConsent}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="marketing" className="text-sm">
                  Acconsento a ricevere comunicazioni di marketing da Budgez (opzionale)
                </Label>
              </div>

              <div className="col-span-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Invio in corso...' : 'Richiedi una demo'}
                </Button>

                <div className="text-xs text-gray-500 mt-4">
                  Puoi annullare l&apos;iscrizione alle comunicazioni di marketing in qualsiasi momento. 
                  Il sito web e le comunicazioni di Budgez sono soggetti alla nostra Privacy Policy.
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}