import React from 'react';
import { Folder, AtSign, PalmtreeIcon,LayoutDashboard, ChartColumn, PhoneOutgoing } from 'lucide-react';
import Image from 'next/image';

type Section = {
  id: string;
  main_title: string;
  main_subtitle: string;
  main_description: string;
  features: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  image: string;
};

const defaultData: Section[] = [
  {
    id: '1',
    main_title: 'Collabora insieme',
    main_subtitle: 'a tutto il team.',
    main_description: 'Creare preventivi è spesso laborioso: organizza il lavoro del team nella definizione degli economics',
    features: [
      {
        title: 'Working on it',
        description: 'Usa la tab di supporto per tenere traccia della scrittura del preventivo.',
        icon: <Folder className="w-6 h-6" />
      },
      {
        title: 'Invita chi vuoi',
        description: 'Tutti possono iscriversi a Budget e collaborare.',
        icon: <AtSign className="w-6 h-6" />
      },
      {
        title: 'Gratis',
        description: 'Collaboratori Editor o Viewer non pagano nulla.',
        icon: <PalmtreeIcon className="w-6 h-6" />
      }
    ],
    image: '/images/teamwork.jpg'
  },
  {
    id: '2',
    main_title: 'Monitora, sempre.',
    main_subtitle: 'Tutto.',
    main_description: 'Siamo impegnati a fornirti la dashboard più dettagliata possibile. Così puoi vendere di più e meglio.',
    features: [
      {
        title: 'Dati dati dati',
        description: 'Leggi le metriche, non basarti sulle intuizioni.',
        icon: <LayoutDashboard className="w-6 h-6" />
      },
      {
        title: 'Miglioramento continuo',
        description: 'Solo se lo puoi misurare lo puoi migliorare.',
        icon: <ChartColumn className="w-6 h-6" />
      },
      {
        title: 'Aumenta le conversioni',
        description: 'Impara quando è opportuno chiamare e quando è tempo perso.',
        icon: <PhoneOutgoing className="w-6 h-6" />
      }
    ],
    image: '/images/dashboard_budgez.jpg'
  }
];

const DocsSection = ({ sections = defaultData }) => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-5 mt-5">
      {sections.map((section) => (
        <div key={section.id} className="flex flex-col gap-4 my-20">
          {/* Header and Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Title and Description */}
            <div>
              <h1 className="text-5xl font-bold text-gray-900">
                {section.main_title}
                <br />
                {section.main_subtitle}
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                {section.main_description}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4">
              {section.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Large Image Section */}
          <div className="relative aspect-[16/9] w-full">
            <div className="absolute inset-0 bg-white rounded-lg shadow-sm p-4">
              <Image
                src={section.image}
                alt="Documentation example"
                fill
                priority
                sizes="(max-width: 1200px) 100vw"
                style={{ objectFit: 'cover' }}
                className="rounded-lg border-2"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocsSection;