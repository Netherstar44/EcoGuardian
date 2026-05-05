import { createRoot } from "react-dom/client";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import App from "./App";
import "./index.css";

import { StatusBar } from '@capacitor/status-bar';

// Inicializa el plugin de Google Auth
GoogleAuth.initialize({
  clientId: '88091990755-v6k744gs1f75423juad1p66q7ga49vpn.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});

if ((window as any).Capacitor?.isNative) {
  StatusBar.hide().catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);
