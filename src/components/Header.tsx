import { MessageCircle } from 'lucide-react';

interface HeaderProps {
  isActive: boolean;
  isVideoEnabled: boolean;
  sessionElapsed: number;
  speakerBands: number[];
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
  settings: {
    avatarUrl?: string;
    userName?: string;
  };
  user: {
    photoURL?: string | null;
  };
}

export function Header({
  isActive,
  isVideoEnabled,
  sessionElapsed,
  speakerBands,
  showSidebar,
  setShowSidebar,
  setShowProfile,
  settings,
  user,
}: HeaderProps) {
  return (
    <header className={`z-50 flex items-center justify-between border-b border-white/5 bg-[#050505]/80 px-6 py-4 backdrop-blur-md ${isVideoEnabled ? 'pointer-events-none opacity-0' : ''}`}>
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
          showSidebar
            ? 'border-lime-300/50 bg-lime-300/10 text-lime-300'
            : 'border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'
        }`}
        aria-label="Toggle Chat"
      >
        <MessageCircle className={`h-4 w-4 ${showSidebar ? 'text-lime-300' : ''}`} />
        <span className="hidden sm:inline">Chat</span>
      </button>

      <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        {isActive ? (
          <div className="flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/5 px-4 py-1.5">
            <span className="flex items-end gap-[2px] h-3">
              {speakerBands.slice(0, 5).map((level, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-lime-300"
                  style={{
                    height: `${Math.max(3, Math.round(level * 14))}px`,
                    opacity: 0.4 + level * 0.6,
                  }}
                />
              ))}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-lime-300">Active</span>
            <span className="font-mono text-[9px] text-lime-300/70">
              {String(Math.floor(sessionElapsed / 60)).padStart(2, '0')}:{String(Math.floor(sessionElapsed % 60)).padStart(2, '0')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="font-mono text-[12px] tracking-widest text-zinc-500">।‖‖‖।</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Inactive</span>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowProfile(true)}
        className="h-10 w-10 overflow-hidden rounded-full border border-white/10 transition-all hover:border-lime-300/50 focus:outline-none focus:ring-2 focus:ring-lime-300/50 active:scale-95"
      >
        {settings.avatarUrl || user.photoURL ? (
          <img src={settings.avatarUrl || user.photoURL || ''} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 font-bold text-zinc-400">
            {settings.userName?.[0] || 'U'}
          </div>
        )}
      </button>
    </header>
  );
}
