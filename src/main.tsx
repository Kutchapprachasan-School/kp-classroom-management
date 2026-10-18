import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { cloudDataService } from './services/cloudDataService'

// Ensure clean slate does not suppress essential school rosters on client startup
if (typeof window !== 'undefined' && window.localStorage) {
  if (window.localStorage.getItem('kp_clean_slate_mvp_activated') === 'true') {
    window.localStorage.removeItem('kp_clean_slate_mvp_activated');
  }
  if (window.localStorage.getItem('kp_clean_slate_v2_active') === 'true') {
    window.localStorage.removeItem('kp_clean_slate_v2_active');
  }
}

// Initialize Centralized Supabase Cloud Persistence (Cross-Device Sync)
cloudDataService.initializeCloudSync().catch((err) => {
  console.warn('[main] Cloud sync initialization fallback:', err);
});

// Register Service Worker for Native Phone Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

