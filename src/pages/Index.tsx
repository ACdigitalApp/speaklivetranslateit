import { useCallback, useState } from "react";
import { Settings, Trash2, MicOff, Mic, Share2, Send } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { translateText } from "@/lib/speech/demoTranslations";
import { speakTextWithSettings } from "@/lib/speech/tts";
import { LanguageSelector, ListeningIndicator, SettingsModal, ConversationView, VoxLogo } from "@/components/vox/VoxUnified";

export default function Index() {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const addMessage = useAppStore((s) => s.addMessage);
  const setStatus = useAppStore((s) => s.setStatus);
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { startMic, stopMic, pauseMic, resumeMic } = useMicrophone();
  const { startRecognition, stopRecognition } = useSpeechRecognition();

  const handleToggle = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopRecognition(); stopMic();
    if (useAppStore.getState().status !== "idle") useAppStore.getState().setStatus("idle");
    startMic(); startRecognition(pauseMic, resumeMic);
  }, [startMic, stopMic, startRecognition, stopRecognition, pauseMic, resumeMic]);

  const handleClear = useCallback(() => {
    if (window.confirm("Vuoi cancellare tutta la cronologia?")) clearMessages();
  }, [clearMessages]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) { resumeMic(); setIsMuted(false); } else { pauseMic(); setIsMuted(true); }
  }, [isMuted, pauseMic, resumeMic]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: "Speak & Translate Live", text: "Traduci in tempo reale!", url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copiato!");
    }
  }, []);

  const handleSendText = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setInputText("");
    setStatus("processing");
    const { sourceLangCode, targetLangCode } = useAppStore.getState();
    try {
      const translated = await translateText(text, sourceLangCode, targetLangCode);
      addMessage({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        text,
        translatedText: translated,
        sourceLang: sourceLangCode.slice(0, 2).toUpperCase(),
        targetLang: targetLangCode.slice(0, 2).toUpperCase(),
        timestamp: Date.now(),
      });
      setStatus("speaking");
      speakTextWithSettings(translated, targetLangCode, () => setStatus("idle"));
    } catch {
      setStatus("idle");
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, addMessage, setStatus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[hsl(var(--background))] overflow-hidden">
      {/* HEADER */}
      <header className="px-5 pt-12 pb-3 flex items-center justify-between safe-top z-10">
        <div className="flex items-center gap-3">
          <VoxLogo />
           <h1 className="text-xl font-bold tracking-tight text-foreground">Speak & Translate Live</h1>
         </div>
         <div className="flex items-center gap-2">
           <button onClick={handleMuteToggle} className={`p-2.5 rounded-full border transition-colors ${isMuted ? "bg-destructive/10 border-destructive/40" : "bg-background border-blue-300"}`}>
             {isMuted ? <MicOff size={20} className="text-destructive" /> : <Mic size={20} className="text-blue-500" />}
           </button>
           <button onClick={handleClear} className="p-2.5 rounded-full bg-background border border-red-300 transition-colors">
             <Trash2 size={20} className="text-red-500" />
           </button>
           <button onClick={() => setSettingsOpen(true)} className="p-2.5 rounded-full bg-background border border-green-300 active:bg-green-50 transition">
             <Settings size={20} className="text-green-500" />
           </button>
           <button onClick={handleShare} className="p-2.5 rounded-full bg-background border border-orange-300 active:bg-orange-50 transition">
             <Share2 size={20} className="text-orange-500" />
           </button>
         </div>
       </header>

      {/* LANGUAGE SELECTOR */}
      <div className="px-5 py-2">
        <LanguageSelector />
      </div>

      {/* CONVERSATION */}
      <ConversationView />

      {/* TEXT INPUT */}
      <div className="px-4 pb-3 pt-2 border-t border-border bg-[hsl(var(--background))]">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un testo da tradurre..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-card text-foreground px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          {/* CLEAR button */}
          {inputText.length > 0 && (
            <button
              onClick={() => setInputText("")}
              className="p-3 rounded-full bg-destructive/10 border border-destructive/30 text-destructive transition-colors shrink-0"
              title="Cancella testo"
            >
              <span className="text-lg leading-none">✕</span>
            </button>
          )}
          {/* SEND button */}
          <button
            onClick={handleSendText}
            disabled={!inputText.trim() || isSending}
            className="p-3 rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-colors shrink-0"
            title="Traduci"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-1">Enter per inviare · Shift+Enter per a capo</p>
      </div>

      {/* MICROPHONE */}
      <div className="px-8 pt-2 pb-6 safe-bottom flex flex-col items-center">
        <ListeningIndicator onToggle={handleToggle} />
      </div>

      <SettingsModal />
    </div>
  );
}
