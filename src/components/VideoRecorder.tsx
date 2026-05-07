import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Camera, Square } from 'lucide-react';
import { OneLineStreamingTranscript } from './OneLineStreamingTranscript';
import { TranscriptData } from './types';

interface VideoRecorderProps {
  isVideoEnabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  facingMode: 'user' | 'environment';
  currentTranscript: TranscriptData | null;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onCapturePhoto: () => void;
}

export function VideoRecorder({
  isVideoEnabled,
  videoRef,
  facingMode,
  currentTranscript,
  onToggleVideo,
  onSwitchCamera,
  onCapturePhoto,
}: VideoRecorderProps) {
  return (
    <AnimatePresence>
      {isVideoEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 bg-black"
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/5 bg-black/40 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_8px_rgba(190,242,100,0.9)]" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-lime-200">Camera Live</span>
            </div>
            <button
              onClick={onToggleVideo}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/20"
              aria-label="Close camera"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="pointer-events-auto absolute bottom-0 inset-x-0 flex items-center justify-center gap-8 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
            <button
              onClick={onSwitchCamera}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-xl transition hover:border-white/40"
              aria-label="Switch camera"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            <button
              onClick={onCapturePhoto}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-white backdrop-blur-xl transition hover:border-white/50 hover:bg-white/20"
              aria-label="Take photo"
            >
              <Camera className="h-6 w-6" />
            </button>

            <button
              onClick={onToggleVideo}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/20 text-red-300 backdrop-blur-xl transition hover:border-red-500/60 hover:bg-red-500/30"
              aria-label="Stop recording"
            >
              <Square className="h-5 w-5" />
            </button>
          </div>

          <AnimatePresence>
            {currentTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="pointer-events-none absolute left-1/2 top-[106px] z-50 w-[92vw] max-w-5xl -translate-x-1/2"
              >
                <OneLineStreamingTranscript
                  role={currentTranscript.role}
                  text={currentTranscript.text}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
