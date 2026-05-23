import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  StickyNote,
  Camera,
  Eye,
} from 'lucide-react';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MappedOrder } from '@/lib/api/orders.api';
import { useLinenCategories } from '@/hooks/queries/useLinenCategories';
import { useLinenTypes } from '@/hooks/queries/useLinenTypes';
import { cn, resolveAsset } from '@/lib/utils';

/**
 * Panneau partagé Pesée + Triage : affiche les items estimés + détails commande/client.
 * Pas de logique métier — purement affichage.
 */
export function OrderDetailsPanel({ order }: { order: MappedOrder }) {
  const items = order.estimatedItemsRaw ?? [];
  const grouped = groupByCategory(items);
  const collectedAt = order.collectedAt ? new Date(order.collectedAt) : null;
  const totalQty = items.reduce((s, it) => s + (it.quantity ?? 0), 0);

  // Catalogue API pour afficher les noms réels (ex: "Drap 2 personnes" au lieu de LP-001)
  const { data: linenTypes = [] } = useLinenTypes();
  const labelByCode = useMemo(() => {
    const m: Record<string, string> = {};
    for (const lt of linenTypes) m[lt.code] = lt.name;
    return m;
  }, [linenTypes]);

  // Catégories dynamiques (label + emoji) depuis l'API
  const { data: linenCategories = [] } = useLinenCategories();
  const categoryDisplay = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of linenCategories) {
      m[c.code] = c.emoji ? `${c.emoji} ${c.label}` : c.label;
    }
    return m;
  }, [linenCategories]);

  // Maps de quantités par type pour comparaison
  const driverByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of order.driverItems ?? []) m[it.type] = it.quantity;
    return m;
  }, [order.driverItems]);

  const receivedByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of order.receivedItems ?? []) m[it.type] = it.quantity;
    return m;
  }, [order.receivedItems]);

  const hasDriver = (order.driverItems ?? []).length > 0;
  const hasReceived = (order.receivedItems ?? []).length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 py-4 bg-paper border-t-hairline border-ink-200">
      {/* Items + comparaison chauffeur/atelier */}
      <section>
        <Header icon={Package} label="Items" right={`${totalQty} annoncé${totalQty > 1 ? 's' : ''}`} />
        {items.length === 0 ? (
          <p className="text-tiny italic text-ink-500">Aucun item annoncé.</p>
        ) : (
          <div className="space-y-3">
            {(hasDriver || hasReceived) && (
              <div className="grid grid-cols-12 gap-2 text-micro text-ink-500 uppercase tracking-wide pb-1 border-b border-ink-200">
                <div className="col-span-6">Article</div>
                <div className="col-span-2 text-right">Annoncé</div>
                <div className="col-span-2 text-right">Chauffeur</div>
                <div className="col-span-2 text-right">Atelier</div>
              </div>
            )}
            {grouped.map(([cat, rows]) => (
              <div key={cat}>
                <p className="caps mb-1">{categoryDisplay[cat] ?? cat}</p>
                <ul className="space-y-1">
                  {rows.map((it, idx) => {
                    const driverQty = driverByType[it.type];
                    const receivedQty = receivedByType[it.type];
                    const driverDiff =
                      driverQty != null ? driverQty - it.quantity : null;
                    const receivedDiff =
                      receivedQty != null ? receivedQty - it.quantity : null;
                    return (
                      <li
                        key={`${it.type}-${idx}`}
                        className="grid grid-cols-12 gap-2 text-sm py-1 border-b border-ink-100 last:border-b-0 items-center"
                      >
                        <span className="col-span-6 text-ink-800 truncate">
                          {labelByCode[it.type] ?? it.type}
                        </span>
                        <span className="col-span-2 text-right font-mono tnum font-semibold text-ink-900">
                          {it.quantity}
                        </span>
                        <span
                          className={cn(
                            'col-span-2 text-right font-mono tnum',
                            driverQty == null
                              ? 'text-ink-300'
                              : driverDiff === 0
                                ? 'text-ink-700'
                                : driverDiff! > 0
                                  ? 'text-ok-700 font-semibold'
                                  : 'text-danger-600 font-semibold',
                          )}
                        >
                          {driverQty == null ? '—' : driverQty}
                        </span>
                        <span
                          className={cn(
                            'col-span-2 text-right font-mono tnum',
                            receivedQty == null
                              ? 'text-ink-300'
                              : receivedDiff === 0
                                ? 'text-ink-700'
                                : receivedDiff! > 0
                                  ? 'text-ok-700 font-semibold'
                                  : 'text-danger-600 font-semibold',
                          )}
                        >
                          {receivedQty == null ? '—' : receivedQty}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Client + commande */}
      <section className="space-y-3">
        <div>
          <Header icon={Building2} label="Client" />
          <p className="text-sm font-semibold text-ink-900">{order.clientName ?? '—'}</p>
          {order.clientType && (
            <p className="text-tiny text-ink-500 capitalize">{order.clientType}</p>
          )}
          {order.clientAddress && (
            <p className="text-tiny text-ink-700 mt-1 flex items-start gap-1">
              <MapPin className="w-3 h-3 mt-0.5 text-ink-400 shrink-0" strokeWidth={1.75} />
              {order.clientAddress}
            </p>
          )}
          {order.clientPhone && (
            <p className="text-tiny text-ink-700 mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-ink-400 shrink-0" strokeWidth={1.75} />
              {order.clientPhone}
            </p>
          )}
          {order.clientEmail && (
            <p className="text-tiny text-ink-700 mt-0.5 flex items-center gap-1">
              <Mail className="w-3 h-3 text-ink-400 shrink-0" strokeWidth={1.75} />
              {order.clientEmail}
            </p>
          )}
        </div>

        {(collectedAt || order.estimatedSize || order.estimatedWeight) && (
          <div>
            <Header icon={Calendar} label="Commande" />
            {collectedAt && (
              <p className="text-tiny text-ink-700">
                Collectée le {format(collectedAt, "d MMM 'à' HH:mm", { locale: fr })}
              </p>
            )}
            {order.estimatedWeight != null && (
              <p className="text-tiny text-ink-700">
                Poids estimé :{' '}
                <span className="font-mono tnum">{(order.estimatedWeight / 1000).toFixed(1)} kg</span>
              </p>
            )}
            {order.estimatedSize && (
              <p className="text-tiny text-ink-700 flex items-center gap-1">
                <Eye className="w-3 h-3 text-ink-400" strokeWidth={1.75} />
                Estimation visuelle : {order.estimatedSize}
              </p>
            )}
          </div>
        )}

        {order.instructions && (
          <div>
            <Header icon={StickyNote} label="Instructions" />
            <p className="text-tiny text-ink-700 whitespace-pre-wrap">{order.instructions}</p>
          </div>
        )}

        {order.collectionPhotos && order.collectionPhotos.length > 0 && (
          <div>
            <Header
              icon={Camera}
              label="Photos collecte"
              right={`${order.collectionPhotos.length}`}
            />
            <div className="flex flex-wrap gap-2">
              {order.collectionPhotos.slice(0, 4).map((url, i) => {
                const src = resolveAsset(url);
                return (
                  <a
                    key={i}
                    href={src ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-14 h-14 rounded-input overflow-hidden border-hairline border-ink-200 bg-paper-2"
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-400">
                        <Camera className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                    )}
                  </a>
                );
              })}
              {order.collectionPhotos.length > 4 && (
                <span className="self-center text-tiny text-ink-500">
                  +{order.collectionPhotos.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Header({
  icon: Icon,
  label,
  right,
}: {
  icon: typeof Building2;
  label: string;
  right?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-brand-800" strokeWidth={1.75} />
        <p className="caps">{label}</p>
      </div>
      {right && <p className="text-tiny font-mono tnum text-ink-700">{right}</p>}
    </div>
  );
}

function groupByCategory(
  items: { category: string; type: string; quantity: number }[],
): Array<[string, { category: string; type: string; quantity: number }[]]> {
  const map = new Map<string, { category: string; type: string; quantity: number }[]>();
  for (const it of items) {
    const key = it.category ?? '—';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  return Array.from(map.entries());
}

