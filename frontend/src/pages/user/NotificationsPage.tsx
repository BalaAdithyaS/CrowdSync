import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { NotificationItem } from '@/types';
import { useNotifications } from '@/context/NotificationContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, CheckCheck, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { refreshUnreadCount } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: notifications = [], isLoading, refetch } = useQuery<NotificationItem[]>({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => apiRequest<NotificationItem[]>(`/notifications?unread_only=${unreadOnly}`),
  });

  const handleMarkRead = async (id: string) => {
    await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    refetch();
    refreshUnreadCount();
  };

  const handleMarkAllRead = async () => {
    await apiRequest('/notifications/read-all', { method: 'POST' });
    refetch();
    refreshUnreadCount();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TICKET_CALLED':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'QUEUE_COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-violet-500" />;
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time updates regarding your tickets, wait times, and turns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={unreadOnly ? 'bg-violet-50 dark:bg-violet-950 text-violet-600' : ''}
          >
            {unreadOnly ? 'Showing Unread' : 'Filter Unread'}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1 text-slate-500" />
            Mark All Read
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                !n.is_read ? 'bg-violet-50/40 dark:bg-violet-950/20 border-violet-200/60 dark:border-violet-800/40' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{n.title}</h4>
                  <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600 shrink-0 mt-2" />
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Bell className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Inbox is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are all caught up! You will be notified here whenever you join a queue or your ticket is called.
          </p>
        </div>
      )}
    </div>
  );
};
