import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { LocationDetailPage } from '@/pages/LocationDetailPage';

// User Pages
import { DashboardPage } from '@/pages/user/DashboardPage';
import { QueuesPage } from '@/pages/user/QueuesPage';
import { QueueTrackingPage } from '@/pages/user/QueueTrackingPage';
import { FavoritesPage } from '@/pages/user/FavoritesPage';
import { HistoryPage } from '@/pages/user/HistoryPage';
import { NotificationsPage } from '@/pages/user/NotificationsPage';
import { ProfilePage } from '@/pages/user/ProfilePage';

// Admin Pages
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { AdminQueuesPage } from '@/pages/admin/AdminQueuesPage';
import { AdminLocationsPage } from '@/pages/admin/AdminLocationsPage';
import { AdminLocationDetailPage } from '@/pages/admin/AdminLocationDetailPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

const ProtectedUserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/locations/:locationId" element={<LocationDetailPage />} />

                  {/* Protected User routes */}
                  <Route
                    path="/app"
                    element={
                      <ProtectedUserRoute>
                        <DashboardPage />
                      </ProtectedUserRoute>
                    }
                  />
                  <Route
                    path="/app/queues"
                    element={
                      <ProtectedUserRoute>
                        <QueuesPage />
                      </ProtectedUserRoute>
                    }
                  />
                  <Route
                    path="/app/queues/:queueId"
                    element={
                      <ProtectedUserRoute>
                        <QueueTrackingPage />
                      </ProtectedUserRoute>
                    }
                  />
                  <Route
                    path="/app/favorites"
                    element={
                      <ProtectedUserRoute>
                        <FavoritesPage />
                      </ProtectedUserRoute>
                    }
                  />
                  <Route
                    path="/app/history"
                    element={
                      <ProtectedUserRoute>
                        <HistoryPage />
                      </ProtectedUserRoute>
                    }
                  />
                  <Route
                    path="/app/notifications"
                    element={
                      <ProtectedUserRoute>
                        <NotificationsPage />
                      </ProtectedUserRoute>
                    }
                  />
                  <Route
                    path="/app/profile"
                    element={
                      <ProtectedUserRoute>
                        <ProfilePage />
                      </ProtectedUserRoute>
                    }
                  />

                  {/* Admin routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedAdminRoute>
                        <AdminOverviewPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/queues"
                    element={
                      <ProtectedAdminRoute>
                        <AdminQueuesPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/locations"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLocationsPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/locations/:locationId"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLocationDetailPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <ProtectedAdminRoute>
                        <AdminAnalyticsPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedAdminRoute>
                        <AdminSettingsPage />
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* 404 catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
