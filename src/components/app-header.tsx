'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, Languages, User, LogOut } from 'lucide-react';
import type { Language } from '@/lib/translations';

interface AppHeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  translations: {
    howItWorks: string;
    requestQuote?: string;
    createBudget?: string;
    login?: string;
    profile?: string;
    logout?: string;
  };
  user?: any;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

const AppHeader = ({ language, onLanguageChange, translations, user, onLoginClick, onLogout }: AppHeaderProps) => {
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

            {/* Login/Profile button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    className="h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {translations.profile || 'Profilo'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={async () => {
                      if (onLogout) {
                        await onLogout();
                      }
                    }} 
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {translations.logout || 'Esci'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              onLoginClick && (
                <Button 
                  variant="ghost"
                  onClick={onLoginClick}
                  className="h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  {translations.login || 'Accedi'}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

