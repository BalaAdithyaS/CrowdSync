import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Location, ServiceCounter } from '@/types';
import { CrowdBadge } from '@/components/locations/CrowdBadge';
import { JoinQueueModal } from '@/components/queue/JoinQueueModal';
import { LocationMapView } from '@/components/locations/LocationMapView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getCategoryLabel } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { RealtimeSocket } from '@/lib/websocket';
import { 
  Clock, Users, MapPin, Bookmark, BookmarkCheck, 
  ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle, Plus
} from 'lucide-react';

export const LocationDetailPage: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [selectedCounter, setSelectedCounter] = useState<ServiceCounter | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const { data: location, isLoading, refetch } = useQuery<Location>({
    queryKey: ['location', locationId],
    queryFn: () => apiRequest<Location>(`/locations/${locationId}`),
    enabled: Boolean(locationId),
  });

  // Real-time live update for this location
  useEffect(() => {
    if (!locationId) return;
    const ws = new RealtimeSocket(`/ws/locations/${locationId}`);
    ws.connect();

    const unsubscribe = ws.subscribe((event) => {
      if (event.type === 'LOCATION_UPDATE') {
        refetch();
      }
    });

    return () => {
      unsubscribe();
      ws.close();
    };
  }, [locationId, refetch]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-2xl md:col-span-2" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Location Not Found</h2>
        <p className="text-xs text-slate-500">The requested campus location does not exist or has been deactivated.</p>
        <Link to="/explore">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const handleOpenJoinModal = (counter: ServiceCounter) => {
    setSelectedCounter(counter);
    setJoinModalOpen(true);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Back button */}
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all campus locations
      </Link>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 min-h-[260px] md:min-h-[320px] flex flex-col justify-end p-6 md:p-10 shadow-xl border border-slate-200 dark:border-slate-800">
        {location.image_url ? (
          <img
            src={location.image_url}
            alt={location.name}
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
              {getCategoryLabel(location.category)}
            </span>
            <CrowdBadge level={location.crowd_status} />
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {location.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
            {location.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              {location.address}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              {location.opening_hours}
            </span>
          </div>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Current Wait</span>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums mt-1">
            ~{location.current_wait_minutes} mins
          </div>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Waiting</span>
          <div className="text-2xl font-black text-violet-600 dark:text-violet-400 tabular-nums mt-1">
            {location.total_waiting} people
          </div>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Counters</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {location.active_counters_count} open
          </div>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Operating Status</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {location.is_active ? 'Open' : 'Closed'}
          </div>
        </Card>
      </div>

      {/* Service Counters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Available Service Counters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an open counter below to join its virtual queue from your phone.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {location.counters?.map((counter) => {
            const isClosed = counter.status !== 'OPEN';
            return (
              <Card
                key={counter.id}
                className={`p-5 flex flex-col justify-between space-y-4 transition-all ${
                  isClosed ? 'opacity-60 bg-slate-100/50 dark:bg-slate-900/40' : 'hover:border-violet-500/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                      Code {counter.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        counter.status === 'OPEN'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {counter.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {counter.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">In Line:</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                        {counter.active_queue_count} people
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Est. Wait:</span>
                      <p className="font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5 tabular-nums">
                        ~{counter.estimated_wait_minutes} mins
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant={isClosed ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={isClosed}
                  onClick={() => handleOpenJoinModal(counter)}
                  className="w-full font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {isClosed ? 'Counter Inactive' : 'Join Virtual Queue'}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Map location container */}
      <div className="space-y-3 pt-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Campus Map Location
        </h3>
        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <LocationMapView locations={[location]} selectedLocationId={location.id} />
        </div>
      </div>

      {/* Join Queue Modal */}
      {selectedCounter && (
        <JoinQueueModal
          isOpen={joinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          location={location}
          counter={selectedCounter}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
