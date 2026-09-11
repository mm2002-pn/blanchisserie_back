import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Building2,
  Package,
  Calendar,
  Weight,
  ScanQrCode,
  Scale,
  ListChecks,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { Modal, Badge, Button } from '@/components/ui';
import { formatDate, formatWeight } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import type { Order } from '@/types';

/**
 * Modal "détail + QR" — affiche les infos clés d'une commande et un QR code
 * encodant l'ID API. Le driver scanne ce QR depuis l'app mobile (collect.tsx).
 */
export interface OrderDetailWithMeta extends Order {
  clientName?: string;
  apiStatus?: string;
  workflowState?: string;
  receivedPieces?: number;
  driverPieces?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  order: OrderDetailWithMeta | null;
}

export function OrderQrModal({ open, onClose, order }: Props) {
  const navigate = useNavigate();
  if (!order) return null;
  const pieces = order.receivedPieces ?? order.driverPieces ?? 0;
  const apiHost = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

  /** Action contextuelle selon le statut courant. */
  const apiStatus = order.apiStatus ?? '';
  const action = (() => {
    if (['pending', 'confirmed', 'collection_planned'].includes(apiStatus)) {
      return {
        label: 'En attente de collecte',
        icon: <Truck className="w-3.5 h-3.5" strokeWidth={1.75} />,
        path: null,
        hint: 'Le driver utilisera le QR ci-dessus.',
      };
    }
    if (apiStatus === 'collected') {
      return {
        label: 'Procéder à la réception',
        icon: <Scale className="w-3.5 h-3.5" strokeWidth={1.75} />,
        path: ROUTES.RECEPTION,
        hint: 'À peser et enregistrer en atelier.',
      };
    }
    if (apiStatus === 'received') {
      return {
        label: 'Procéder au triage',
        icon: <ListChecks className="w-3.5 h-3.5" strokeWidth={1.75} />,
        path: ROUTES.TRIAGE,
        hint: 'Ventilation par type · génération étiquettes.',
      };
    }
    if (apiStatus === 'triaged') {
      return {
        label: 'Inclure dans la prod du jour',
        icon: <PackageCheck className="w-3.5 h-3.5" strokeWidth={1.75} />,
        path: ROUTES.PRODUCTION_DAY,
        hint: 'Items prêts dans le pool. À planifier.',
      };
    }
    if (['in_production', 'ready'].includes(apiStatus)) {
      return {
        label: 'Suivre la production',
        icon: <Package className="w-3.5 h-3.5" strokeWidth={1.75} />,
        path: ROUTES.PRODUCTION,
        hint: 'Production en cours · suivi temps réel.',
      };
    }
    if (apiStatus === 'delivered' || apiStatus === 'invoiced') {
      return {
        label: 'Voir facture',
        icon: <PackageCheck className="w-3.5 h-3.5" strokeWidth={1.75} />,
        path: ROUTES.INVOICES,
        hint: 'Commande livrée.',
      };
    }
    return null;
  })();

  return (
    <Modal isOpen={open} onClose={onClose} title="">
      <div className="space-y-5 -mt-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="caps">Commande</p>
            <h3 className="font-mono text-2xl font-semibold text-ink-900 tnum mt-0.5">
              {order.orderNumber}
            </h3>
            {order.clientName && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-ink-600">
                <Building2 className="w-3.5 h-3.5 text-brand-800" strokeWidth={1.75} />
                <span>{order.clientName}</span>
              </div>
            )}
          </div>
          <Badge variant="brand" dot>
            {order.status}
          </Badge>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 -mt-1 -mr-1"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* QR */}
        <div className="card-surface p-6 flex flex-col items-center bg-paper-2">
          <div className="bg-white p-4 rounded-input border-hairline border-ink-200">
            <QRCodeSVG value={order.id} size={220} level="M" />
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <ScanQrCode className="w-3.5 h-3.5 text-ink-500" strokeWidth={1.75} />
            <p className="text-tiny text-ink-500">
              Scan ce QR depuis l'écran <span className="font-mono">Collecte</span> du driver
            </p>
          </div>
          <p className="font-mono text-micro text-ink-400 mt-1.5 break-all text-center">
            {order.id}
          </p>
        </div>

        {/* Tiles */}
        <div className="grid grid-cols-3 gap-2.5">
          <Tile
            icon={<Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />}
            label="Collecte"
            value={formatDate(order.collectionDate, 'dd/MM/yyyy')}
          />
          <Tile
            icon={<Weight className="w-3.5 h-3.5" strokeWidth={1.75} />}
            label="Poids"
            value={formatWeight(order.totalWeight ?? 0)}
          />
          <Tile
            icon={<Package className="w-3.5 h-3.5" strokeWidth={1.75} />}
            label="Pièces"
            value={pieces > 0 ? String(pieces) : '—'}
          />
        </div>

        {(order.apiStatus || order.workflowState) && (
          <div className="grid grid-cols-2 gap-2.5">
            <Tile label="Status API" value={order.apiStatus ?? '—'} mono />
            <Tile label="Workflow" value={order.workflowState ?? '—'} mono />
          </div>
        )}

        {apiHost && (
          <p className="text-tiny text-ink-400 text-center">
            <span className="font-mono">{apiHost}</span>
          </p>
        )}

        {action && (
          <div className="card-surface p-3 bg-paper-2 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="caps text-ink-500">Prochaine étape</p>
              <p className="text-sm font-semibold text-ink-900 mt-0.5">
                {action.hint}
              </p>
            </div>
            {action.path && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(action.path!);
                }}
                className="gap-1.5 shrink-0"
              >
                {action.icon}
                {action.label}
              </Button>
            )}
            {!action.path && (
              <span className="text-tiny text-ink-500 italic">{action.label}</span>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose} size="sm">
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Tile({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="p-3 rounded-input bg-paper-2 border-hairline border-ink-200">
      <div className="flex items-center gap-1.5 text-ink-500">
        {icon}
        <p className="caps">{label}</p>
      </div>
      <p
        className={`mt-1 text-sm font-semibold text-ink-900 ${mono ? 'font-mono tnum text-tiny' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}
