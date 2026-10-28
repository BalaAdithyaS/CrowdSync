import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Location } from '@/types';
import { LocationCard } from '@/components/locations/LocationCard';
import { LocationMapView } from '@/components/locations/LocationMapView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Search, Filter, Map, LayoutGrid, Sparkles, 
  RotateCcw, SlidersHorizontal, MapPin
} from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCrowd, setSelectedCrowd] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('shortest_wait');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const categories = [
    { id: 'all', label: 'All Places' },
    { id: 'cafeteria', label: 'Cafeterias' },
    { id: 'library', label: 'Libraries' },
    { id: 'service_counter', label: 'Student Services' },
    { id: 'food_court', label: 'Cafés & Quick Bites' },
    { id: 'clinic', label: 'Health Clinics' },
  ];

  const crowdLevels = [
    { id: 'ALL', label: 'All Crowds' },
    { id: 'LOW', label: 'Low Crowd' },
    { id: 'MODERATE', label: 'Moderate' },
    { id: 'HIGH', label: 'High Wait' },
  ];

  const { data: locations = [], isLoading, refetch } = useQuery<Location[]>({
    queryKey: ['locations', selectedCategory, selectedCrowd, search, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCrowd !== 'ALL') params.append('crowd_status', selectedCrowd);
      if (search.trim()) params.append('search', search.trim());
      if (sortBy) params.append('sort_by', sortBy);

      return apiRequest<Location[]>(`/locations?${params.toString()}`);
    },
  });

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedCrowd('ALL');
    setSortBy('shortest_wait');
  };

  const isFiltered = search || selectedCategory !== 'all' || selectedCrowd !== 'ALL' || sortBy !== 'shortest_wait';

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Title & Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" />
            Campus Live Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Discover Campus Locations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time occupancy, telemetry, and waiting estimates across all campus service hubs.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl border border-slate-300/60 dark:border-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grid View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Interactive Map
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by building, dining hall, or service..."
              className="h-10 w-full pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="shortest_wait">Sort: Shortest Wait First</option>
              <option value="name">Sort: Alphabetical (A-Z)</option>
              <option value="popularity">Sort: Most Popular</option>
            </select>

            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={resetFilters} title="Reset filters">
                <RotateCcw className="w-4 h-4 text-slate-500" />
              </Button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}

          <span className="text-slate-300 dark:text-slate-700 px-1">•</span>

          {/* Crowd Pills */}
          {crowdLevels.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setSelectedCrowd(lvl.id)}
              className={`px-2.5 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                selectedCrowd === lvl.id
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Grid or Map */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No matching locations found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, selecting "All Places", or clearing the crowd filter.
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[550px] w-full">
          <LocationMapView locations={locations} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onFavoriteToggle={() => refetch()}
            />
          ))}
        </div>
      )}
    </div>
  );
};
