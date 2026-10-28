import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { QueueSession, Location, NotificationItem } from '@/types';
import { QueueTicketCard } from '@/components/queue/QueueTicketCard';
import { LocationCard } from '@/components/locations/LocationCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Compass, Bookmark, Layers, Bell, ArrowRight, 
  Sparkles, Zap, CheckCircle2, AlertCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Active queues
  const { data: activeQueues = [], isLoading: queuesLoading, refetch: refetchQueues } = useQuery<QueueSession[]>({
    queryKey: ['my_active_queues'],
    queryFn: () => apiRequest<QueueSession[]>('/queues/me'),
    refetchInterval: 10000,
  });

  // Recommended less-crowded locations (LOW crowd)
  const { data: lowCrowdLocations = [], isLoading: locsLoading } = useQuery<Location[]>({
    queryKey: ['recommended_locations'],
    queryFn: () => apiRequest<Location[]>('/locations?crowd_status=LOW&sort_by=shortest_wait'),
  });

  // Saved Favorites
  const { data: favorites = [] } = useQuery<Location[]>({
    queryKey: ['my_favorites'],
    queryFn: () => apiRequest<Location[]>('/favorites'),
  });

  // Recent notifications
  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['recent_notifications'],
    queryFn: () => apiRequest<NotificationItem[]>('/notifications?limit=3'),
  });

  const handleLeaveQueue = async (sessionId: string, reason: string) => {
    await apiRequest(`/queues/${sessionId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    refetchQueues();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Contextual Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            Campus Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here is your live campus queue status and recommendations.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <Link to="/explore">
            <Button variant="primary" size="sm">
              <Compass className="w-4 h-4 mr-1" />
              Explore Locations
            </Button>
          </Link>
          <Link to="/app/favorites">
            <Button variant="outline" size="sm">
              <Bookmark className="w-4 h-4 mr-1" />
              Saved
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Queue Spotlight */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-500" />
            Active Virtual Queue Session
          </h2>
          <Link to="/app/queues" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            View All Queues
          </Link>
        </div>

        {queuesLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : activeQueues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeQueues.map((session) => (
              <QueueTicketCard
                key={session.id}
                session={session}
                onLeave={handleLeaveQueue}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-slate-50/70 dark:bg-slate-900/40 border-dashed border-2 border-slate-300 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              You are not currently in any virtual queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Explore open dining halls, libraries, or service desks to grab a ticket in advance.
            </p>
            <Link to="/explore">
              <Button size="sm">
                Browse Live Locations
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Grid: Recommended Less-Crowded Places & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recommended Less-Crowded Places */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Recommended Fast Hubs (Low Crowd)
            </h2>
            <Link to="/explore?crowd_status=LOW" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              See All Low Wait
            </Link>
          </div>

          {locsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-60 rounded-2xl" />
              <Skeleton className="h-60 rounded-2xl" />
            </div>
          ) : lowCrowdLocations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lowCrowdLocations.slice(0, 2).map((loc) => (
                <LocationCard key={loc.id} location={loc} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">All campus locations currently have moderate or active queue traffic.</p>
          )}
        </div>

        {/* Right: Recent Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-500" />
              Recent Activity
            </h2>
            <Link to="/app/notifications" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              Notification Center
            </Link>
          </div>

          <Card className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                No recent notifications.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
