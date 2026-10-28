import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={isDark ? 'Switch to Light Mode (Watch the Sun Rise)' : 'Switch to Dark Mode (Watch the Sun Set)'}
      title={isDark ? 'Sunrise: Switch to Light Mode' : 'Sunset: Switch to Dark Mode'}
      className={`relative group inline-flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 cursor-pointer overflow-hidden select-none ${
        isDark
          ? 'bg-slate-900/90 border-slate-700/80 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-950/40 text-slate-200'
          : 'bg-amber-50/90 border-amber-200/80 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20 text-slate-800'
      } ${className}`}
    >
      {/* Sky backdrop viewport container */}
      <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
        {/* Sky Background with Day/Night gradient */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={{
            background: isDark
              ? 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #31104b 100%)'
              : 'linear-gradient(135deg, #fef3c7 0%, #fdba74 40%, #67e8f9 100%)',
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Ambient atmospheric haze / horizon glow */}
        <motion.div
          className="absolute bottom-0 inset-x-0 h-4 blur-[2px] pointer-events-none"
          animate={{
            background: isDark
              ? 'radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.4), transparent 70%)'
              : 'radial-gradient(ellipse at bottom, rgba(245, 158, 11, 0.6), transparent 70%)',
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Stars in Night Sky */}
        <AnimatePresence>
          {isDark && (
            <>
              {/* Star 1 */}
              <motion.div
                key="star-1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.7, 1], scale: [0, 1.2, 0.9, 1] }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute top-1.5 left-2 w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_3px_#22d3ee]"
              />
              {/* Star 2 */}
              <motion.div
                key="star-2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.8], scale: [0, 1.1, 1] }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="absolute top-2 right-2 w-0.5 h-0.5 bg-violet-200 rounded-full shadow-[0_0_2px_#a78bfa]"
              />
              {/* Star 3 */}
              <motion.div
                key="star-3"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="absolute bottom-2.5 left-2.5 w-0.5 h-0.5 bg-white rounded-full"
              />
            </>
          )}
        </AnimatePresence>

        {/* The Sun: Rises on sunrise (Light mode), Sets on sunset (Dark mode) */}
        <AnimatePresence mode="wait">
          {!isDark ? (
            <motion.div
              key="sun-rising"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ y: 24, scale: 0.4, opacity: 0, rotate: -45 }}
              animate={{
                y: 0,
                scale: 1,
                opacity: 1,
                rotate: 0,
                transition: {
                  type: 'spring',
                  stiffness: 260,
                  damping: 18,
                  duration: 0.6,
                },
              }}
              exit={{
                y: 26,
                scale: 0.3,
                opacity: 0,
                rotate: 35,
                transition: {
                  duration: 0.4,
                  ease: 'easeIn',
                },
              }}
            >
              {/* Sun Body & Rotating Rays */}
              <div className="relative flex items-center justify-center">
                {/* Sun Glow Corona */}
                <motion.div
                  className="absolute w-6 h-6 rounded-full bg-amber-400/40 blur-[3px]"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                />

                <svg
                  className="w-5 h-5 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4.5" fill="currentColor" className="text-amber-400" />
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                    style={{ transformOrigin: '12px 12px' }}
                  >
                    <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" className="text-amber-500" />
                    <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" className="text-amber-500" />
                    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" stroke="currentColor" className="text-amber-500" />
                    <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" stroke="currentColor" className="text-amber-500" />
                    <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" className="text-amber-500" />
                    <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" className="text-amber-500" />
                    <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" stroke="currentColor" className="text-amber-500" />
                    <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" stroke="currentColor" className="text-amber-500" />
                  </motion.g>
                </svg>
              </div>
            </motion.div>
          ) : (
            /* The Moon: Rises on sunset (Dark mode), Sets on sunrise (Light mode) */
            <motion.div
              key="moon-rising"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ y: 24, scale: 0.4, opacity: 0, rotate: 30 }}
              animate={{
                y: 0,
                scale: 1,
                opacity: 1,
                rotate: 0,
                transition: {
                  type: 'spring',
                  stiffness: 260,
                  damping: 18,
                  duration: 0.6,
                },
              }}
              exit={{
                y: 26,
                scale: 0.3,
                opacity: 0,
                rotate: -35,
                transition: {
                  duration: 0.4,
                  ease: 'easeIn',
                },
              }}
            >
              <div className="relative flex items-center justify-center">
                {/* Luminous Lunar Aura */}
                <motion.div
                  className="absolute w-5 h-5 rounded-full bg-cyan-400/20 blur-[3px]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                />

                <svg
                  className="w-4.5 h-4.5 text-cyan-200 drop-shadow-[0_0_5px_rgba(34,211,238,0.7)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
                    fill="currentColor"
                    className="text-cyan-100"
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Horizon silhouette line at the bottom */}
        <div
          className={`absolute bottom-0 inset-x-0 h-1 transition-colors duration-500 ${
            isDark ? 'bg-slate-950/80 border-t border-indigo-900/40' : 'bg-amber-600/20 border-t border-amber-400/40'
          }`}
        />
      </div>

      {/* Optional or desktop text label */}
      {showLabel && (
        <span className="hidden sm:inline-block text-xs font-semibold tracking-wide">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};
