import { HashRouter, Route, Routes } from 'react-router';
import { HomePage } from '../ui/HomePage';
import { supportedLanguages } from './i18n';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage languages={supportedLanguages} />} />
      </Routes>
    </HashRouter>
  );
}
