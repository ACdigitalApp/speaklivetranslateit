import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.speaklivetranslate',
  appName: 'Speak & Translate Live',
  webDir: 'dist',
  server: {
    url: 'https://speaklivetranslate.it',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
