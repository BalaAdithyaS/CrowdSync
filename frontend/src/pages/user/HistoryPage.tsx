import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { QueueSession } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/lib/utils';
import { History, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { data: history = [], isLoading } = useQuery<QueueSession[]>({
    queryKey: ['my_history_queues'],
    queryFn: () => apiRequest<QueueSession[]>('/queues/history?limit=50'),
  });

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Visit & Queue History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your completed service appointments and previous ticket sessions.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          {history.map((sess) => {
            const isCompleted = sess.status === 'COMPLETED';
            return (
              <Card key={sess.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {sess.ticket_number}
                      </span>
                      <Badge variant={isCompleted ? 'low' : 'default'}>
                        {sess.status}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {sess.location_name} • {sess.counter_name}
                    </h4>

                    {sess.cancellation_reason && (
                      <p className="text-xs text-rose-500">
                        Reason: {sess.cancellation_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <div>Joined: {formatRelativeTime(sess.joined_at)}</div>
                  {sess.completed_at && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Finished: {formatRelativeTime(sess.completed_at)}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <History className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No previous sessions</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your completed and cancelled virtual queue tickets will appear here once you join and finish service sessions.
          </p>
        </div>
      )}
    </div>
  );
};
