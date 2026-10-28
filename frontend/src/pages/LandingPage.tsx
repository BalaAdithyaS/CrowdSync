import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CrowdBadge } from '@/components/locations/CrowdBadge';
import { 
  Users2, Clock, Sparkles, Bell, Shield, ArrowRight, 
  CheckCircle2, Compass, Zap, Building2, MapPin
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Subtle gradient backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
                <span>Next-Gen Campus Telemetry & Virtual Queuing</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]"
              >
                Your time is worth <br />
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                  more than waiting.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
              >
                Discover live crowd conditions, find faster queues, and move through your day with CrowdSync. Purpose-built for cafeterias, libraries, service desks, and clinics.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2"
              >
                <Link to="/explore" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto font-semibold">
                    <Compass className="w-5 h-5 mr-1" />
                    Explore Live Locations
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium">
                    See how it works
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </motion.div>

              {/* Campus trust bar */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Real-time Queue Prediction
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  Instant Virtual Tickets
                </span>
              </div>
            </div>

            {/* Right Product Preview Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md w-full">
                {/* Glow ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-3xl blur-xl opacity-30 dark:opacity-40 animate-pulse" />

                {/* Simulated Live Product Card */}
                <Card className="relative p-5 shadow-2xl space-y-4">
                  {/* Status header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Live Campus Feed
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      CAMPUS LIVE
                    </span>
                  </div>

                  {/* Sample 1: Cafeteria */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Central Food Park & Cafeteria
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Counter A • Express Lunch
                        </p>
                      </div>
                      <CrowdBadge level="MODERATE" />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-500" />
                        Est. Wait: 4–6 mins
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[10px] font-bold">
                        Ticket CEN-A-042
                      </span>
                    </div>
                  </div>

                  {/* Sample 2: Library */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Periyar Central Library
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Circulation Desk • Ground Floor
                        </p>
                      </div>
                      <CrowdBadge level="LOW" />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        No Waiting • Immediate
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        1 person in line
                      </span>
                    </div>
                  </div>

                  {/* Interactive hint */}
                  <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-violet-500" />
                      Live notifications ready
                    </span>
                    <span className="text-violet-600 dark:text-violet-400 font-semibold text-[11px]">
                      5 counters open →
                    </span>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-20 bg-white/60 dark:bg-slate-950/60 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Smarter crowd intelligence for everyday campus life
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Say goodbye to blind waiting. Compare crowd conditions across buildings and jump in virtual lines from anywhere.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 space-y-3 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Live Crowd Intelligence
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Color-coded occupancy status (Low, Moderate, High) with configurable thresholds tailored to cafeterias, study halls, and registration desks.
              </p>
            </Card>

            <Card className="p-6 space-y-3 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Intelligent Wait Estimates
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Transparent wait-time models factoring in queue depth, active counters, and observed transaction durations, with honest confidence intervals.
              </p>
            </Card>

            <Card className="p-6 space-y-3 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Virtual Queues & Alerts
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Take a digital ticket, go about your day, and receive push notifications when your position advances and when your turn is called.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              How CrowdSync Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Four simple steps to effortless campus navigation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Discover Locations',
                desc: 'Browse dining halls, library checkouts, and student service centers on map or list view.',
              },
              {
                step: '02',
                title: 'Compare Wait Times',
                desc: 'Check live crowd levels and intelligent wait estimations before you leave your dorm or classroom.',
              },
              {
                step: '03',
                title: 'Join Virtual Queue',
                desc: 'Take an instant digital ticket for any active service counter with a single tap.',
              },
              {
                step: '04',
                title: 'Arrive Just in Time',
                desc: 'Get notified when your turn approaches and proceed directly to the counter when called.',
              },
            ].map((item) => (
              <Card key={item.step} className="p-6 relative overflow-hidden">
                <span className="text-4xl font-black text-slate-200 dark:text-slate-800/80 absolute top-4 right-4">
                  {item.step}
                </span>
                <div className="relative z-10 space-y-2 mt-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 mx-auto">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Transparent, Data-Driven Wait Estimates
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            CrowdSync does not generate fictitious wait times or make false guarantees. Predictions are mathematically formulated using active server-side queue sequences, counter throughput rates, and observed historical transactions.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Spend less time waiting.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Join students, faculty, and campus administrators moving through their day with seamless coordination.
          </p>
          <div className="pt-2">
            <Link to="/explore">
              <Button size="lg" className="font-semibold shadow-lg shadow-violet-500/25">
                Explore Available Locations Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
