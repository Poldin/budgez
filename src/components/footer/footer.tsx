import React from 'react';
import { Instagram, Twitter, Linkedin, Facebook, Youtube } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translations, type Language } from '@/lib/translations';

interface FooterProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

const Footer = ({ language, onLanguageChange }: FooterProps) => {
  const t = translations[language];

  const openBuyMeACoffee = () => {
    window.open('https://buymeacoffee.com/poldo', '_blank');
  };

  return (
    <footer className="border-t border-gray-200 bg-white py-6 mt-10 p-4">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Social Links */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-lg font-bold">B) Budgez</span>
            </div>
            <div className="flex space-x-4">
              <span className="text-gray-400 cursor-not-allowed">
                <Instagram className="h-5 w-5" />
              </span>
              <span className="text-gray-400 cursor-not-allowed">
                <Twitter className="h-5 w-5" />
              </span>
              <span className="text-gray-400 cursor-not-allowed">
                <Linkedin className="h-5 w-5" />
              </span>
              <span className="text-gray-400 cursor-not-allowed">
                <Facebook className="h-5 w-5" />
              </span>
              <span className="text-gray-400 cursor-not-allowed">
                <Youtube className="h-5 w-5" />
              </span>
            </div>
          </div>

          {/* Services Links */}
          <div className="col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">{t.footerServices}</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  {t.createBudget}
                </a>
              </li>
              <li>
                <a 
                  href="/requests" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  {t.requestQuote}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">{t.footerResources}</h3>
            <ul className="space-y-3">
              <li>
                <a href="/how-to" className="text-gray-600 hover:text-gray-900 text-sm">{t.footerHowItWorks}</a>
              </li>
              <li>
                <a href="/blog" className="text-gray-600 hover:text-gray-900 text-sm">Blog</a>
              </li>
              <li>
                <button 
                  onClick={openBuyMeACoffee}
                  className="text-gray-600 hover:text-gray-900 text-sm underline-offset-4 hover:underline"
                >
                  {t.footerSupport}
                </button>
              </li>
              <li>
                <a 
                  href="https://discord.gg/as35SNuG" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 text-sm underline-offset-4 hover:underline"
                >
                  {t.footerJoinDiscord}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-4 text-xs">
              <Select value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-gray-400 cursor-not-allowed text-xs">
                {t.footerPrivacy}
              </span>
            </div>
            <div className="text-gray-600 text-xs">
              {t.footerCopyright}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;