import { NavLink, Outlet } from 'react-router-dom';
import { SETTINGS_NAVIGATION } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">Paramètres</h1>
        <p className="text-ink-500 mt-1">
          Configuration du système et gestion des données de référence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <div className="bg-paper rounded-card shadow-soft p-4 space-y-6">
            {SETTINGS_NAVIGATION.map((section) => (
              <div key={section.section}>
                <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                  {section.section}
                </h3>
                <nav className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'block px-3 py-2 rounded-lg text-sm transition-colors duration-200',
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-medium'
                            : 'text-ink-700 hover:bg-paper-3'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
