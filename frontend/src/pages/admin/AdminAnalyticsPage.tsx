import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { 
  AnalyticsOverview, VolumeTrendPoint, WaitTimeAccuracyPoint, 
  CounterPerformancePoint, LocationComparisonPoint, Location 
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area 
} from 'recharts';
import { Activity, Clock, Users, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => apiRequest<Location[]>('/locations'),
  });

  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics_overview', selectedLocation],
    queryFn: () => {
      const q = selectedLocation ? `?location_id=${selectedLocation}` : '';
      return apiRequest<AnalyticsOverview>(`/analytics/overview${q}`);
    },
  });

  const { data: volumeTrends = [], isLoading: trendsLoading } = useQuery<VolumeTrendPoint[]>({
    queryKey: ['analytics_trends', selectedLocation],
    queryFn: () => {
      const q = selectedLocation ? `?location_id=${selectedLocation}` : '';
      return apiRequest<VolumeTrendPoint[]>(`/analytics/crowd-trends${q}`);
    },
  });

  const { data: waitAccuracy = [], isLoading: accuracyLoading } = useQuery<WaitTimeAccuracyPoint[]>({
    queryKey: ['analytics_accuracy', selectedLocation],
    queryFn: () => {
      const q = selectedLocation ? `?location_id=${selectedLocation}` : '';
      return apiRequest<WaitTimeAccuracyPoint[]>(`/analytics/wait-times${q}`);
    },
  });

  const { data: counterPerformance = [] } = useQuery<CounterPerformancePoint[]>({
    queryKey: ['analytics_counter_perf', selectedLocation],
    queryFn: () => {
      const q = selectedLocation ? `?location_id=${selectedLocation}` : '';
      return apiRequest<CounterPerformancePoint[]>(`/analytics/counter-performance${q}`);
    },
  });

  const { data: locationComparisons = [] } = useQuery<LocationComparisonPoint[]>({
    queryKey: ['analytics_location_comparisons'],
    queryFn: () => apiRequest<LocationComparisonPoint[]>('/analytics/location-comparisons'),
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Operational Analytics
            </h1>
            {overview?.is_demo_data && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                CAMPUS DEMO DATASET
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Throughput analysis, wait estimation precision, and counter capacity utilization.
          </p>
        </div>

        {/* Location Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="">All Campus Facilities</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart 1: Hourly Queue Volume & Completions */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              Queue Traffic & Completions by Hour
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total virtual queue sessions joined vs successfully completed across operational hours.
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="volume" name="Queue Registrations" stroke="#8b5cf6" fillOpacity={1} fill="url(#volGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" name="Completed Sessions" stroke="#06b6d4" fillOpacity={1} fill="url(#compGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid: Wait Time Accuracy & Counter Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wait Time Accuracy Chart */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-500" />
              Wait Time Accuracy (Estimated vs Actual)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates predictive model accuracy against observed customer wait durations.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waitAccuracy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time_label" tick={{ fontSize: 11 }} />
                <YAxis unit="m" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="estimated_minutes" name="Predicted Wait (min)" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="actual_minutes" name="Actual Wait (min)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Location Crowding Comparison */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Live Facility Crowding Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active student waiting counts across distinct campus facilities.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="location_name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="current_waiting" name="Waiting Students" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Counter Throughput Table */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Individual Counter Service Speed & Utilization
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Counter</th>
                <th className="py-2.5 px-3">Facility</th>
                <th className="py-2.5 px-3 text-center">Served Today</th>
                <th className="py-2.5 px-3 text-center">Avg Transaction Time</th>
                <th className="py-2.5 px-3 text-right">Capacity Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {counterPerformance.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-semibold">{c.counter_name}</td>
                  <td className="py-3 px-3 text-slate-500">{c.location_name}</td>
                  <td className="py-3 px-3 text-center tabular-nums">{c.served_count}</td>
                  <td className="py-3 px-3 text-center tabular-nums">{c.avg_service_minutes} mins</td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {c.utilization_percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
