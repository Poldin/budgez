import React from 'react';

export interface MonthlyStats {
  twoMonthsAgo: { created: number; signed: number; conversionRate: number };
  lastMonth: { created: number; signed: number; conversionRate: number };
  currentMonth: { created: number; signed: number; conversionRate: number };
}

interface MonthlyStatsTableProps {
  monthlyStats: MonthlyStats;
}

export default function MonthlyStatsTable({ monthlyStats }: MonthlyStatsTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
      <div className="grid grid-cols-3 gap-4">
        {/* 2 mesi fa */}
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium text-center">
            {(() => {
              const date = new Date();
              date.setMonth(date.getMonth() - 2);
              return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
            })()}
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="text-2xl font-bold text-gray-900">
              {monthlyStats.twoMonthsAgo.signed}
            </div>
            <div className="flex flex-col">
              <div className="text-sm text-gray-500">
                {monthlyStats.twoMonthsAgo.created}
              </div>
              <div className="text-xs text-gray-500">
                {monthlyStats.twoMonthsAgo.conversionRate}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Mese scorso */}
        <div className="border-l border-r border-gray-200 px-4">
          <div className="text-xs text-gray-500 mb-2 font-medium text-center">
            {(() => {
              const date = new Date();
              date.setMonth(date.getMonth() - 1);
              return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
            })()}
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="text-2xl font-bold text-gray-900">
              {monthlyStats.lastMonth.signed}
            </div>
            <div className="flex flex-col">
              <div className="text-sm text-gray-500">
                {monthlyStats.lastMonth.created}
              </div>
              <div className="text-xs text-gray-500">
                {monthlyStats.lastMonth.conversionRate}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Mese attuale */}
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium text-center">
            {(() => {
              const date = new Date();
              return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
            })()}
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="text-2xl font-bold text-gray-900">
              {monthlyStats.currentMonth.signed}
            </div>
            <div className="flex flex-col">
              <div className="text-sm text-gray-500">
                {monthlyStats.currentMonth.created}
              </div>
              <div className="text-xs text-gray-500">
                {monthlyStats.currentMonth.conversionRate}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


