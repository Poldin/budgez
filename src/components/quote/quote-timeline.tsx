'use client'

import React from 'react';
import type { Activity } from '@/types/budget';
import GanttChart from '@/components/gantt-chart';

interface QuoteTimelineProps {
  activities: Activity[];
}

export default function QuoteTimeline({ activities }: QuoteTimelineProps) {
  const activitiesWithDates = activities.filter(a => a.startDate && a.endDate);
  
  if (activitiesWithDates.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-gray-900 pb-2 mb-4">
          Timeline Progetto
        </h2>
        <GanttChart 
          activities={activities}
          onUpdateActivity={() => {}} // Non modificabile nella visualizzazione
        />
      </div>
    </div>
  );
}

