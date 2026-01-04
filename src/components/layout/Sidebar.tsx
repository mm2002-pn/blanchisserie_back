import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { MAIN_NAVIGATION } from '@/lib/constants';
import { usePermissions, useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { canView, user } = usePermissions();
  const { logout } = useAuth();

  // Filter navigation based on permissions
  const visibleNavigation = MAIN_NAVIGATION.filter((item) =>
    canView(item.permission)
  );

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-medium flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <h1 className="text-lg font-heading font-semibold text-gray-900">
              Blanchisserie
            </h1>
            <p className="text-xs text-gray-500">Gestion Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group',
                  isActive
                    ? 'bg-accent-50 text-accent-700'
                    : 'text-gray-700 hover:bg-primary-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-accent-600' : 'text-gray-500 group-hover:text-gray-700'
                    )}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-50">
          <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-error transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
