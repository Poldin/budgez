'use client'

import React from 'react';
import type { PDFConfig } from '@/components/budget/pdf-html-generator';

interface QuoteHeaderProps {
  pdfConfig?: PDFConfig;
}

export default function QuoteHeader({ pdfConfig }: QuoteHeaderProps) {
  if (!pdfConfig || (!pdfConfig.companyLogo && !pdfConfig.companyName && !pdfConfig.headerText)) {
    return null;
  }

  return (
    <div className="flex justify-between items-start gap-10 mb-8">
      <div className="flex-[0_0_40%] flex flex-col gap-4">
        {pdfConfig.companyLogo && (
          <div className="flex items-center justify-start p-4 bg-gray-50 border border-gray-200 rounded-md min-h-[100px]">
            <img 
              src={pdfConfig.companyLogo} 
              alt="Company Logo" 
              className="max-w-full max-h-20 object-contain"
            />
          </div>
        )}
        {pdfConfig.companyName && (
          <div className="text-lg font-bold text-gray-900 text-left p-2">
            {pdfConfig.companyName}
          </div>
        )}
        {pdfConfig.companyInfo && (
          <div className="text-xs text-gray-600 text-left whitespace-pre-wrap leading-relaxed">
            {pdfConfig.companyInfo}
          </div>
        )}
      </div>
      
      {pdfConfig.headerText && (
        <div className="flex-[0_0_50%] p-4 bg-gray-50 border border-gray-300 rounded whitespace-pre-wrap text-xs text-right self-start">
          {pdfConfig.headerText}
        </div>
      )}
    </div>
  );
}

