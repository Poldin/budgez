'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, ShieldCheck, Share2, FileText, ThumbsDown } from 'lucide-react';
import ReportAbuseDialog from '@/components/report-abuse-dialog';

interface RequestCardProps {
  id: string | number;
  title: string;
  description: string;
  budget: number | null;
  deadline: Date;
  email: string;
  attachmentUrl?: string;
  proposalsCount?: number;
  onViewDetails?: () => void;
}

export default function RequestCard({
  id,
  title,
  description,
  budget,
  deadline,
  attachmentUrl,
  proposalsCount = 0,
  onViewDetails,
}: RequestCardProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
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

  // Handle share functionality
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/requests?rid=${id}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Dai un'occhiata a questa richiesta: ${title}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiato negli appunti!');
      } catch (err) {
        console.log('Error copying to clipboard:', err);
      }
    }
  };

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
        
        {/* Budget and Proposals Count */}
        <div className="flex items-center justify-between gap-3 text-sm text-gray-700 mb-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{formatBudget(budget)}</span>
            </div>
            {attachmentUrl && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FileText className="h-3.5 w-3.5" />
                <span>PDF</span>
              </div>
            )}
          </div>
          
          {/* Proposals Count Badge */}
          <Badge 
            variant="outline"
            className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-semibold"
          >
            {proposalsCount} {proposalsCount === 1 ? 'proposta' : 'proposte'}
          </Badge>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 group/card-actions">

          {/* Report Abuse Button */}
          <Button 
            variant="outline" 
            size="icon"
            className="transition-all duration-300 shrink-0 text-gray-500 hover:text-orange-600 hover:border-orange-300"
            onClick={(e) => {
              e.stopPropagation();
              setReportDialogOpen(true);
            }}
            title="Segnala abuso"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>

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

          {/* Share Button */}
          <Button 
            variant="outline" 
            size="icon"
            className="transition-all duration-300 shrink-0"
            onClick={handleShare}
            title="Condividi"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {/* Report Abuse Dialog */}
      <ReportAbuseDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        requestId={String(id)}
        requestTitle={title}
      />
    </Card>
  );
}

