import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecoguardian.app',
  appName: 'EcoGuardian',
  webDir: 'dist/public',
  server: {
    cleartext: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "88091990755-v6k744gs1f75423juad1p66q7ga49vpn.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
