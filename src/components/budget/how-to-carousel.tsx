'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Copy, Globe, Check, Bot, Sparkles, Code, FileText, Link2, ExternalLink, Mail, Users, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Demo UI Components
function AICreationDemo({ isActive }: { isActive: boolean }) {
  const [prompt, setPrompt] = useState('');
  const [promptParts, setPromptParts] = useState<{ text: string; badge?: string }>({ text: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState({
    name: '',
    resources: [] as string[],
    activities: [] as string[],
  });

  useEffect(() => {
    if (!isActive) {
      setPrompt('');
      setPromptParts({ text: '' });
      setIsProcessing(false);
      setGeneratedContent({ name: '', resources: [], activities: [] });
      return;
    }

    const timers = [
      // Mostra il prompt che viene digitato
      setTimeout(() => {
        setPrompt('il cliente vuole un sito web in Wordpress moderno');
        setPromptParts({ text: 'il cliente vuole un sito web in Wordpress moderno' });
      }, 500),
      setTimeout(() => {
        setPrompt('il cliente vuole un sito web in Wordpress moderno: fai un preventivo');
        setPromptParts({ text: 'il cliente vuole un sito web in Wordpress moderno: fai un preventivo' });
      }, 1000),
      setTimeout(() => {
        setPrompt('il cliente vuole un sito web in Wordpress moderno: fai un preventivo prendendo a modello il preventivo @landing page WP old');
        setPromptParts({ 
          text: 'il cliente vuole un sito web in Wordpress moderno: fai un preventivo prendendo a modello il preventivo ',
          badge: 'landing page WP standard'
        });
      }, 1500),
      // Mostra che l'AI sta processando
      setTimeout(() => {
        setIsProcessing(true);
      }, 2200),
      // Genera il contenuto progressivamente
      setTimeout(() => {
        setIsProcessing(false);
        setGeneratedContent(prev => ({ ...prev, name: 'Preventivo Sito WordPress' }));
      }, 3000),
      setTimeout(() => {
        setGeneratedContent(prev => ({ ...prev, resources: ['Sviluppatore WordPress'] }));
      }, 3600),
      setTimeout(() => {
        setGeneratedContent(prev => ({ ...prev, resources: ['Sviluppatore WordPress', 'Designer UX/UI'] }));
      }, 4200),
      setTimeout(() => {
        setGeneratedContent(prev => ({ ...prev, activities: ['Sviluppo Template'] }));
      }, 4800),
      setTimeout(() => {
        setGeneratedContent(prev => ({ ...prev, activities: ['Sviluppo Template', 'Configurazione Plugin'] }));
      }, 5400),
      setTimeout(() => {
        setGeneratedContent(prev => ({ ...prev, activities: ['Sviluppo Template', 'Configurazione Plugin', 'Ottimizzazione SEO'] }));
      }, 6000),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [isActive]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Input prompt */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-4 w-4 text-purple-600" />
          <div className="h-2 bg-gray-300 rounded w-32"></div>
        </div>
        <div className="relative">
          <div className={`h-20 bg-gray-100 rounded-lg border-2 transition-all duration-300 ${
            prompt ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
          }`}>
            {prompt && (
              <div className="h-full flex items-start p-3 text-sm text-gray-700 animate-in fade-in slide-in-from-left-2 flex-wrap gap-1">
                {promptParts.text}
                {promptParts.badge && (
                  <Badge className="inline-flex items-center h-5 text-xs bg-blue-500 text-white border-blue-600 hover:bg-blue-600">
                    @{promptParts.badge}
                  </Badge>
                )}
                {!isProcessing && prompt && <span className="animate-pulse">|</span>}
              </div>
            )}
          </div>
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-purple-50/80 rounded-lg animate-in fade-in">
              <div className="flex items-center gap-2 text-purple-600">
                <Sparkles className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">L'AI sta creando il preventivo...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated content */}
      {(generatedContent.name || generatedContent.resources.length > 0 || generatedContent.activities.length > 0) && (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          {generatedContent.name && (
            <div className="space-y-1">
              <div className="h-2 bg-gray-300 rounded w-20"></div>
              <div className="h-8 bg-green-50 border-2 border-green-400 rounded flex items-center px-3 text-sm text-gray-700 animate-in fade-in slide-in-from-left-2">
                {generatedContent.name}
              </div>
            </div>
          )}
          
          {generatedContent.resources.length > 0 && (
            <div className="space-y-1">
              <div className="h-2 bg-gray-300 rounded w-24"></div>
              <div className="flex flex-wrap gap-2">
                {generatedContent.resources.map((resource, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {resource}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {generatedContent.activities.length > 0 && (
            <div className="space-y-1">
              <div className="h-2 bg-gray-300 rounded w-28"></div>
              <div className="flex flex-wrap gap-2">
                {generatedContent.activities.map((activity, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateSelectionDemo({ isActive }: { isActive: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const templates = [
    { name: 'Sviluppo Web', tags: ['IT', 'Web'], bgColor: 'bg-blue-50' },
    { name: 'Design Grafico', tags: ['Design', 'Creativo'], bgColor: 'bg-purple-50' },
    { name: 'Consulenza', tags: ['Business', 'Servizi'], bgColor: 'bg-green-50' },
    { name: 'Marketing', tags: ['Digital', 'Social'], bgColor: 'bg-orange-50' },
    { name: 'E-commerce', tags: ['Online', 'Shop'], bgColor: 'bg-pink-50' },
    { name: 'Mobile App', tags: ['App', 'iOS/Android'], bgColor: 'bg-indigo-50' },
  ];

  useEffect(() => {
    if (!isActive) {
      setSelectedIndex(-1);
      return;
    }
    
    const timer = setTimeout(() => {
      setSelectedIndex(0);
    }, 500);
    
    const timer2 = setTimeout(() => {
      setSelectedIndex(1);
    }, 2000);
    
    const timer3 = setTimeout(() => {
      setSelectedIndex(2);
    }, 3500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isActive]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Search bar placeholder */}
      <div className="relative">
        <div className="h-10 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center px-4">
          <div className="h-2 bg-gray-300 rounded w-32"></div>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-3 gap-3">
        {templates.map((template, index) => (
          <Card
            key={index}
            className={`p-4 cursor-pointer transition-all duration-300 relative overflow-hidden ${
              selectedIndex === index
                ? 'ring-2 ring-blue-500 shadow-xl scale-105 bg-blue-50'
                : 'hover:shadow-lg border-gray-200'
            }`}
          >
            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${template.bgColor}`}></div>
            
            <div className="relative z-10">
              {/* Name */}
              <div className={`text-sm font-semibold mb-2 transition-colors ${
                selectedIndex === index ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {template.name}
              </div>
              
              {/* Tags */}
              <div className="flex gap-1 flex-wrap">
                {template.tags.map((tag, tagIndex) => (
                  <Badge 
                    key={tagIndex} 
                    variant={selectedIndex === index ? "default" : "outline"} 
                    className="text-[9px] px-1.5 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Selected template preview */}
      {selectedIndex >= 0 && (
        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
            <Check className="h-4 w-4" />
            Template selezionato: {templates[selectedIndex].name}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsFormDemo({ isActive }: { isActive: boolean }) {
  const [fields, setFields] = useState({
    name: '',
    currency: '',
    vat: '',
    resource: '',
  });

  useEffect(() => {
    if (!isActive) {
      setFields({ name: '', currency: '', vat: '', resource: '' });
      return;
    }

    const timers = [
      setTimeout(() => setFields(prev => ({ ...prev, name: 'Preventivo Sito Web' })), 600),
      setTimeout(() => setFields(prev => ({ ...prev, currency: 'EUR' })), 1200),
      setTimeout(() => setFields(prev => ({ ...prev, vat: '22%' })), 1800),
      setTimeout(() => setFields(prev => ({ ...prev, resource: 'Sviluppatore Senior' })), 2400),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [isActive]);

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="space-y-2">
        <div className="h-2 bg-gray-200 rounded w-24"></div>
        <div className={`h-9 bg-gray-100 rounded border-2 transition-all duration-300 ${
          fields.name ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
        }`}>
          {fields.name && (
            <div className="h-full flex items-center px-3 text-sm text-gray-700 animate-in fade-in slide-in-from-left-2">
              {fields.name}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded w-16"></div>
          <div className={`h-9 bg-gray-100 rounded border-2 transition-all duration-300 ${
            fields.currency ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
          }`}>
            {fields.currency && (
              <div className="h-full flex items-center px-3 text-sm text-gray-700 animate-in fade-in">
                {fields.currency}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded w-12"></div>
          <div className={`h-9 bg-gray-100 rounded border-2 transition-all duration-300 ${
            fields.vat ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
          }`}>
            {fields.vat && (
              <div className="h-full flex items-center px-3 text-sm text-gray-700 animate-in fade-in">
                {fields.vat}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-gray-200 rounded w-32"></div>
        <div className={`h-9 bg-gray-100 rounded border-2 transition-all duration-300 ${
          fields.resource ? 'border-green-400 bg-green-50' : 'border-gray-200'
        }`}>
          {fields.resource && (
            <div className="h-full flex items-center px-3 text-sm text-gray-700 animate-in fade-in slide-in-from-left-2">
              {fields.resource}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyFormDemo({ isActive }: { isActive: boolean }) {
  const [senderFields, setSenderFields] = useState({ name: '', email: '' });
  const [recipientFields, setRecipientFields] = useState({ name: '', email: '' });

  useEffect(() => {
    if (!isActive) {
      setSenderFields({ name: '', email: '' });
      setRecipientFields({ name: '', email: '' });
      return;
    }

    const timers = [
      setTimeout(() => setSenderFields({ name: 'La Mia Azienda SRL', email: 'info@miaazienda.it' }), 600),
      setTimeout(() => setRecipientFields({ name: 'Cliente SpA', email: 'contatti@cliente.it' }), 1800),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [isActive]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
          <div className="h-2 bg-gray-300 rounded w-24"></div>
        </div>
        <div className="space-y-2 pl-5">
          <div className={`h-9 bg-gray-100 rounded border-2 transition-all duration-300 ${
            senderFields.name ? 'border-green-400 bg-green-50' : 'border-gray-200'
          }`}>
            {senderFields.name && (
              <div className="h-full flex items-center px-3 text-sm text-gray-700 animate-in fade-in slide-in-from-left-2">
                {senderFields.name}
              </div>
            )}
          </div>
          <div className={`h-9 bg-gray-100 rounded border-2 transition-all duration-300 ${
            senderFields.email ? 'border-green-400 bg-green-50' : 'border-gray-200'
          }`}>
            {senderFields.email && (
              <div className="h-full flex items-center px-3 text-sm text-gray-700 animate-in fade-in slide-in-from-left-2">
                {senderFields.email}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
          <div className="h-2 bg-gray-300 rounded w-28"></div>
        </div>
        <div className="space-y-2 pl-5">
          <div className={`h-9 bg-gray-100 rounded border-2 transition-all duration-300 ${
            recipientFields.name ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
          }`}>
            {recipientFields.name && (
              <div className="h-full flex items-center px-3 text-sm text-gray-700 animate-in fade-in slide-in-from-left-2">
                {recipientFields.name}
              </div>
            )}
          </div>
          <div className={`h-9 bg-gray-100 rounded border-2 transition-all duration-300 ${
            recipientFields.email ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
          }`}>
            {recipientFields.email && (
              <div className="h-full flex items-center px-3 text-sm text-gray-700 animate-in fade-in slide-in-from-left-2">
                {recipientFields.email}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareExportDemo({ isActive }: { isActive: boolean }) {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      setActiveButton(null);
      setCopied(false);
      setShowPreview(null);
      return;
    }

    const timers = [
      setTimeout(() => {
        setActiveButton('pdf');
        setShowPreview('pdf');
      }, 600),
      setTimeout(() => {
        setActiveButton('json');
        setShowPreview('json');
      }, 2000),
      setTimeout(() => {
        setActiveButton('share');
        setShowPreview('share');
        setCopied(true);
      }, 3400),
      setTimeout(() => setCopied(false), 5000),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [isActive]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant={activeButton === 'pdf' ? 'default' : 'outline'}
          size="lg"
          className={`transition-all duration-300 ${
            activeButton === 'pdf' ? 'scale-110 shadow-xl ring-2 ring-blue-500' : ''
          }`}
        >
          <Download className="h-5 w-5 mr-2" />
          Esporta PDF
        </Button>
        <Button
          variant={activeButton === 'json' ? 'default' : 'outline'}
          size="lg"
          className={`transition-all duration-300 ${
            activeButton === 'json' ? 'scale-110 shadow-xl ring-2 ring-purple-500' : ''
          }`}
        >
          <Copy className={`h-5 w-5 mr-2 ${copied ? 'hidden' : ''}`} />
          <Check className={`h-5 w-5 mr-2 ${copied ? '' : 'hidden'}`} />
          Copia JSON
        </Button>
        <Button
          variant={activeButton === 'share' ? 'default' : 'outline'}
          size="lg"
          className={`transition-all duration-300 ${
            activeButton === 'share' ? 'scale-110 shadow-xl ring-2 ring-green-500' : ''
          }`}
        >
          <Globe className="h-5 w-5 mr-2" />
          Condividi
        </Button>
      </div>

      {/* Preview area */}
      {showPreview && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {showPreview === 'pdf' && (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 rounded-lg p-3">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Preventivo.pdf</div>
                  <div className="text-sm text-gray-600 mb-3">Documento pronto per il download</div>
                  <div className="flex gap-2">
                    <div className="h-2 bg-blue-300 rounded w-24"></div>
                    <div className="h-2 bg-blue-300 rounded w-16"></div>
                    <div className="h-2 bg-blue-300 rounded w-20"></div>
                  </div>
                </div>
                <Download className="h-5 w-5 text-blue-600" />
              </div>
            </Card>
          )}

          {showPreview === 'json' && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
              <div className="flex items-start gap-4">
                <div className="bg-purple-500 rounded-lg p-3">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Configurazione copiata</div>
                  <div className="text-sm text-gray-600 mb-3">JSON pronto per essere incollato</div>
                  <div className="bg-white/60 rounded p-2 font-mono text-xs text-gray-700">
                    {`{ "budget": "...", "resources": [...] }`}
                  </div>
                </div>
                <Check className="h-5 w-5 text-purple-600" />
              </div>
            </Card>
          )}

          {showPreview === 'share' && (
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-lg p-3">
                  <Link2 className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Link condiviso</div>
                  <div className="text-sm text-gray-600 mb-3">Pagina interattiva disponibile</div>
                  <div className="bg-white/60 rounded p-2 flex items-center gap-2">
                    <div className="h-2 bg-green-300 rounded flex-1"></div>
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <Globe className="h-5 w-5 text-green-600" />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function CollaborativeCompilationDemo({ isActive }: { isActive: boolean }) {
  const [step, setStep] = useState<'button' | 'saving' | 'shared' | 'collaborator'>('button');
  const [resources, setResources] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setStep('button');
      setResources([]);
      setShowToast(false);
      return;
    }

    const timers = [
      setTimeout(() => setStep('button'), 500),
      setTimeout(() => setStep('saving'), 1500),
      setTimeout(() => setStep('shared'), 2500),
      setTimeout(() => {
        setStep('collaborator');
        setResources(['Fornitore Esterno']);
      }, 3500),
      setTimeout(() => {
        setResources(['Fornitore Esterno', 'Consulente IT']);
      }, 4500),
      setTimeout(() => {
        setShowToast(true);
      }, 5500),
      setTimeout(() => setShowToast(false), 7000),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [isActive]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Header con pulsante */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-gray-400 rounded"></div>
            <div className="h-2 bg-gray-300 rounded w-20"></div>
          </div>
          {step === 'button' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs animate-in fade-in slide-in-from-right-2"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Compilazione collaborativa
            </Button>
          )}
          {step === 'saving' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled
            >
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1.5"></div>
              Salvataggio...
            </Button>
          )}
          {(step === 'shared' || step === 'collaborator') && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs animate-in fade-in"
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Condividi
              </Button>
            </div>
          )}
        </div>

        {/* Resources section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="space-y-2">
            {/* Existing resources */}
            <div className="h-10 bg-gray-50 border border-gray-200 rounded flex items-center px-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="h-2 bg-gray-300 rounded w-24"></div>
                <Badge variant="secondary" className="text-[9px]">€50/h</Badge>
              </div>
            </div>
            
            {/* Collaborator added resources */}
            {resources.map((resource, idx) => (
              <div 
                key={idx}
                className="h-10 bg-blue-50 border-2 border-blue-300 rounded flex items-center px-3 animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-blue-700 font-medium">{resource}</span>
                  <Badge variant="secondary" className="text-[9px] bg-blue-100 text-blue-700">
                    {idx === 0 ? '€80/h' : '€120/h'}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-[8px] border-blue-300 text-blue-600">
                  collaboratore
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shared link preview */}
      {(step === 'shared' || step === 'collaborator') && (
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-lg p-2">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm mb-1">Link di collaborazione attivo</div>
              <div className="text-xs text-gray-600">I collaboratori non vedono i margini</div>
            </div>
            <Check className="h-5 w-5 text-green-600" />
          </div>
        </Card>
      )}

      {/* Success toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 text-sm">
          <Check className="h-4 w-4" />
          Modifiche salvate dal collaboratore!
        </div>
      )}
    </div>
  );
}

function OTPSignatureDemo({ isActive }: { isActive: boolean }) {
  const [step, setStep] = useState<'button' | 'dialog' | 'email' | 'otp' | 'signed'>('button');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!isActive) {
      setStep('button');
      setEmail('');
      setOtp('');
      return;
    }

    const timers = [
      setTimeout(() => setStep('button'), 500),
      setTimeout(() => setStep('dialog'), 1500),
      setTimeout(() => setStep('email'), 2500),
      setTimeout(() => {
        setEmail('cliente@example.com');
        setStep('otp');
      }, 3500),
      setTimeout(() => {
        setOtp('123456');
      }, 4500),
      setTimeout(() => setStep('signed'), 5500),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [isActive]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Header con pulsante */}
      <div className="bg-white border-b border-gray-200 p-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="h-2 bg-gray-300 rounded w-32"></div>
          {step === 'button' && (
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs bg-gray-900 hover:bg-gray-800 text-white animate-in fade-in slide-in-from-right-2"
            >
              Firma con OTP
            </Button>
          )}
          {step === 'signed' && (
            <div className="text-xs text-gray-600 font-medium animate-in fade-in slide-in-from-right-2">
              Firmato con OTP da cliente@example.com il 15/12/2024 alle 14:30
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      {(step === 'dialog' || step === 'email' || step === 'otp') && (
        <Card className="p-6 bg-white border-2 border-gray-200 shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-4">
            {/* Titolo */}
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 rounded w-40"></div>
              <div className="h-3 bg-gray-200 rounded w-64"></div>
            </div>

            {/* Email input */}
            {(step === 'email' || step === 'otp') && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                <div className="h-2 bg-gray-200 rounded w-16"></div>
                <div className="flex gap-2">
                  <div className={`h-9 flex-1 bg-gray-100 rounded border-2 transition-all duration-300 ${
                    email ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  }`}>
                    {email && (
                      <div className="h-full flex items-center px-3 text-sm text-gray-700">
                        {email}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className={`transition-all duration-300 ${
                      email ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'
                    }`}
                  >
                    <Mail className="h-4 w-4 mr-1.5" />
                    Richiedi OTP
                  </Button>
                </div>
              </div>
            )}

            {/* OTP input */}
            {step === 'otp' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  Abbiamo inviato un codice di verifica a {email}
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded w-24"></div>
                  <div className={`h-12 bg-gray-100 rounded border-2 transition-all duration-300 ${
                    otp ? 'border-green-400 bg-green-50' : 'border-gray-200'
                  }`}>
                    {otp && (
                      <div className="h-full flex items-center justify-center text-2xl tracking-widest font-mono text-gray-700">
                        {otp}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Invia nuovo codice
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className={`flex-1 transition-all duration-300 ${
                      otp ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'
                    }`}
                  >
                    Verifica e Firma
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export const slides = [
  {
    title: '0. Crea con AI',
    description: 'Usa ChatGPT, Claude, Gemini o qualsiasi AI per generare il tuo preventivo. Clicca su "Crea con AI", copia il prompt ottimizzato, incollalo nel tuo assistente AI preferito descrivendo il progetto, poi incolla il JSON generato per importare automaticamente risorse, attività, intestazioni e condizioni contrattuali.',
    demo: AICreationDemo,
  },
  {
    title: '1. Scegli un template',
    description: 'Inizia selezionando un template predefinito per il tuo settore oppure compila manualmente da zero. I template ti fanno risparmiare tempo fornendo una struttura già pronta con risorse e attività tipiche del tuo settore.',
    demo: TemplateSelectionDemo,
  },
  {
    title: '2. Definisci Impostazioni, Risorse, Attività, Sconti',
    description: 'Configura le impostazioni generali (nome, valuta, IVA), aggiungi le risorse umane o materiali con i rispettivi costi, crea le attività del progetto assegnando le risorse necessarie, e applica eventuali sconti specifici per attività o generali.',
    demo: SettingsFormDemo,
  },
  {
    title: '3. Compila Mittente e Destinatario',
    description: 'Inserisci i dati della tua azienda (mittente) e del cliente (destinatario) nella sezione di configurazione PDF. Aggiungi informazioni aziendali, condizioni contrattuali, termini di pagamento e firma per rendere il preventivo completo e professionale.',
    demo: CompanyFormDemo,
  },
  {
    title: '4. Crea Pagina Interattiva e Condividi',
    description: 'Una volta completato il preventivo, puoi esportarlo in PDF, copiare la configurazione in JSON per riutilizzarla, o creare una pagina interattiva da condividere con il cliente. La pagina interattiva permette al cliente di visualizzare tutti i dettagli in modo dinamico.',
    demo: ShareExportDemo,
  },
  {
    title: '5. Compilazione Collaborativa',
    description: 'Hai bisogno di aiuto per definire i costi? Usa la funzione "Compilazione collaborativa" per invitare colleghi, partner o fornitori a contribuire. Condividi un link dedicato dove i collaboratori possono aggiungere risorse e attività senza vedere i tuoi margini. Le modifiche vengono salvate in tempo reale.',
    demo: CollaborativeCompilationDemo,
  },
  {
    title: '6. Firma con OTP',
    description: 'Il cliente può firmare il preventivo utilizzando la verifica OTP via email. Basta cliccare sul pulsante "Firma con OTP", inserire la propria email, ricevere il codice di verifica e inserirlo per confermare la firma. Una volta firmato, il preventivo mostrerà la data e l\'ora della firma.',
    demo: OTPSignatureDemo,
  },
];

interface HowToCarouselProps {
  isDialog?: boolean;
  isOpen?: boolean;
  onLastSlideAction?: () => void;
  lastSlideButtonText?: string;
  className?: string;
  contentClassName?: string;
}

export default function HowToCarousel({ 
  isDialog = false, 
  isOpen = true,
  onLastSlideAction,
  lastSlideButtonText = 'Avanti',
  className = '',
  contentClassName = ''
}: HowToCarouselProps = {}) {
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

  return (
    <div className={`w-full ${isDialog ? 'h-full flex flex-col' : 'max-w-5xl mx-auto my-12'} ${className}`}>
      {/* Slide content with animation */}
      <div className={`relative overflow-hidden ${isDialog ? 'flex-1' : ''}`}>
        <div
          className={`flex transition-transform duration-500 ease-in-out ${isDialog ? 'h-full' : ''}`}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => {
            const DemoComponent = slide.demo;
            const isActive = index === currentSlide && isOpen;
            
            return (
              <div
                key={index}
                className={`w-full flex-shrink-0 ${isDialog ? 'p-8 h-full overflow-y-auto' : 'px-4'}`}
                style={{ minWidth: '100%' }}
              >
                <div className={`flex flex-col items-center ${isDialog ? 'h-full justify-center' : ''} ${contentClassName}`}>
                  {/* Title with optional badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 text-center">
                      {slide.title}
                    </h2>
                    {slide.badge && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-xs px-2 py-1">
                        {slide.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-base leading-relaxed max-w-xl mb-8 text-center">
                    {slide.description}
                  </p>

                  {/* Animated Demo UI */}
                  <div className={`w-full flex justify-center ${isDialog ? 'py-6 flex-1 items-center' : 'py-6'}`}>
                    <DemoComponent isActive={isActive} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className={`flex items-center justify-between ${isDialog ? 'px-8 pb-6' : 'px-4 mt-8'}`}>
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
          onLastSlideAction ? (
            <Button
              variant="default"
              size="sm"
              onClick={onLastSlideAction}
              className="h-9"
            >
              {lastSlideButtonText}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              disabled
              className="h-9"
            >
              {lastSlideButtonText}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}

