import { FileText, Plus, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { usePermissions } from '@/hooks';

export default function ContractsPage() {
  const { canEdit } = usePermissions();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Contrats</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            Modèles de contrat clients
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Gabarits pré-remplis pour générer les contrats hôtels et restaurants.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" disabled>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau modèle
          </Button>
        )}
      </div>

      {/* WIP card */}
      <div className="card-surface bg-brand-900 border-brand-900 p-8 text-paper overflow-hidden relative">
        {/* Ambient shape */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-800 opacity-60" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-terra-600 text-paper mb-4">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="text-micro font-semibold uppercase tracking-caps">
              En préparation
            </span>
          </div>
          <h3 className="font-serif text-3xl font-medium tracking-tight leading-[1.1]">
            Les modèles de contrat arrivent bientôt
          </h3>
          <p className="text-sm text-brand-100 mt-3 leading-relaxed max-w-lg">
            Nous préparons un éditeur de templates avec variables, clauses
            réutilisables, export PDF et signature électronique directement
            intégrée au workflow de création de compte client.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <div className="flex items-center gap-1.5 text-tiny text-brand-100">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              Livraison prévue au Q3
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RoadmapTile
          icon={FileText}
          step="01"
          title="Éditeur de templates"
          sub="Variables, clauses types, sections réutilisables"
        />
        <RoadmapTile
          icon={Sparkles}
          step="02"
          title="Génération PDF"
          sub="Mise en page propre + signature digitale"
        />
        <RoadmapTile
          icon={Clock}
          step="03"
          title="Cycle de renouvellement"
          sub="Alertes automatiques avant expiration"
        />
      </div>
    </div>
  );
}

function RoadmapTile({
  icon: Icon,
  step,
  title,
  sub,
}: {
  icon: typeof FileText;
  step: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center">
          <Icon className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
        </div>
        <span className="font-mono text-micro text-ink-400 tnum">{step}</span>
      </div>
      <p className="font-serif text-base font-medium tracking-tight text-ink-900">
        {title}
      </p>
      <p className="text-tiny text-ink-500 mt-1 leading-relaxed">{sub}</p>
    </div>
  );
}
