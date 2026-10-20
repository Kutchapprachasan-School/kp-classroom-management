import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'kps_pwa_install_dismissed_until';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if previously dismissed within cooldown period
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        return;
      }
    } catch {
      // ignore
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 4. Capture Chromium/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Reveal prompt smoothly after 2 seconds
      setTimeout(() => setIsVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. If iOS Safari or prompt not fired, show guidance after a gentle delay
    const fallbackTimer = setTimeout(() => {
      if (!checkStandalone()) {
        setIsVisible(true);
      }
    }, 3000);

    // 6. Listen for appinstalled event to auto-hide
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
          setDeferredPrompt(null);
          setIsInstalled(true);
        } else {
          handleDismiss();
        }
      } catch {
        handleDismiss();
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Fallback instructions for unsupported browsers
      alert(
        'กรุณากดปุ่มเมนูของเบราว์เซอร์ (จุด 3 จุดที่มุมขวาบน) แล้วเลือก "ติดตั้งแอปพลิเคชัน" หรือ "เพิ่มลงในหน้าจอหลัก"'
      );
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIosGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS));
    } catch {
      // ignore
    }
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating PWA Install Prompt Banner (Bottom Right / Mobile Bottom Bar) */}
      <aside
        aria-label="การแจ้งเตือนติดตั้งแอป"
        className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto sm:max-w-md z-50 animate-fade-in select-none"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-blue-200/90 shadow-xl shadow-blue-500/15 p-4 sm:p-5 flex flex-col gap-3 relative overflow-hidden">
          {/* Subtle anime pastel decorative background blob */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-blue-100/50 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-indigo-100/40 blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="ปิดการแจ้งเตือนติดตั้งแอป"
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content Header */}
          <div className="flex items-start gap-3.5 pr-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 border border-white">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  ติดตั้งสะดวก รวดเร็ว
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                ติดตั้งแอปพลิเคชัน KP Classroom
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                ใช้งานได้เสมือนแอปจริงบนมือถือและคอมพิวเตอร์ เปิดทันใจไม่ต้องพิมพ์ URL
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all text-center cursor-pointer"
            >
              ไว้คราวหลัง
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              ติดตั้งแอปทันที
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Share Sheet Guide Modal */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-guide-title"
          onClick={() => setShowIosGuide(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-prompt"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-blue-100 space-y-4 animate-slide-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 id="ios-guide-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                วิธีติดตั้งบน iPhone / iPad
              </h4>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              สำหรับ Safari บน iOS สามารถติดตั้งแอปพลิเคชันลงบนหน้าจอหลักได้ใน 2 ขั้นตอนง่ายๆ:
            </p>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  กดปุ่ม <span className="font-bold text-blue-700 inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded"><Share className="w-3 h-3" /> แชร์ (Share)</span> ที่แถบล่างสุดของหน้าจอ Safari
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  เลื่อนลงมาแล้วกดเลือก <span className="font-bold text-slate-900 inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded"><PlusSquare className="w-3 h-3 text-slate-600" /> เพิ่มไปยังหน้าจอหลัก (Add to Home Screen)</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                handleDismiss();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              เข้าใจแล้ว ปิดหน้านี้
            </button>
          </div>
        </div>
      )}
    </>
  );
};
