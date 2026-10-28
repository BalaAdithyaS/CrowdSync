import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Location } from '@/types';
import { Card } from '@/components/ui/Card';
import { CrowdBadge } from './CrowdBadge';
import { getCategoryLabel, formatWaitTime } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Clock, Users, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';

interface LocationCardProps {
  location: Location;
  onFavoriteToggle?: (locationId: string, isFav: boolean) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, onFavoriteToggle }) => {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [isFavorite, setIsFavorite] = useState(location.is_favorite ?? false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      addToast({
        type: 'warning',
        title: 'Sign in Required',
        message: 'Please sign in to save favorite locations.',
      });
      return;
    }

    setIsTogglingFav(true);
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      if (nextState) {
        await apiRequest(`/favorites/${location.id}`, { method: 'POST' });
        addToast({
          type: 'success',
          title: 'Saved',
          message: `${location.name} added to your favorites.`,
        });
      } else {
        await apiRequest(`/favorites/${location.id}`, { method: 'DELETE' });
        addToast({
          type: 'info',
          title: 'Removed',
          message: `${location.name} removed from favorites.`,
        });
      }
      onFavoriteToggle?.(location.id, nextState);
    } catch {
      setIsFavorite(!nextState); // revert
    } finally {
      setIsTogglingFav(false);
    }
  };

  return (
    <Card hoverable className="overflow-hidden flex flex-col group h-full">
      {/* Header Image */}
      <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
        {location.image_url ? (
          <img
            src={location.image_url}
            alt={location.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-violet-900 to-slate-900 flex items-center justify-center">
            <span className="text-2xl font-bold text-white/40">{location.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

        {/* Category & Status Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-950/70 text-white backdrop-blur-md border border-white/10">
            {getCategoryLabel(location.category)}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <button
            onClick={handleFavoriteClick}
            disabled={isTogglingFav}
            aria-label="Toggle favorite"
            className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-950/90 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
          >
            {isFavorite ? (
              <BookmarkCheck className="w-4 h-4 text-violet-400 fill-violet-400" />
            ) : (
              <Bookmark className="w-4 h-4 text-slate-300" />
            )}
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <CrowdBadge level={location.crowd_status} />
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950/80 text-white backdrop-blur-md border border-white/10 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>~{location.current_wait_minutes} min wait</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {location.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {location.description}
          </p>
        </div>

        {/* Telemetry info bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3 tabular-nums">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-violet-500" />
              {location.total_waiting} in queue
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span>{location.active_counters_count} active counter{location.active_counters_count !== 1 ? 's' : ''}</span>
          </div>

          <Link
            to={`/locations/${location.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:gap-1.5 transition-all"
          >
            Details
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
