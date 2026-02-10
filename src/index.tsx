import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { AuthProvider } from './context/AuthContext';
import './index.css';
import { initNativeDeepLinks } from './lib/nativeDeepLinks';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(rootElement);
async function bootstrap() {
  // Must run at app startup (not inside components) so OAuth deep links work on iOS cold start.
  try {
    await initNativeDeepLinks();
  } catch (e) {
    console.warn('Falha ao inicializar deep links nativos:', e);
  }

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

void bootstrap();

// Register Service Worker for PWA/Push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
