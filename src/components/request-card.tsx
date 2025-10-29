'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, ShieldCheck } from 'lucide-react';

interface RequestCardProps {
  id: string | number;
  title: string;
  description: string;
  budget: number | null;
  deadline: Date;
  email: string;
  onViewDetails?: () => void;
}

export default function RequestCard({
  title,
  description,
  budget,
  deadline,
  onViewDetails,
}: RequestCardProps) {
  
  // Format budget for display
  const formatBudget = (budget: number | null): string => {
    if (!budget || budget === 0) return 'Da concordare';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Scaduto';
    if (diffDays === 0) return 'Scade oggi';
    if (diffDays === 1) return 'Scade domani';
    return `${diffDays} giorni rimanenti`;
  };

  const daysRemaining = getDaysRemaining();
  const isUrgent = (() => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  })();

  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-medium">Verified</span>
          </div>
          <Badge 
            variant={isUrgent ? "destructive" : "secondary"}
            className="text-xs"
          >
            {daysRemaining}
          </Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {description}
        </p>
        
        {/* Budget */}
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 mt-auto">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{formatBudget(budget)}</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 group/card-actions">

          {/* View Details Button */}
          <Button 
            variant="outline" 
            className="flex-1 transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.();
            }}
          >
            Visualizza dettagli
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

