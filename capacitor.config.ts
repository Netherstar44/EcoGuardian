import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecoguardian.app',
  appName: 'EcoGuardian',
  webDir: 'dist/public',
  server: {
    // Load the app directly from Vercel — all relative /api paths work automatically
    url: 'https://eco-guardian-sand.vercel.app',
    cleartext: true,
  },
};

export default config;
