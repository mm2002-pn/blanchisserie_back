import { useMemo, useState } from 'react';
import { Search, ShieldCheck, User as UserIcon, Shield } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuditLogs } from '@/hooks/queries/useAuditLogs';
import type { MappedAuditLog, UiAuditAction } from '@/lib/api/audit.api';

type AuditAction = UiAuditAction;
type AuditLog = MappedAuditLog;

const ACTION_LABEL: Record<AuditAction, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  login: 'Connexion',
  permission: 'Permissions',
};

const ACTION_VARIANT: Record<AuditAction, 'success' | 'warning' | 'error' | 'brand' | 'info'> = {
  create: 'success',
  update: 'warning',
  delete: 'error',
  login: 'info',
  permission: 'brand',
};

export default function AuditLogsPage() {
  const { data, isLoading, error } = useAuditLogs();
  const logs: AuditLog[] = data ?? [];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AuditAction | 'all'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (filter !== 'all' && l.action !== filter) return false;
      if (!q) return true;
      return `${l.actor} ${l.entity} ${l.details}`.toLowerCase().includes(q);
    });
  }, [logs, filter, search]);

  const counts = useMemo(() => {
    const all = logs.length;
    const by: Partial<Record<AuditAction, number>> = {};
    logs.forEach((l) => (by[l.action] = (by[l.action] ?? 0) + 1));
    return { all, by };
  }, [logs]);

  const filters: { key: AuditAction | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'Tous', count: counts.all },
    { key: 'create', label: 'Créations', count: counts.by.create ?? 0 },
    { key: 'update', label: 'Modifications', count: counts.by.update ?? 0 },
    { key: 'delete', label: 'Suppressions', count: counts.by.delete ?? 0 },
    { key: 'login', label: 'Connexions', count: counts.by.login ?? 0 },
    { key: 'permission', label: 'Permissions', count: counts.by.permission ?? 0 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Journal d'audit</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            Traçabilité des actions
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Qui a fait quoi, quand, depuis quelle IP. Conservation 5 ans.
          </p>
        </div>
        <Badge variant="success" dot>
          Audit actif
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-tiny font-semibold transition-colors border-hairline',
                  active
                    ? 'bg-brand-800 text-paper border-brand-800'
                    : 'bg-paper text-ink-700 border-ink-200 hover:bg-paper-2',
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'font-mono tnum',
                    active ? 'text-brand-100' : 'text-ink-400',
                  )}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un acteur, une entité…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {/* Logs list */}
      <div className="card-surface overflow-hidden">
        {filtered.map((log, i) => {
          const d = new Date(log.at);
          return (
            <div
              key={log.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3',
                i < filtered.length - 1 && 'border-b border-hairline border-ink-200',
              )}
            >
              <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
                {log.actor === 'Système' ? (
                  <ShieldCheck className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                ) : log.action === 'permission' ? (
                  <Shield className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
                ) : (
                  <UserIcon className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ink-900">{log.actor}</p>
                  <Badge variant={ACTION_VARIANT[log.action]}>
                    {ACTION_LABEL[log.action]}
                  </Badge>
                  <span className="text-tiny text-ink-500">
                    sur <span className="font-semibold text-ink-700">{log.entity}</span>
                  </span>
                </div>
                <p className="text-tiny text-ink-700 mt-0.5 truncate">{log.details}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-mono text-tiny text-ink-900 tnum">
                  {format(d, 'HH:mm', { locale: fr })}
                </p>
                <p className="font-mono text-micro text-ink-500 tnum capitalize">
                  {format(d, 'd MMM', { locale: fr })}
                </p>
              </div>

              <div className="hidden md:flex items-center shrink-0 ml-2">
                <span className="font-mono text-micro text-ink-400 tnum tabular-nums">
                  {log.ip}
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-6 py-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-paper-2 rounded-full mb-3 border-hairline border-ink-200">
              <Shield className="w-5 h-5 text-ink-400" strokeWidth={1.6} />
            </div>
            <p className="text-sm text-ink-500">
              {error
                ? `Erreur : ${(error as Error).message}`
                : isLoading
                  ? 'Chargement…'
                  : 'Aucune entrée pour ces filtres.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
