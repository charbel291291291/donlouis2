import React, { useEffect, useState } from 'react';
import { Icon } from './Icons';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Capture install prompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (isStandalone) return null;

  // Render logic
  if (deferredPrompt) {
    return (
      <button 
        onClick={handleInstallClick}
        className="w-full bg-gradient-to-r from-brand-gold to-yellow-600 p-4 rounded-xl flex items-center justify-between shadow-lg hover:shadow-brand-gold/20 transition-all active:scale-95"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
             <Icon name="plus" className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-neutral-900">Install App</div>
            <div className="text-xs text-neutral-800 font-medium">Add to Home Screen</div>
          </div>
        </div>
        <Icon name="chevronRight" className="w-5 h-5 text-neutral-900" />
      </button>
    );
  }

  // iOS Instructions
  if (isIOS) {
    return (
        <div className="bg-neutral-800/50 border border-white/5 p-4 rounded-xl flex items-start gap-4">
             <div className="bg-neutral-700 p-2 rounded-lg text-brand-gold">
                <Icon name="plus" className="w-6 h-6" />
             </div>
             <div>
                <div className="font-bold text-white mb-1">Install on iPhone</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                    Tap the <span className="font-bold text-white">Share</span> button in your browser menu, then select <span className="font-bold text-white">Add to Home Screen</span>.
                </div>
             </div>
        </div>
    );
  }

  return null;
};