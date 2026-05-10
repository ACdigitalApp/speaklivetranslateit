import { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChatBubble } from './ChatBubble';
import { AnimatePresence } from 'framer-motion';

export function ConversationView() {
  const messages = useAppStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <p className="text-lg font-medium text-[hsl(var(--muted-foreground))]">Tap the microphone to start translating</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 opacity-60">Speak naturally — Speak & Translate Live will detect the language and translate in real-time</p>
        </div>
      )}
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
      </AnimatePresence>
    </div>
  );
}
