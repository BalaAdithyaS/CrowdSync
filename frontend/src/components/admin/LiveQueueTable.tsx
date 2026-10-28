import React from 'react';
import type { AdminQueueSession } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { PhoneCall, Play, CheckCircle2, UserX, XCircle } from 'lucide-react';

interface LiveQueueTableProps {
  queues: AdminQueueSession[];
  onStartService?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  onCancel?: (id: string) => void;
  isLoading?: boolean;
}

export const LiveQueueTable: React.FC<LiveQueueTableProps> = ({
  queues,
  onStartService,
  onComplete,
  onNoShow,
  onCancel,
  isLoading = false,
}) => {
  if (queues.length === 0 && !isLoading) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          No queue sessions currently matching the selected filters.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="violet">Waiting</Badge>;
      case 'APPROACHING':
        return <Badge variant="mod">Approaching</Badge>;
      case 'CALLED':
        return <Badge variant="cyan">Called</Badge>;
      case 'SERVING':
        return <Badge variant="low">Serving</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">Completed</Badge>;
      case 'NO_SHOW':
        return <Badge variant="high">No Show</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          <tr>
            <th className="py-3.5 px-4">Ticket</th>
            <th className="py-3.5 px-4">Location & Counter</th>
            <th className="py-3.5 px-4">User</th>
            <th className="py-3.5 px-4 text-center">Pos</th>
            <th className="py-3.5 px-4">Joined</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Operator Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
          {queues.map((q) => (
            <tr
              key={q.id}
              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                q.status === 'CALLED' ? 'bg-cyan-50/30 dark:bg-cyan-950/20' : ''
              }`}
            >
              <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {q.ticket_number}
              </td>
              <td className="py-3.5 px-4">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{q.location_name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{q.counter_name}</div>
              </td>
              <td className="py-3.5 px-4">
                <div className="font-medium text-slate-900 dark:text-slate-100">{q.user_name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{q.user_email}</div>
              </td>
              <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {['WAITING', 'APPROACHING'].includes(q.status) ? `#${q.queue_position}` : '-'}
              </td>
              <td className="py-3.5 px-4 tabular-nums text-slate-500 dark:text-slate-400">
                {formatRelativeTime(q.joined_at)}
              </td>
              <td className="py-3.5 px-4">{getStatusBadge(q.status)}</td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {q.status === 'CALLED' && onStartService && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onStartService(q.id)}
                      className="text-xs h-7 px-2.5"
                    >
                      <Play className="w-3 h-3" />
                      Start Service
                    </Button>
                  )}

                  {q.status === 'SERVING' && onComplete && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => onComplete(q.id)}
                      className="text-xs h-7 px-2.5"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Complete
                    </Button>
                  )}

                  {q.status === 'CALLED' && onNoShow && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onNoShow(q.id)}
                      className="text-xs h-7 px-2.5"
                    >
                      <UserX className="w-3 h-3" />
                      No Show
                    </Button>
                  )}

                  {['WAITING', 'APPROACHING'].includes(q.status) && onCancel && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancel(q.id)}
                      className="text-xs h-7 px-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
