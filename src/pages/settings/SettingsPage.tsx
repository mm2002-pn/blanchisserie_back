import { NavLink, Outlet } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { SETTINGS_NAVIGATION } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
          <SettingsIcon className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
        </div>
        <div>
          <div className="caps mb-2">Paramètres</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900 leading-none">
            Configuration
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Données de référence, rôles, workflows et outils système.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* Sidebar Navigation */}
        <aside>
          <div className="card-surface p-3 sticky top-24 space-y-5">
            {SETTINGS_NAVIGATION.map((section) => (
              <div key={section.section}>
                <h3 className="caps px-2 mb-1.5">{section.section}</h3>
                <nav className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'block px-3 py-2 rounded-input text-sm transition-colors',
                          isActive
                            ? 'bg-brand-100 text-brand-800 font-semibold'
                            : 'text-ink-700 font-medium hover:bg-paper-2',
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
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
