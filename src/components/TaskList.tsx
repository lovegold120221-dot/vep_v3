import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Download, Video, FileText } from 'lucide-react';
import { ActionTask } from './types';

interface TaskListProps {
  tasks: ActionTask[];
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="mb-4 w-full max-w-md space-y-2 px-6">
      <AnimatePresence>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
            className="flex items-center gap-3 rounded-xl border border-l-2 border-white/5 border-l-lime-300/50 bg-[#0A0A0B]/80 p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="relative flex h-8 w-20 shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg bg-black/40">
              {task.status === 'processing' && (
                <div className="absolute inset-0 bg-lime-300/20" style={{ width: '35%', animation: 'scan 1s ease-in-out infinite alternate' }} />
              )}
              <div className={`h-1.5 w-1.5 rounded-full ${task.status === 'processing' ? 'bg-lime-300 animate-pulse' : task.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`text-[7px] font-bold uppercase tracking-widest ${task.status === 'processing' ? 'text-lime-300' : task.status === 'completed' ? 'text-emerald-400' : 'text-red-400'}`}>
                {task.status === 'processing' ? 'Running' : task.status === 'completed' ? 'Done' : 'Failed'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-zinc-100">{task.action}</p>
            </div>

            {task.htmlPreviewData && task.htmlPreviewFilename && (
              <a
                href={task.htmlPreviewData}
                target="_blank"
                rel="noreferrer"
                title="View Preview"
                className="pointer-events-auto rounded-lg border border-lime-300/20 p-2 text-lime-200 hover:bg-lime-300/10"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            {task.downloadData && task.downloadFilename && (
              <a
                href={task.downloadData}
                download={task.downloadFilename}
                title="Download Result"
                className="pointer-events-auto rounded-lg border border-lime-300/20 p-2 text-lime-200 hover:bg-lime-300/10"
              >
                <Download className="h-4 w-4" />
              </a>
            )}

            {task.toolName === 'generate_video' && task.videoUrl && (
              <a
                href={task.videoUrl}
                target="_blank"
                rel="noreferrer"
                title="View Video"
                className="pointer-events-auto rounded-lg border border-lime-300/20 p-2 text-lime-200 hover:bg-lime-300/10"
              >
                <Video className="h-4 w-4" />
              </a>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
