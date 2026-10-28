import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { QueueSession } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatTimeRange, formatRelativeTime } from '@/lib/utils';
import { 
  Clock, Users, CheckCircle2, AlertTriangle, ArrowRight, 
  Sparkles, ExternalLink, Volume2, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QueueTicketCardProps {
  session: QueueSession;
  onLeave?: (sessionId: string, reason: string) => Promise<void>;
  detailed?: boolean;
}

export const QueueTicketCard: React.FC<QueueTicketCardProps> = ({
  session,
  onLeave,
  detailed = false,
}) => {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveReason, setLeaveReason] = useState('Changed plans');
  const [showExplanation, setShowExplanation] = useState(false);

  const isCalled = session.status === 'CALLED';
  const isServing = session.status === 'SERVING';
  const isCompleted = session.status === 'COMPLETED';
  const isApproaching = session.status === 'APPROACHING';
  const isCancelled = session.status === 'CANCELLED' || session.status === 'NO_SHOW';

  const triggerCelebration = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleConfirmLeave = async () => {
    if (!onLeave) return;
    setIsLeaving(true);
    try {
      await onLeave(session.id, leaveReason);
      setLeaveModalOpen(false);
    } finally {
      setIsLeaving(false);
    }
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'WAITING':
        return { label: 'In Queue', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' };
      case 'APPROACHING':
        return { label: 'Almost Ready', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'CALLED':
        return { label: 'Ticket Called!', color: 'bg-emerald-500 text-white border-emerald-600 animate-bounce' };
      case 'SERVING':
        return { label: 'At Counter (Serving)', color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' };
      case 'COMPLETED':
        return { label: 'Completed', color: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent' };
      case 'NO_SHOW':
        return { label: 'No Show', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      <Card
        className={`overflow-hidden border transition-all ${
          isCalled
            ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
            : isApproaching
            ? 'ring-1 ring-amber-500/50 shadow-md shadow-amber-500/10'
            : ''
        }`}
      >
        {/* Urgent Call Alert Banner */}
        {isCalled && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold animate-pulse">
            <span className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              IT IS YOUR TURN! Please report to {session.counter_name} immediately.
            </span>
            <button
              onClick={triggerCelebration}
              className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              Acknowledge
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                {session.location_name}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {session.counter_name}
              </h3>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${statusBadge.color}`}
            >
              {statusBadge.label}
            </span>
          </div>

          {/* Big Ticket and Position Display */}
          <div className="my-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Your Ticket Number</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5">
                {session.ticket_number}
              </div>
            </div>

            {!isCompleted && !isCancelled && (
              <div className="flex items-center gap-6 divide-x divide-slate-200 dark:divide-slate-800">
                <div className="text-center px-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Position</span>
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                    {session.queue_position > 0 ? `#${session.queue_position}` : 'At Desk'}
                  </div>
                </div>

                <div className="text-center pl-6">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Estimated Wait</span>
                  <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {session.status === 'CALLED' || session.status === 'SERVING'
                      ? 'Now'
                      : formatTimeRange(session.estimated_wait_range_min, session.estimated_wait_range_max)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Estimation Explanation Accordion */}
          {!isCompleted && !isCancelled && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-violet-500" />
                <span>How is this wait calculated?</span>
                <span className="text-[10px] text-slate-400">({showExplanation ? 'Hide' : 'Show details'})</span>
              </button>

              {showExplanation && (
                <div className="mt-2.5 p-3.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>{session.estimation_explanation}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 italic">
                    Uncertainty interval accounts for observed service variance. You will receive an alert when you are next in line.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Timeline indicator */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
              <span>Joined: {formatRelativeTime(session.joined_at)}</span>
              {session.called_at && <span>Called: {formatRelativeTime(session.called_at)}</span>}
              {session.completed_at && <span>Done: {formatRelativeTime(session.completed_at)}</span>}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 mt-4">
              {!detailed ? (
                <Link to={`/app/queues/${session.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <span>Live Tracking View</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              ) : null}

              {!isCompleted && !isCancelled && onLeave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeaveModalOpen(true)}
                  className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Leave Queue
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Leave Queue Confirmation Modal */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Leave Virtual Queue?"
        description={`Are you sure you want to surrender your spot for ticket ${session.ticket_number}?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Surrendering your ticket will release your position in line. If you change your mind later, you will need to take a new ticket at the back of the queue.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Reason (Optional):
            </label>
            <select
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="Changed plans">Changed plans</option>
              <option value="Joined another counter">Found a shorter queue</option>
              <option value="Class or meeting starting">Class or meeting starting</option>
              <option value="Waited too long">Wait longer than expected</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setLeaveModalOpen(false)}>
              Keep My Ticket
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isLeaving}
              onClick={handleConfirmLeave}
            >
              Confirm Leave
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
