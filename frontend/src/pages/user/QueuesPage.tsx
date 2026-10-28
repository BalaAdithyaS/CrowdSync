import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { QueueSession } from '@/types';
import { QueueTicketCard } from '@/components/queue/QueueTicketCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Layers, History, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QueuesPage: React.FC = () => {
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const { data: activeQueues = [], isLoading: activeLoading, refetch: refetchActive } = useQuery<QueueSession[]>({
    queryKey: ['my_active_queues'],
    queryFn: () => apiRequest<QueueSession[]>('/queues/me'),
    refetchInterval: 8000,
  });

  const { data: historyQueues = [], isLoading: historyLoading } = useQuery<QueueSession[]>({
    queryKey: ['my_history_queues'],
    queryFn: () => apiRequest<QueueSession[]>('/queues/history'),
    enabled: tab === 'history',
  });

  const handleLeaveQueue = async (sessionId: string, reason: string) => {
    await apiRequest(`/queues/${sessionId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    refetchActive();
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Virtual Queues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active tickets in real-time or review past service sessions.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl self-start sm:self-auto border border-slate-300/60 dark:border-slate-800">
          <button
            onClick={() => setTab('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === 'active'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-violet-500" />
            Active ({activeQueues.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === 'history'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5 text-cyan-500" />
            Previous Sessions
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'active' ? (
        activeLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-60 rounded-2xl" />
            <Skeleton className="h-60 rounded-2xl" />
          </div>
        ) : activeQueues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeQueues.map((session) => (
              <QueueTicketCard
                key={session.id}
                session={session}
                onLeave={handleLeaveQueue}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No active tickets
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't joined any queues today. Explore campus dining, library desks, or clinic counters to reserve your turn.
            </p>
            <Link to="/explore">
              <Button size="sm">
                <Compass className="w-4 h-4 mr-1" />
                Explore Locations
              </Button>
            </Link>
          </div>
        )
      ) : historyLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : historyQueues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {historyQueues.map((session) => (
            <QueueTicketCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-xs text-slate-500">
          No previous queue history found.
        </div>
      )}
    </div>
  );
};
