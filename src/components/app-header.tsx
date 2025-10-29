'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { HelpCircle, Languages } from 'lucide-react';
import type { Language } from '@/lib/translations';

interface AppHeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  translations: {
    howItWorks: string;
    requestQuote?: string;
    createBudget?: string;
  };
  ctaText: string;
  ctaHref: string;
}

const AppHeader = ({ language, onLanguageChange, translations, ctaText, ctaHref }: AppHeaderProps) => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <span 
              className="text-lg font-bold text-gray-700 cursor-pointer" 
              onClick={() => router.push('/')}
            >
              B) Budgez
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Language selector - minimal con bandiera e icona */}
            <Select value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
              <SelectTrigger className="w-fit h-9 border-none shadow-none hover:bg-gray-100 text-gray-600 gap-1">
                <Languages className="h-4 w-4" />
                <span className="text-lg">
                  {language === 'it' && '🇮🇹'}
                  {language === 'en' && '🇬🇧'}
                  {language === 'fr' && '🇫🇷'}
                  {language === 'de' && '🇩🇪'}
                  {language === 'es' && '🇪🇸'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
              </SelectContent>
            </Select>
            
            {/* How it works icon button - opens in new tab */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.open('/how-to', '_blank')}
              title={translations.howItWorks}
              className="h-9 w-9 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* CTA button */}
            <Button 
              onClick={() => router.push(ctaHref)}
              className="bg-gray-900 hover:bg-gray-800 text-white h-9"
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

