import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRightLeft,
  Camera,
  ChevronDown,
  FileText,
  Languages,
  LogIn,
  Mic,
  Send,
  Settings,
  Share2,
  Shield,
  Trash2,
  User,
  Volume2,
} from "lucide-react";

import { translateText } from "@/lib/speech/demoTranslations";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { SettingsModal } from "@/components/vox/VoxUnified";
import { VoiceSetupModal } from "@/components/vox/VoiceSetupModal";
import SEOHead from "@/components/SEOHead";
import HomeFAQ, { HOME_FAQ_DATA } from "@/components/HomeFAQ";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

type Language = {
  code: string;
  label: string;
  flag: string;
  speechCode: string;
};

type Status = "idle" | "listening" | "translating" | "speaking" | "error";

type ConversationItem = {
  id: string;
  source: string;
  translated: string;
  from: string;
  to: string;
};

const SESSION_STORAGE_KEY = "acaridi_translate_session_id";

const languages: Language[] = [
  { code: "it", label: "Italiano", flag: "🇮🇹", speechCode: "it-IT" },
  { code: "en", label: "English", flag: "🇬🇧", speechCode: "en-GB" },
  { code: "es", label: "Español", flag: "🇪🇸", speechCode: "es-ES" },
  { code: "fr", label: "Français", flag: "🇫🇷", speechCode: "fr-FR" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", speechCode: "de-DE" },
  { code: "pt", label: "Português", flag: "🇵🇹", speechCode: "pt-PT" },
  { code: "ru", label: "Русский", flag: "🇷🇺", speechCode: "ru-RU" },
  { code: "ar", label: "العربية", flag: "🇸🇦", speechCode: "ar-SA" },
  { code: "zh", label: "中文", flag: "🇨🇳", speechCode: "zh-CN" },
  { code: "ja", label: "日本語", flag: "🇯🇵", speechCode: "ja-JP" },
  { code: "ko", label: "한국어", flag: "🇰🇷", speechCode: "ko-KR" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳", speechCode: "hi-IN" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", speechCode: "nl-NL" },
  { code: "pl", label: "Polski", flag: "🇵🇱", speechCode: "pl-PL" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", speechCode: "tr-TR" },
];

const createId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const [fromLang, setFromLang] = useState<Language>(languages[0]);
  const [toLang, setToLang] = useState<Language>(languages[1]);
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState("");
  const [autoSpeak] = useState(true);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Legge le lingue anche dallo store per sincronizzazione bidirezionale.
  // Quando lo store cambia (es. da SettingsModal o altro), la Home si aggiorna.
  const storeTargetCode = useAppStore((s) => s.targetLangCode);
  const storeSourceCode = useAppStore((s) => s.sourceLangCode);

  // Sync Store → Home: se targetLangCode nello store cambia, aggiorna toLang
  useEffect(() => {
    // Match esatto prima, poi match per prefisso a 2 caratteri (es. en-US → en-GB)
    const found =
      languages.find((l) => l.speechCode === storeTargetCode) ||
      languages.find((l) => l.speechCode.slice(0, 2) === storeTargetCode.slice(0, 2));
    if (found && found.code !== toLang.code) setToLang(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeTargetCode]);

  // Sync Store → Home: se sourceLangCode nello store cambia, aggiorna fromLang
  useEffect(() => {
    const found =
      languages.find((l) => l.speechCode === storeSourceCode) ||
      languages.find((l) => l.speechCode.slice(0, 2) === storeSourceCode.slice(0, 2));
    if (found && found.code !== fromLang.code) setFromLang(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSourceCode]);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentAudioLevelRef = useRef(0);
  const dictatedTextRef = useRef("");
  const rafRef = useRef<number>(0);

  const canSwap = useMemo(
    () => fromLang.code !== toLang.code,
    [fromLang.code, toLang.code]
  );

  const recognitionSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current !== null) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const releaseMicPermission = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    currentAudioLevelRef.current = 0;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    clearRestartTimeout();
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // niente
    } finally {
      recognitionRef.current = null;
      setStatus("idle");
    }
  }, [clearRestartTimeout]);

  const startAudioMonitor = useCallback((stream: MediaStream) => {
    if (audioContextRef.current) return;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let frameCount = 0;
    const monitor = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const level = Math.min(sum / dataArray.length / 128, 1);
      currentAudioLevelRef.current = level;
      // Update React state every ~3 frames (~50ms) to avoid excessive re-renders
      frameCount++;
      if (frameCount % 3 === 0) setAudioLevel(level);
      rafRef.current = requestAnimationFrame(monitor);
    };
    monitor();
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("MicrophoneUnavailable");
    }

    if (mediaStreamRef.current) {
      return mediaStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    startAudioMonitor(stream);
    return stream;
  }, [startAudioMonitor]);


  const getStatusLabel = useCallback(() => {
    if (!isMicEnabled) return "Microphone off";
    switch (status) {
      case "listening":
        return "Listening...";
      case "translating":
        return "Translating...";
      case "speaking":
        return "Speaking...";
      case "error":
        return "Error";
      default:
        return "Microphone on";
    }
  }, [isMicEnabled, status]);

  const scheduleRestartListening = useCallback(() => {
    if (!shouldKeepListeningRef.current || !isMicEnabled) return;
    clearRestartTimeout();
    restartTimeoutRef.current = window.setTimeout(() => {
      if (!shouldKeepListeningRef.current || !isMicEnabled || recognitionRef.current) {
        return;
      }
      const event = new CustomEvent("vox:start-continuous-listening");
      window.dispatchEvent(event);
    }, 250);
  }, [clearRestartTimeout, isMicEnabled]);

  const speakText = useCallback(
    (content: string) => {
      if (
        !content ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        setStatus(isMicEnabled && shouldKeepListeningRef.current ? "listening" : "idle");
        scheduleRestartListening();
        return;
      }

      stopSpeaking();

      const store = useAppStore.getState();
      const allVoices = window.speechSynthesis.getVoices();

      // Try to use the voice selected in settings
      const selectedVoice = allVoices.find((v) => v.name === store.voiceName);

      // Check if selected voice language matches target language
      if (selectedVoice) {
        const voiceLangPrefix = selectedVoice.lang?.slice(0, 2).toLowerCase();
        const targetPrefix = toLang.code.toLowerCase();
        if (voiceLangPrefix && voiceLangPrefix !== targetPrefix) {
          // Vocal warning about mismatch
          const warning = new SpeechSynthesisUtterance(
            `Warning: the selected voice is ${selectedVoice.lang}, but the target language is ${toLang.label}. Please change the voice in settings.`
          );
          warning.lang = "en-US";
          warning.rate = 1;
          warning.pitch = 1;
          warning.volume = 1;
          const itVoice = allVoices.find((v) => v.lang?.startsWith("it") && v.name.toLowerCase().includes("google"));
          if (itVoice) warning.voice = itVoice;
          warning.onend = () => {
            setStatus(isMicEnabled && shouldKeepListeningRef.current ? "listening" : "idle");
            scheduleRestartListening();
          };
          window.speechSynthesis.speak(warning);
          setStatus("speaking");
          return;
        }
      }

      // Fallback: find a Google voice or any voice for the target language
      const fallbackVoice =
        allVoices.find((v) => v.name.toLowerCase().includes("google") && v.lang.startsWith(toLang.code)) ||
        allVoices.find((v) => v.lang === toLang.speechCode) ||
        allVoices.find((v) => v.lang.startsWith(toLang.code));

      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = toLang.speechCode;
      utterance.voice = selectedVoice || fallbackVoice || null;
      utterance.rate = store.speechRate;
      utterance.pitch = store.speechPitch;
      utterance.volume = store.volume / 100;

      utterance.onstart = () => setStatus("speaking");
      utterance.onend = () => {
        if (isMicEnabled && shouldKeepListeningRef.current) {
          setStatus("listening");
          scheduleRestartListening();
          return;
        }
        setStatus("idle");
      };
      utterance.onerror = () => {
        if (isMicEnabled && shouldKeepListeningRef.current) {
          setStatus("listening");
          scheduleRestartListening();
          return;
        }
        setStatus("idle");
      };

      window.speechSynthesis.speak(utterance);
    },
    [clearRestartTimeout, isMicEnabled, scheduleRestartListening, stopSpeaking, toLang.code, toLang.label, toLang.speechCode]
  );

  const loadConversation = useCallback(async (_sid: string) => {
    // Conversation history is kept in local state only
  }, []);

  const handleTranslate = useCallback(
    async (rawText?: string) => {
      const cleanText = (rawText ?? text)
        .replace(/\s*\[.*?\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!cleanText) return;

      dictatedTextRef.current = cleanText;
      setErrorText("");
      setTranslatedText("");
      setStatus("translating");

      try {
        const translated = await translateText(cleanText, fromLang.code, toLang.code);

        setText(cleanText);
        setTranslatedText(translated);

        setConversation((prev) => [
          ...prev,
          {
            id: createId(),
            source: cleanText,
            translated,
            from: fromLang.label,
            to: toLang.label,
          },
        ]);

        if (autoSpeak) {
          speakText(translated);
        } else {
          if (isMicEnabled && shouldKeepListeningRef.current) {
            setStatus("listening");
            scheduleRestartListening();
          } else {
            setStatus("idle");
          }
        }
      } catch (error) {
        console.error(error);
        setStatus("error");
        setErrorText(
          "Translation failed. Please try again in a few seconds."
        );
        if (isMicEnabled && shouldKeepListeningRef.current) {
          scheduleRestartListening();
        }
      }
    },
    [
      autoSpeak,
      fromLang.code,
      fromLang.label,
      isMicEnabled,
      scheduleRestartListening,
      speakText,
      text,
      toLang.code,
      toLang.label,
    ]
  );

  const swapLanguages = useCallback(() => {
    if (!canSwap) return;
    setFromLang(toLang);
    setToLang(fromLang);
    // Sincronizza lo store per la modale Sintesi Vocale
    useAppStore.getState().setSourceLangCode(toLang.speechCode);
    useAppStore.getState().setTargetLangCode(fromLang.speechCode);
  }, [canSwap, fromLang, toLang]);

  const startListening = useCallback(async () => {
    if (!recognitionSupported || typeof window === "undefined") {
      setStatus("error");
      setErrorText("Speech Recognition is not supported in this browser.");
      return;
    }

    stopSpeaking();
    dictatedTextRef.current = "";
    setText("");
    setTranslatedText("");
    setErrorText("");
    clearRestartTimeout();

    // Request mic permission directly from big button click
    try {
      await requestMicrophonePermission();
      setIsMicEnabled(true);
    } catch (error: any) {
      console.error(error);
      const permissionDenied =
        error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      setStatus("error");
      setErrorText(
        permissionDenied
          ? "Microphone permission denied by the device."
          : "Unable to access the device microphone."
      );
      return;
    }

    if (recognitionRef.current) {
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setStatus("error");
      setErrorText("Speech Recognition not available.");
      return;
    }

    shouldKeepListeningRef.current = true;

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.lang = fromLang.speechCode;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus("listening");
    };

    recognition.onresult = (event: any) => {
      let finalizedText = dictatedTextRef.current;
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results?.[i];
        const transcript = result?.[0]?.transcript?.trim?.() || "";
        if (!transcript) continue;

        if (result?.isFinal) {
          finalizedText = finalizedText ? `${finalizedText} ${transcript}` : transcript;
        } else {
          interimTranscript = interimTranscript
            ? `${interimTranscript} ${transcript}`
            : transcript;
        }
      }

      const normalizedFinalText = finalizedText.replace(/\s+/g, " ").trim();
      dictatedTextRef.current = normalizedFinalText;
      setTranslatedText("");

      if (interimTranscript) {
        setText(
          normalizedFinalText
            ? `${normalizedFinalText} [${interimTranscript}]`
            : `[${interimTranscript}]`
        );
        return;
      }

      setText(normalizedFinalText);
    };

    recognition.onerror = (event: any) => {
      if (event?.error === "aborted" || event?.error === "no-speech") {
        if (shouldKeepListeningRef.current) {
          scheduleRestartListening();
        }
        return;
      }

      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        setIsMicEnabled(false);
        shouldKeepListeningRef.current = false;
        releaseMicPermission();
        setStatus("error");
        setErrorText("Microphone permission denied by the device.");
        return;
      }

      setStatus("error");
      setErrorText("Error during voice recognition.");
      if (shouldKeepListeningRef.current) {
        scheduleRestartListening();
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (shouldKeepListeningRef.current) {
        setStatus("listening");
        scheduleRestartListening();
        return;
      }
      setStatus("idle");
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
      recognitionRef.current = null;
      setStatus("error");
      setErrorText("Unable to start voice listening.");
    }
  }, [clearRestartTimeout, fromLang.speechCode, recognitionSupported, releaseMicPermission, requestMicrophonePermission, scheduleRestartListening, stopSpeaking]);

  // Big mic button: toggles start/stop directly
  const handleBigMicToggle = useCallback(async () => {
    if (isMicEnabled && shouldKeepListeningRef.current) {
      // Stop everything
      stopListening();
      stopSpeaking();
      dictatedTextRef.current = "";
      releaseMicPermission();
      setIsMicEnabled(false);
      setErrorText("");
      return;
    }

    // Start listening (requests permission directly)
    await startListening();
  }, [isMicEnabled, releaseMicPermission, startListening, stopListening, stopSpeaking]);

  // Small mic button: opens voice setup
  const handleSmallMicClick = useCallback(() => {
    useAppStore.getState().setVoiceSetupOpen(true);
  }, []);

  const handleContinuousListeningStart = useCallback(async () => {
    await startListening();
  }, [startListening]);

  const handleSend = useCallback(async () => {
    const cleanText = (dictatedTextRef.current || text)
      .replace(/\s*\[.*?\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleanText) return;

    const unlockUtterance = new SpeechSynthesisUtterance("");
    unlockUtterance.volume = 0;
    window.speechSynthesis?.speak(unlockUtterance);

    dictatedTextRef.current = cleanText;
    setText(cleanText);
    setTranslatedText("");
    await handleTranslate(cleanText);
  }, [handleTranslate, text]);

  const handleDelete = useCallback(async () => {
    stopListening();
    stopSpeaking();
    dictatedTextRef.current = "";
    releaseMicPermission();
    setIsMicEnabled(false);
    setText("");
    setTranslatedText("");
    setConversation([]);
    setErrorText("");
    useAppStore.getState().setSettingsOpen(false);
    setStatus("idle");

    const newSessionId = createId();
    setSessionId(newSessionId);

    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    }
  }, [releaseMicPermission, stopListening, stopSpeaking]);

  const handleShare = useCallback(async () => {
    const content = translatedText
      ? `Originale: ${text}\nTraduzione: ${translatedText}`
      : text || "Speak & Translate Live";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Speak & Translate Live",
          text: content,
          url: window.location.href,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
        alert("Text copied to clipboard");
        return;
      }

      alert(content);
    } catch (error) {
      console.error(error);
    }
  }, [text, translatedText]);

  const handleReplayVoice = useCallback(() => {
    if (!translatedText) return;
    speakText(translatedText);
  }, [speakText, translatedText]);

  const onTextareaKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored =
      localStorage.getItem(SESSION_STORAGE_KEY)?.trim() || createId();

    localStorage.setItem(SESSION_STORAGE_KEY, stored);
    setSessionId(stored);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    void loadConversation(sessionId);
  }, [loadConversation, sessionId]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    // Unico scopo: triggerare il lazy-loading delle voci appena l'app si monta.
    // NON impostiamo onvoiceschanged qui per evitare conflitti con la SettingsModal
    // che usa addEventListener per gestire voiceschanged in modo non-esclusivo.
    window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.key.toLowerCase() === "m") {
        e.preventDefault();
        void handleBigMicToggle();
      }

      if (meta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        swapLanguages();
      }

      if (meta && e.key === "Enter") {
        e.preventDefault();
        void handleSend();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        void handleDelete();
      }
    };

    const onContinuousListeningStart = () => {
      void handleContinuousListeningStart();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("vox:start-continuous-listening", onContinuousListeningStart);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("vox:start-continuous-listening", onContinuousListeningStart);
    };
  }, [handleContinuousListeningStart, handleDelete, handleBigMicToggle, handleSend, swapLanguages]);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
      releaseMicPermission();
      clearRestartTimeout();
    };
  }, [clearRestartTimeout, releaseMicPermission, stopListening, stopSpeaking]);

  const seoJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AC Digital App",
      url: "https://speaklivetranslate.it",
      email: "acdigital.app@gmail.com",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Speak & Translate Live",
      url: "https://speaklivetranslate.it",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Speak & Translate Live",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web, iOS, Android, Desktop",
      description:
        "Traduttore vocale e testuale in tempo reale per viaggi, lavoro, studio e conversazioni multilingua.",
      url: "https://speaklivetranslate.it",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://speaklivetranslate.it/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Speak & Translate Live",
          item: "https://speaklivetranslate.it/",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOME_FAQ_DATA.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-transparent text-[#243428]">
      <SEOHead jsonLd={seoJsonLd} />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-6 pt-4 sm:max-w-lg">
        <header className="mb-4 rounded-[24px] border border-[#D7E3DA] bg-white/55 px-4 py-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="shrink-0">
              <span className="text-sm italic font-medium tracking-wide" style={{ color: '#2D6A4F' }}>
                by AC Digital App
              </span>
            </div>

            <div className="grid shrink-0 grid-cols-4 gap-2">
              <TopActionButton ariaLabel="Voice setup" onClick={handleSmallMicClick}>
                <Mic className="h-[18px] w-[18px]" />
              </TopActionButton>

              <TopActionButton ariaLabel="Delete" onClick={() => void handleDelete()}>
                <Trash2 className="h-[18px] w-[18px]" />
              </TopActionButton>

              <TopActionButton
                ariaLabel="Settings"
                onClick={() => {
                  useAppStore.getState().setSettingsOpen(true);
                }}
              >
                <Settings className="h-[18px] w-[18px]" />
              </TopActionButton>

              <TopActionButton ariaLabel="Share" onClick={() => void handleShare()}>
                <Share2 className="h-[18px] w-[18px]" />
              </TopActionButton>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#1C6B3B] sm:text-[32px]">
              Speak &amp; Translate Live
            </h1>
          </div>

        </header>

        {/* Navigation buttons */}
        <section className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/photo")}
            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-[18px] border border-[#D7E3DA] bg-white/80 px-4 py-3.5 text-[15px] font-semibold text-[#1C6B3B] shadow-[0_4px_12px_rgba(22,42,28,0.06)] transition hover:bg-[#F4F8F5] active:scale-[0.98]"
          >
            <Camera className="h-5 w-5" />
            Traduttore Foto
          </button>
          <button
            onClick={() => navigate("/pdf")}
            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-[18px] border border-[#D7E3DA] bg-white/80 px-4 py-3.5 text-[15px] font-semibold text-[#1C6B3B] shadow-[0_4px_12px_rgba(22,42,28,0.06)] transition hover:bg-[#F4F8F5] active:scale-[0.98]"
          >
            <FileText className="h-5 w-5" />
            Traduttore PDF
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-[18px] border border-[#D7E3DA] bg-white/80 px-4 py-3.5 text-[15px] font-semibold text-[#1C6B3B] shadow-[0_4px_12px_rgba(22,42,28,0.06)] transition hover:bg-[#F4F8F5] active:scale-[0.98]"
          >
            <Languages className="h-5 w-5" />
            Premium
          </button>
          {!isAuthenticated ? (
            <button
              onClick={() => navigate("/login")}
              className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-[18px] border border-[#D7E3DA] bg-white/80 px-4 py-3.5 text-[15px] font-semibold text-[#1C6B3B] shadow-[0_4px_12px_rgba(22,42,28,0.06)] transition hover:bg-[#F4F8F5] active:scale-[0.98]"
            >
              <LogIn className="h-5 w-5" />
              Accedi
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/settings")}
                className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-[18px] border border-[#D7E3DA] bg-white/80 px-4 py-3.5 text-[15px] font-semibold text-[#1C6B3B] shadow-[0_4px_12px_rgba(22,42,28,0.06)] transition hover:bg-[#F4F8F5] active:scale-[0.98]"
              >
                <User className="h-5 w-5" />
                {currentUser?.name?.split(' ')[0] || 'Profilo'}
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => navigate("/admin/users")}
                  aria-current={isAdminRoute ? 'page' : undefined}
                  className={
                    isAdminRoute
                      ? "flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-[18px] border-2 border-[#1C6B3B] bg-[#1C6B3B] px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(28,107,59,0.35)] ring-2 ring-[#1C6B3B]/30 ring-offset-2 ring-offset-white transition active:scale-[0.98]"
                      : "flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-[18px] border border-[#1C6B3B] bg-[#1C6B3B] px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_12px_rgba(22,42,28,0.15)] transition hover:bg-[#155a30] active:scale-[0.98]"
                  }
                >
                  <Shield className="h-5 w-5" />
                  {isAdminRoute ? 'Gestione Utenti' : 'Pannello Admin'}
                </button>
              )}
            </>
          )}
        </section>

        <section className="mb-5">
          <div className="flex items-center gap-3">
            <LanguageCard
              value={fromLang}
              onChange={(e) => {
                const selected = languages.find(
                  (lang) => lang.code === e.target.value
                );
                if (selected) {
                  setFromLang(selected);
                  useAppStore.getState().setSourceLangCode(selected.speechCode);
                }
              }}
            />

            <button
              type="button"
              onClick={swapLanguages}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition hover:bg-[#165330] active:scale-[0.98]"
              aria-label="Swap languages"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>

            <LanguageCard
              value={toLang}
              onChange={(e) => {
                const selected = languages.find(
                  (lang) => lang.code === e.target.value
                );
                if (selected) {
                  setToLang(selected);
                  useAppStore.getState().setTargetLangCode(selected.speechCode);
                }
              }}
            />
          </div>
        </section>

        <main className="flex flex-1 flex-col">
          <section className="flex flex-1 flex-col justify-between rounded-[28px] border border-[#D7E3DA] bg-white/35 px-6 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <div>
              <div className="mb-4 flex items-center justify-center">
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                    status === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-[rgba(28,107,59,0.10)] text-[#1C6B3B]"
                  }`}
                >
                  {getStatusLabel()}
                </span>
              </div>

              {!translatedText ? (
                <div className="mx-auto max-w-xs">
                  <h2 className="text-[20px] font-semibold leading-snug text-[#2A4A35]">
                    Press the microphone to speak, then tap TRANSLATE
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#61736A]">
                    The small 🎙️ button opens voice setup · Press the big mic again to stop
                  </p>
                </div>
              ) : (
                <div className="mx-auto max-w-sm text-left">
                  <div className="rounded-[20px] border border-[#D7E3DA] bg-white/80 p-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#61736A]">
                      {fromLang.label}
                    </p>
                    <p className="text-[15px] leading-relaxed text-[#243428]">
                      {text}
                    </p>
                  </div>

                  <div className="mt-3 rounded-[20px] border border-[#D7E3DA] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#61736A]">
                        {toLang.label}
                      </p>

                      <button
                        type="button"
                        onClick={handleReplayVoice}
                        className="flex items-center gap-1 rounded-full border border-[#D7E3DA] bg-white px-2 py-1 text-[12px] text-[#1C6B3B]"
                        aria-label="Play translated audio"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Listen
                      </button>
                    </div>

                    <p className="text-[17px] font-medium leading-relaxed text-[#243428]">
                      {translatedText}
                    </p>
                  </div>
                </div>
              )}

              {errorText && (
                <p className="mx-auto mt-4 max-w-sm text-[13px] text-red-600">
                  {errorText}
                </p>
              )}
            </div>

            {conversation.length > 0 && (
              <div className="mt-5 text-left">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#61736A]">
                  Recent history
                </p>

                <div className="space-y-2">
                  {conversation.slice(-3).reverse().map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[16px] border border-[#D7E3DA] bg-white/70 p-3"
                    >
                      <p className="text-[12px] text-[#61736A]">
                        {item.from || fromLang.label} → {item.to || toLang.label}
                      </p>
                      <p className="mt-1 text-[13px] text-[#243428]">
                        {item.source}
                      </p>
                      <p className="mt-1 text-[14px] font-medium text-[#1C6B3B]">
                        {item.translated}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="mt-5 border-t border-[#D7E3DA] pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-[18px] border border-[#D7E3DA] bg-white/90 shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
                <textarea
                  value={text}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    dictatedTextRef.current = nextValue
                      .replace(/\s*\[.*?\]/g, "")
                      .replace(/\s+/g, " ")
                      .trim();
                    setText(nextValue);
                    setTranslatedText("");
                  }}
                  onKeyDown={onTextareaKeyDown}
                  rows={1}
                  placeholder="Type text to translate..."
                  className="min-h-[52px] w-full resize-none bg-transparent px-4 py-3 text-[16px] text-[#243428] outline-none placeholder:text-[#7C8B82]"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSend()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition hover:bg-[#165330] active:scale-[0.98]"
                aria-label="Send text"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 px-1 text-[13px] text-[#6E7E75]">
              Enter to send · Ctrl/Cmd+Enter send · Shift+Enter new line
            </p>

            {/* Social proof */}
            <p className="text-center text-xs font-medium mt-3 mb-1 tracking-wide" style={{ color: '#2D6A4F' }}>
              Over 1,200 visits
            </p>

            <div className="mt-4 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center gap-6">
                {/* Audio level ring on mic button */}
                {status === "listening" && audioLevel > 0.05 && (
                  <div
                    className="absolute left-1/2 -translate-x-[calc(50%+3.25rem)] rounded-full border-[3px] border-[#1C6B3B] pointer-events-none transition-transform duration-75"
                    style={{
                      width: `${112 + audioLevel * 48}px`,
                      height: `${112 + audioLevel * 48}px`,
                      opacity: 0.15 + audioLevel * 0.55,
                    }}
                  />
                )}

                {/* Big mic button */}
                <button
                  type="button"
                  onClick={() => void handleBigMicToggle()}
                  className={`relative flex h-28 w-28 items-center justify-center rounded-full border transition active:scale-[0.98] ${
                    isMicEnabled
                      ? "border-red-500 bg-red-500 text-white shadow-[0_14px_32px_rgba(220,38,38,0.22)]"
                      : "border-[#1C6B3B] bg-[#1C6B3B] text-white shadow-[0_14px_32px_rgba(28,107,59,0.22)] hover:bg-[#165330]"
                  }`}
                  aria-label={isMicEnabled ? "Stop voice translation" : "Start voice translation"}
                >
                  {isMicEnabled ? (
                    <div className="h-10 w-10 rounded-md bg-white" />
                  ) : (
                    <Mic className="h-12 w-12" strokeWidth={1.8} />
                  )}
                </button>

                {/* Big TRADUCI button — same size as mic */}
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-[#1C6B3B] bg-white text-[#1C6B3B] shadow-[0_14px_32px_rgba(28,107,59,0.12)] transition hover:bg-[#F4F8F5] active:scale-[0.98]"
                  aria-label="Translate text"
                >
                  <Languages className="h-10 w-10" strokeWidth={1.8} />
                  <span className="mt-1 text-[13px] font-bold tracking-wide">TRANSLATE</span>
                </button>
              </div>

              {/* Audio level bar */}
              {status === "listening" && (
                <div className="mt-4 w-48 h-2 rounded-full bg-[#D7E3DA] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${Math.max(audioLevel * 100, 2)}%`,
                      backgroundColor: audioLevel > 0.6 ? "#dc2626" : audioLevel > 0.3 ? "#f59e0b" : "#1C6B3B",
                    }}
                  />
                </div>
              )}

              <p className="mt-4 max-w-[300px] text-center text-[15px] leading-relaxed text-[#4E6358]">
                {isMicEnabled ? "Listening — tap to stop" : "Tap the microphone to start voice translation"}
              </p>

              {!recognitionSupported && (
                <p className="mt-2 text-center text-[12px] text-red-600">
                  Questo browser non supporta il riconoscimento vocale nativo.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
      <HomeFAQ />
      <SettingsModal />
      <VoiceSetupModal />
    </div>
  );
}

function TopActionButton({
  children,
  ariaLabel,
  onClick,
  isActive = false,
}: {
  children: ReactNode;
  ariaLabel: string;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`flex h-[42px] w-[42px] items-center justify-center rounded-full border shadow-[0_4px_10px_rgba(28,107,59,0.16)] transition active:scale-[0.98] ${
        isActive
          ? "border-[#1C6B3B] bg-[#1C6B3B] text-white"
          : "border-[#D7E3DA] bg-white text-[#1C6B3B] hover:bg-[#F4F8F5]"
      }`}
    >
      {children}
    </button>
  );
}

function LanguageCard({
  value,
  onChange,
}: {
  value: Language;
  onChange: ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <label className="relative block flex-1">
      <div className="pointer-events-none flex h-14 items-center rounded-[18px] border border-[#D7E3DA] bg-[rgba(255,255,255,0.88)] px-4 pr-10 text-[#243428] shadow-[0_8px_24px_rgba(22,42,28,0.08)]">
        <span className="mr-2 text-[22px]">{value.flag}</span>
        <span className="truncate text-[17px] font-medium">{value.label}</span>
        <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1C6B3B]" />
      </div>

      <select
        value={value.code}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default App;
