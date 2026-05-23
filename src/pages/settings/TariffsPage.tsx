import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Plus, Edit, Trash2, Check, Tag } from 'lucide-react';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useTariffs } from '@/hooks/queries/useTariffs';

const TYPE_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'info' | 'brand'> = {
  Standard: 'neutral',
  Premium: 'success',
  Service: 'warning',
  Segment: 'info',
  Forfait: 'brand',
};

export default function TariffsPage() {
  const { canEdit } = usePermissions();
  const { data, isLoading, error } = useTariffs();
  const tariffs = data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTariff = tariffs.find((t) => t.id === selectedId) ?? tariffs[0];
  const setSelectedTariff = (t: typeof tariffs[number]) => setSelectedId(t.id);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Tarification</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {tariffs.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              grilles tarifaires
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Définis les prix par catégorie de client, segment ou forfait mensuel.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouvelle grille
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Impossible de charger les tarifs : {(error as Error).message}
        </div>
      )}
      {isLoading && (
        <div className="text-sm text-ink-500">Chargement des tarifs…</div>
      )}
      {!isLoading && tariffs.length === 0 && !error && (
        <div className="text-sm text-ink-500">Aucune grille tarifaire.</div>
      )}
      {selectedTariff && (
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Tariffs list */}
        <div className="space-y-2">
          <div className="caps mb-1">Grilles · {tariffs.length}</div>
          {tariffs.map((tariff) => (
            <button
              key={tariff.id}
              onClick={() => setSelectedTariff(tariff)}
              className={cn(
                'w-full text-left card-surface p-3.5 transition-colors',
                selectedTariff.id === tariff.id
                  ? 'border-brand-800 bg-brand-50'
                  : 'hover:bg-paper-2',
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-ink-900 truncate">
                      {tariff.name}
                    </p>
                    {tariff.isDefault && (
                      <Badge variant="success" dot>
                        défaut
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-tiny text-ink-500 tnum mt-0.5">
                    {tariff.code}
                  </p>
                </div>
                <Badge variant={(TYPE_VARIANT[tariff.type] ?? 'neutral') as any}>
                  {tariff.type}
                </Badge>
              </div>

              <p className="text-tiny text-ink-500 line-clamp-2">
                {tariff.description}
              </p>

              {tariff.type === 'Forfait' && (
                <p className="font-mono text-sm font-semibold text-brand-800 tnum mt-2">
                  {formatCurrency(tariff.monthlyPrice || 0)}
                  <span className="text-ink-500 font-normal"> /mois</span>
                </p>
              )}

              <div className="flex items-center gap-2 mt-2.5">
                <Badge variant={tariff.isActive ? 'success' : 'neutral'} dot>
                  {tariff.isActive ? 'Actif' : 'Inactif'}
                </Badge>
                {tariff.items && tariff.items.length > 0 && (
                  <span className="font-mono text-micro text-ink-500 tnum">
                    · {tariff.items.length} lignes
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="card-surface p-5 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={(TYPE_VARIANT[selectedTariff.type] ?? 'neutral') as any}>
                  {selectedTariff.type}
                </Badge>
                <span className="font-mono text-tiny text-ink-500 tnum">
                  {selectedTariff.code}
                </span>
              </div>
              <h3 className="font-serif text-xl font-medium tracking-tight text-ink-900">
                {selectedTariff.name}
              </h3>
              <p className="text-tiny text-ink-500 mt-1">
                {selectedTariff.description}
              </p>
            </div>
            {canEdit('settings') && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="secondary" size="sm" className="gap-1">
                  <Edit className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Modifier
                </Button>
                {!selectedTariff.isDefault && (
                  <Button variant="danger" size="sm" className="!px-2">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            <MetaTile label="Code" value={selectedTariff.code} mono />
            <MetaTile label="Type" value={selectedTariff.type} />
            <MetaTile
              label="Valide du"
              value={new Date(selectedTariff.validFrom).toLocaleDateString('fr-FR')}
              mono
            />
            <MetaTile
              label="Valide jusqu'au"
              value={
                selectedTariff.validUntil
                  ? new Date(selectedTariff.validUntil).toLocaleDateString('fr-FR')
                  : 'Indéterminé'
              }
              mono
            />
          </div>

          {/* Forfait details */}
          {selectedTariff.type === 'Forfait' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              <ForfaitStat
                label="Prix mensuel"
                value={formatCurrency(selectedTariff.monthlyPrice || 0)}
                tint="brand"
              />
              <ForfaitStat
                label="Volume inclus"
                value={`${selectedTariff.monthlyKgLimit} kg`}
                tint="ok"
              />
              <ForfaitStat
                label="Dépassement"
                value={`${formatCurrency(selectedTariff.overagePricePerKg || 0)} / kg`}
                tint="warn"
              />
            </div>
          )}

          {/* Applicable clients */}
          {selectedTariff.applicableClients &&
            selectedTariff.applicableClients.length > 0 && (
              <div className="mb-5">
                <p className="caps mb-2">Clients applicables</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTariff.applicableClients.map((client) => (
                    <Badge key={client} variant="neutral">
                      <Check className="w-3 h-3 mr-0.5" strokeWidth={2} />
                      {client}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Items table */}
          {selectedTariff.items && selectedTariff.items.length > 0 && (
            <div>
              <p className="caps mb-3">Détail des tarifs · {selectedTariff.items.length}</p>
              <div className="overflow-x-auto card-surface">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-paper-2 px-4 py-3 text-left text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                        Code
                      </th>
                      <th className="bg-paper-2 px-4 py-3 text-left text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                        Type
                      </th>
                      <th className="bg-paper-2 px-4 py-3 text-right text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                        Prix / kg
                      </th>
                      <th className="bg-paper-2 px-4 py-3 text-right text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                        Prix / pièce
                      </th>
                      <th className="bg-paper-2 px-4 py-3 text-center text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                        Mode
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTariff.items.map((item, index) => (
                      <tr
                        key={index}
                        className={cn(
                          'hover:bg-paper-2 transition-colors',
                          index < selectedTariff.items.length - 1 &&
                            'border-b border-hairline border-ink-200',
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-ink-900 tnum">
                          {item.linenTypeCode}
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-900">
                          {item.linenTypeName}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-ink-900 tnum">
                          {formatCurrency(item.pricePerKg)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-ink-700 tnum">
                          {item.pricePerPiece ? formatCurrency(item.pricePerPiece) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              item.billingMode === 'piece' ? 'info' : 'warning'
                            }
                          >
                            {item.billingMode === 'piece' ? 'à la pièce' : 'au kg'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTariff.items?.length === 0 && selectedTariff.type === 'Forfait' && (
            <div className="card-surface bg-paper-2 p-6 text-center flex items-center justify-center gap-2">
              <Tag className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
              <p className="text-sm text-ink-500">
                Ce forfait s'applique à tous les types de linge.
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function MetaTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-3 rounded-input bg-paper-2 border-hairline border-ink-200">
      <p className="caps">{label}</p>
      <p
        className={cn(
          'mt-1 text-ink-900',
          mono ? 'font-mono text-sm tnum' : 'text-sm font-semibold',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ForfaitStat({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: 'brand' | 'ok' | 'warn';
}) {
  const bg =
    tint === 'brand' ? 'bg-brand-100' : tint === 'ok' ? 'bg-ok-100' : 'bg-warn-100';
  const fg =
    tint === 'brand' ? 'text-brand-800' : tint === 'ok' ? 'text-ok-700' : 'text-warn-700';

  return (
    <div className={cn('p-4 rounded-input', bg)}>
      <p className={cn('caps', fg)}>{label}</p>
      <p className="font-mono text-lg font-semibold text-ink-900 tnum mt-1">
        {value}
      </p>
    </div>
  );
}
