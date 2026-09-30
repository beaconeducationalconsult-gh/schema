import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { migrateExistingInstall } from './db/onboarding';
import { applyDisplay } from './lib/theme';
import { initPWA } from './pwa/registerSW';
import { requestPersistentStorage } from './pwa/persist';

applyDisplay();
initPWA();

migrateExistingInstall().catch(() => {}).finally(async () => {
  await requestPersistentStorage().catch(() => {});
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});
