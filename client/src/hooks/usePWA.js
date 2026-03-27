import { useState, useEffect } from 'react';

const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Optional: capture if it was successfully installed
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('PWA was installed');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setInstallPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, handleInstallClick };
};

export default usePWA;
