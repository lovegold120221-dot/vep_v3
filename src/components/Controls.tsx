import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { StartIconMicVisualizer } from './StartIconMicVisualizer';

interface ControlsProps {
  isActive: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  connecting: boolean;
  micLevel: number;
  micBands: number[];
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartSession: () => void;
  onStopSession: () => void;
}

export function Controls({
  isActive,
  isMuted,
  isVideoEnabled,
  connecting,
  micLevel,
  micBands,
  onToggleMute,
  onToggleVideo,
  onStartSession,
  onStopSession,
}: ControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={onToggleMute}
          className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all ${
            isMuted
              ? 'border-red-500/30 bg-red-500/10 text-red-500'
              : 'border-white/10 bg-[#0A0A0B] text-zinc-400 hover:border-white/30 hover:text-white'
          }`}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {!isActive ? (
          <StartIconMicVisualizer
            isActive={false}
            connecting={connecting}
            isMuted={isMuted}
            micLevel={0}
            micBands={micBands}
            onClick={onStartSession}
          />
        ) : (
          <StartIconMicVisualizer
            isActive={true}
            connecting={connecting}
            isMuted={isMuted}
            micLevel={micLevel}
            micBands={micBands}
            onClick={onStopSession}
          />
        )}

        <button
          onClick={onToggleVideo}
          className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all ${
            isVideoEnabled
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
              : 'border-white/10 bg-[#0A0A0B] text-zinc-400 hover:border-white/30 hover:text-white'
          }`}
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
