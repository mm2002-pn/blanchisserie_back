import { useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Scale, ListChecks, Workflow, ChevronRight } from 'lucide-react';
import { useOrders, useOrdersRealtime } from '@/hooks/queries/useOrders';
import { useWaitingCounts } from '@/hooks/queries/useBatches';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type StepKey = 'pesee' | 'triage' | 'production';

interface StepDef {
  key: StepKey;
  label: string;
  description: string;
  icon: typeof Scale;
  path: string;
}

const STEPS: StepDef[] = [
  { key: 'pesee', label: 'Pesée', description: 'Réception atelier', icon: Scale, path: 'pesee' },
  { key: 'triage', label: 'Triage', description: 'Répartition par type', icon: ListChecks, path: 'triage' },
  { key: 'production', label: 'Production', description: 'Lavage → Livraison', icon: Workflow, path: 'production' },
];

function anchorDate(o: {
  receivedAt?: string | null;
  collectedAt?: string | null;
  collectionPlannedAt?: string | null;
  collectionDate?: string | null;
}): Date | null {
  const a = o.receivedAt ?? o.collectedAt ?? o.collectionPlannedAt ?? o.collectionDate;
  return a ? new Date(a) : null;
}

function isTodayOrder(o: Parameters<typeof anchorDate>[0]): boolean {
  const d = anchorDate(o);
  return d ? isToday(d) : false;
}

export default function AtelierJourLayout() {
  useOrdersRealtime();
  const { data: ordersData } = useOrders({ pageSize: 200 });
  const orders = ordersData?.items ?? [];
  const { data: waiting } = useWaitingCounts();
  const location = useLocation();

  const counts = useMemo(() => {
    const toWeigh = orders.filter((o) => o.status === 'collected' && isTodayOrder(o)).length;
    const toTriage = orders.filter((o) => o.status === 'received' && isTodayOrder(o)).length;
    const inProd = orders.filter(
      (o) => (o.status === 'triaged' || o.status === 'in_production') && isTodayOrder(o),
    ).length;
    const waitingTotal = waiting
      ? Object.values(waiting).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
      : 0;
    return { pesee: toWeigh, triage: toTriage, production: Math.max(inProd, waitingTotal) };
  }, [orders, waiting]);

  const activeKey: StepKey =
    STEPS.find((s) => location.pathname.endsWith(`/${s.path}`))?.key ?? 'pesee';

  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Atelier du jour</h1>
        <p className="text-sm text-ink-500 capitalize">{today}</p>
      </div>

      <nav
        aria-label="Étapes de l'atelier"
        className="sticky top-0 z-30 -mx-7 px-7 py-3 bg-paper-2/80 backdrop-blur border-b border-ink-200"
      >
        <ol className="flex items-stretch gap-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.key === activeKey;
            const count = counts[step.key];
            const isLast = idx === STEPS.length - 1;
            return (
              <li key={step.key} className="flex-1 flex items-center gap-2 min-w-0">
                <NavLink
                  to={step.path}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-4 py-3 rounded-card border transition-colors min-w-0',
                    isActive
                      ? 'bg-paper border-brand-800 shadow-sm'
                      : 'bg-paper border-ink-200 hover:bg-paper-2 hover:border-ink-300',
                  )}
                >
                  <div
                    className={cn(
                      'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                      isActive ? 'bg-brand-800 text-white' : 'bg-paper-2 text-ink-700',
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-semibold leading-tight',
                        isActive ? 'text-brand-800' : 'text-ink-800',
                      )}
                    >
                      {idx + 1}. {step.label}
                    </p>
                    <p className="text-tiny text-ink-500 truncate">{step.description}</p>
                  </div>
                  {count > 0 && (
                    <span
                      className={cn(
                        'shrink-0 px-2 py-0.5 rounded-full text-tiny font-bold tabular-nums',
                        isActive
                          ? 'bg-brand-800 text-white'
                          : 'bg-paper-2 text-ink-700 border border-ink-300',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </NavLink>
                {!isLast && <ChevronRight size={20} className="shrink-0 text-ink-300" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <Outlet />
    </div>
  );
}
