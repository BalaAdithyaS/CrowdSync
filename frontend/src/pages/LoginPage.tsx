import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { apiRequest } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Users2, ArrowRight, ShieldCheck, UserCheck, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(data.access_token, data.user);
      addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: `Signed in as ${data.user.name}.`,
      });

      // If admin, navigate to /admin if they came without specific from
      if (['LOCATION_ADMIN', 'ORGANIZATION_ADMIN', 'PLATFORM_ADMIN'].includes(data.user.role) && from === '/app') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Users2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Crowd<span className="text-violet-600 dark:text-violet-400">Sync</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access live queues, saved locations, and real-time alerts
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@vitcampus.edu"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full font-semibold" isLoading={isLoading}>
              Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Logins Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block text-center uppercase tracking-wider">
              1-Click Demo Accounts
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('student@vitcampus.edu', 'StudentPass123!')}
                className="p-2 rounded-xl text-left border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                  <UserCheck className="w-3.5 h-3.5 text-violet-500" />
                  Student
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Alex Rivera</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('staff@vitcampus.edu', 'StaffPass123!')}
                className="p-2 rounded-xl text-left border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                  Staff
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Sarah Operator</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin@vitcampus.edu', 'AdminPass123!')}
                className="p-2 rounded-xl text-left border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  <Shield className="w-3.5 h-3.5 text-purple-500" />
                  Admin
                </div>
                <span className="text-[10px] text-slate-500 block truncate">Platform Admin</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/signup" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
};
