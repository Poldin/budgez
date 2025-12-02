'use client'

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getQuoteById } from '@/app/actions/quote-actions';
import type { Resource, Activity, GeneralDiscount, ResourceAssignment } from '@/types/budget';
import Footer from '@/components/footer/footer';
import ResourcesSection from '@/components/budget/resources-section';
import ActivitiesSection from '@/components/budget/activities-section';
import { translations, type Language } from '@/lib/translations';
import { createClientSupabaseClient } from '@/lib/database/supabase-client';
import { formatNumber } from '@/lib/budget-utils';
import { Calculator, Save, Check, Share2 } from 'lucide-react';

interface QuoteData {
  id: string;
  name: string | null;
  created_at: string;
  metadata: any;
  is_template: boolean | null;
  user_id: string;
}

export default function TogetherPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const [language, setLanguage] = useState<Language>('it');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [budgetName, setBudgetName] = useState('');
  const [budgetDescription, setBudgetDescription] = useState('');
  const [currency, setCurrency] = useState('€');
  const [defaultVat, setDefaultVat] = useState(22);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const initialDataRef = useRef<{ budgetDescription: string; resources: Resource[]; activities: Activity[] } | null>(null);

  const t = translations[language];

  // Verifica stato autenticazione
  useEffect(() => {
    const supabase = createClientSupabaseClient();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        setError('ID preventivo non valido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getQuoteById(quoteId);

        if (!result.success || !result.data) {
          setError(result.error || 'Preventivo non trovato');
          setLoading(false);
          return;
        }

        const quote = result.data as QuoteData;
        setQuoteData(quote);

        // Estrai i dati dai metadata
        const metadata = quote.metadata || {};
        
        if (metadata.budgetName) setBudgetName(metadata.budgetName);
        else if (quote.name) setBudgetName(quote.name);
        else setBudgetName('Preventivo');

        if (metadata.budgetDescription) setBudgetDescription(metadata.budgetDescription);
        if (metadata.currency) setCurrency(metadata.currency);
        if (metadata.defaultVat !== undefined) setDefaultVat(metadata.defaultVat);
        if (metadata.resources) setResources(metadata.resources as Resource[]);
        if (metadata.activities) setActivities(metadata.activities as Activity[]);
        
        // Salva i dati iniziali per il confronto
        initialDataRef.current = {
          budgetDescription: metadata.budgetDescription || '',
          resources: metadata.resources || [],
          activities: metadata.activities || []
        };

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading quote:', err);
        setError('Errore nel caricamento del preventivo');
        setLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

  // Traccia le modifiche
  useEffect(() => {
    if (!initialDataRef.current || loading) return;
    
    const currentData = JSON.stringify({ budgetDescription, resources, activities });
    const initialData = JSON.stringify(initialDataRef.current);
    
    setHasChanges(currentData !== initialData);
  }, [budgetDescription, resources, activities, loading]);

  // Funzione per salvare le modifiche
  const saveChanges = async () => {
    if (!quoteData) return;
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const supabase = createClientSupabaseClient();
      
      // Aggiorna resources, activities e descrizione nei metadata
      const updatedMetadata = {
        ...quoteData.metadata,
        budgetDescription,
        resources,
        activities
      };
      
      const { error } = await supabase
        .from('quotes')
        .update({ metadata: updatedMetadata })
        .eq('id', quoteId);
      
      if (error) throw error;
      
      // Aggiorna i dati iniziali
      initialDataRef.current = { budgetDescription, resources, activities };
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Nascondi il successo dopo 2 secondi
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error('Errore durante il salvataggio:', error);
      alert('Errore durante il salvataggio: ' + (error.message || 'Errore sconosciuto'));
    } finally {
      setSaving(false);
    }
  };

  // Resource operations
  const addResource = () => {
    const newResource: Resource = {
      id: Date.now().toString(),
      name: '',
      costType: 'hourly',
      pricePerHour: 0,
      margin: 0,
    };
    setResources([...resources, newResource]);
  };

  const deleteResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
    setActivities(activities.map(a => ({
      ...a,
      resources: a.resources.filter(r => r.resourceId !== id)
    })));
  };

  const updateResource = (id: string, field: keyof Resource, value: string | number) => {
    setResources(resources.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const moveResourceUp = (index: number) => {
    if (index === 0) return;
    const newResources = [...resources];
    [newResources[index - 1], newResources[index]] = [newResources[index], newResources[index - 1]];
    setResources(newResources);
  };

  const moveResourceDown = (index: number) => {
    if (index === resources.length - 1) return;
    const newResources = [...resources];
    [newResources[index], newResources[index + 1]] = [newResources[index + 1], newResources[index]];
    setResources(newResources);
  };

  // Activity operations
  const addActivity = () => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: '',
      description: '',
      resources: [],
      vat: defaultVat,
      margin: 0,
    };
    setActivities([...activities, newActivity]);
    setExpandedActivities(new Set([...expandedActivities, newActivity.id]));
  };

  const deleteActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const updateActivity = (id: string, field: keyof Activity, value: string | number | ResourceAssignment[] | any) => {
    setActivities(prevActivities => prevActivities.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const moveActivityUp = (index: number) => {
    if (index === 0) return;
    const newActivities = [...activities];
    [newActivities[index - 1], newActivities[index]] = [newActivities[index], newActivities[index - 1]];
    setActivities(newActivities);
  };

  const moveActivityDown = (index: number) => {
    if (index === activities.length - 1) return;
    const newActivities = [...activities];
    [newActivities[index], newActivities[index + 1]] = [newActivities[index + 1], newActivities[index]];
    setActivities(newActivities);
  };

  const addResourceToActivity = (activityId: string) => {
    setActivities(activities.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          resources: [...a.resources, { resourceId: '', hours: 0, fixedPrice: 0 }]
        };
      }
      return a;
    }));
  };

  const updateActivityResource = (activityId: string, index: number, field: keyof ResourceAssignment, value: string | number) => {
    setActivities(activities.map(a => {
      if (a.id === activityId) {
        const newResources = [...a.resources];
        newResources[index] = { ...newResources[index], [field]: value };
        return { ...a, resources: newResources };
      }
      return a;
    }));
  };

  const removeResourceFromActivity = (activityId: string, index: number) => {
    setActivities(activities.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          resources: a.resources.filter((_, i) => i !== index)
        };
      }
      return a;
    }));
  };

  // Calcolo totale semplificato (senza margini né sconti - per la vista collaborativa)
  const calculateSimpleTotal = () => {
    let subtotal = 0;
    let totalVat = 0;

    activities.forEach(activity => {
      let activitySubtotal = 0;
      
      activity.resources.forEach(assignment => {
        const resource = resources.find(r => r.id === assignment.resourceId);
        if (resource) {
          if (resource.costType === 'hourly' || resource.costType === 'quantity') {
            activitySubtotal += assignment.hours * resource.pricePerHour;
          } else {
            activitySubtotal += assignment.fixedPrice;
          }
        }
      });
      
      subtotal += activitySubtotal;
      totalVat += activitySubtotal * (activity.vat / 100);
    });

    return {
      subtotal,
      vat: totalVat,
      total: subtotal + totalVat
    };
  };

  const totals = calculateSimpleTotal();

  // Funzione per condividere il link
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/together/${quoteId}`;
    const shareText = `Collabora al preventivo: ${budgetName}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Preventivo: ${budgetName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // Utente ha annullato o errore
        console.log('Condivisione annullata:', err);
      }
    } else {
      // Fallback: copia negli appunti
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiato negli appunti!');
      } catch (err) {
        console.error('Errore nella copia:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento preventivo...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Errore</h1>
            <p className="text-gray-600">{error || 'Preventivo non trovato'}</p>
          </div>
        </main>
        <Footer language={language} onLanguageChange={setLanguage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">B) Budgez</span>
              <span className="text-sm text-gray-500">• Compilazione collaborativa</span>
            </div>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="h-9"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Condividi
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {(t as any).togetherPageTitle || 'Compilazione collaborativa'}
            </h1>
            <p className="text-base text-gray-600 max-w-3xl">
              {(t as any).togetherPageSubtitle || 'Contribuisci alla definizione dei costi di questo preventivo'}
            </p>
          </div>

          {/* Quote Info */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Preventivo</Label>
                  <p className="text-xl font-semibold text-gray-900">{budgetName}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descrizione</Label>
                  <Textarea
                    value={budgetDescription}
                    onChange={(e) => setBudgetDescription(e.target.value)}
                    placeholder="Aggiungi una descrizione al preventivo..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resources and Activities Sections - Without Margins */}
          <Accordion type="multiple" defaultValue={["resources", "activities"]} className="mb-8">
            <ResourcesSection
              resources={resources}
              currency={currency}
              onAdd={addResource}
              onUpdate={updateResource}
              onDelete={deleteResource}
              onMoveUp={moveResourceUp}
              onMoveDown={moveResourceDown}
              hideMargin={true}
              translations={t}
            />
            <ActivitiesSection
              activities={activities}
              resources={resources}
              currency={currency}
              defaultVat={defaultVat}
              expandedActivities={expandedActivities}
              onToggleActivity={(activityId) => {
                const newExpanded = new Set(expandedActivities);
                if (newExpanded.has(activityId)) {
                  newExpanded.delete(activityId);
                } else {
                  newExpanded.add(activityId);
                }
                setExpandedActivities(newExpanded);
              }}
              onAdd={addActivity}
              onUpdate={updateActivity}
              onDelete={deleteActivity}
              onMoveUp={moveActivityUp}
              onMoveDown={moveActivityDown}
              onAddResource={addResourceToActivity}
              onUpdateResource={updateActivityResource}
              onRemoveResource={removeResourceFromActivity}
              hideMargin={true}
              translations={t}
            />
          </Accordion>

          {/* Totale Semplificato */}
          {activities.length > 0 && (
            <Card className="border-2 border-gray-900 bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.totalEstimate || 'Totale'}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>{t.subtotal || 'Subtotale'}</span>
                    <span className="font-medium">{currency}{formatNumber(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>{t.vatAmount || 'IVA'}</span>
                    <span className="font-medium">{currency}{formatNumber(totals.vat)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                    <span className="text-lg font-semibold text-gray-900">{t.totalWithVat || 'Totale (IVA inclusa)'}</span>
                    <span className="text-2xl font-bold text-gray-900">{currency}{formatNumber(totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Floating Save Button - appare quando ci sono modifiche */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={saveChanges}
            disabled={saving}
            className="shadow-lg text-white px-6 py-3 h-auto"
            style={{
              animation: 'pulseSave 2s ease-in-out infinite',
            }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva modifiche
              </>
            )}
          </Button>
        </div>
      )}

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="h-4 w-4" />
            Modifiche salvate!
          </div>
        </div>
      )}

      <Footer language={language} onLanguageChange={setLanguage} />
    </div>
  );
}

