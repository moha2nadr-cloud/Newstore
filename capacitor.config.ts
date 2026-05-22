import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alattar.islamicmedicine',
  appName: 'الطب الإسلامي البديل',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
