import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecoguardian.app',
  appName: 'EcoGuardian',
  webDir: 'dist/public',
  server: {
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "88091990755-cafbvvp1f5f5nidrp6nuu0rlsn33l6cb.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
