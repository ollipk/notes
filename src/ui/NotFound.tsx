import { useTranslation } from 'react-i18next';
import { linkClass } from './styles';

export function NotFound({ homeHref }: { homeHref: string }) {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t('notFound.heading')}</h1>
      <p>{t('notFound.message')}</p>
      <a href={homeHref} className={linkClass}>
        {t('notFound.back')}
      </a>
    </main>
  );
}
