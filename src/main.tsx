import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx'
import { cloudDataService } from './services/cloudDataService'
import { initVersionGuard } from './config/appVersion'

// Smart Version Guard: Auto-detect version change and bust stale asset cache on startup
initVersionGuard();

// Ensure clean slate does not suppress essential school rosters on client startup
if (typeof window !== 'undefined' && window.localStorage) {
  if (window.localStorage.getItem('kp_clean_slate_mvp_activated') === 'true') {
    window.localStorage.removeItem('kp_clean_slate_mvp_activated');
  }
  if (window.localStorage.getItem('kp_clean_slate_v2_active') === 'true') {
    window.localStorage.removeItem('kp_clean_slate_v2_active');
  }

  // Purge legacy Supabase auth tokens that trigger 402 exceed_egress_quota errors
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

// Initialize Centralized Neon/Supabase Cloud Persistence (Cross-Device Sync)
cloudDataService.initializeCloudSync().catch((err) => {
  console.warn('[main] Cloud sync initialization fallback:', err);
});

// Register Service Worker with Auto-Update & Controller Change detection
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[PWA] Service Worker controller changed. Auto-reloading with latest version...');
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully:', reg.scope);
        // Actively check for SW update on page load
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
