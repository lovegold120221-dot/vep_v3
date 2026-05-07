import { motion } from 'motion/react';

interface OneLineStreamingTranscriptProps {
  text: string;
  role: 'user' | 'model';
}

export function OneLineStreamingTranscript({
  text,
  role,
}: OneLineStreamingTranscriptProps) {
  if (role === 'user') return null;

  return (
    <motion.div
      key={`${role}-${text}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.12 }}
      className="w-full overflow-hidden px-4"
      style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-center overflow-hidden rounded-2xl border border-lime-300/15 bg-black/30 px-5 py-2 shadow-2xl backdrop-blur-2xl">
        <p className="truncate text-left text-sm font-medium leading-tight tracking-tight text-lime-100 md:text-base">
          {text}
        </p>
      </div>
    </motion.div>
  );
}
