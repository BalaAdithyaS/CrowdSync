import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type CelestialTransitionType = 'sunrise' | 'sunset' | null;

interface CelestialScreenTransitionProps {
  transitionType: CelestialTransitionType;
}

export const CelestialScreenTransition: React.FC<CelestialScreenTransitionProps> = ({ transitionType }) => {
  return (
    <AnimatePresence mode="wait">
      {transitionType === 'sunrise' && (
        <motion.div
          key="horizon-sunrise"
          aria-hidden="true"
          className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden"
          initial={{ clipPath: 'circle(0% at 50% 100%)', opacity: 1 }}
          animate={{ clipPath: 'circle(160% at 50% 100%)', opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Light theme morning sky background */}
          <div className="absolute inset-0 bg-[#f8fafc]" />

          {/* Golden Dawn Atmosphere radiance originating from bottom center */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 100%, rgba(251, 191, 36, 0.65) 0%, rgba(245, 158, 11, 0.35) 25%, rgba(125, 211, 252, 0.25) 50%, rgba(248, 250, 252, 0) 80%)',
            }}
          />

          {/* Soft sunrise ray streaks emanating from bottom center */}
          <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-300 via-orange-200/50 to-transparent" />
          </div>

          {/* Physical Rising Sun rising up from bottom-center horizon */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <motion.div
              initial={{ y: 90, scale: 0.5, opacity: 0 }}
              animate={{
                y: -90,
                scale: [0.5, 1.25, 1.4],
                opacity: [0, 1, 0.95],
              }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 shadow-[0_0_100px_rgba(245,158,11,1)] flex items-center justify-center"
            >
              {/* Pulsing Sun Corona */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-amber-300/50 blur-xl"
              />

              {/* Rotating Sunbeams */}
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                className="w-full h-full text-amber-200/80 p-2"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="50" y1="5" x2="50" y2="15" />
                <line x1="50" y1="85" x2="50" y2="95" />
                <line x1="5" y1="50" x2="15" y2="50" />
                <line x1="85" y1="50" x2="95" y2="50" />
                <line x1="18.2" y1="18.2" x2="25.3" y2="25.3" />
                <line x1="74.7" y1="74.7" x2="81.8" y2="81.8" />
                <line x1="18.2" y1="81.8" x2="25.3" y2="74.7" />
                <line x1="74.7" y1="25.3" x2="81.8" y2="18.2" />
              </motion.svg>
            </motion.div>

            {/* Radiant Sunrise Horizon Line across bottom center */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 1, 0.6] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-[120vw] h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[1px] -mt-2"
            />
          </div>
        </motion.div>
      )}

      {transitionType === 'sunset' && (
        <motion.div
          key="horizon-sunset"
          aria-hidden="true"
          className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden"
          initial={{ clipPath: 'circle(0% at 50% 100%)', opacity: 1 }}
          animate={{ clipPath: 'circle(160% at 50% 100%)', opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Dark theme night sky background */}
          <div className="absolute inset-0 bg-[#090d16]" />

          {/* Twilight sunset horizon glow at bottom center */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 100%, rgba(244, 63, 94, 0.4) 0%, rgba(139, 92, 246, 0.35) 25%, rgba(30, 27, 75, 0.8) 55%, rgba(9, 13, 22, 0.98) 100%)',
            }}
          />

          {/* Twinkling evening stars popping in */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.8], scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_6px_#22d3ee]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.7], scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="absolute top-1/3 right-1/4 w-2 h-2 bg-violet-200 rounded-full shadow-[0_0_8px_#a78bfa]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="absolute top-1/5 right-1/3 w-1 h-1 bg-white rounded-full"
            />
          </div>

          {/* Physical Setting Sun sinking down into bottom-center horizon */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <motion.div
              initial={{ y: -120, scale: 1.25, opacity: 1 }}
              animate={{
                y: 80,
                scale: 0.35,
                opacity: [1, 0.8, 0],
              }}
              transition={{ duration: 0.75, ease: [0.32, 0, 0.67, 0] }}
              className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-400 shadow-[0_0_80px_rgba(244,63,94,0.9)] flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-rose-500/40 blur-xl" />
            </motion.div>

            {/* Glowing Sunset Horizon Line across bottom center that fades as the sun sinks */}
            <motion.div
              initial={{ scaleX: 1, opacity: 1 }}
              animate={{ scaleX: 0.4, opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: 'easeIn' }}
              className="w-[120vw] h-2 bg-gradient-to-r from-transparent via-rose-500 to-transparent blur-[1px] -mt-2"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
