import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MISSION } from './app/core';
import { STORAGE_KEY, browserStorage, createAppStore } from './app/store';
import { AppStoreProvider } from './app/StoreContext';
import { I18nProvider } from './i18n';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/app.css';
import './styles/charts.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const routineDays = MISSION.routineControlDays;
const store = createAppStore(browserStorage(), {
  missionDays: routineDays,
  // The last routine control of the mission: the most history to look at.
  defaultMissionDay: routineDays.at(-1) ?? MISSION.durationDays,
});

// Another tab of this browser changed what is saved: show the same here.
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key === STORAGE_KEY) store.reload();
});

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <AppStoreProvider store={store}>
        <App />
      </AppStoreProvider>
    </I18nProvider>
  </StrictMode>,
);
