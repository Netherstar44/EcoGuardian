import { createRoot } from "react-dom/client";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import App from "./App";
import "./index.css";

import { StatusBar } from '@capacitor/status-bar';

// Inicializa el plugin de Google Auth
GoogleAuth.initialize({
  clientId: '88091990755-cafbvvp1f5f5nidrp6nuu0rlsn33l6cb.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});

import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform() || navigator.userAgent.includes('wv')) {
  StatusBar.setOverlaysWebView({ overlay: true }).catch(console.error);
  StatusBar.setBackgroundColor({ color: '#00000000' }).catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);
