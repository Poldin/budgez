'use client'

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const commonCurrencies = [
  { symbol: '€', name: 'Euro' },
  { symbol: '$', name: 'Dollaro USA' },
  { symbol: '£', name: 'Sterlina' },
  { symbol: 'CHF', name: 'Franco Svizzero' },
  { symbol: '¥', name: 'Yen' },
  { symbol: '₹', name: 'Rupia' },
  { symbol: 'R$', name: 'Real' },
  { symbol: 'A$', name: 'Dollaro Australiano' },
  { symbol: 'C$', name: 'Dollaro Canadese' },
  { symbol: 'kr', name: 'Corona' },
  { symbol: 'zł', name: 'Zloty' },
  { symbol: '฿', name: 'Baht' },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function CurrencySelector({ value, onChange, label = "Valuta" }: CurrencySelectorProps) {
  return (
    <div>
      <Label className="text-sm text-gray-700 mb-1.5 block">{label}</Label>
      <div className="flex items-center gap-3">
        {/* Input per valuta personalizzata */}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-lg w-fit min-w-[80px]"
          placeholder="€"
        />
        
        {/* Select per valute comuni */}
        <Select 
          value={value} 
          onValueChange={onChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Seleziona valuta" />
          </SelectTrigger>
          <SelectContent>
            {commonCurrencies.map(currency => (
              <SelectItem key={currency.symbol} value={currency.symbol}>
                {currency.symbol} - {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Seleziona dalla lista o scrivi un simbolo personalizzato
      </p>
    </div>
  );
}

