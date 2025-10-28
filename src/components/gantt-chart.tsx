'use client'

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { NumberInput } from "@/components/ui/number-input";
import { Calendar, ArrowRight, ArrowLeft, CalendarClock } from 'lucide-react';

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
  const [globalShiftDays, setGlobalShiftDays] = useState<number>(0);
  const [individualShifts, setIndividualShifts] = useState<Record<string, number>>({});

  // Filtra solo le attività con date valide
  const activitiesWithDates = useMemo(
    () => activities.filter(a => a.startDate && a.endDate),
    [activities]
  );

  // Calcola le date minime e massime con padding (normalizzate per evitare problemi di timezone)
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
    
    // Normalizza le date raw (solo anno, mese, giorno)
    const normalizedRawMin = new Date(rawMinDate.getFullYear(), rawMinDate.getMonth(), rawMinDate.getDate());
    const normalizedRawMax = new Date(rawMaxDate.getFullYear(), rawMaxDate.getMonth(), rawMaxDate.getDate());
    
    // Calcola la durata in giorni
    const durationDays = Math.ceil((normalizedRawMax.getTime() - normalizedRawMin.getTime()) / (1000 * 60 * 60 * 24));
    
    // Aggiungi padding (5% su ogni lato, minimo 1 giorno)
    const paddingDays = Math.max(1, Math.ceil(durationDays * 0.05));
    const minDate = new Date(normalizedRawMin);
    minDate.setDate(minDate.getDate() - paddingDays);
    const maxDate = new Date(normalizedRawMax);
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
    const MIN_COLUMN_WIDTH = 60; // Larghezza minima in pixel per colonna
    const CONTAINER_WIDTH = 800; // Larghezza minima del contenitore
    
    if (viewType === 'day') {
      // Mostra giorni - calcola il numero di giorni nel range
      const numDays = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calcola il raggruppamento necessario
      const maxColumns = Math.floor(CONTAINER_WIDTH / MIN_COLUMN_WIDTH);
      const groupSize = Math.max(1, Math.ceil(numDays / maxColumns));
      
      for (let i = 0; i < numDays; i += groupSize) {
        const current = new Date(minDate);
        current.setDate(current.getDate() + i);
        const groupEnd = new Date(current);
        groupEnd.setDate(groupEnd.getDate() + groupSize - 1);
        
        // Limita groupEnd a maxDate
        if (groupEnd > maxDate) {
          groupEnd.setTime(maxDate.getTime());
        }
        
        // Calcola i giorni effettivi in questo gruppo
        const actualDays = Math.round((groupEnd.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Formatta la label in modo intelligente
        let label;
        if (actualDays === 1) {
          // Un solo giorno: mostra solo la data
          label = current.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
        } else if (current.getMonth() === groupEnd.getMonth()) {
          // Stesso mese: mostra "1-5 ott"
          label = `${current.getDate()}-${groupEnd.getDate()} ${current.toLocaleDateString('it-IT', { month: 'short' })}`;
        } else {
          // Mesi diversi: mostra "28 set - 2 ott"
          label = `${current.getDate()} ${current.toLocaleDateString('it-IT', { month: 'short' })} - ${groupEnd.getDate()} ${groupEnd.toLocaleDateString('it-IT', { month: 'short' })}`;
        }
        
        result.push({
          date: new Date(current),
          label,
          type: 'day' as const,
          days: actualDays
        });
      }
    } else if (viewType === 'week') {
      // Mostra settimane - dividi il periodo in settimane da 7 giorni
      const numDays = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const numWeeks = Math.ceil(numDays / 7);
      
      // Calcola il raggruppamento necessario
      const maxColumns = Math.floor(CONTAINER_WIDTH / MIN_COLUMN_WIDTH);
      const groupSize = Math.max(1, Math.ceil(numWeeks / maxColumns));
      
      for (let i = 0; i < numWeeks; i += groupSize) {
        const weekStart = new Date(minDate);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + (groupSize * 7) - 1);
        
        // Assicurati che weekEnd non superi maxDate
        if (weekEnd > maxDate) {
          weekEnd.setTime(maxDate.getTime());
        }
        
        const actualDays = Math.round((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Formatta la label in modo intelligente
        let label;
        if (actualDays <= 7 && groupSize === 1) {
          // Una sola settimana
          label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
        } else if (weekStart.getMonth() === weekEnd.getMonth()) {
          // Stesso mese: mostra "1/10 - 15/10"
          label = `${weekStart.getDate()}-${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
        } else {
          // Mesi diversi: mostra "28/9 - 5/10"
          label = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
        }
        
        result.push({
          date: new Date(weekStart),
          label,
          type: 'week' as const,
          days: actualDays
        });
      }
    } else {
      // Mostra mesi - calcola quanti mesi completi o parziali ci sono
      const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      
      // Conta i mesi totali
      let totalMonths = 0;
      const tempDate = new Date(current);
      while (tempDate <= endMonth) {
        totalMonths++;
        tempDate.setMonth(tempDate.getMonth() + 1);
      }
      
      // Calcola il raggruppamento necessario
      const maxColumns = Math.floor(CONTAINER_WIDTH / MIN_COLUMN_WIDTH);
      const groupSize = Math.max(1, Math.ceil(totalMonths / maxColumns));
      
      //const monthIndex = 0;
      while (current <= endMonth) {
        const groupStart = new Date(current);
        const groupEnd = new Date(current);
        groupEnd.setMonth(groupEnd.getMonth() + groupSize - 1);
        
        // Calcola i giorni effettivi
        const effectiveStart = groupStart < minDate ? minDate : groupStart;
        const effectiveEndMonth = groupEnd > endMonth ? endMonth : groupEnd;
        const lastDayOfMonth = new Date(effectiveEndMonth.getFullYear(), effectiveEndMonth.getMonth() + 1, 0);
        const effectiveEnd = lastDayOfMonth > maxDate ? maxDate : lastDayOfMonth;
        const days = Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Formatta la label in modo intelligente
        let label;
        if (groupSize === 1) {
          // Un solo mese
          label = current.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
        } else if (groupStart.getFullYear() === effectiveEndMonth.getFullYear()) {
          // Stesso anno: mostra "gen - mar 2025"
          label = `${groupStart.toLocaleDateString('it-IT', { month: 'short' })} - ${effectiveEndMonth.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}`;
        } else {
          // Anni diversi: mostra "dic 2024 - feb 2025"
          label = `${groupStart.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })} - ${effectiveEndMonth.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}`;
        }
        
        result.push({
          date: new Date(current),
          label,
          type: 'month' as const,
          days
        });
        
        current.setMonth(current.getMonth() + groupSize);
        //monthIndex += groupSize;
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
                  <div key={activity.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-blue-100">
                    <div className="col-span-3">
                      <p className="text-xs font-medium truncate" title={activity.name}>
                        {activity.name || 'Attività senza nome'}
                      </p>
                    </div>
                    <div className="col-span-9">
                      <Label className="text-xs text-gray-600 mb-1 block">Periodo</Label>
                      <DateRangePicker
                        key={`${activity.id}-${activity.startDate}-${activity.endDate}`}
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
                        placeholder="Seleziona periodo"
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
    
    // Normalizza le date all'inizio del giorno per confronti precisi
    const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    // Calcola il totale giorni nel range (stesso metodo usato nelle colonne)
    const totalDaysInRange = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calcola l'offset in giorni dall'inizio
    const offsetDays = Math.round((normalizedStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcola la durata in giorni (incluso il giorno finale)
    const durationDays = Math.round((normalizedEnd.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calcola le percentuali basate sul totale giorni
    const leftPercent = (offsetDays / totalDaysInRange) * 100;
    const widthPercent = (durationDays / totalDaysInRange) * 100;
    
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

  // Applica shift globale a tutte le attività
  const applyGlobalShift = (direction: number) => {
    if (!onUpdateActivity || globalShiftDays === 0) return;
    
    const shiftAmount = globalShiftDays * direction; // -1 per indietro, +1 per avanti
    
    // Calcola tutte le nuove date prima di applicare gli aggiornamenti
    const updates: Array<{ id: string; startDate?: string; endDate?: string }> = [];
    
    activities.forEach(activity => {
      const update: { id: string; startDate?: string; endDate?: string } = { id: activity.id };
      
      if (activity.startDate) {
        const newStart = new Date(activity.startDate);
        newStart.setDate(newStart.getDate() + shiftAmount);
        update.startDate = formatDateToLocal(newStart);
      }
      
      if (activity.endDate) {
        const newEnd = new Date(activity.endDate);
        newEnd.setDate(newEnd.getDate() + shiftAmount);
        update.endDate = formatDateToLocal(newEnd);
      }
      
      if (update.startDate || update.endDate) {
        updates.push(update);
      }
    });
    
    // Applica tutti gli aggiornamenti
    updates.forEach(update => {
      if (update.startDate) {
        onUpdateActivity(update.id, 'startDate', update.startDate);
      }
      if (update.endDate) {
        onUpdateActivity(update.id, 'endDate', update.endDate);
      }
    });
    
    setGlobalShiftDays(0);
  };

  // Calcola lo shift necessario per portare la data più vecchia a oggi
  const calculateShiftToToday = () => {
    // Trova la data di inizio più vecchia
    const startDates = activities
      .filter(a => a.startDate)
      .map(a => new Date(a.startDate!));
    
    if (startDates.length === 0) return;
    
    const oldestDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    const today = new Date();
    
    // Normalizza entrambe le date all'inizio del giorno
    const normalizedOldest = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), oldestDate.getDate());
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Calcola i giorni di differenza
    const daysDiff = Math.round((normalizedToday.getTime() - normalizedOldest.getTime()) / (1000 * 60 * 60 * 24));
    
    // Setta il valore nell'input dello shift globale
    setGlobalShiftDays(Math.abs(daysDiff));
  };

  // Applica shift individuale a una singola attività
  const applyIndividualShift = (activityId: string, direction: number) => {
    if (!onUpdateActivity) return;
    
    const shiftDays = individualShifts[activityId] || 0;
    if (shiftDays === 0) return;
    
    const shiftAmount = shiftDays * direction; // -1 per indietro, +1 per avanti
    
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    if (activity.startDate) {
      const newStart = new Date(activity.startDate);
      newStart.setDate(newStart.getDate() + shiftAmount);
      onUpdateActivity(activity.id, 'startDate', formatDateToLocal(newStart));
    }
    if (activity.endDate) {
      const newEnd = new Date(activity.endDate);
      newEnd.setDate(newEnd.getDate() + shiftAmount);
      onUpdateActivity(activity.id, 'endDate', formatDateToLocal(newEnd));
    }
    
    setIndividualShifts(prev => ({ ...prev, [activityId]: 0 }));
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Configurazione Rapida Date</h3>
              
              {/* Global Shift Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="hidden sm:inline">Shift:</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={calculateShiftToToday}
                    className="h-8 px-2"
                    title="Calcola shift per portare a oggi"
                  >
                    <CalendarClock className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyGlobalShift(-1)}
                    disabled={globalShiftDays === 0}
                    className="h-8 px-2"
                    title="Sposta indietro"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <NumberInput
                    value={Math.abs(globalShiftDays)}
                    onChange={(value) => setGlobalShiftDays(Math.abs(value))}
                    placeholder="0"
                    min={0}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyGlobalShift(1)}
                    disabled={globalShiftDays === 0}
                    className="h-8 px-2"
                    title="Sposta avanti"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-gray-200">
                  <div className="col-span-3">
                    <p className="text-xs font-medium truncate" title={activity.name}>
                      {activity.name || 'Attività senza nome'}
                    </p>
                  </div>
                    <div className="col-span-6">
                      <Label className="text-xs text-gray-600 mb-1 block">Periodo</Label>
                      <DateRangePicker
                        key={`${activity.id}-${activity.startDate}-${activity.endDate}`}
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
                        placeholder="Seleziona periodo"
                      />
                    </div>
                  <div className="col-span-3">
                    <div className="flex items-end justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => applyIndividualShift(activity.id, -1)}
                        disabled={!individualShifts[activity.id] || individualShifts[activity.id] === 0}
                        className="h-8 px-1"
                        title="Sposta indietro"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </Button>
                      <NumberInput
                        value={Math.abs(individualShifts[activity.id] || 0)}
                        onChange={(value) => setIndividualShifts(prev => ({ 
                          ...prev, 
                          [activity.id]: Math.abs(value)
                        }))}
                        placeholder="0"
                        min={0}
                        className="w-12 h-8 text-xs text-center"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => applyIndividualShift(activity.id, 1)}
                        disabled={!individualShifts[activity.id] || individualShifts[activity.id] === 0}
                        className="h-8 px-1"
                        title="Sposta avanti"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
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
              <div className="flex-1 relative">
                <div className="absolute inset-0 flex">
                  {timeColumns.map((column, idx) => {
                    // Usa i giorni calcolati nella colonna
                    const totalDays = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const columnDays = column.days || 1;
                    const widthPercent = (columnDays / totalDays) * 100;
                    
                    return (
                      <div 
                        key={idx} 
                        className="text-center py-2 border-l border-gray-200 text-xs font-semibold"
                        style={{ width: `${widthPercent}%` }}
                      >
                        {column.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Righe delle attività */}
            <div className="space-y-2">
              {activitiesWithDates.map((activity) => {
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
                        {timeColumns.map((column, mIdx) => {
                          // Usa i giorni calcolati nella colonna
                          const totalDays = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          const columnDays = column.days || 1;
                          const widthPercent = (columnDays / totalDays) * 100;
                          
                          return (
                            <div 
                              key={mIdx} 
                              className="border-l border-gray-100"
                              style={{ width: `${widthPercent}%` }}
                            />
                          );
                        })}
                      </div>
                      
                       {/* Barra del Gantt */}
                       {position.isVisible && (
                         <div 
                           className="absolute top-1/2 -translate-y-1/2 h-8 rounded transition-all group-hover:shadow-md"
                           style={{
                             left: position.left,
                             width: position.width,
                             backgroundColor: '#6b7280', // gray-500
                             opacity: 0.85
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

