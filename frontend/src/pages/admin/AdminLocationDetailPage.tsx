import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Location, ServiceCounter } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/context/NotificationContext';
import { 
  ArrowLeft, Plus, PhoneCall, Power, Pause, Play, 
  Clock, Users, AlertCircle, Settings
} from 'lucide-react';

export const AdminLocationDetailPage: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { addToast } = useNotifications();

  const [createCounterModal, setCreateCounterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Counter form state
  const [counterName, setCounterName] = useState('');
  const [counterCode, setCounterCode] = useState('');
  const [avgDuration, setAvgDuration] = useState(180);
  const [capacity, setCapacity] = useState(40);

  const { data: location, isLoading, refetch } = useQuery<Location>({
    queryKey: ['location', locationId],
    queryFn: () => apiRequest<Location>(`/locations/${locationId}`),
    enabled: Boolean(locationId),
  });

  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;
    setIsSubmitting(true);
    try {
      await apiRequest('/admin/counters', {
        method: 'POST',
        body: JSON.stringify({
          location_id: locationId,
          name: counterName,
          code: counterCode.toUpperCase(),
          status: 'OPEN',
          average_service_seconds: Number(avgDuration),
          queue_capacity: Number(capacity),
        }),
      });

      addToast({
        type: 'success',
        title: 'Counter Added',
        message: `${counterName} is now active at ${location?.name}.`,
      });
      refetch();
      setCreateCounterModal(false);
      setCounterName('');
      setCounterCode('');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCounterStatus = async (counter: ServiceCounter, newStatus: string) => {
    try {
      await apiRequest(`/admin/counters/${counter.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      addToast({
        type: 'info',
        title: 'Counter Status Updated',
        message: `${counter.name} is now ${newStatus}.`,
      });
      refetch();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.message });
    }
  };

  const handleCallNext = async (counterId: string) => {
    try {
      const res = await apiRequest(`/admin/counters/${counterId}/call-next`, {
        method: 'POST',
      });
      if (res.called) {
        addToast({ type: 'success', title: 'Ticket Called', message: res.message });
      } else {
        addToast({ type: 'info', title: 'No Waiting Tickets', message: res.message });
      }
      refetch();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!location) return null;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <Link
        to="/admin/locations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Locations
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            {location.category.replace('_', ' ')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {location.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {location.address} • {location.counters?.length ?? 0} counters configured
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setCreateCounterModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Service Counter
        </Button>
      </div>

      {/* Counters Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Service Counters & Operator Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {location.counters?.map((c) => (
            <Card key={c.id} className="p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    Code {c.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'OPEN'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : c.status === 'PAUSED'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {c.name}
                </h3>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Waiting Now</span>
                    <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
                      {c.active_queue_count} students
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Avg Duration</span>
                    <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
                      {Math.round(c.average_service_seconds / 60)} mins/person
                    </strong>
                  </div>
                </div>
              </div>

              {/* Operator Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={c.status !== 'OPEN'}
                  onClick={() => handleCallNext(c.id)}
                >
                  <PhoneCall className="w-3.5 h-3.5 mr-1" />
                  Call Next Ticket
                </Button>

                <div className="flex items-center gap-2">
                  {c.status === 'OPEN' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-amber-600 dark:text-amber-400"
                      onClick={() => handleToggleCounterStatus(c, 'PAUSED')}
                    >
                      <Pause className="w-3.5 h-3.5 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-emerald-600 dark:text-emerald-400"
                      onClick={() => handleToggleCounterStatus(c, 'OPEN')}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Open
                    </Button>
                  )}

                  {c.status !== 'CLOSED' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-rose-600 dark:text-rose-400"
                      onClick={() => handleToggleCounterStatus(c, 'CLOSED')}
                    >
                      <Power className="w-3.5 h-3.5 mr-1" />
                      Close
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Counter Modal */}
      <Modal
        isOpen={createCounterModal}
        onClose={() => setCreateCounterModal(false)}
        title="Add Service Counter"
        description={`Add a new serving desk to ${location.name}.`}
      >
        <form onSubmit={handleCreateCounter} className="space-y-4">
          <Input
            label="Counter Name"
            type="text"
            value={counterName}
            onChange={(e) => setCounterName(e.target.value)}
            placeholder="e.g. Counter D - Beverage & Pastry"
            required
          />

          <Input
            label="Counter Short Code"
            type="text"
            value={counterCode}
            onChange={(e) => setCounterCode(e.target.value)}
            placeholder="e.g. D or EXP"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Avg Service Time (sec)"
              type="number"
              value={avgDuration}
              onChange={(e) => setAvgDuration(Number(e.target.value))}
              required
            />
            <Input
              label="Queue Max Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateCounterModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Add Counter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
