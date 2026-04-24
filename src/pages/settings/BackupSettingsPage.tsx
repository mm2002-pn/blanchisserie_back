import { Download, Clock, Database, PlayCircle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const BACKUPS = [
  {
    id: '1',
    kind: 'Complète',
    at: '2026-04-24T02:00:00Z',
    size: '2,4 Go',
    duration: '4 min 12 s',
    ok: true,
  },
  {
    id: '2',
    kind: 'Incrémentale',
    at: '2026-04-23T22:00:00Z',
    size: '84 Mo',
    duration: '38 s',
    ok: true,
  },
  {
    id: '3',
    kind: 'Incrémentale',
    at: '2026-04-23T12:00:00Z',
    size: '62 Mo',
    duration: '29 s',
    ok: true,
  },
  {
    id: '4',
    kind: 'Complète',
    at: '2026-04-17T02:00:00Z',
    size: '2,3 Go',
    duration: '4 min 03 s',
    ok: true,
  },
];

export default function BackupSettingsPage() {
  const last = BACKUPS[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Sauvegardes</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            Backups automatiques
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Complète tous les dimanches à 02:00 · incrémentale toutes les 6 h.
          </p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0">
          <PlayCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
          Backup manuel
        </Button>
      </div>

      {/* Status hero */}
      <div className="card-surface bg-brand-900 border-brand-900 text-paper p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="caps text-brand-100">Dernière sauvegarde</p>
            <p className="font-serif text-2xl font-medium tracking-tight mt-2 leading-none">
              {format(new Date(last.at), "d MMMM à HH:mm", { locale: fr })}
            </p>
            <p className="text-tiny text-brand-100 mt-1.5">
              {last.kind} · {last.size} · durée {last.duration}
            </p>
          </div>
          <div className="w-11 h-11 rounded-input bg-baobab-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-paper" strokeWidth={1.75} />
          </div>
        </div>

        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-brand-700">
          <div>
            <p className="caps text-brand-100">Statut</p>
            <Badge variant="success" dot>
              Synchronisée
            </Badge>
          </div>
          <div className="h-8 w-px bg-brand-700" />
          <div>
            <p className="caps text-brand-100">Prochaine</p>
            <p className="font-mono text-sm font-semibold tnum mt-0.5">
              dans 5 h 42 min
            </p>
          </div>
          <div className="h-8 w-px bg-brand-700" />
          <div>
            <p className="caps text-brand-100">Rétention</p>
            <p className="font-mono text-sm font-semibold tnum mt-0.5">30 j</p>
          </div>
        </div>
      </div>

      {/* History */}
      <div>
        <p className="caps mb-2">Historique · {BACKUPS.length}</p>
        <div className="card-surface overflow-hidden">
          {BACKUPS.map((b, i) => (
            <div
              key={b.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                i < BACKUPS.length - 1 && 'border-b border-hairline border-ink-200',
              )}
            >
              <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">
                    Sauvegarde {b.kind.toLowerCase()}
                  </p>
                  <Badge variant={b.ok ? 'success' : 'error'} dot>
                    {b.ok ? 'OK' : 'Échec'}
                  </Badge>
                </div>
                <p className="font-mono text-tiny text-ink-500 tnum mt-0.5">
                  {format(new Date(b.at), "d MMM yyyy · HH:mm", { locale: fr })}
                  {' · '}
                  {b.size} · {b.duration}
                </p>
              </div>
              <Button variant="secondary" size="sm" className="gap-1 shrink-0">
                <Download className="w-3 h-3" strokeWidth={1.75} />
                Télécharger
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
