import { BudgetTemplate } from '@/components/templates-sidebar';

export const budgetTemplates: BudgetTemplate[] = [
  {
    id: 'web-dev-basic',
    name: 'Sviluppo Web Base',
    description: 'Template per un progetto web standard con frontend e backend',
    tags: ['Web', 'Sviluppo', 'IT'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Sviluppatore Frontend',
          costType: 'hourly',
          pricePerHour: 50,
        },
        {
          id: '2',
          name: 'Sviluppatore Backend',
          costType: 'hourly',
          pricePerHour: 60,
        },
        {
          id: '3',
          name: 'Designer UI/UX',
          costType: 'hourly',
          pricePerHour: 45,
        },
        {
          id: '4',
          name: 'Hosting Annuale',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Design e Prototipazione',
          description: 'Creazione mockup e design dell\'interfaccia utente',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Sviluppo Frontend',
          description: 'Implementazione interfaccia utente responsive',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 80, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Sviluppo Backend',
          description: 'API, database e logica server',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 100, fixedPrice: 0 },
          ],
        },
        {
          id: '4',
          name: 'Hosting e Deploy',
          description: 'Setup server e deployment applicazione',
          vat: 22,
          resources: [
            { resourceId: '4', hours: 0, fixedPrice: 500 },
            { resourceId: '2', hours: 8, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'marketing-campaign',
    name: 'Campagna Marketing',
    description: 'Template per gestire una campagna marketing completa',
    tags: ['Marketing', 'Social Media', 'Pubblicità'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Social Media Manager',
          costType: 'hourly',
          pricePerHour: 35,
        },
        {
          id: '2',
          name: 'Copywriter',
          costType: 'hourly',
          pricePerHour: 40,
        },
        {
          id: '3',
          name: 'Graphic Designer',
          costType: 'hourly',
          pricePerHour: 45,
        },
        {
          id: '4',
          name: 'Budget Ads Facebook',
          costType: 'fixed',
          pricePerHour: 0,
        },
        {
          id: '5',
          name: 'Budget Ads Google',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Strategia e Pianificazione',
          description: 'Definizione obiettivi e piano editoriale',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 20, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Creazione Contenuti',
          description: 'Testi, grafiche e video per i social',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 30, fixedPrice: 0 },
            { resourceId: '3', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Gestione Social Media',
          description: 'Pubblicazione e community management',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 60, fixedPrice: 0 },
          ],
        },
        {
          id: '4',
          name: 'Advertising',
          description: 'Campagne a pagamento su Facebook e Google',
          vat: 22,
          resources: [
            { resourceId: '4', hours: 0, fixedPrice: 1500 },
            { resourceId: '5', hours: 0, fixedPrice: 2000 },
            { resourceId: '1', hours: 15, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'consulting-project',
    name: 'Progetto Consulenza',
    description: 'Template per servizi di consulenza aziendale',
    tags: ['Consulenza', 'Business', 'Strategia'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Senior Consultant',
          costType: 'hourly',
          pricePerHour: 120,
        },
        {
          id: '2',
          name: 'Business Analyst',
          costType: 'hourly',
          pricePerHour: 80,
        },
        {
          id: '3',
          name: 'Report Dettagliato',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Analisi Situazione Attuale',
          description: 'Assessment completo dell\'azienda',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 30, fixedPrice: 0 },
            { resourceId: '2', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Sviluppo Strategia',
          description: 'Definizione piano strategico e obiettivi',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 50, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Documentazione e Report',
          description: 'Creazione documentazione completa',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 0, fixedPrice: 1500 },
            { resourceId: '2', hours: 20, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'event-organization',
    name: 'Organizzazione Evento',
    description: 'Template per organizzare eventi aziendali o privati',
    tags: ['Eventi', 'Organizzazione', 'Catering'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Event Manager',
          costType: 'hourly',
          pricePerHour: 55,
        },
        {
          id: '2',
          name: 'Location',
          costType: 'fixed',
          pricePerHour: 0,
        },
        {
          id: '3',
          name: 'Catering',
          costType: 'fixed',
          pricePerHour: 0,
        },
        {
          id: '4',
          name: 'Attrezzatura Audio/Video',
          costType: 'fixed',
          pricePerHour: 0,
        },
        {
          id: '5',
          name: 'Fotografo',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Pianificazione e Coordinamento',
          description: 'Organizzazione generale dell\'evento',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Location e Servizi',
          description: 'Affitto location e servizi base',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 0, fixedPrice: 3000 },
            { resourceId: '3', hours: 0, fixedPrice: 2500 },
          ],
        },
        {
          id: '3',
          name: 'Attrezzature e Media',
          description: 'Setup tecnico e documentazione fotografica',
          vat: 22,
          resources: [
            { resourceId: '4', hours: 0, fixedPrice: 800 },
            { resourceId: '5', hours: 0, fixedPrice: 600 },
          ],
        },
      ],
    },
  },
  {
    id: 'mobile-app',
    name: 'App Mobile',
    description: 'Sviluppo di applicazione mobile iOS e Android',
    tags: ['Mobile', 'App', 'IT', 'Sviluppo'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Mobile Developer',
          costType: 'hourly',
          pricePerHour: 65,
        },
        {
          id: '2',
          name: 'UI/UX Designer',
          costType: 'hourly',
          pricePerHour: 50,
        },
        {
          id: '3',
          name: 'Backend Developer',
          costType: 'hourly',
          pricePerHour: 60,
        },
        {
          id: '4',
          name: 'Licenze App Store',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Design UI/UX',
          description: 'Design interfaccia e user experience',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 60, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Sviluppo App Mobile',
          description: 'Sviluppo iOS e Android',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 200, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Backend e API',
          description: 'Server, database e API REST',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 80, fixedPrice: 0 },
          ],
        },
        {
          id: '4',
          name: 'Pubblicazione',
          description: 'Deploy su App Store e Play Store',
          vat: 22,
          resources: [
            { resourceId: '4', hours: 0, fixedPrice: 200 },
            { resourceId: '1', hours: 10, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'ecommerce-setup',
    name: 'E-commerce Completo',
    description: 'Setup completo di un negozio online con Shopify/WooCommerce',
    tags: ['E-commerce', 'Web', 'Vendita Online'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'E-commerce Specialist',
          costType: 'hourly',
          pricePerHour: 55,
        },
        {
          id: '2',
          name: 'Web Developer',
          costType: 'hourly',
          pricePerHour: 50,
        },
        {
          id: '3',
          name: 'Fotografo Prodotti',
          costType: 'hourly',
          pricePerHour: 40,
        },
        {
          id: '4',
          name: 'Licenza Piattaforma',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Setup Piattaforma',
          description: 'Installazione e configurazione e-commerce',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 30, fixedPrice: 0 },
            { resourceId: '4', hours: 0, fixedPrice: 1200 },
          ],
        },
        {
          id: '2',
          name: 'Personalizzazione Design',
          description: 'Template personalizzato e branding',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 50, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Fotografia Prodotti',
          description: 'Shooting e editing foto catalogo',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 40, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'video-production',
    name: 'Produzione Video Aziendale',
    description: 'Video professionale per aziende e brand',
    tags: ['Video', 'Media', 'Produzione'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Videomaker',
          costType: 'hourly',
          pricePerHour: 70,
        },
        {
          id: '2',
          name: 'Video Editor',
          costType: 'hourly',
          pricePerHour: 50,
        },
        {
          id: '3',
          name: 'Motion Designer',
          costType: 'hourly',
          pricePerHour: 55,
        },
        {
          id: '4',
          name: 'Attrezzatura e Location',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Pre-produzione',
          description: 'Sceneggiatura, storyboard e pianificazione',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 15, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Riprese',
          description: 'Shooting video in location',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 16, fixedPrice: 0 },
            { resourceId: '4', hours: 0, fixedPrice: 800 },
          ],
        },
        {
          id: '3',
          name: 'Post-produzione',
          description: 'Montaggio, color grading e effetti',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 30, fixedPrice: 0 },
            { resourceId: '3', hours: 20, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'renovation-project',
    name: 'Ristrutturazione Appartamento',
    description: 'Preventivo completo per lavori di ristrutturazione',
    tags: ['Edilizia', 'Ristrutturazione', 'Casa'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Architetto',
          costType: 'hourly',
          pricePerHour: 80,
        },
        {
          id: '2',
          name: 'Muratore',
          costType: 'hourly',
          pricePerHour: 35,
        },
        {
          id: '3',
          name: 'Elettricista',
          costType: 'hourly',
          pricePerHour: 40,
        },
        {
          id: '4',
          name: 'Idraulico',
          costType: 'hourly',
          pricePerHour: 45,
        },
        {
          id: '5',
          name: 'Materiali Edili',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Progettazione',
          description: 'Progetto architettonico e pratiche',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Lavori Murari',
          description: 'Demolizioni e ricostruzioni',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 120, fixedPrice: 0 },
            { resourceId: '5', hours: 0, fixedPrice: 5000 },
          ],
        },
        {
          id: '3',
          name: 'Impianti',
          description: 'Elettrico e idraulico',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 60, fixedPrice: 0 },
            { resourceId: '4', hours: 50, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'training-course',
    name: 'Corso di Formazione',
    description: 'Progettazione ed erogazione corso professionale',
    tags: ['Formazione', 'Education', 'Corsi'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Docente Senior',
          costType: 'hourly',
          pricePerHour: 90,
        },
        {
          id: '2',
          name: 'Tutor',
          costType: 'hourly',
          pricePerHour: 45,
        },
        {
          id: '3',
          name: 'Instructional Designer',
          costType: 'hourly',
          pricePerHour: 55,
        },
        {
          id: '4',
          name: 'Sala e Materiali',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Progettazione Didattica',
          description: 'Programma, materiali e slide',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Erogazione Corso',
          description: '5 giornate di formazione',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 40, fixedPrice: 0 },
            { resourceId: '2', hours: 40, fixedPrice: 0 },
            { resourceId: '4', hours: 0, fixedPrice: 1500 },
          ],
        },
      ],
    },
  },
  {
    id: 'wedding-photography',
    name: 'Servizio Fotografico Matrimonio',
    description: 'Pacchetto completo fotografia matrimoniale',
    tags: ['Fotografia', 'Eventi', 'Matrimonio'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Fotografo Principale',
          costType: 'hourly',
          pricePerHour: 100,
        },
        {
          id: '2',
          name: 'Secondo Fotografo',
          costType: 'hourly',
          pricePerHour: 60,
        },
        {
          id: '3',
          name: 'Editor Foto',
          costType: 'hourly',
          pricePerHour: 40,
        },
        {
          id: '4',
          name: 'Album Premium',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Servizio Fotografico',
          description: 'Copertura completa della giornata (10h)',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 10, fixedPrice: 0 },
            { resourceId: '2', hours: 10, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Post-produzione',
          description: 'Selezione e editing 300 foto',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 30, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Album e Stampe',
          description: 'Album fotografico premium',
          vat: 22,
          resources: [
            { resourceId: '4', hours: 0, fixedPrice: 800 },
          ],
        },
      ],
    },
  },
  {
    id: 'seo-campaign',
    name: 'Campagna SEO',
    description: 'Ottimizzazione SEO e posizionamento Google',
    tags: ['SEO', 'Marketing', 'Digital'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'SEO Specialist',
          costType: 'hourly',
          pricePerHour: 65,
        },
        {
          id: '2',
          name: 'Content Writer',
          costType: 'hourly',
          pricePerHour: 40,
        },
        {
          id: '3',
          name: 'Link Builder',
          costType: 'hourly',
          pricePerHour: 45,
        },
        {
          id: '4',
          name: 'Tool SEO (Semrush/Ahrefs)',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Audit SEO',
          description: 'Analisi completa del sito',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 20, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Ottimizzazione On-Page',
          description: 'Ottimizzazione pagine e contenuti',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 30, fixedPrice: 0 },
            { resourceId: '2', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Link Building',
          description: 'Acquisizione backlink di qualità',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 50, fixedPrice: 0 },
            { resourceId: '4', hours: 0, fixedPrice: 300 },
          ],
        },
      ],
    },
  },
  {
    id: 'branding-identity',
    name: 'Branding e Identità Aziendale',
    description: 'Creazione brand identity completa',
    tags: ['Branding', 'Design', 'Grafica'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Brand Strategist',
          costType: 'hourly',
          pricePerHour: 85,
        },
        {
          id: '2',
          name: 'Graphic Designer',
          costType: 'hourly',
          pricePerHour: 60,
        },
        {
          id: '3',
          name: 'Copywriter',
          costType: 'hourly',
          pricePerHour: 50,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Strategia di Brand',
          description: 'Definizione valori, mission e positioning',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 30, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Identità Visiva',
          description: 'Logo, palette colori, tipografia',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 60, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Brand Manual',
          description: 'Guideline e tone of voice',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 20, fixedPrice: 0 },
            { resourceId: '3', hours: 25, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'wordpress-plugin',
    name: 'Sviluppo Plugin WordPress',
    description: 'Plugin custom per WordPress',
    tags: ['WordPress', 'Sviluppo', 'Plugin'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'WordPress Developer',
          costType: 'hourly',
          pricePerHour: 60,
        },
        {
          id: '2',
          name: 'QA Tester',
          costType: 'hourly',
          pricePerHour: 40,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Analisi e Progettazione',
          description: 'Studio funzionalità e architettura',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 15, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Sviluppo Plugin',
          description: 'Codice, funzionalità e admin panel',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 80, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Testing e Deploy',
          description: 'Test completi e rilascio',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 20, fixedPrice: 0 },
            { resourceId: '1', hours: 10, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'it-audit',
    name: 'Audit Sicurezza IT',
    description: 'Valutazione sicurezza informatica aziendale',
    tags: ['IT', 'Sicurezza', 'Audit', 'Consulenza'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Security Expert',
          costType: 'hourly',
          pricePerHour: 120,
        },
        {
          id: '2',
          name: 'Penetration Tester',
          costType: 'hourly',
          pricePerHour: 100,
        },
        {
          id: '3',
          name: 'Tool di Sicurezza',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Assessment Iniziale',
          description: 'Analisi infrastruttura e policy',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 25, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Penetration Testing',
          description: 'Test di sicurezza e vulnerabilità',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 40, fixedPrice: 0 },
            { resourceId: '3', hours: 0, fixedPrice: 500 },
          ],
        },
        {
          id: '3',
          name: 'Report e Raccomandazioni',
          description: 'Documentazione completa e piano rimedio',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 20, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'social-media-annual',
    name: 'Gestione Social Media Annuale',
    description: 'Gestione completa social per 12 mesi',
    tags: ['Social Media', 'Marketing', 'Long-term'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Social Media Manager',
          costType: 'hourly',
          pricePerHour: 40,
        },
        {
          id: '2',
          name: 'Graphic Designer',
          costType: 'hourly',
          pricePerHour: 45,
        },
        {
          id: '3',
          name: 'Copywriter',
          costType: 'hourly',
          pricePerHour: 38,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Strategia e Pianificazione',
          description: 'Piano editoriale annuale e strategia',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Creazione Contenuti (12 mesi)',
          description: '4 post/settimana per 12 mesi',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 200, fixedPrice: 0 },
            { resourceId: '3', hours: 150, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Community Management (12 mesi)',
          description: 'Gestione quotidiana e interazioni',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 250, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'logo-design',
    name: 'Design Logo Professionale',
    description: 'Creazione logo e declinazioni',
    tags: ['Design', 'Logo', 'Grafica', 'Branding'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Logo Designer',
          costType: 'hourly',
          pricePerHour: 70,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Ricerca e Concept',
          description: 'Brief, moodboard e sketch iniziali',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 10, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Proposte Logo',
          description: '3 proposte complete',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 20, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Finalizzazione',
          description: 'Revisioni e file finali tutti i formati',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 10, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'elearning-platform',
    name: 'Piattaforma E-learning',
    description: 'Sviluppo LMS personalizzato',
    tags: ['E-learning', 'Sviluppo', 'Education', 'Web'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Full Stack Developer',
          costType: 'hourly',
          pricePerHour: 70,
        },
        {
          id: '2',
          name: 'UI/UX Designer',
          costType: 'hourly',
          pricePerHour: 55,
        },
        {
          id: '3',
          name: 'Instructional Designer',
          costType: 'hourly',
          pricePerHour: 50,
        },
        {
          id: '4',
          name: 'Server e Hosting',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Design e UX',
          description: 'Progettazione interfaccia studente/docente',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 50, fixedPrice: 0 },
            { resourceId: '3', hours: 30, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Sviluppo Piattaforma',
          description: 'Backend, frontend e integrazione LMS',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 250, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Deploy e Setup',
          description: 'Configurazione server e deploy',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 20, fixedPrice: 0 },
            { resourceId: '4', hours: 0, fixedPrice: 1500 },
          ],
        },
      ],
    },
  },
  {
    id: 'podcast-production',
    name: 'Produzione Podcast Serie',
    description: 'Serie podcast completa (10 episodi)',
    tags: ['Podcast', 'Audio', 'Media', 'Produzione'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Producer',
          costType: 'hourly',
          pricePerHour: 60,
        },
        {
          id: '2',
          name: 'Audio Engineer',
          costType: 'hourly',
          pricePerHour: 55,
        },
        {
          id: '3',
          name: 'Editor Audio',
          costType: 'hourly',
          pricePerHour: 45,
        },
        {
          id: '4',
          name: 'Studio Recording',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Pre-produzione',
          description: 'Format, scaletta e ricerca ospiti',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 40, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Registrazioni (10 episodi)',
          description: 'Recording in studio professionale',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 30, fixedPrice: 0 },
            { resourceId: '4', hours: 0, fixedPrice: 2000 },
          ],
        },
        {
          id: '3',
          name: 'Post-produzione (10 episodi)',
          description: 'Editing, mixing e mastering',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 80, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'translation-services',
    name: 'Traduzione Documenti Tecnici',
    description: 'Servizio traduzione professionale multilingua',
    tags: ['Traduzione', 'Linguistica', 'Documenti'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Traduttore Specializzato',
          costType: 'hourly',
          pricePerHour: 45,
        },
        {
          id: '2',
          name: 'Revisore Madrelingua',
          costType: 'hourly',
          pricePerHour: 40,
        },
        {
          id: '3',
          name: 'Software CAT Tool',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Traduzione Base',
          description: 'Traduzione documenti (circa 50 pagine)',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 60, fixedPrice: 0 },
            { resourceId: '3', hours: 0, fixedPrice: 200 },
          ],
        },
        {
          id: '2',
          name: 'Revisione e Quality Check',
          description: 'Controllo accuratezza e terminologia',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 30, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'crm-implementation',
    name: 'Implementazione CRM',
    description: 'Setup e personalizzazione sistema CRM',
    tags: ['CRM', 'Software', 'Business', 'Consulenza'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'CRM Consultant',
          costType: 'hourly',
          pricePerHour: 90,
        },
        {
          id: '2',
          name: 'System Integrator',
          costType: 'hourly',
          pricePerHour: 75,
        },
        {
          id: '3',
          name: 'Trainer',
          costType: 'hourly',
          pricePerHour: 60,
        },
        {
          id: '4',
          name: 'Licenze Software',
          costType: 'fixed',
          pricePerHour: 0,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Analisi e Setup',
          description: 'Analisi processi e configurazione CRM',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 40, fixedPrice: 0 },
            { resourceId: '4', hours: 0, fixedPrice: 3000 },
          ],
        },
        {
          id: '2',
          name: 'Personalizzazione e Integrazione',
          description: 'Custom fields, workflow e integrazioni',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 60, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Formazione Team',
          description: 'Training utenti finali',
          vat: 22,
          resources: [
            { resourceId: '3', hours: 20, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'interior-design',
    name: 'Progetto Interior Design',
    description: 'Design d\'interni completo per abitazione',
    tags: ['Design', 'Interni', 'Architettura'],
    config: {
      currency: '€',
      defaultVat: 22,
      resources: [
        {
          id: '1',
          name: 'Interior Designer',
          costType: 'hourly',
          pricePerHour: 70,
        },
        {
          id: '2',
          name: 'Render 3D Artist',
          costType: 'hourly',
          pricePerHour: 50,
        },
      ],
      activities: [
        {
          id: '1',
          name: 'Concept e Mood',
          description: 'Concept design e moodboard',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 20, fixedPrice: 0 },
          ],
        },
        {
          id: '2',
          name: 'Progetto Esecutivo',
          description: 'Planimetrie, prospetti e specifiche',
          vat: 22,
          resources: [
            { resourceId: '1', hours: 50, fixedPrice: 0 },
          ],
        },
        {
          id: '3',
          name: 'Render Fotorealistici',
          description: 'Visualizzazioni 3D degli ambienti',
          vat: 22,
          resources: [
            { resourceId: '2', hours: 40, fixedPrice: 0 },
          ],
        },
      ],
    },
  },
];

