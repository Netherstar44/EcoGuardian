import { createRoot } from "react-dom/client";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import App from "./App";
import "./index.css";

// Inicializa el plugin de Google Auth
GoogleAuth.initialize({
  clientId: '88091990755-v6k744gs1f75423juad1p66q7ga49vpn.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});

createRoot(document.getElementById("root")!).render(<App />);
