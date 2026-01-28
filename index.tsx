import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Relative path ./sw.js ensures it works on subdirectories
    navigator.serviceWorker.register('./sw.js').then(
      (registration) => console.log('SW registered: ', registration.scope),
      (err) => console.log('SW registration failed: ', err)
    );
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);