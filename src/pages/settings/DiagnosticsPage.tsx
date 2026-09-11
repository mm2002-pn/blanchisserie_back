import {
  CheckCircle,
  Database,
  Cloud,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

type Status = 'ok' | 'warn' | 'danger';

type Check = {
  id: string;
  icon: typeof Database;
  name: string;
  description: string;
  status: Status;
  value: string;
  detail: string;
};

const CHECKS: Check[] = [
  {
    id: 'db',
    icon: Database,
    name: 'Base de données',
    description: 'Connectivité PostgreSQL',
    status: 'ok',
    value: 'Opérationnelle',
    detail: 'latence 8 ms',
  },
  {
    id: 'api',
    icon: Cloud,
    name: 'Serveur API',
    description: 'Temps de réponse moyen',
    status: 'ok',
    value: '94 ms',
    detail: '99,98 % uptime',
  },
  {
    id: 'cpu',
    icon: Cpu,
    name: 'CPU serveur',
    description: 'Charge moyenne 15 min',
    status: 'warn',
    value: '78 %',
    detail: '2 pics > 85 %',
  },
  {
    id: 'disk',
    icon: HardDrive,
    name: 'Disque',
    description: 'Espace utilisé / total',
    status: 'ok',
    value: '142 / 500 Go',
    detail: '28 % utilisés',
  },
  {
    id: 'mobile',
    icon: Wifi,
    name: 'App mobile',
    description: 'Connexions actives',
    status: 'ok',
    value: '23',
    detail: 'chauffeurs + hôtels',
  },
];

export default function DiagnosticsPage() {
  const healthy = CHECKS.filter((c) => c.status === 'ok').length;
  const warnings = CHECKS.filter((c) => c.status === 'warn').length;
  const down = CHECKS.filter((c) => c.status === 'danger').length;

  const globalStatus: Status = down > 0 ? 'danger' : warnings > 0 ? 'warn' : 'ok';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Diagnostic système</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            État de santé
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Monitoring en temps réel des services critiques. Dernier contrôle il y a
            2 min.
          </p>
        </div>
        <Badge
          variant={globalStatus === 'ok' ? 'success' : globalStatus === 'warn' ? 'warning' : 'error'}
          dot
        >
          {globalStatus === 'ok'
            ? 'Tous les services opérationnels'
            : globalStatus === 'warn'
              ? `${warnings} alerte${warnings > 1 ? 's' : ''}`
              : `${down} service${down > 1 ? 's' : ''} indisponible${down > 1 ? 's' : ''}`}
        </Badge>
      </div>

      {/* Overview strip */}
      <div className="grid grid-cols-3 gap-3">
        <OverviewTile label="OK" value={healthy} tint="ok" icon={CheckCircle} />
        <OverviewTile label="Alertes" value={warnings} tint="warn" icon={AlertTriangle} />
        <OverviewTile label="Incidents" value={down} tint="danger" icon={AlertTriangle} />
      </div>

      {/* Checks */}
      <div>
        <p className="caps mb-2">Services surveillés · {CHECKS.length}</p>
        <div className="card-surface overflow-hidden">
          {CHECKS.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-4',
                  i < CHECKS.length - 1 && 'border-b border-hairline border-ink-200',
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-input flex items-center justify-center shrink-0',
                    c.status === 'ok' && 'bg-ok-100 text-ok-700',
                    c.status === 'warn' && 'bg-warn-100 text-warn-700',
                    c.status === 'danger' && 'bg-danger-100 text-danger-600',
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{c.name}</p>
                  <p className="text-tiny text-ink-500">{c.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'font-mono text-sm font-semibold tnum',
                      c.status === 'ok' && 'text-ok-700',
                      c.status === 'warn' && 'text-warn-700',
                      c.status === 'danger' && 'text-danger-600',
                    )}
                  >
                    {c.value}
                  </p>
                  <p className="text-tiny text-ink-500">{c.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OverviewTile({
  label,
  value,
  tint,
  icon: Icon,
}: {
  label: string;
  value: number;
  tint: Status;
  icon: typeof CheckCircle;
}) {
  const bg = tint === 'ok' ? 'bg-ok-100' : tint === 'warn' ? 'bg-warn-100' : 'bg-danger-100';
  const fg = tint === 'ok' ? 'text-ok-700' : tint === 'warn' ? 'text-warn-700' : 'text-danger-600';

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p className={cn('font-serif text-3xl font-medium tnum tracking-tight mt-1.5 leading-none', fg)}>
            {value}
          </p>
        </div>
        <div className={cn('w-9 h-9 rounded-input flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
