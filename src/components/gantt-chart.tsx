'use client'

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Calendar } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
}

interface GanttChartProps {
  activities: Activity[];
  onUpdateActivity?: (id: string, field: 'startDate' | 'endDate', value: string) => void;
}

// Converte una Date in formato YYYY-MM-DD preservando la data locale (senza shift UTC)
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function GanttChart({ activities, onUpdateActivity }: GanttChartProps) {
  const [showQuickConfig, setShowQuickConfig] = useState(true); // Aperto di default

  // Filtra solo le attività con date valide
  const activitiesWithDates = useMemo(
    () => activities.filter(a => a.startDate && a.endDate),
    [activities]
  );

  // Calcola le date minime e massime con padding
  const { minDate, maxDate, totalDays, viewType } = useMemo(() => {
    if (activitiesWithDates.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: now, totalDays: 0, viewType: 'month' as const };
    }
    
    const dates = activitiesWithDates.flatMap(a => [
      new Date(a.startDate!),
      new Date(a.endDate!)
    ]);
    
    const rawMinDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const rawMaxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Calcola la durata in giorni
    const durationDays = Math.ceil((rawMaxDate.getTime() - rawMinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Aggiungi padding (5% su ogni lato, minimo 1 giorno)
    const paddingDays = Math.max(1, Math.ceil(durationDays * 0.05));
    const minDate = new Date(rawMinDate);
    minDate.setDate(minDate.getDate() - paddingDays);
    const maxDate = new Date(rawMaxDate);
    maxDate.setDate(maxDate.getDate() + paddingDays);
    
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determina il tipo di visualizzazione in base alla durata
    let viewType: 'day' | 'week' | 'month';
    if (totalDays <= 60) {
      viewType = 'day'; // Fino a 2 mesi: mostra giorni
    } else if (totalDays <= 180) {
      viewType = 'week'; // Fino a 6 mesi: mostra settimane
    } else {
      viewType = 'month'; // Oltre 6 mesi: mostra mesi
    }
    
    return { minDate, maxDate, totalDays, viewType };
  }, [activitiesWithDates]);

  // Genera le colonne della timeline in base al tipo di visualizzazione
  const timeColumns = useMemo(() => {
    const result = [];
    
    if (viewType === 'day') {
      // Mostra giorni - dividi uniformemente il periodo totale
      const numDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      for (let i = 0; i < numDays; i++) {
        const current = new Date(minDate);
        current.setDate(current.getDate() + i);
        result.push({
          date: new Date(current),
          label: current.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          type: 'day' as const
        });
      }
    } else if (viewType === 'week') {
      // Mostra settimane - dividi il periodo in settimane da 7 giorni
      const numDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const numWeeks = Math.ceil(numDays / 7);
      
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = new Date(minDate);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Assicurati che weekEnd non superi maxDate
        if (weekEnd > maxDate) {
          weekEnd.setTime(maxDate.getTime());
        }
        
        result.push({
          date: new Date(weekStart),
          label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          type: 'week' as const,
          days: 7
        });
      }
    } else {
      // Mostra mesi - calcola quanti mesi completi o parziali ci sono
      const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      
      while (current <= endMonth) {
        result.push({
          date: new Date(current),
          label: current.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
          type: 'month' as const,
          days: new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
        });
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return result;
  }, [minDate, maxDate, viewType]);

  // Se non ci sono attività con date, mostra solo il pannello di configurazione
  if (activitiesWithDates.length === 0) {
    return (
      <Card className="bg-white border-2 border-gray-200">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline Progetto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Quick Configuration Panel - sempre visibile quando non ci sono date */}
          {onUpdateActivity && activities.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold mb-3 text-blue-900">Imposta le date per visualizzare la timeline</h3>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded border border-blue-100">
                    <div className="col-span-4">
                      <p className="text-sm font-medium truncate" title={activity.name}>
                        {activity.name || 'Attività senza nome'}
                      </p>
                    </div>
                    <div className="col-span-8">
                      <Label className="text-xs text-gray-600 mb-1 block">Periodo</Label>
                      <DateRangePicker
                        value={{
                          from: activity.startDate ? new Date(activity.startDate) : undefined,
                          to: activity.endDate ? new Date(activity.endDate) : undefined,
                        }}
                        onChange={(range) => {
                          if (range.from) {
                            onUpdateActivity(activity.id, 'startDate', formatDateToLocal(range.from));
                          }
                          if (range.to) {
                            onUpdateActivity(activity.id, 'endDate', formatDateToLocal(range.to));
                          }
                        }}
                        placeholder="Seleziona date inizio e fine"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activities.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              Aggiungi delle attività per poter creare la timeline del progetto.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Calcola la posizione e la larghezza di una barra nel Gantt
  const calculateBarPosition = (activityStart: string, activityEnd: string) => {
    const start = new Date(activityStart);
    const end = new Date(activityEnd);
    
    // Calcola l'offset dall'inizio
    const offsetDays = Math.max(0, Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calcola la durata in giorni
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calcola le percentuali
    const leftPercent = (offsetDays / totalDays) * 100;
    const widthPercent = (durationDays / totalDays) * 100;
    
    return {
      left: `${Math.max(0, Math.min(100, leftPercent))}%`,
      width: `${Math.max(0.5, Math.min(100 - leftPercent, widthPercent))}%`,
      isVisible: leftPercent < 100 && (leftPercent + widthPercent) > 0
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getViewTypeLabel = () => {
    if (viewType === 'day') return 'Giorni';
    if (viewType === 'week') return 'Settimane';
    return 'Mesi';
  };

  return (
    <Card className="bg-white border-2 border-gray-200">
      <CardHeader className="border-b bg-gray-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline Progetto
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Visualizzazione: {getViewTypeLabel()} • Durata: {totalDays} giorni
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickConfig(!showQuickConfig)}
          >
            {showQuickConfig ? 'Nascondi configurazione' : 'Mostra configurazione'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Quick Configuration Panel */}
        {showQuickConfig && onUpdateActivity && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold mb-3">Configurazione Rapida Date</h3>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4">
                    <p className="text-sm font-medium truncate" title={activity.name}>
                      {activity.name || 'Attività senza nome'}
                    </p>
                  </div>
                  <div className="col-span-8">
                    <Label className="text-xs text-gray-600 mb-1 block">Periodo</Label>
                    <DateRangePicker
                      value={{
                        from: activity.startDate ? new Date(activity.startDate) : undefined,
                        to: activity.endDate ? new Date(activity.endDate) : undefined,
                      }}
                      onChange={(range) => {
                        if (range.from) {
                          onUpdateActivity(activity.id, 'startDate', formatDateToLocal(range.from));
                        }
                        if (range.to) {
                          onUpdateActivity(activity.id, 'endDate', formatDateToLocal(range.to));
                        }
                      }}
                      placeholder="Seleziona date inizio e fine"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gantt Chart */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header della timeline */}
            <div className="flex border-b-2 border-gray-300 mb-2">
              <div className="w-48 flex-shrink-0 pr-4 py-2 font-semibold text-sm">
                Attività
              </div>
              <div className="flex-1 flex">
                {timeColumns.map((column, idx) => (
                  <div 
                    key={idx} 
                    className="flex-1 text-center py-2 border-l border-gray-200 text-xs font-semibold"
                    style={{ minWidth: viewType === 'day' ? '40px' : '80px' }}
                  >
                    {column.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Righe delle attività */}
            <div className="space-y-2">
              {activitiesWithDates.map((activity, idx) => {
                const position = calculateBarPosition(activity.startDate!, activity.endDate!);
                
                return (
                   <div key={activity.id} className="flex items-start group hover:bg-gray-50 rounded">
                     <div className="w-48 flex-shrink-0 pr-4 py-2">
                       <p className="text-sm font-medium break-words">
                         {activity.name}
                       </p>
                       <p className="text-xs text-gray-500">
                         {formatDate(activity.startDate!)} - {formatDate(activity.endDate!)}
                       </p>
                     </div>
                    <div className="flex-1 relative h-12">
                      {/* Griglia verticale timeline */}
                      <div className="absolute inset-0 flex">
                        {timeColumns.map((column, mIdx) => (
                          <div 
                            key={mIdx} 
                            className="flex-1 border-l border-gray-100"
                            style={{ minWidth: viewType === 'day' ? '40px' : '80px' }}
                          />
                        ))}
                      </div>
                      
                       {/* Barra del Gantt */}
                       {position.isVisible && (
                         <div 
                           className="absolute top-1/2 -translate-y-1/2 h-8 rounded transition-all"
                           style={{
                             left: position.left,
                             width: position.width,
                             backgroundColor: `hsl(${(idx * 360) / activitiesWithDates.length}, 70%, 60%)`,
                             opacity: 0.9
                           }}
                         />
                       )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Periodo: {minDate.toLocaleDateString('it-IT')} - {maxDate.toLocaleDateString('it-IT')} • {timeColumns.length} {getViewTypeLabel().toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

