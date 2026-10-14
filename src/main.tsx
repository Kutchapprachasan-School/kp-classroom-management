import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { cloudDataService } from './services/cloudDataService'

// Initialize Centralized Supabase Cloud Persistence (Cross-Device Sync)
cloudDataService.initializeCloudSync().catch((err) => {
  console.warn('[main] Cloud sync initialization fallback:', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

