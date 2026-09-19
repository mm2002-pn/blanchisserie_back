import { useEffect, useState } from 'react';
import { usePageHeaderValue } from '@/context/PageHeaderContext';
import { useRealtime } from '@/hooks/useRealtime';

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function Header() {
  const { eyebrow, title, sub } = usePageHeaderValue();
  const { connected } = useRealtime();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = `${DATE_FMT.format(now)} · ${now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return (
    <header className="sticky top-0 z-30 bg-paper border-b border-hairline border-ink-200 px-7 py-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <div className="caps">{eyebrow}</div>
          <h1 className="font-heading font-bold text-2xl tracking-tight text-ink-900 mt-1 leading-tight">
            {title}
          </h1>
          {sub ? <p className="text-tiny text-ink-600 mt-0.5">{sub}</p> : null}
        </div>

        <div className="flex-none flex items-center gap-2 bg-terra-100 rounded-pill px-3.5 py-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-ok-600 animate-pulse' : 'bg-ink-400'
            }`}
          />
          <span
            className={`text-xs font-medium ${connected ? 'text-ok-700' : 'text-ink-500'}`}
          >
            {connected ? 'Temps réel connecté' : 'Connexion…'}
          </span>
        </div>

        <div className="flex-none font-heading text-xs text-ink-600 capitalize">
          {dateLabel}
        </div>
      </div>
    </header>
  );
}
