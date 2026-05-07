import { motion } from 'motion/react';
import { Loader2, Power } from 'lucide-react';

interface StartIconMicVisualizerProps {
  isActive: boolean;
  connecting: boolean;
  isMuted: boolean;
  micLevel: number;
  micBands?: number[];
  onClick: () => void;
}

export function StartIconMicVisualizer({
  isActive,
  connecting,
  isMuted,
  micLevel,
  micBands,
  onClick,
}: StartIconMicVisualizerProps) {
  const innerBands = micBands?.length
    ? micBands.slice(5, 14)
    : [0.35, 0.5, 0.72, 0.9, 1, 0.82, 0.64, 0.46, 0.32].map(n => n * micLevel);

  return (
    <button
      onClick={onClick}
      disabled={connecting}
      aria-label={isActive ? 'Stop voice session' : 'Start voice session'}
      className="group relative flex h-20 w-20 items-center justify-center"
    >
      <motion.div
        animate={{
          opacity: isActive ? 0.16 + micLevel * 0.3 : 0.08,
        }}
        transition={{ duration: 0.045 }}
        className={`absolute inset-0 rounded-full ${
          isMuted ? 'bg-red-500/20' : 'bg-lime-300/30'
        }`}
      />

      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border bg-[#0A0A0B] shadow-2xl transition-all ${
          isActive
            ? isMuted
              ? 'border-red-500/35'
              : 'border-lime-300/60'
            : 'border-white/10 group-hover:border-lime-300/50'
        }`}
      >
        {connecting ? (
          <Loader2 className="h-7 w-7 animate-spin text-lime-300" />
        ) : isActive ? (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
            <div className="flex h-12 items-center gap-1">
              {innerBands.map((band, i) => {
                const liveBand = isMuted ? 0 : Math.max(band, micLevel * 0.4);

                return (
                  <motion.div
                    key={i}
                    animate={{
                      height: Math.max(5, liveBand * 42),
                      opacity: isMuted ? 0.2 : Math.max(0.32, liveBand + 0.18),
                    }}
                    transition={{ duration: 0.035 }}
                    className={`w-1 rounded-full ${
                      isMuted
                        ? 'bg-red-500'
                        : 'bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.75)]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <Power className="h-8 w-8 text-lime-300 transition-colors" />
        )}
      </div>
    </button>
  );
}
