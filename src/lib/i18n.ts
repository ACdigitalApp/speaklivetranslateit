// App UI translations for all 7 supported languages

export type AppLang = 'it' | 'en' | 'es' | 'fr' | 'de' | 'zh' | 'sq';

export const APP_LANGUAGES: { code: AppLang; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'it', label: 'Italiano',  nativeLabel: 'Italiano',   flag: '🇮🇹' },
  { code: 'en', label: 'English',   nativeLabel: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',   nativeLabel: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',  nativeLabel: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',   nativeLabel: 'Deutsch',    flag: '🇩🇪' },
  { code: 'zh', label: '中文',       nativeLabel: '中文',        flag: '🇨🇳' },
  { code: 'sq', label: 'Shqip',     nativeLabel: 'Shqip',      flag: '🇦🇱' },
];

export type Strings = {
  appName: string;
  tapToStart: string;
  listening: string;
  translating: string;
  speaking: string;
  settings: string;
  settingsTitle: string;
  languageSettings: string;
  followSystem: string;
  appLanguage: string;
  voiceUser: string;
  female: string;
  male: string;
  micSensitivity: string;
  volume: string;
  voiceSynthesis: string;
  chooseVoice: string;
  speed: string;
  pitch: string;
  test: string;
  clearHistory: string;
  clearConfirm: string;
  mute: string;
  unmute: string;
};

