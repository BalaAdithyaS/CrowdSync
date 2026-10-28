import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { AnalyticsOverview, Location } from '@/types';
import { StatCard } from '@/components/admin/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, Clock, CheckCircle2, XCircle, 
  Layers, AlertTriangle, ArrowRight, Activity, PhoneCall
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const { data: overview, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['admin_overview'],
    queryFn: () => apiRequest<AnalyticsOverview>('/admin/overview'),
    refetchInterval: 10000,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => apiRequest<Location[]>('/locations'),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Operational Overview
            </h1>
            {overview?.is_demo_data && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                DEMO SIMULATION ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time campus crowd telemetry, active queue depths, and operator controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/queues">
            <Button variant="primary" size="sm">
              <Layers className="w-4 h-4 mr-1" />
              Live Queue Console
            </Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-1" />
              Detailed Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="People Waiting"
          value={overview?.current_waiting ?? 0}
          subtitle="Across all open campus counters"
          icon={Users}
          variant="violet"
        />
        <StatCard
          title="Active Counters"
          value={overview?.active_counters ?? 0}
          subtitle={`At ${overview?.total_locations ?? 0} campus locations`}
          icon={Building2}
          variant="cyan"
        />
        <StatCard
          title="Average Wait Time"
          value={`${overview?.avg_wait_minutes ?? 0} min`}
          subtitle="Based on actual service observations"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Completed Today"
          value={overview?.completed_today ?? 0}
          subtitle={`${overview?.cancelled_today ?? 0} cancellations`}
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Longest Queue Spotlight Alert */}
      {overview && overview.longest_queue_count > 0 && (
        <Card className="p-4 bg-gradient-to-r from-violet-500/10 via-slate-50 to-cyan-500/10 dark:from-violet-950/20 dark:via-slate-900 dark:to-cyan-950/20 border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600 text-white shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Peak Demand Hub: {overview.longest_queue_location}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Currently holding the highest queue volume with {overview.longest_queue_count} students waiting.
              </p>
            </div>
          </div>
          <Link to="/admin/queues">
            <Button size="sm" variant="outline">
              Manage Queue
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </Card>
      )}

      {/* Campus Locations Status Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Active Campus Locations Telemetry
          </h2>
          <Link to="/admin/locations" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            Manage Locations & Counters →
          </Link>
        </div>

        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Crowd Condition</th>
                <th className="py-3.5 px-4 text-center">People Waiting</th>
                <th className="py-3.5 px-4 text-center">Active Counters</th>
                <th className="py-3.5 px-4 text-right">Estimated Wait</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {loc.name}
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-500 dark:text-slate-400">
                    {loc.category.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        loc.crowd_status === 'LOW'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : loc.crowd_status === 'MODERATE'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        loc.crowd_status === 'LOW'
                          ? 'bg-emerald-500'
                          : loc.crowd_status === 'MODERATE'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`} />
                      {loc.crowd_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold tabular-nums">
                    {loc.total_waiting}
                  </td>
                  <td className="py-3.5 px-4 text-center tabular-nums">
                    {loc.active_counters_count}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    ~{loc.current_wait_minutes} mins
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link to={`/admin/locations/${loc.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Manage Counters
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
