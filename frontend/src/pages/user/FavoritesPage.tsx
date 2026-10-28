import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Location } from '@/types';
import { LocationCard } from '@/components/locations/LocationCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Bookmark, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FavoritesPage: React.FC = () => {
  const { data: favorites = [], isLoading, refetch } = useQuery<Location[]>({
    queryKey: ['my_favorites'],
    queryFn: () => apiRequest<Location[]>('/favorites'),
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Saved Locations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quickly monitor crowd conditions and wait times at your favorite campus spots.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((loc) => (
            <LocationCard
              key={loc.id}
              location={{ ...loc, is_favorite: true }}
              onFavoriteToggle={() => refetch()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <Bookmark className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No saved locations yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any campus cafeteria, library, or service counter to pin it here for one-click access.
          </p>
          <Link to="/explore">
            <Button size="sm">
              <Compass className="w-4 h-4 mr-1" />
              Explore Campus
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
