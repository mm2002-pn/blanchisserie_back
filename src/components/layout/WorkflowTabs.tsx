import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

const TABS = [
  { label: 'Réception', route: ROUTES.RECEPTION },
  { label: 'Triage', route: ROUTES.TRIAGE },
  { label: 'Production', route: ROUTES.PRODUCTION },
  { label: 'Tracking', route: ROUTES.WORKFLOW_TRACKING },
];

/**
 * Mini tab switcher partagé par les 4 écrans du Workflow quotidien.
 * Utilisé dans le header des pages Reception / Triage / Production / WorkflowTracking.
 */
export function WorkflowTabs() {
  return (
    <div className="inline-flex items-center bg-paper border-hairline border-ink-200 rounded-input p-0.5">
      {TABS.map((t) => (
        <NavLink
          key={t.route}
          to={t.route}
          end
          className={({ isActive }) =>
            cn(
              'px-3 py-1.5 rounded-[6px] text-tiny font-medium transition-colors',
              isActive
                ? 'bg-ink-900 text-paper'
                : 'text-ink-700 hover:bg-paper-2',
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
