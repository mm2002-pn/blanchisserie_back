import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Truck,
  User,
  Calendar,
  Scale,
  ListChecks,
  Package,
  CheckCircle2,
  PenLine,
  Image as ImageIcon,
  AlertTriangle,
  ScanQrCode,
  FileText,
  Download,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useLinenTypes } from '@/hooks/queries/useLinenTypes';
import type { ApiOrder } from '@/lib/api/orders.api';
import { useOrderDetail, useOrdersRealtime } from '@/hooks/queries/useOrders';
import { ROUTES } from '@/lib/constants';
import { OrderQrModal, type OrderDetailWithMeta } from '@/components/orders/OrderQrModal';
import { AssignCollectionModal } from '@/components/orders/AssignCollectionModal';
import { Smartphone, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { openOrderDocument, type OrderDocumentKind } from '@/lib/api/documents.api';

const API_HOST = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const ASSET_HOST = API_HOST.replace(/\/api\/v1\/?$/, '');

/** Préfixe les URLs relatives `/uploads/...` avec l'hôte API pour affichage. */
function resolveAsset(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${ASSET_HOST}${url}`;
}

const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  pending: 'neutral',
  confirmed: 'info',
  collection_planned: 'info',
  collected: 'info',
  received: 'warning',
  triaged: 'warning',
  in_production: 'warning',
  ready: 'success',
  delivered: 'success',
  invoiced: 'success',
  cancelled: 'error',
};

export default function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useOrdersRealtime();

  const { data, isLoading, error } = useOrderDetail(id);
  const [qrOpen, setQrOpen] = useState(false);

  if (isLoading) return <div className="text-sm text-ink-500">Chargement…</div>;
  if (error) {
    return (
      <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        Erreur : {(error as Error).message}
      </div>
    );
  }
  if (!data) return null;

  const { raw: o, mapped } = data;

  const collected = !!o.collectedAt;
  const received = !!o.receivedAt;
  const triaged = !!o.triagedAt;
  const delivered = !!o.deliveredAt;

  return (
    <OrderDetailContent
      o={o}
      mapped={mapped}
      collected={collected}
      received={received}
      triaged={triaged}
      delivered={delivered}
      qrOpen={qrOpen}
      setQrOpen={setQrOpen}
      onBack={() => navigate(ROUTES.ORDERS)}
    />
  );
}

/* ─── Stepper-based content ─── */

interface OrderDetailContentProps {
  o: ApiOrder;
  mapped: ReturnType<typeof useOrderDetail>['data'] extends { mapped: infer M } | undefined
    ? M
    : never;
  collected: boolean;
  received: boolean;
  triaged: boolean;
  delivered: boolean;
  qrOpen: boolean;
  setQrOpen: (v: boolean) => void;
  onBack: () => void;
}

type StepKey =
  | 'overview'
  | 'articles'
  | 'collecte'
  | 'reception'
  | 'triage'
  | 'livraison';

interface StepDef {
  key: StepKey;
  label: string;
  icon: typeof Building2;
  done: boolean;
  current?: boolean;
}

function OrderDetailContent({
  o,
  mapped,
  collected,
  received,
  triaged,
  delivered,
  qrOpen,
  setQrOpen,
  onBack,
}: OrderDetailContentProps) {
  // Liste des étapes avec leur statut "done"
  const steps: StepDef[] = useMemo(
    () => [
      { key: 'overview', label: 'Aperçu', icon: Building2, done: true },
      { key: 'articles', label: 'Articles', icon: Package, done: true },
      { key: 'collecte', label: 'Collecte', icon: Truck, done: collected },
      { key: 'reception', label: 'Réception', icon: Scale, done: received },
      { key: 'triage', label: 'Triage', icon: ListChecks, done: triaged },
      { key: 'livraison', label: 'Livraison', icon: CheckCircle2, done: delivered },
    ],
    [collected, received, triaged, delivered],
  );

  // Étape "courante" = première non-done à venir
  const currentKey: StepKey = useMemo(() => {
    if (!collected) return 'collecte';
    if (!received) return 'reception';
    if (!triaged) return 'triage';
    return 'livraison';
  }, [collected, received, triaged]);

  const [active, setActive] = useState<StepKey>('overview');

  // Auto-sélectionne l'étape courante au premier affichage
  useEffect(() => {
    setActive(currentKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="secondary" size="sm" onClick={onBack} className="gap-1.5 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            Retour
          </Button>
          <div>
            <p className="caps">Commande</p>
            <h1 className="font-mono text-3xl font-semibold text-ink-900 tnum">{o.orderNumber}</h1>
            <p className="text-sm text-ink-500 mt-1">
              Créée le {format(new Date(o.createdAt), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[o.status] ?? 'neutral'} dot>
            {mapped.status}
          </Badge>
          <Button variant="secondary" size="sm" onClick={() => setQrOpen(true)} className="gap-1.5">
            <ScanQrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
            QR code
          </Button>
        </div>
      </div>

      {/* Documents commerciaux — toujours visibles */}
      <OrderDocumentsCard order={o} />

      {/* Stepper horizontal */}
      <Stepper steps={steps} active={active} current={currentKey} onSelect={setActive} />

      {/* Contenu de l'étape active */}
      <div>
        {active === 'overview' && <StepOverview o={o} />}
        {active === 'articles' && <StepArticles o={o} />}
        {active === 'collecte' && <StepCollecte o={o} collected={collected} />}
        {active === 'reception' && <StepReception o={o} received={received} />}
        {active === 'triage' && <StepTriage o={o} triaged={triaged} />}
        {active === 'livraison' && <StepLivraison o={o} delivered={delivered} />}
      </div>

      <OrderQrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        order={mapped as OrderDetailWithMeta}
      />
    </div>
  );
}

/* ─── Stepper bar ─── */

function Stepper({
  steps,
  active,
  current,
  onSelect,
}: {
  steps: StepDef[];
  active: StepKey;
  current: StepKey;
  onSelect: (key: StepKey) => void;
}) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-stretch gap-1 overflow-x-auto">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.key === active;
          const isCurrent = step.key === current;
          const isDone = step.done;
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onSelect(step.key)}
                className={`flex-1 min-w-0 flex flex-col items-center gap-1.5 py-2 px-1 rounded-input transition-colors ${
                  isActive ? 'bg-brand-50' : 'hover:bg-paper-2'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-brand-800 text-paper'
                      : isDone
                        ? 'bg-ok-100 text-ok-700'
                        : isCurrent
                          ? 'bg-baobab-100 text-baobab-700 ring-2 ring-baobab-600'
                          : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {isDone && !isActive ? (
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </div>
                <span
                  className={`text-tiny font-semibold truncate w-full text-center ${
                    isActive
                      ? 'text-brand-800'
                      : isDone
                        ? 'text-ink-800'
                        : 'text-ink-500'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`h-px flex-1 mx-1 ${
                    steps[i + 1].done || steps[i].done ? 'bg-ok-200' : 'bg-ink-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step contents ─── */

function StepOverview({ o }: { o: ApiOrder }) {
  return (
    <div className="space-y-5">
      <Card title="Client" icon={Building2}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Row label="Hôtel" value={o.client?.name ?? '—'} bold />
          <Row label="Type" value={o.client?.type ?? '—'} />
          <Row label="Adresse" value={o.client?.address ?? '—'} />
          <Row label="Téléphone" value={o.client?.phone ?? '—'} mono />
          <Row label="Email" value={o.client?.email ?? '—'} />
        </div>
      </Card>

      {(o.instructions || o.cancelReason) && (
        <Card title="Notes" icon={AlertTriangle}>
          {o.instructions && (
            <div className="mb-2">
              <p className="caps mb-1">Instructions hôtel</p>
              <p className="text-sm text-ink-700 italic">"{o.instructions}"</p>
            </div>
          )}
          {o.cancelReason && (
            <div>
              <p className="caps mb-1 text-rose-700">Motif d'annulation</p>
              <p className="text-sm text-rose-800 italic">"{o.cancelReason}"</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function StepArticles({ o }: { o: ApiOrder }) {
  return (
    <Card title="Détail du linge" icon={Package}>
      <ItemsTable order={o} />
    </Card>
  );
}

function StepCollecte({ o, collected }: { o: ApiOrder; collected: boolean }) {
  const [assignOpen, setAssignOpen] = useState(false);
  const canAssign = !collected; // pas modifiable une fois la collecte effectuée

  return (
    <Card title="Collecte" icon={Truck} done={collected}>
      {/* Action bar : bouton affecter visible tant que la collecte n'est pas effectuée */}
      {canAssign && (
        <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-input bg-brand-50 border-hairline border-brand-200">
          <div className="flex items-center gap-2 text-sm text-brand-900">
            <UserPlus className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>
              {o.collectionDriverId
                ? "Modifier l'affectation (chauffeur, véhicule, PDA, créneau)"
                : "Affecter cette commande à un chauffeur"}
            </span>
          </div>
          <Button size="sm" onClick={() => setAssignOpen(true)} className="gap-1.5 shrink-0">
            <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />
            {o.collectionDriverId ? 'Modifier' : 'Affecter'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row
          label="Date prévue"
          value={
            o.collectionPlannedAt
              ? format(new Date(o.collectionPlannedAt), 'd MMM yyyy à HH:mm', { locale: fr })
              : format(new Date(o.collectionDate), 'd MMM yyyy', { locale: fr })
          }
        />
        <Row
          label="Réalisée le"
          value={
            o.collectedAt
              ? format(new Date(o.collectedAt), 'd MMM yyyy à HH:mm', { locale: fr })
              : 'Pas encore'
          }
          highlight={collected}
        />
        <Row
          label="Chauffeur"
          value={
            o.collectionDriver
              ? `${o.collectionDriver.firstName} ${o.collectionDriver.lastName}`
              : 'Non assigné'
          }
          sub={o.collectionDriver?.phone ?? undefined}
        />
        <Row
          label="Véhicule"
          value={
            o.collectionVehicle
              ? `${o.collectionVehicle.matricule} — ${o.collectionVehicle.brand} ${o.collectionVehicle.model}`
              : 'Non assigné'
          }
        />
        <Row
          label="PDA"
          value={
            o.collectionPda
              ? `${o.collectionPda.reference}${
                  o.collectionPda.batteryLevel != null
                    ? ` · 🔋 ${o.collectionPda.batteryLevel}%`
                    : ''
                }`
              : 'Non assigné'
          }
          mono={!!o.collectionPda}
        />
        <Row label="Pesée terrain" value={o.driverWeight ? `${(o.driverWeight / 1000).toFixed(1)} kg` : '—'} mono />
        <Row label="Pièces (driver)" value={o.driverPieces ? String(o.driverPieces) : '—'} mono />
        <Row label="Estimation visuelle" value={o.visualEstimation ?? '—'} />
        <Row label="Reçu par" value={o.collectionRecipientName ?? '—'} />
      </div>

      {o.collectionPhotos && o.collectionPhotos.length > 0 && (
        <PhotoGrid label="Photos collecte" urls={o.collectionPhotos} />
      )}
      {o.collectionSignatureUrl && (
        <SignatureBlock label="Signature collecte" url={o.collectionSignatureUrl} />
      )}

      <AssignCollectionModal
        open={assignOpen}
        order={o}
        onClose={() => setAssignOpen(false)}
      />
    </Card>
  );
}

function StepReception({ o, received }: { o: ApiOrder; received: boolean }) {
  return (
    <Card title="Réception atelier" icon={Scale} done={received}>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row
          label="Reçue le"
          value={
            o.receivedAt
              ? format(new Date(o.receivedAt), 'd MMM yyyy à HH:mm', { locale: fr })
              : 'Pas encore'
          }
          highlight={received}
        />
        <Row label="Pesée officielle" value={o.receivedWeight ? `${(o.receivedWeight / 1000).toFixed(1)} kg` : '—'} mono bold />
        <Row label="Pièces" value={o.receivedPieces ? String(o.receivedPieces) : '—'} mono />
        <Row
          label="Écart vs estimation"
          value={o.weightDeviation != null ? `${o.weightDeviation > 0 ? '+' : ''}${o.weightDeviation}%` : '—'}
          mono
          danger={o.weightDeviation != null && Math.abs(o.weightDeviation) > 30}
        />
      </div>
    </Card>
  );
}

function StepTriage({ o, triaged }: { o: ApiOrder; triaged: boolean }) {
  return (
    <Card title="Triage" icon={ListChecks} done={triaged}>
      {o.triagedAt && (
        <p className="text-sm text-ink-700 mb-3">
          Effectué le{' '}
          <strong>
            {format(new Date(o.triagedAt), 'd MMM yyyy à HH:mm', { locale: fr })}
          </strong>
        </p>
      )}
      {!triaged && <p className="text-sm text-ink-500 italic">Pas encore triagé</p>}
    </Card>
  );
}

function StepLivraison({ o, delivered }: { o: ApiOrder; delivered: boolean }) {
  return (
    <Card title="Livraison" icon={CheckCircle2} done={delivered}>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row
          label="Livrée le"
          value={
            o.deliveredAt
              ? format(new Date(o.deliveredAt), 'd MMM yyyy à HH:mm', { locale: fr })
              : 'Pas encore'
          }
          highlight={delivered}
        />
        <Row
          label="Chauffeur"
          value={
            o.deliveryDriver
              ? `${o.deliveryDriver.firstName} ${o.deliveryDriver.lastName}`
              : 'Non assigné'
          }
          sub={o.deliveryDriver?.phone ?? undefined}
        />
        <Row
          label="Véhicule"
          value={
            o.deliveryVehicle
              ? `${o.deliveryVehicle.matricule} — ${o.deliveryVehicle.brand} ${o.deliveryVehicle.model}`
              : 'Non assigné'
          }
        />
        <Row label="Reçu par" value={o.deliveryRecipientName ?? '—'} />
      </div>

      {o.deliveryPhotos && o.deliveryPhotos.length > 0 && (
        <PhotoGrid label="Photos livraison" urls={o.deliveryPhotos} />
      )}
      {o.deliverySignatureUrl && (
        <SignatureBlock label="Signature livraison" url={o.deliverySignatureUrl} />
      )}
    </Card>
  );
}

/* ─── Sub-components ─── */

/** Carte "Documents commerciaux" — boutons de téléchargement par étape. */
function OrderDocumentsCard({ order }: { order: ApiOrder }) {
  const status = order.status;
  const hasCollected = !!order.collectedAt;
  const hasTriaged = !!order.triagedAt;
  const hasDelivered = !!order.deliveredAt;

  const docs: Array<{
    key: string;
    label: string;
    sub: string;
    enabled: boolean;
    kind: OrderDocumentKind;
  }> = [
    {
      key: 'bc',
      label: 'Bon de Commande',
      sub: 'CMD',
      enabled: true, // toujours dispo dès la création
      kind: 'bon-commande',
    },
    {
      key: 'bcol',
      label: 'Bon de Collecte',
      sub: 'BCOL',
      enabled: hasCollected,
      kind: 'bon-collecte',
    },
    {
      key: 'bt',
      label: 'Bordereau de Triage',
      sub: 'BT (interne)',
      enabled: hasTriaged,
      kind: 'bordereau-triage',
    },
    {
      key: 'bl',
      label: 'Bon de Livraison',
      sub: 'BL',
      enabled: hasDelivered,
      kind: 'bon-livraison',
    },
  ];

  async function handleOpen(kind: OrderDocumentKind, label: string) {
    const t = toast.loading(`Préparation du ${label}…`);
    try {
      await openOrderDocument(order.id, kind);
      toast.dismiss(t);
    } catch (err) {
      toast.dismiss(t);
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'ouverture';
      toast.error(msg);
    }
  }

  void status;

  return (
    <section className="card-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-input flex items-center justify-center bg-paper-2 text-ink-500">
          <FileText className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <h3 className="font-serif text-base font-medium text-ink-900">Documents</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {docs.map((d) => (
          <button
            key={d.key}
            type="button"
            disabled={!d.enabled}
            onClick={() => d.enabled && void handleOpen(d.kind, d.label)}
            className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-input border-hairline text-sm transition-colors text-left ${
              d.enabled
                ? 'border-ink-200 bg-paper hover:border-brand-800 hover:text-brand-800 text-ink-800 cursor-pointer'
                : 'border-ink-100 bg-paper-2 text-ink-400 cursor-not-allowed'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate leading-tight">{d.label}</p>
              <p className="text-micro text-ink-500 font-mono">{d.sub}</p>
            </div>
            <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          </button>
        ))}
      </div>
    </section>
  );
}

function Card({
  title,
  icon: Icon,
  done,
  children,
}: {
  title: string;
  icon: typeof Building2;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="card-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-7 h-7 rounded-input flex items-center justify-center ${
            done ? 'bg-ok-100 text-ok-700' : 'bg-paper-2 text-ink-500'
          }`}
        >
          {done ? (
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          )}
        </div>
        <h2 className="font-serif text-lg font-medium text-ink-900">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  sub,
  bold,
  mono,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  sub?: string;
  bold?: boolean;
  mono?: boolean;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="caps text-ink-500">{label}</p>
      <p
        className={`mt-0.5 ${
          danger
            ? 'text-rose-700 font-semibold'
            : highlight
              ? 'text-ok-700 font-semibold'
              : 'text-ink-900'
        } ${mono ? 'font-mono tnum' : ''} ${bold ? 'font-semibold' : ''} text-sm`}
      >
        {value}
      </p>
      {sub && <p className="text-tiny text-ink-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function PhotoGrid({ label, urls }: { label: string; urls: string[] }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-2">
        <ImageIcon className="w-3.5 h-3.5 text-ink-500" strokeWidth={1.75} />
        <p className="caps">{label} · {urls.length}</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {urls.map((u, i) => {
          const src = resolveAsset(u);
          return (
            <a
              key={i}
              href={src ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="block aspect-square bg-paper-2 border-hairline border-ink-200 rounded-input overflow-hidden hover:opacity-80"
            >
              {src ? (
                <img src={src} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-400">
                  <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function SignatureBlock({ label, url }: { label: string; url: string }) {
  const src = resolveAsset(url);
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-2">
        <PenLine className="w-3.5 h-3.5 text-ink-500" strokeWidth={1.75} />
        <p className="caps">{label}</p>
      </div>
      <div className="border-hairline border-ink-200 rounded-input bg-white p-2 inline-block">
        {src ? (
          <img src={src} alt={label} className="max-h-32 max-w-md object-contain" />
        ) : (
          <span className="text-tiny text-ink-400">Pas d'image</span>
        )}
      </div>
    </div>
  );
}

void User; // import non utilisé directement — on garde pour cohérence
void Calendar;

/** Tableau des items annoncés par le client (sans comparaison atelier). */
function ItemsTable({ order }: { order: ApiOrder }) {
  const { data: linenTypes = [] } = useLinenTypes();
  const labelByCode: Record<string, string> = {};
  for (const lt of linenTypes) labelByCode[lt.code] = lt.name;

  const estimated = order.estimatedItems ?? [];

  if (estimated.length === 0) {
    return (
      <p className="text-sm italic text-ink-500">
        Aucun item annoncé sur cette commande.
      </p>
    );
  }

  const totalEst = estimated.reduce((s, it) => s + (it.quantity ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-tiny font-semibold uppercase tracking-wide text-ink-500 pb-2 border-b border-ink-200">
        <div className="col-span-3">Cat.</div>
        <div className="col-span-6">Article</div>
        <div className="col-span-3 text-right">Quantité</div>
      </div>

      {estimated.map((it, idx) => (
        <div
          key={`${it.type}-${idx}`}
          className="grid grid-cols-12 gap-2 text-sm py-2 border-b border-ink-100 last:border-b-0 items-center"
        >
          <div className="col-span-3">
            <Badge variant="neutral" className="text-tiny">
              {it.category}
            </Badge>
          </div>
          <div className="col-span-6 text-ink-800 truncate">
            {labelByCode[it.type] ?? it.type}
          </div>
          <div className="col-span-3 text-right font-mono tnum font-semibold text-ink-900">
            {it.quantity}
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="grid grid-cols-12 gap-2 text-sm py-2 mt-1 border-t-2 border-ink-300 font-semibold">
        <div className="col-span-9 text-ink-900">Total</div>
        <div className="col-span-3 text-right font-mono tnum text-ink-900">{totalEst}</div>
      </div>
    </div>
  );
}
