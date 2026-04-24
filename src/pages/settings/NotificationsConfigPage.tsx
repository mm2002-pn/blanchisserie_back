import { useState } from 'react';
import { Bell, Mail, MessageSquare, AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks';

type Channel = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: typeof Bell;
};

type Rule = {
  id: string;
  label: string;
  sub: string;
  channels: { email: boolean; push: boolean; sms: boolean };
  severity: 'info' | 'warn' | 'danger';
};

export default function NotificationsConfigPage() {
  const { canEdit } = usePermissions();
  const readonly = !canEdit('settings');

  const [channels, setChannels] = useState<Channel[]>([
    { id: 'email', label: 'Email', description: 'Notifications par courriel', enabled: true, icon: Mail },
    { id: 'push', label: 'Push', description: 'Notifications mobiles in-app', enabled: true, icon: Bell },
    { id: 'sms', label: 'SMS', description: 'Alertes critiques uniquement', enabled: false, icon: MessageSquare },
  ]);

  const [rules, setRules] = useState<Rule[]>([
    {
      id: 'new-order',
      label: 'Nouvelle commande',
      sub: "Déclenché à la création d'une commande via l'app mobile",
      channels: { email: true, push: true, sms: false },
      severity: 'info',
    },
    {
      id: 'overdue-invoice',
      label: 'Facture en retard',
      sub: 'Facture non réglée 7 jours après échéance',
      channels: { email: true, push: true, sms: true },
      severity: 'danger',
    },
    {
      id: 'machine-incident',
      label: 'Incident machine',
      sub: 'Machine tombe en maintenance ou hors service',
      channels: { email: true, push: true, sms: true },
      severity: 'danger',
    },
    {
      id: 'low-stock',
      label: 'Stock bas',
      sub: 'Produit atteint son seuil de réapprovisionnement',
      channels: { email: false, push: true, sms: false },
      severity: 'warn',
    },
    {
      id: 'quality-deviation',
      label: 'Écart qualité',
      sub: 'Taux de défauts dépasse 1,5 %',
      channels: { email: true, push: false, sms: false },
      severity: 'warn',
    },
  ]);

  const toggleChannel = (id: string) => {
    if (readonly) return;
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  const toggleRuleChannel = (ruleId: string, key: keyof Rule['channels']) => {
    if (readonly) return;
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, channels: { ...r.channels, [key]: !r.channels[key] } } : r,
      ),
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Notifications</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            Alertes & canaux
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Paramètre quelles alertes sont envoyées et par quel canal.
          </p>
        </div>
        {!readonly && (
          <Button size="sm" className="gap-1.5 shrink-0">
            <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
            Enregistrer
          </Button>
        )}
      </div>

      {/* Channels */}
      <div>
        <p className="caps mb-2">Canaux d'envoi</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => toggleChannel(c.id)}
                disabled={readonly}
                className={cn(
                  'card-surface p-4 text-left transition-colors',
                  c.enabled ? 'border-brand-800 bg-brand-50' : 'hover:bg-paper-2',
                  readonly && 'cursor-not-allowed opacity-80',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-input flex items-center justify-center shrink-0',
                        c.enabled ? 'bg-brand-800 text-paper' : 'bg-paper-2 text-ink-500',
                      )}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{c.label}</p>
                      <p className="text-tiny text-ink-500 mt-0.5">{c.description}</p>
                    </div>
                  </div>
                  <Toggle value={c.enabled} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules */}
      <div>
        <p className="caps mb-2">Règles de déclenchement · {rules.length}</p>
        <div className="card-surface overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_90px_90px_90px] gap-3 px-4 py-3 bg-paper-2 border-b border-hairline border-ink-200">
            <p className="text-micro font-semibold uppercase tracking-caps text-ink-500">
              Événement
            </p>
            <p className="text-micro font-semibold uppercase tracking-caps text-ink-500 text-center">
              Email
            </p>
            <p className="text-micro font-semibold uppercase tracking-caps text-ink-500 text-center">
              Push
            </p>
            <p className="text-micro font-semibold uppercase tracking-caps text-ink-500 text-center">
              SMS
            </p>
          </div>
          {rules.map((r, i) => (
            <div
              key={r.id}
              className={cn(
                'grid grid-cols-1 md:grid-cols-[1fr_90px_90px_90px] gap-3 px-4 py-3 items-center',
                i < rules.length - 1 && 'border-b border-hairline border-ink-200',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <SeverityDot severity={r.severity} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{r.label}</p>
                  <p className="text-tiny text-ink-500 truncate">{r.sub}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Toggle
                  value={r.channels.email}
                  onClick={() => toggleRuleChannel(r.id, 'email')}
                  disabled={readonly}
                />
              </div>
              <div className="flex justify-center">
                <Toggle
                  value={r.channels.push}
                  onClick={() => toggleRuleChannel(r.id, 'push')}
                  disabled={readonly}
                />
              </div>
              <div className="flex justify-center">
                <Toggle
                  value={r.channels.sms}
                  onClick={() => toggleRuleChannel(r.id, 'sms')}
                  disabled={readonly}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="card-surface bg-paper-2 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-ink-700 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="caps">À propos des canaux</p>
            <p className="text-tiny text-ink-700 mt-1 leading-relaxed">
              Les SMS sont facturés par Twilio · activer uniquement pour les alertes
              critiques. Le push est gratuit et instantané. L'email est le canal par
              défaut pour les rapports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  value,
  onClick,
  disabled = false,
}: {
  value: boolean;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  return (
    <span
      role="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick?.(e);
      }}
      aria-pressed={value}
      className={cn(
        'inline-flex items-center w-9 h-5 rounded-pill transition-colors border-hairline',
        value ? 'bg-brand-800 border-brand-800' : 'bg-ink-100 border-ink-200',
        disabled && 'opacity-60',
      )}
    >
      <span
        className={cn(
          'w-4 h-4 rounded-full bg-paper transition-transform shadow-soft',
          value ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </span>
  );
}

function SeverityDot({ severity }: { severity: 'info' | 'warn' | 'danger' }) {
  const bg =
    severity === 'danger'
      ? 'bg-danger-600'
      : severity === 'warn'
        ? 'bg-warn-600'
        : 'bg-brand-800';
  return <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', bg)} />;
}
