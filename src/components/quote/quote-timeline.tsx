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
    <div className="mt-8 mb-8">
      <GanttChart 
        activities={activities}
        onUpdateActivity={() => {}} // Non modificabile nella visualizzazione
        hideConfig={true}
      />
    </div>
  );
}

