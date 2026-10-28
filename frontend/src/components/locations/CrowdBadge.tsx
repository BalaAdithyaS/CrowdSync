import React from 'react';
import { CrowdLevel } from '@/types';
import { getCrowdBadgeStyles } from '@/lib/utils';
import { Users } from 'lucide-react';

interface CrowdBadgeProps {
  level: CrowdLevel;
  showIcon?: boolean;
  className?: string;
}

export const CrowdBadge: React.FC<CrowdBadgeProps> = ({ level, showIcon = true, className = '' }) => {
  const styles = getCrowdBadgeStyles(level);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles.bg} ${styles.border} ${className}`}
      title={`Crowd condition: ${styles.label}`}
    >
      <span className={`w-2 h-2 rounded-full ${styles.dotColor} animate-pulse`} />
      {showIcon && <Users className="w-3 h-3 opacity-80" />}
      <span>{styles.label}</span>
    </span>
  );
};
