import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { QueueSession } from '@/types';
import { QueueTicketCard } from '@/components/queue/QueueTicketCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { RealtimeSocket } from '@/lib/websocket';
import { useNotifications } from '@/context/NotificationContext';
import { 
  ArrowLeft, Wifi, WifiOff, Volume2, CheckCircle2, 
  MapPin, Clock, Info, ShieldCheck, Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QueueTrackingPage: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [wsConnected, setWsConnected] = useState(false);

  const { data: session, isLoading, refetch } = useQuery<QueueSession>({
    queryKey: ['queue_session', queueId],
    queryFn: () => apiRequest<QueueSession>(`/queues/${queueId}`),
    enabled: Boolean(queueId),
    refetchInterval: 6000,
  });

  // WebSocket live connection to queue channel
  useEffect(() => {
    if (!queueId) return;

    const ws = new RealtimeSocket(`/ws/queues/${queueId}`);
    ws.connect();
    setWsConnected(true);

    const unsubscribe = ws.subscribe((event) => {
      if (event.type === 'QUEUE_UPDATE') {
        refetch();
        if (event.data?.status === 'CALLED') {
          confetti({ particleCount: 75, spread: 80, origin: { y: 0.5 } });
        }
      }
    });

    return () => {
      unsubscribe();
      ws.close();
      setWsConnected(false);
    };
  }, [queueId, refetch]);

  const handleLeave = async (sessionId: string, reason: string) => {
    await apiRequest(`/queues/${sessionId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    addToast({
      type: 'info',
      title: 'Ticket Surrendered',
      message: 'You have successfully left the queue.',
    });
    navigate('/app/queues');
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Ticket Not Found</h2>
        <p className="text-xs text-slate-500">This queue session could not be retrieved.</p>
        <Link to="/app/queues">
          <Button variant="outline" size="sm">Back to Queues</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Bar with Live Indicator */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/queues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Queues
        </Link>

        {/* WebSocket Live Status indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {wsConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400">Live Sync Connected</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-600 dark:text-amber-400">Polling Telemetry</span>
            </>
          )}
        </div>
      </div>

      {/* Main Ticket Card Component */}
      <QueueTicketCard
        session={session}
        onLeave={handleLeave}
        detailed={true}
      />

      {/* Campus Arrival Instructions */}
      <Card className="p-6 space-y-4 bg-slate-50/60 dark:bg-slate-900/40">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-violet-500" />
          Where to report when your ticket is called
        </h4>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
          <p>
            Please proceed to <strong className="text-slate-900 dark:text-slate-100">{session.location_name}</strong> and look for <strong className="text-slate-900 dark:text-slate-100">{session.counter_name}</strong>.
          </p>
          <p>
            When called, display your ticket number <strong className="font-mono text-violet-600 dark:text-violet-400">{session.ticket_number}</strong> to the operator at the counter desk.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <Link to={`/locations/${session.location_id}`}>
            <Button variant="outline" size="sm">
              View Location Map & Hours
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
