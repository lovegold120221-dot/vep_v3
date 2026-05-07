import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Paperclip, Send, Upload, FileText, Download, ExternalLink, Video } from 'lucide-react';
import { ChatMessage } from './types';

interface SidebarProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  isActive: boolean;
  sessionElapsed: number;
  historyMsgs: ChatMessage[];
  settings: {
    userName: string;
    agentName: string;
  };
  chatInput: string;
  setChatInput: (value: string) => void;
  sendChatMessage: (e: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function Sidebar({
  showSidebar,
  setShowSidebar,
  isActive,
  sessionElapsed,
  historyMsgs,
  settings,
  chatInput,
  setChatInput,
  sendChatMessage,
  fileInputRef,
  messagesEndRef,
}: SidebarProps) {
  return (
    <AnimatePresence>
      {showSidebar && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[101] flex w-full flex-col bg-[#0A0A0B] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0A0A0B]/95 px-4 py-3 backdrop-blur-xl pt-[max(12px,env(safe-area-inset-top))]">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-lime-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Chats</span>
              </div>
              {isActive && (
                <div className="flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1">
                  <span className="font-mono text-[10px] tracking-widest text-lime-300">।‖‖‖।</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-lime-300">Voice Active</span>
                  <span className="font-mono text-[8px] text-lime-300/70">
                    {String(Math.floor(sessionElapsed / 60)).padStart(2, '0')}:{String(sessionElapsed % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowSidebar(false)}
                className="-mr-2 rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close Sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col pb-[max(16px,env(safe-area-inset-bottom))]">
              <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-3">
                {historyMsgs.map((msg, i) => (
                  <div
                    key={`${msg.timestamp}-${i}`}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="mb-1 text-[8px] uppercase tracking-widest text-zinc-600">
                      {msg.role === 'user' ? settings.userName : settings.agentName}
                    </span>

                    <div
                      className={`max-w-[92%] rounded-2xl p-3 text-xs leading-relaxed overflow-hidden break-words whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'rounded-tr-sm border border-sky-400/20 bg-sky-400/10 text-sky-100'
                          : 'rounded-tl-sm border border-lime-300/10 bg-white/5 text-zinc-300'
                      }`}
                    >
                      {msg.fileDataUrl && (
                        <div className="mb-2 flex w-full justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
                          <img
                            src={msg.fileDataUrl}
                            alt="Preview"
                            className="max-h-48 w-auto object-contain"
                          />
                        </div>
                      )}

                      {msg.fileName && (
                        <div className="mb-2 flex items-center gap-2 rounded-xl bg-black/30 px-2 py-1 text-[10px] text-lime-200">
                          <Upload className="h-3 w-3" />
                          {msg.fileName}
                        </div>
                      )}

                      {msg.toolName && (
                        <div className="mb-2 flex items-center gap-2 rounded-xl bg-lime-300/10 px-2 py-1 text-[10px] text-lime-200">
                          <FileText className="h-3 w-3" />
                          Tool Output: {msg.toolName}
                        </div>
                      )}

                      {msg.videoUrl && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
                          <video
                            src={msg.videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls
                            className="w-full object-contain"
                            style={{ maxHeight: '320px' }}
                          />
                          <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-lime-300">
                              <Video className="h-4 w-4" /> Video Generated
                            </div>
                            <a
                              href={msg.videoUrl}
                              download
                              className="flex items-center gap-2 rounded-lg bg-lime-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-lime-300 transition hover:bg-lime-300/20"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          </div>
                        </div>
                      )}

                      {msg.text}

                      {msg.htmlPreviewData && msg.htmlPreviewFilename && (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <a
                            href={msg.htmlPreviewData}
                            target="_blank"
                            rel="noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-lime-200 transition hover:bg-lime-300/15"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open HTML Preview
                          </a>
                          <a
                            href={msg.htmlPreviewData}
                            download={msg.htmlPreviewFilename}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-200 transition hover:bg-white/10"
                          >
                            <Download className="h-3.5 w-3.5" /> Download HTML
                          </a>
                        </div>
                      )}

                      {msg.downloadData && msg.downloadFilename && (
                        <a
                          href={msg.downloadData}
                          download={msg.downloadFilename}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-lime-200 transition hover:bg-lime-300/15"
                        >
                          <Download className="h-3.5 w-3.5" /> Download Result
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {historyMsgs.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <MessageCircle className="h-8 w-8 text-zinc-600" />
                    </div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">No messages yet</p>
                    <p className="text-[10px] text-zinc-600">Start a conversation with {settings.agentName}</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={sendChatMessage}
                className="border-t border-white/10 bg-[#070807]/95 p-3 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-lime-300/15 bg-black/45 p-2 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:border-lime-300/30 hover:text-lime-200 active:scale-95"
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Message ${settings.agentName}...`}
                    className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300 text-black transition hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
