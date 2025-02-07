import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BudgetLog {
  id: number;
  created_at: string;
  event: string;
  metadata: {
    bg?: string;
    logger_email?: string;  // Added logger_email to metadata
  };
  user: string;
}

interface BudgetLogsProps {
  budgetId: string;
}

export default function BudgetLogs({ budgetId }: BudgetLogsProps) {
  const [logs, setLogs] = useState<BudgetLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('budgets_logs')
          .select('*')
          .eq('busget_id', budgetId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [budgetId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48">Loading logs...</div>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-2 p-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between p-2 rounded-lg border"
        >
          <span className={`text-sm text-gray-800 px-2 py-1 rounded-lg ${log.metadata?.bg}`}>
            <b>{log.metadata?.logger_email || "qualcuno"}</b> {log.event}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(log.created_at)}
          </span>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No activity logs found
        </div>
      )}
    </div>
  );
}