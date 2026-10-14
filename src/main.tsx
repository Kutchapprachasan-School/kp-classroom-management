import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { cloudDataService } from './services/cloudDataService'
import { cleanSlateService } from './services/cleanSlateService'

// Auto-purge legacy mock data for fresh real-world testing (Once per client)
const CLEAN_SLATE_INIT_KEY = 'kp_clean_slate_v2_active';
if (typeof window !== 'undefined' && window.localStorage) {
  if (window.localStorage.getItem(CLEAN_SLATE_INIT_KEY) !== 'true') {
    cleanSlateService.purgeTransactionalMockData();
    window.localStorage.setItem(CLEAN_SLATE_INIT_KEY, 'true');
  }
}

// Initialize Centralized Supabase Cloud Persistence (Cross-Device Sync)
cloudDataService.initializeCloudSync().catch((err) => {
  console.warn('[main] Cloud sync initialization fallback:', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

