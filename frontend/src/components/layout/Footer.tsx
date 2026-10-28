import React from 'react';
import { Link } from 'react-router-dom';
import { Users2, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                  <Users2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Crowd<span className="text-violet-600 dark:text-violet-400">Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Intelligent real-time crowd and queue management platform. Built to minimize campus waiting times and streamline operations.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Campus Telemetry Active
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><Link to="/explore" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Campus Locations</Link></li>
              <li><Link to="/explore?category=cafeteria" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Dining & Cafeterias</Link></li>
              <li><Link to="/explore?category=library" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Central Library</Link></li>
              <li><Link to="/explore?category=service_counter" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Student Care Desks</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><Link to="/app" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">User Dashboard</Link></li>
              <li><Link to="/app/queues" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Virtual Queue Tracker</Link></li>
              <li><Link to="/admin" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Administrative Overview</Link></li>
              <li><Link to="/admin/analytics" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Queue Analytics</Link></li>
            </ul>
          </div>

          {/* Trust & Simulation notice */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Telemetry Notice
            </h4>
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                Transparent Estimates
              </div>
              Wait estimates represent predictive models based on active queues and observed transaction durations. Actual service times may vary based on transaction complexity.
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} CrowdSync Platform. Designed for Modern Campuses.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for intelligent crowd synchronization.
          </p>
        </div>
      </div>
    </footer>
  );
};
