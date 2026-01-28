export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const sendLocalNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      try {
        registration.showNotification(title, {
          body,
          icon: 'https://picsum.photos/192/192', // Fallback placeholder or use specific asset
          badge: 'https://picsum.photos/192/192',
          vibrate: [200, 100, 200],
          tag: 'order-update',
          data: { url: '/#/track' } // Hash router compatible
        } as any);
      } catch (e) {
        console.error("Notification failed", e);
      }
    });
  } else {
    // Fallback if SW not ready or permission not granted (e.g. standard alert or toast could go here)
    console.log("Notification permission not granted or SW not ready");
  }
};