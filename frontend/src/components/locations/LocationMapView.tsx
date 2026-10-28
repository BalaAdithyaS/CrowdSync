import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import type { Location } from '@/types';
import { getCrowdBadgeStyles } from '@/lib/utils';

interface LocationMapViewProps {
  locations: Location[];
  selectedLocationId?: string;
  onSelectLocation?: (location: Location) => void;
  className?: string;
}

export const LocationMapView: React.FC<LocationMapViewProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // VIT University Campus center approx: [12.9698, 79.1559]
      const defaultCenter: [number, number] = [12.9705, 79.1572];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers
    locations.forEach((loc) => {
      const styles = getCrowdBadgeStyles(loc.crowd_status);
      const isSelected = loc.id === selectedLocationId;

      const markerColor =
        loc.crowd_status === 'LOW'
          ? '#10b981'
          : loc.crowd_status === 'MODERATE'
          ? '#f59e0b'
          : '#ef4444';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${markerColor};
            width: ${isSelected ? '28px' : '22px'};
            height: ${isSelected ? '28px' : '22px'};
            border-radius: 9999px;
            border: 3px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <span style="width: 6px; height: 6px; background-color: white; border-radius: 9999px;"></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(map);

      // Popup
      const popupContent = `
        <div style="font-family: inherit; padding: 4px;">
          <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0; color: #0f172a;">${loc.name}</h4>
          <p style="font-size: 11px; margin: 0 0 6px 0; color: #64748b;">${loc.address}</p>
          <div style="display: flex; gap: 8px; font-size: 11px; margin-bottom: 8px;">
            <span style="font-weight: 600; color: ${markerColor};">${styles.label}</span>
            <span>•</span>
            <span style="color: #0284c7; font-weight: 600;">~${loc.current_wait_minutes} min wait</span>
          </div>
          <button id="view-loc-${loc.id}" style="
            width: 100%;
            padding: 6px 10px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">View Details & Join</button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-loc-${loc.id}`);
        if (btn) {
          btn.onclick = () => {
            navigate(`/locations/${loc.id}`);
          };
        }
      });

      marker.on('click', () => {
        onSelectLocation?.(loc);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if locations exist
    if (locations.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    return () => {
      // Don't destroy map on every rerender, only on unmount
    };
  }, [locations, selectedLocationId, onSelectLocation, navigate]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-md text-[11px] flex items-center gap-3">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Crowd Legend:</span>
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Low
        </span>
        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Moderate
        </span>
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          High Wait
        </span>
      </div>
    </div>
  );
};
