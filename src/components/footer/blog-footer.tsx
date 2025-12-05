'use client'

import React, { useState } from 'react';
import Footer from './footer';
import type { Language } from '@/lib/translations';

export default function BlogFooter() {
  const [language, setLanguage] = useState<Language>('it');

  return (
    <Footer 
      language={language} 
      onLanguageChange={setLanguage} 
    />
  );
}

