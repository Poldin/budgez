'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2 } from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import AppHeader from '@/components/app-header';
import Footer from '@/components/footer/footer';
import RequestCard from '@/components/request-card';
import NewRequestDialog from '@/components/new-request-dialog';
import RequestDetailsDialog from '@/components/request-details-dialog';
import { getActiveRequests, getProposalsCountsForRequests } from '@/app/actions/request-actions';
import { Tables } from '@/lib/database/supabase';

// Tipo per le richieste con join email
type RequestWithEmail = Tables<'requests'> & {
  otp_verification: {
    email: string | null;
  } | null;
  attachment_url: string | null;
};

// Tipo per le richieste
type RequestType = {
  id: string;
  title: string | null;
  description: string | null;
  budget: number | null;
  deadline: string | null;
  email: string | null;
  created_at: string;
  attachment_url: string | null;
  proposalsCount?: number;
};

function RequestsPageContent() {
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<Language>('it');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<string>('all');
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestType | null>(null);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [autoOpenedForQuery, setAutoOpenedForQuery] = useState<string | null>(null);

  const t = translations[language];

  // Handle rid parameter from URL
  useEffect(() => {
    const rid = searchParams.get('rid');
    if (rid) {
      setSearchQuery(rid);
      // Reset auto-open flag when URL changes
      setAutoOpenedForQuery(null);
    }
  }, [searchParams]);

  // Reset auto-open flag when user manually changes search query
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    if (value !== autoOpenedForQuery) {
      setAutoOpenedForQuery(null);
    }
  };

  // Fetch requests from database
  const fetchRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    const result = await getActiveRequests();
    
    if (result.success && result.data) {
      // Transform data to match the expected format
      const transformedData: RequestType[] = (result.data as unknown as RequestWithEmail[]).map((req) => ({
        id: req.id,
        title: req.title,
        description: req.description,
        budget: req.budget,
        deadline: req.deadline,
        email: req.otp_verification?.email || null,
        created_at: req.created_at,
        attachment_url: req.attachment_url || null,
      }));
      
      // Fetch proposals counts for all requests
      const requestIds = transformedData.map(req => req.id);
      const countsResult = await getProposalsCountsForRequests(requestIds);
      
      if (countsResult.success && countsResult.data) {
        // Add proposals count to each request
        const counts = countsResult.data as Record<string, number>;
        transformedData.forEach(req => {
          req.proposalsCount = counts[req.id] || 0;
        });
      }
      
      setRequests(transformedData);
    }
    
    setIsLoadingRequests(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleViewDetails = (request: RequestType) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const sortOptions = [
    { key: 'all', label: t.allCategories },
    { key: 'dueSoon', label: t.dueSoon },
    { key: 'noRush', label: t.noRush },
    { key: 'topBudget', label: t.topBudget },
    { key: 'noBudget', label: t.noBudget },
  ];

  // Helper function to calculate days until deadline
  const getDaysUntilDeadline = (deadline: string | null): number => {
    if (!deadline) return 0;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = 
        (request.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (request.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (request.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (selectedSort) {
        case 'dueSoon':
          // Sort by closest deadline first
          return getDaysUntilDeadline(a.deadline) - getDaysUntilDeadline(b.deadline);
        
        case 'noRush':
          // Sort by furthest deadline first
          return getDaysUntilDeadline(b.deadline) - getDaysUntilDeadline(a.deadline);
        
        case 'topBudget':
          // Sort by highest budget first
          return (b.budget || 0) - (a.budget || 0);
        
        case 'noBudget':
          // Sort by showing "no budget" first (budget = 0 or null)
          const aBudget = a.budget || 0;
          const bBudget = b.budget || 0;
          if (aBudget === 0 && bBudget !== 0) return -1;
          if (aBudget !== 0 && bBudget === 0) return 1;
          return 0;
        
        default:
          // 'all' - sort by created_at desc (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Auto-open details dialog when searching by exact UUID match
  useEffect(() => {
    if (!isLoadingRequests && searchQuery && filteredRequests.length === 1) {
      // Check if the search query matches exactly the ID of the single result
      const exactMatch = filteredRequests[0].id.toLowerCase() === searchQuery.toLowerCase();
      // Only auto-open if we haven't already auto-opened for this query
      if (exactMatch && !isDetailsDialogOpen && autoOpenedForQuery !== searchQuery) {
        // Small delay to ensure UI is ready
        const timer = setTimeout(() => {
          handleViewDetails(filteredRequests[0]);
          setAutoOpenedForQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoadingRequests, searchQuery, filteredRequests, isDetailsDialogOpen, autoOpenedForQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <AppHeader 
        language={language}
        onLanguageChange={setLanguage}
        translations={t}
        ctaText={t.createBudget}
        ctaHref="/"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.requestsPageTitle}</h1>
            <p className="text-base text-gray-600 max-w-3xl">
              Richiedi preventivi per le tue esigenze o consulta le richieste attive per proporre la tua offerta.
            </p>
          </div>

          {/* Search and New Request */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t.searchRequests}
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button 
              className="bg-gray-900 hover:bg-gray-800 text-white h-11 gap-2"
              onClick={() => setIsNewRequestDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t.newRequest}
            </Button>
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2 mb-8">
            {sortOptions.map((option) => (
              <Badge
                key={option.key}
                variant={selectedSort === option.key ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 ${
                  selectedSort === option.key
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedSort(option.key)}
              >
                {option.label}
              </Badge>
            ))}
          </div>

          {/* Loading State */}
          {isLoadingRequests && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Requests Grid */}
          {!isLoadingRequests && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  id={request.id}
                  title={request.title || ''}
                  description={request.description || ''}
                  budget={request.budget}
                  deadline={request.deadline ? new Date(request.deadline) : new Date()}
                  email={request.email || ''}
                  attachmentUrl={request.attachment_url || undefined}
                  proposalsCount={request.proposalsCount || 0}
                  onViewDetails={() => handleViewDetails(request)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingRequests && filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nessuna richiesta trovata</p>
              <p className="text-gray-400 text-sm mt-2">Prova a modificare i filtri di ricerca</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer language={language} onLanguageChange={setLanguage} />

      {/* New Request Dialog */}
      <NewRequestDialog
        open={isNewRequestDialogOpen}
        onOpenChange={setIsNewRequestDialogOpen}
        onRequestCreated={fetchRequests}
      />

      {/* Request Details Dialog */}
      {selectedRequest && (
        <RequestDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          requestId={selectedRequest.id}
          title={selectedRequest.title || ''}
          description={selectedRequest.description || ''}
          budget={selectedRequest.budget}
          deadline={selectedRequest.deadline ? new Date(selectedRequest.deadline) : new Date()}
          email={selectedRequest.email || ''}
          attachmentUrl={selectedRequest.attachment_url || undefined}
          proposalsCount={selectedRequest.proposalsCount || 0}
        />
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <RequestsPageContent />
    </Suspense>
  );
}

