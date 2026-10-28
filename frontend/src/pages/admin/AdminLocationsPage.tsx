import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Location } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/context/NotificationContext';
import { Link } from 'react-router-dom';
import { Building2, Plus, ArrowRight, MapPin, Clock } from 'lucide-react';

export const AdminLocationsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cafeteria');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('08:00 AM - 08:00 PM');
  const [lowThreshold, setLowThreshold] = useState(15);
  const [modThreshold, setModThreshold] = useState(35);

  const { data: locations = [], isLoading, refetch } = useQuery<Location[]>({
    queryKey: ['admin_locations'],
    queryFn: () => apiRequest<Location[]>('/locations'),
  });

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest('/admin/locations', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description,
          category,
          address,
          latitude: 12.9705,
          longitude: 79.1572,
          opening_hours: openingHours,
          low_threshold: Number(lowThreshold),
          mod_threshold: Number(modThreshold),
          crowd_capacity: 100,
          is_active: true,
        }),
      });

      addToast({
        type: 'success',
        title: 'Location Created',
        message: `${name} has been successfully added to campus directory.`,
      });
      refetch();
      setCreateModalOpen(false);
      // Reset form
      setName('');
      setDescription('');
      setAddress('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Creating Location',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manage Campus Locations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure facilities, manage operational hours, and set crowding thresholds.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add New Location
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-60 rounded-2xl" />
          <Skeleton className="h-60 rounded-2xl" />
          <Skeleton className="h-60 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <Card key={loc.id} className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    {loc.category.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      loc.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {loc.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {loc.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {loc.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{loc.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{loc.opening_hours}</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-[11px] grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>Low &lt; {loc.low_threshold}</div>
                  <div>Mod &lt; {loc.mod_threshold}</div>
                </div>
              </div>

              <Link to={`/admin/locations/${loc.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <span>Manage Counters ({loc.counters?.length ?? 0})</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Create Location Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Campus Location"
        description="Register a new building or service location on campus."
      >
        <form onSubmit={handleCreateLocation} className="space-y-4">
          <Input
            label="Location Name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            }}
            placeholder="e.g. Technology Tower Food Plaza"
            required
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="cafeteria">Cafeteria / Dining</option>
              <option value="library">Library & Reserves</option>
              <option value="service_counter">Student Service Counter</option>
              <option value="food_court">Food Court & Café</option>
              <option value="clinic">Health Clinic</option>
              <option value="event">Event Entrance</option>
            </select>
          </div>

          <Input
            label="Campus Address / Building"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. TT Hall, Level 2"
            required
          />

          <Input
            label="Opening Hours"
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="08:00 AM - 09:00 PM"
            required
          />

          <Input
            label="Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of food options or services provided"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Low Crowd Cutoff"
              type="number"
              value={lowThreshold}
              onChange={(e) => setLowThreshold(Number(e.target.value))}
              required
            />
            <Input
              label="Moderate Cutoff"
              type="number"
              value={modThreshold}
              onChange={(e) => setModThreshold(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Create Location
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
