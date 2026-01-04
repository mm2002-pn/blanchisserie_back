import { Search, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">
            Bonjour, {user?.firstName} !
          </h2>
          <p className="text-sm text-gray-500">
            Bienvenue sur votre tableau de bord
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>

          {/* Refresh */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
