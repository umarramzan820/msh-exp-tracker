import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    const dismissed = localStorage.getItem('expensio_pwa_dismissed');
    if (dismissed) return;

    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (isIosDevice && !isStandalone) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('expensio_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <aside aria-label="Install App" className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 animate-bounce-in">
      <div className="glass-modal rounded-2xl p-4 shadow-2xl border border-emerald-500/30 flex items-start gap-3 bg-slate-900/95 backdrop-blur-xl">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-white">Install Expensio App</h4>
            <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> PWA
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {isIOS 
              ? 'Install on iPhone: Tap "Share" and select "Add to Home Screen" for instant offline access.' 
              : 'Add to your device home screen for 100% offline access, zero latency, and desktop app experience.'}
          </p>

          <div className="flex items-center gap-2">
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/25"
              >
                <Download className="w-3.5 h-3.5" /> Install Now
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs rounded-lg transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
