import { HashRouter, Route, Routes } from 'react-router';
import { HomePage } from '../ui/HomePage';
import { NotFound } from '../ui/NotFound';
import { catalog } from './catalog';
import { supportedLanguages } from './i18n';
import { HOME_HREF, tuneHref } from './routes';
import { TuneRoute } from './TuneRoute';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage languages={supportedLanguages} tunes={catalog} tuneHref={tuneHref} />}
        />
        <Route path="/tune/:tuneId" element={<TuneRoute tunes={catalog} />} />
        <Route path="*" element={<NotFound homeHref={HOME_HREF} />} />
      </Routes>
    </HashRouter>
  );
}