export const STRINGS: Record<AppLang, Strings> = {
  it: {
    appName: 'Speak & Translate Live',
    tapToStart: 'Tocca il microfono per iniziare a tradurre',
    listening: 'In ascolto...',
    translating: 'Traduzione in corso...',
    speaking: 'Riproduzione...',
    settings: 'Impostazioni',
    settingsTitle: 'Impostazioni',
    languageSettings: 'Impostazioni lingua',
    followSystem: 'Segui il sistema',
    appLanguage: 'Lingua app',
    voiceUser: 'Voce utente',
    female: '👩 Femminile',
    male: '👨 Maschile',
    micSensitivity: 'Sensibilità Microfono',
    volume: 'Volume Riproduzione',
    voiceSynthesis: 'Sintesi Vocale',
    chooseVoice: 'Scegli la voce e regola le impostazioni di lettura',
    speed: 'Velocità',
    pitch: 'Tono',
    test: 'Prova',
    clearHistory: 'Cancella cronologia',
    clearConfirm: 'Vuoi cancellare tutta la cronologia?',
    mute: 'Silenzia microfono',
    unmute: 'Riattiva microfono',
  },
  en: {
    appName: 'Speak & Translate Live',
    tapToStart: 'Tap the microphone to start translating',
    listening: 'Listening...',
    translating: 'Translating...',
    speaking: 'Speaking...',
    settings: 'Settings',
    settingsTitle: 'Settings',
    languageSettings: 'Language settings',
    followSystem: 'Follow system',
    appLanguage: 'App language',
    voiceUser: 'User voice',
    female: '👩 Female',
    male: '👨 Male',
    micSensitivity: 'Microphone Sensitivity',
    volume: 'Playback Volume',
    voiceSynthesis: 'Voice Synthesis',
    chooseVoice: 'Choose voice and adjust reading settings',
    speed: 'Speed',
    pitch: 'Pitch',
    test: 'Test',
    clearHistory: 'Clear history',
    clearConfirm: 'Do you want to clear all history?',
    mute: 'Mute microphone',
    unmute: 'Unmute microphone',
  },
  es: {
    appName: 'Speak & Translate Live',
    tapToStart: 'Toca el micrófono para empezar a traducir',
    listening: 'Escuchando...',
    translating: 'Traduciendo...',
    speaking: 'Reproduciendo...',
    settings: 'Ajustes',
    settingsTitle: 'Ajustes',
    languageSettings: 'Configuración de idioma',
    followSystem: 'Seguir el sistema',
    appLanguage: 'Idioma de la app',
    voiceUser: 'Voz del usuario',
    female: '👩 Femenino',
    male: '👨 Masculino',
    micSensitivity: 'Sensibilidad del micrófono',
    volume: 'Volumen de reproducción',
    voiceSynthesis: 'Síntesis de voz',
    chooseVoice: 'Elige la voz y ajusta la configuración',
    speed: 'Velocidad',
    pitch: 'Tono',
    test: 'Prueba',
    clearHistory: 'Borrar historial',
    clearConfirm: '¿Quieres borrar todo el historial?',
    mute: 'Silenciar micrófono',
    unmute: 'Reactivar micrófono',
  },
  fr: {
    appName: 'Speak & Translate Live',
    tapToStart: 'Appuyez sur le micro pour commencer à traduire',
    listening: 'Écoute...',
    translating: 'Traduction...',
    speaking: 'Lecture...',
    settings: 'Paramètres',
    settingsTitle: 'Paramètres',
    languageSettings: 'Paramètres de langue',
    followSystem: 'Suivre le système',
    appLanguage: "Langue de l'app",
    voiceUser: 'Voix utilisateur',
    female: '👩 Féminin',
    male: '👨 Masculin',
    micSensitivity: 'Sensibilité du microphone',
    volume: 'Volume de lecture',
    voiceSynthesis: 'Synthèse vocale',
    chooseVoice: 'Choisissez la voix et ajustez les paramètres',
    speed: 'Vitesse',
    pitch: 'Tonalité',
    test: 'Tester',
    clearHistory: "Effacer l'historique",
    clearConfirm: "Voulez-vous effacer tout l'historique?",
    mute: 'Couper le microphone',
    unmute: 'Réactiver le microphone',
  },
  de: {
    appName: 'Speak & Translate Live',
    tapToStart: 'Tippe auf das Mikrofon zum Übersetzen',
    listening: 'Zuhören...',
    translating: 'Übersetzen...',
    speaking: 'Wiedergabe...',
    settings: 'Einstellungen',
    settingsTitle: 'Einstellungen',
    languageSettings: 'Spracheinstellungen',
    followSystem: 'System folgen',
    appLanguage: 'App-Sprache',
    voiceUser: 'Benutzerstimme',
    female: '👩 Weiblich',
    male: '👨 Männlich',
    micSensitivity: 'Mikrofonempfindlichkeit',
    volume: 'Wiedergabelautstärke',
    voiceSynthesis: 'Sprachsynthese',
    chooseVoice: 'Stimme wählen und Einstellungen anpassen',
    speed: 'Geschwindigkeit',
    pitch: 'Tonhöhe',
    test: 'Testen',
    clearHistory: 'Verlauf löschen',
    clearConfirm: 'Möchten Sie den gesamten Verlauf löschen?',
    mute: 'Mikrofon stummschalten',
    unmute: 'Mikrofon aktivieren',
  },
  zh: {
    appName: 'Speak & Translate Live',
    tapToStart: '点击麦克风开始翻译',
    listening: '正在聆听...',
    translating: '翻译中...',
    speaking: '播放中...',
    settings: '设置',
    settingsTitle: '设置',
    languageSettings: '语言设置',
    followSystem: '跟随系统',
    appLanguage: '应用语言',
    voiceUser: '用户声音',
    female: '👩 女声',
    male: '👨 男声',
    micSensitivity: '麦克风灵敏度',
    volume: '播放音量',
    voiceSynthesis: '语音合成',
    chooseVoice: '选择语音并调整设置',
    speed: '语速',
    pitch: '音调',
    test: '测试',
    clearHistory: '清除历史',
    clearConfirm: '确定要清除所有记录吗？',
    mute: '静音麦克风',
    unmute: '取消静音',
  },
  sq: {
    appName: 'Speak & Translate Live',
    tapToStart: 'Prek mikrofonin për të filluar përkthimin',
    listening: 'Duke dëgjuar...',
    translating: 'Duke përkthyer...',
    speaking: 'Duke luajtur...',
    settings: 'Cilësimet',
    settingsTitle: 'Cilësimet',
    languageSettings: 'Cilësimet e gjuhës',
    followSystem: 'Ndiq sistemin',
    appLanguage: 'Gjuha e aplikacionit',
    voiceUser: 'Zëri i përdoruesit',
    female: '👩 Femër',
    male: '👨 Mashkull',
    micSensitivity: 'Ndjeshmëria e mikrofonit',
    volume: 'Volumi i riprodhimit',
    voiceSynthesis: 'Sinteza e zërit',
    chooseVoice: 'Zgjidh zërin dhe rregullit cilësimet',
    speed: 'Shpejtësia',
    pitch: 'Toni',
    test: 'Provë',
    clearHistory: 'Fshi historikun',
    clearConfirm: 'Dëshironi të fshini të gjithë historikun?',
    mute: 'Heshtje mikrofoni',
    unmute: 'Aktivizo mikrofonin',
  },
};

export function getStrings(lang: AppLang): Strings {
  return STRINGS[lang] ?? STRINGS.it;
}

// Link to the AC Digital App portal: brand line + descriptive line (Italian and English; other languages fall back to English)
const AC_DIGITAL_LINK_TEXT: Partial<Record<AppLang, { title: string; subtitle: string }>> = {
  it: { title: 'AC Digital App', subtitle: 'Scopri le altre applicazioni' },
  en: { title: 'AC Digital App', subtitle: 'Discover our other apps' },
};

export function getAcDigitalLinkText(lang: AppLang): { title: string; subtitle: string } {
  return AC_DIGITAL_LINK_TEXT[lang] ?? AC_DIGITAL_LINK_TEXT.en!;
}

export function detectSystemLang(): AppLang {
  const sys = navigator.language?.slice(0, 2).toLowerCase();
  const supported: AppLang[] = ['it','en','es','fr','de','zh','sq'];
  return supported.includes(sys as AppLang) ? (sys as AppLang) : 'en';
}
