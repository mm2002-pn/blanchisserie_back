import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { MAIN_NAVIGATION } from '@/lib/constants';
import { usePermissions, useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { canView, user } = usePermissions();
  const { logout } = useAuth();

  const visible = MAIN_NAVIGATION.filter((item) => canView(item.permission));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-paper border-r border-hairline border-ink-200 flex flex-col">
      {/* Brand header */}
      <div className="px-5 py-5 bg-brand-900 text-paper">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terra-600 rounded-[10px] flex items-center justify-center">
            <span className="font-serif font-medium text-xl text-paper">B</span>
          </div>
          <div>
            <h1 className="font-serif text-lg font-medium tracking-tight leading-tight">
              Blanchisserie SN
            </h1>
            <p className="text-micro text-brand-100 font-mono mt-0.5">
              Admin · v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <div className="caps px-3 pb-2">Navigation</div>
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-input transition-colors group',
                  isActive
                    ? 'bg-brand-100 text-brand-800'
                    : 'text-ink-700 hover:bg-paper-2'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-brand-800' : 'text-ink-500 group-hover:text-ink-700'
                    )}
                    strokeWidth={isActive ? 2 : 1.75}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-hairline border-ink-200">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-[10px] bg-terra-600 flex items-center justify-center shrink-0">
            <span className="text-paper font-sans font-semibold text-sm">
              {(user?.firstName?.[0] ?? '').toUpperCase()}
              {(user?.lastName?.[0] ?? '').toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-micro font-mono text-ink-500 truncate capitalize">
              {user?.role ?? '—'}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-ink-400 hover:text-danger-600 transition-colors p-1"
            title="Déconnexion"
            aria-label="Déconnexion"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
