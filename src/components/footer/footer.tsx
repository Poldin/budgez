import React, { useState } from 'react';
import { Instagram, Twitter, Linkedin, Facebook, Youtube, Mail, Coffee, Briefcase, Share2, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { translations, type Language } from '@/lib/translations';

interface FooterProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

const Footer = ({ language, onLanguageChange }: FooterProps) => {
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const t = translations[language];

  const copyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
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
                <button 
                  data-support-dialog
                  onClick={() => setSupportDialogOpen(true)}
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

      {/* Support Dialog */}
      <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
        <DialogContent className="min-w-[60vw] h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{t.supportDialogTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Section 1: Report Bugs */}
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t.supportBugTitle}</h3>
                  <p className="text-gray-600 mb-4">
                    {t.supportBugDesc}
                  </p>
                  <Button 
                    onClick={() => window.open('mailto:scrivici@techero.xyz?subject=Bug/Miglioramento Budgez', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {t.supportEmailButton}
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 2: Buy Coffee */}
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-amber-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Coffee className="h-8 w-8 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t.supportCoffeeTitle}</h3>
                  <p className="text-gray-600 mb-4">
                    {t.supportCoffeeDesc}
                  </p>
                  <Button 
                    onClick={() => window.open('https://www.paypal.com/pool/9jx1uzoDgg?sr=wccr', '_blank')}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    {t.supportCoffeeButton}
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 3: Business Opportunities */}
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-green-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Briefcase className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t.supportBusinessTitle}</h3>
                  <p className="text-gray-600 mb-4">
                    {t.supportBusinessDesc}
                  </p>
                  <Button 
                    onClick={() => window.open('mailto:scrivici@techero.xyz?subject=Opportunità Business', '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    {t.supportEmailButton}
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 4: Share Project */}
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-purple-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Share2 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t.supportShareTitle}</h3>
                  <p className="text-gray-600 mb-4">
                    {t.supportShareDesc}
                  </p>
                  <Button 
                    onClick={copyLink}
                    className={linkCopied ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-600 hover:bg-purple-700"}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t.supportShareCopied}
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        {t.supportShareButton}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;