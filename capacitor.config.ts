import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecoguardian.app',
  appName: 'EcoGuardian',
  webDir: 'dist/public',
  server: {
    // Load the app directly from the dev server — all relative /api paths work automatically
    url: 'http://192.168.0.20:3000',
    cleartext: true,
    androidScheme: 'http',
  },
};

export default config;
