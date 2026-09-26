import { useCallback, useRef } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { NotFound } from '../ui/NotFound';
import { PlayerSettingsProvider } from '../ui/PlayerSettings';
import { catalog } from './catalog';
import { supportedLanguages } from './i18n';
import { HomeRoute } from './HomeRoute';
import { HOME_HREF } from './routes';
import { TuneRoute } from './TuneRoute';

export function App() {
  const homeVisited = useRef(false);
  const markHomeVisited = useCallback(() => {
    homeVisited.current = true;
  }, []);
  const wasHomeVisited = useCallback(() => homeVisited.current, []);

  return (
    <PlayerSettingsProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              <HomeRoute languages={supportedLanguages} tunes={catalog} onVisit={markHomeVisited} />
            }
          />
          <Route
            path="/tune/:tuneId"
            element={<TuneRoute tunes={catalog} homeVisited={wasHomeVisited} />}
          />
          <Route path="*" element={<NotFound homeHref={HOME_HREF} />} />
        </Routes>
      </HashRouter>
    </PlayerSettingsProvider>
  );
}
