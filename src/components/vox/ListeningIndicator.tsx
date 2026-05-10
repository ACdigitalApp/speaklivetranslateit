import { Mic, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

type Props = {
  onToggle: () => void;
};

export function ListeningIndicator({ onToggle }: Props) {
  const status = useAppStore((s) => s.status);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const isActive = status !== 'idle';
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Pulse rings */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                key="ring1"
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-[hsl(var(--vox-green))]"
              />
              <motion.div
                key="ring2"
                initial={{ scale: 1, opacity: 0.2 }}
                animate={{ scale: [1, 1.4], opacity: [0.2, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut', delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-[hsl(var(--vox-green))]"
              />
            </>
          )}
        </AnimatePresence>

        {/* Audio level glow */}
        {isListening && audioLevel > 0.1 && (
          <motion.div
            animate={{ scale: 1 + audioLevel * 0.3, opacity: audioLevel * 0.5 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-[-8px] rounded-full bg-[hsl(var(--vox-green)/0.3)] blur-md"
          />
        )}

        {/* Main button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={onToggle}
          className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: 'hsl(145 77% 46%)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }}
        >
          {isProcessing ? (
            <Loader2 size={40} className="text-white animate-spin" />
          ) : (
            <Mic size={50} className="text-white" strokeWidth={2} />
          )}
        </motion.button>
      </div>

      <p className="mt-5 text-base text-[hsl(var(--muted-foreground))] max-w-xs text-center leading-relaxed">
        {status === 'idle' && 'Speak naturally — Speak & Translate Live listens and translates automatically'}
        {status === 'listening' && 'Listening...'}
        {status === 'processing' && 'Translating...'}
        {status === 'speaking' && 'Speaking...'}
      </p>
    </div>
  );
}
