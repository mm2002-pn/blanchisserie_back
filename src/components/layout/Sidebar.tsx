import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { MAIN_NAVIGATION } from '@/lib/constants';
import { usePermissions, useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/ui';

export function Sidebar() {
  const { canView, user } = usePermissions();
  const { logout } = useAuth();

  const visible = MAIN_NAVIGATION.filter((item) => canView(item.permission));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-brand-900 text-white flex flex-col px-3.5 py-5">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-1.5 pb-5">
        <BrandMark variant="line" className="w-9 h-9 flex-none text-white" />
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-sm tracking-tight leading-tight truncate">
            B&amp;C <span className="text-terra-600">Teranga</span>
          </h1>
          <p className="text-[10px] text-brand-100/70 tracking-[0.16em] uppercase mt-0.5">
            Back-office
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-0.5">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] transition-colors font-heading text-[13.5px] font-medium',
                  isActive
                    ? 'bg-terra-600 text-white'
                    : 'text-brand-100 hover:bg-brand-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-brand-100')}
                    strokeWidth={isActive ? 2 : 1.75}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="mt-auto pt-4 px-1 border-t border-brand-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex-none rounded-full bg-terra-600 flex items-center justify-center">
            <span className="font-heading font-bold text-xs text-brand-900">
              {(user?.firstName?.[0] ?? '').toUpperCase()}
              {(user?.lastName?.[0] ?? '').toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10.5px] text-brand-100/70 tracking-[0.1em] uppercase truncate">
              {user?.role ?? '—'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full h-9 rounded-[8px] border border-brand-700 text-brand-100/80 text-xs font-medium font-heading flex items-center justify-center gap-2 hover:text-white hover:border-terra-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
