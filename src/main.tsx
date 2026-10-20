import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/forms.css';
import './styles/photos.css';
import './styles/stats.css';
import './styles/settings.css';

// Installable PWA; new versions activate on the next load.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
