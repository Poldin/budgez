'use client'

import React from 'react';

interface QuoteContractTermsProps {
  contractTerms?: string;
}

export default function QuoteContractTerms({ contractTerms }: QuoteContractTermsProps) {
  if (!contractTerms) {
    return null;
  }

  return (
    <div className="mt-10 pt-8 border-t border-gray-300">
      <h2 className="text-lg font-semibold text-gray-900 pb-2 mb-4">
        Condizioni Contrattuali
      </h2>
      <div className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
        {contractTerms}
      </div>
    </div>
  );
}

