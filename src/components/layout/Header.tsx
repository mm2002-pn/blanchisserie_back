import { Search, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-paper border-b border-hairline border-ink-200 px-7 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Greeting */}
        <div>
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink-900">
            Bonjour, {user?.firstName ?? 'Superviseur'}
          </h2>
          <p className="text-tiny text-ink-500 mt-0.5">
            Blanchisserie SN · Atelier Dakar
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder="Rechercher une commande, un client…"
              className="w-[360px] pl-9 pr-4 py-2 text-sm bg-paper-2 border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
            />
          </div>

          {/* Refresh */}
          <button
            className="p-2 rounded-input bg-paper-2 border-hairline border-ink-200 text-ink-700 hover:bg-paper-3 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-input bg-paper-2 border-hairline border-ink-200 text-ink-700 hover:bg-paper-3 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-600 rounded-full ring-2 ring-paper-2" />
          </button>
        </div>
      </div>
    </header>
  );
}
