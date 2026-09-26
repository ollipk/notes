import { HashRouter, Route, Routes } from 'react-router';
import { NotFound } from '../ui/NotFound';
import { catalog } from './catalog';
import { supportedLanguages } from './i18n';
import { HomeRoute } from './HomeRoute';
import { HOME_HREF } from './routes';
import { TuneRoute } from './TuneRoute';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeRoute languages={supportedLanguages} tunes={catalog} />} />
        <Route path="/tune/:tuneId" element={<TuneRoute tunes={catalog} />} />
        <Route path="*" element={<NotFound homeHref={HOME_HREF} />} />
      </Routes>
    </HashRouter>
  );
}
