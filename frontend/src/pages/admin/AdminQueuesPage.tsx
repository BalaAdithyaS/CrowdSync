import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { AdminQueueSession, Location, ServiceCounter } from '@/types';
import { LiveQueueTable } from '@/components/admin/LiveQueueTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useNotifications } from '@/context/NotificationContext';
import { PhoneCall, Layers, Filter, RefreshCw } from 'lucide-react';

export const AdminQueuesPage: React.FC = () => {
  const { addToast } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [isCallingNext, setIsCallingNext] = useState(false);

  // Fetch locations for filters and counter picking
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => apiRequest<Location[]>('/locations'),
  });

  // Fetch active admin queues
  const { data: queues = [], isLoading, refetch } = useQuery<AdminQueueSession[]>({
    queryKey: ['admin_queues', statusFilter, locationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status_filter', statusFilter);
      if (locationFilter) params.append('location_id', locationFilter);
      return apiRequest<AdminQueueSession[]>(`/admin/queues?${params.toString()}`);
    },
    refetchInterval: 5000,
  });

  // Collect all counters across locations
  const allCounters: { counter: ServiceCounter; locName: string }[] = [];
  locations.forEach((loc) => {
    loc.counters?.forEach((c) => {
      allCounters.push({ counter: c, locName: loc.name });
    });
  });

  const handleCallNextTicket = async (counterId: string) => {
    setIsCallingNext(true);
    try {
      const res = await apiRequest(`/admin/counters/${counterId}/call-next`, {
        method: 'POST',
      });
      if (res.called) {
        addToast({
          type: 'success',
          title: 'Ticket Called',
          message: res.message,
        });
      } else {
        addToast({
          type: 'info',
          title: 'No Tickets Waiting',
          message: res.message,
        });
      }
      refetch();
      setCallModalOpen(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Calling Ticket',
        message: err.message,
      });
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleStartService = async (id: string) => {
    try {
      await apiRequest(`/admin/queues/${id}/start-service`, { method: 'POST' });
      addToast({
        type: 'success',
        title: 'Service Started',
        message: 'Customer service commenced.',
      });
      refetch();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.message });
    }
  };

  const handleCompleteService = async (id: string) => {
    try {
      await apiRequest(`/admin/queues/${id}/complete`, { method: 'POST' });
      addToast({
        type: 'success',
        title: 'Service Completed',
        message: 'Queue ticket recorded as completed.',
      });
      refetch();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.message });
    }
  };

  const handleMarkNoShow = async (id: string) => {
    try {
      await apiRequest(`/admin/queues/${id}/no-show`, { method: 'POST' });
      addToast({
        type: 'warning',
        title: 'Marked No-Show',
        message: 'Ticket expired as customer did not appear.',
      });
      refetch();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.message });
    }
  };

  const handleCancelTicket = async (id: string) => {
    try {
      await apiRequest(`/admin/queues/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cancelled by operator desk' }),
      });
      addToast({
        type: 'info',
        title: 'Ticket Cancelled',
        message: 'Session has been cancelled.',
      });
      refetch();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.message });
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Live Queue Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time queue monitoring table and operator dispatch actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (allCounters.length > 0) setSelectedCounterId(allCounters[0].counter.id);
              setCallModalOpen(true);
            }}
          >
            <PhoneCall className="w-4 h-4 mr-1" />
            Call Next Ticket
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Active Statuses</option>
            <option value="WAITING">Waiting Only</option>
            <option value="APPROACHING">Approaching</option>
            <option value="CALLED">Called Only</option>
            <option value="SERVING">Serving</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 tabular-nums">
          Showing <strong>{queues.length}</strong> active tickets
        </div>
      </div>

      {/* Live Queues Table */}
      <LiveQueueTable
        queues={queues}
        onStartService={handleStartService}
        onComplete={handleCompleteService}
        onNoShow={handleMarkNoShow}
        onCancel={handleCancelTicket}
        isLoading={isLoading}
      />

      {/* Call Next Ticket Modal */}
      <Modal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        title="Call Next Ticket"
        description="Select a service counter to summon the next student in line."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Service Counter
            </label>
            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {allCounters.map(({ counter, locName }) => (
                <option key={counter.id} value={counter.id}>
                  {locName} — {counter.name} ({counter.active_queue_count} waiting)
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Calling will immediately advance the highest-priority ticket to "CALLED" status and dispatch an alert to the user's phone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCallModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isCallingNext}
              onClick={() => handleCallNextTicket(selectedCounterId)}
            >
              <PhoneCall className="w-4 h-4 mr-1" />
              Call Ticket Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
