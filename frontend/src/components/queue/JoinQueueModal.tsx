import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Location, ServiceCounter } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Clock, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface JoinQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  counter: ServiceCounter;
  onSuccess?: () => void;
}

export const JoinQueueModal: React.FC<JoinQueueModalProps> = ({
  isOpen,
  onClose,
  location,
  counter,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      addToast({
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in or create an account to take a queue ticket.',
      });
      navigate('/login');
      return;
    }

    setIsJoining(true);
    try {
      const session = await apiRequest('/queues/join', {
        method: 'POST',
        body: JSON.stringify({ counter_id: counter.id }),
      });

      addToast({
        type: 'success',
        title: 'Queue Ticket Issued!',
        message: `Your ticket ${session.ticket_number} is active at position #${session.queue_position}.`,
      });

      onSuccess?.();
      onClose();
      navigate(`/app/queues/${session.id}`);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Unable to Join Queue',
        message: err.message || 'Queue request failed.',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const isCounterClosed = counter.status !== 'OPEN';
  const isAtCapacity = counter.active_queue_count >= counter.queue_capacity;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Virtual Queue"
      description={location.name}
    >
      <div className="space-y-4">
        {/* Counter Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{counter.name}</h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
              Code: {counter.code}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-200/60 dark:border-slate-800/60">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Current Queue:</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-violet-500" />
                {counter.active_queue_count} people waiting
              </p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Estimated Wait:</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                ~{counter.estimated_wait_minutes} mins
              </p>
            </div>
          </div>
        </div>

        {/* Warning if closed or full */}
        {isCounterClosed ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>This counter is currently {counter.status.toLowerCase()} and cannot accept new queue registrations.</p>
          </div>
        ) : isAtCapacity ? (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Queue capacity limit ({counter.queue_capacity} people) reached. Please check back shortly.</p>
          </div>
        ) : (
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
            <p className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Live notifications enabled for your turn.
            </p>
            <p>• You may track your position from anywhere on campus.</p>
            <p>• Please report promptly when ticket status updates to "CALLED".</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isJoining}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isJoining}
            disabled={isCounterClosed || isAtCapacity}
            onClick={handleJoin}
          >
            Confirm & Join Queue
          </Button>
        </div>
      </div>
    </Modal>
  );
};
