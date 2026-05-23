import { useMemo, useRef, useState } from 'react';
import { Plus, Search, Truck, Fuel, UsersRound, Smartphone, Link2, Check, X, History, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { Badge, Button, Input, Modal, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import {
  useEnrollVehicle,
  useFleetOverview,
  useVehicleEnrollmentHistory,
  useVehicles,
} from '@/hooks/queries/useVehicles';
import { usePdas } from '@/hooks/queries/usePdas';
import { useUsers } from '@/hooks/queries/useUsers';
import { cn } from '@/lib/utils';
import type { MappedVehicle } from '@/lib/api/vehicles.api';

const STATUS_VARIANT: Record<MappedVehicle['status'], 'success' | 'warning' | 'error' | 'info'> = {
  Disponible: 'success',
  'En tournée': 'info',
  Maintenance: 'warning',
  'Hors service': 'error',
};

export default function VehiclesPage() {
  const { canEdit } = usePermissions();
  const { data, isLoading, error } = useVehicles();
  const { data: overview } = useFleetOverview();
  const vehicles: MappedVehicle[] = data ?? [];

  const [search, setSearch] = useState('');
  const [enrollVehicle, setEnrollVehicle] = useState<MappedVehicle | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      `${v.matricule} ${v.brand} ${v.model}`.toLowerCase().includes(q),
    );
  }, [vehicles, search]);

  const columns = [
    {
      header: 'Véhicule',
      accessorKey: 'matricule' as keyof MappedVehicle,
      cell: (row: MappedVehicle) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">{row.matricule}</p>
            <p className="text-tiny text-ink-500 truncate">
              {row.brand} {row.model}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Capacité',
      accessorKey: 'capacityKg' as keyof MappedVehicle,
      align: 'right' as const,
      cell: (row: MappedVehicle) => (
        <span className="font-mono text-sm text-ink-900 tnum">
          {row.capacityKg} <span className="text-ink-500">kg</span>
        </span>
      ),
    },
    {
      header: 'Carburant',
      accessorKey: 'fuelLevel' as keyof MappedVehicle,
      cell: (row: MappedVehicle) => {
        const pct = row.fuelLevel ?? 0;
        const fill =
          pct >= 60 ? 'bg-ok-600' : pct >= 30 ? 'bg-warn-600' : 'bg-danger-600';
        return (
          <div className="space-y-1 min-w-[90px]">
            <div className="flex items-center gap-1.5">
              <Fuel className="w-3 h-3 text-ink-400" strokeWidth={1.75} />
              <span className="font-mono text-tiny tnum text-ink-700">{pct}%</span>
            </div>
            <div className="h-1 bg-ink-100 rounded-pill overflow-hidden">
              <div className={cn('h-full rounded-pill', fill)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Statut',
      accessorKey: 'status' as keyof MappedVehicle,
      cell: (row: MappedVehicle) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Équipage enrôlé',
      accessorKey: 'enrolledDriver' as keyof MappedVehicle,
      cell: (row: MappedVehicle) => (
        <div className="min-w-[200px] space-y-1">
          <div className="flex items-center gap-1.5 text-tiny">
            <UsersRound className="w-3 h-3 text-ink-500 shrink-0" strokeWidth={1.75} />
            {row.enrolledDriver ? (
              <span className="text-ink-800 truncate">
                {row.enrolledDriver.firstName} {row.enrolledDriver.lastName}
              </span>
            ) : (
              <span className="text-ink-400 italic">Aucun chauffeur</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-tiny">
            <Smartphone className="w-3 h-3 text-ink-500 shrink-0" strokeWidth={1.75} />
            {row.enrolledPda ? (
              <span className="text-ink-800 truncate font-mono">
                {row.enrolledPda.reference}
              </span>
            ) : (
              <span className="text-ink-400 italic">Aucun PDA</span>
            )}
          </div>
          {row.enrolledSince && (
            <div className="flex items-center gap-1.5 text-micro text-ink-500">
              <Clock className="w-3 h-3 shrink-0" strokeWidth={1.75} />
              <span>
                Depuis le {format(new Date(row.enrolledSince), 'd MMM yyyy', { locale: frLocale })}
              </span>
            </div>
          )}
          {canEdit('settings') && (
            <button
              onClick={() => setEnrollVehicle(row)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-brand-50 text-brand-800 text-micro font-semibold hover:bg-brand-100"
            >
              <Link2 className="w-3 h-3" strokeWidth={2} />
              {row.enrolledDriverId || row.enrolledPdaId ? 'Modifier' : 'Enrôler'}
            </button>
          )}
        </div>
      ),
    },
    {
      header: 'Dernière maint.',
      accessorKey: 'lastMaintenance' as keyof MappedVehicle,
      cell: (row: MappedVehicle) => (
        <span className="font-mono text-tiny text-ink-500 tnum">
          {row.lastMaintenance ? row.lastMaintenance.slice(0, 10) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Flotte</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {vehicles.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">véhicules enregistrés</span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Camions de collecte et de livraison · maintenance et carburant.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau véhicule
          </Button>
        )}
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Total" value={String(overview.total)} sub="véhicules" />
          <KpiTile
            label="Capacité totale"
            value={`${overview.totalCapacityKg}`}
            sub="kg cumulés"
          />
          <KpiTile
            label="Carburant moyen"
            value={`${overview.avgFuelLevel}%`}
            sub="parc complet"
          />
          <KpiTile
            label="Disponibles"
            value={String(overview.byStatus.available ?? 0)}
            sub="prêts à partir"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" strokeWidth={1.75} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Matricule, marque, modèle…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Impossible de charger les véhicules : {(error as Error).message}
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          emptyMessage={
            isLoading
              ? 'Chargement…'
              : search
                ? `Aucun résultat pour « ${search} »`
                : 'Aucun véhicule'
          }
        />
      )}

      <EnrollmentModal
        vehicle={enrollVehicle}
        onClose={() => setEnrollVehicle(null)}
      />
    </div>
  );
}

/* ─── Modale d'enrollement (chauffeur + PDA) ─── */

function EnrollmentModal({
  vehicle,
  onClose,
}: {
  vehicle: MappedVehicle | null;
  onClose: () => void;
}) {
  const [driverId, setDriverId] = useState('');
  const [pdaId, setPdaId] = useState('');
  const [startsAt, setStartsAt] = useState(() => toLocalDateTime(new Date()));
  const [endsAt, setEndsAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: users = [] } = useUsers();
  const { data: pdas = [], refetch: refetchPdas } = usePdas();
  const enroll = useEnrollVehicle();
  const { data: history = [] } = useVehicleEnrollmentHistory(vehicle?.id ?? null);

  // Force un refetch des PDAs à chaque ouverture de la modale pour avoir le
  // statut le plus récent (sinon le cache React Query peut retarder de 30s).
  const previousVehicleRef = useRef<string | null>(null);
  if (vehicle && previousVehicleRef.current !== vehicle.id) {
    previousVehicleRef.current = vehicle.id;
    void refetchPdas();
  }
  if (!vehicle && previousVehicleRef.current !== null) {
    previousVehicleRef.current = null;
  }

  const drivers = users.filter((u) => u.role === 'Chauffeur' && u.isActive);
  // Pour l'enrollement on affiche TOUS les PDAs actifs.
  // Les statuts (in_use / maintenance) sont juste indicatifs - on peut
  // enroller un PDA sur un nouveau véhicule même s'il était en cours d'usage.
  const availablePdas = pdas.filter((p) => p.isActive);

  // Sync initial state when modal opens with a new vehicle
  if (vehicle && driverId === '' && vehicle.enrolledDriverId) {
    setDriverId(vehicle.enrolledDriverId);
  }
  if (vehicle && pdaId === '' && vehicle.enrolledPdaId) {
    setPdaId(vehicle.enrolledPdaId);
  }

  const reset = () => {
    setDriverId('');
    setPdaId('');
    setStartsAt(toLocalDateTime(new Date()));
    setEndsAt('');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setError(null);
    try {
      await enroll.mutateAsync({
        id: vehicle.id,
        driverId: driverId || null,
        pdaId: pdaId || null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec enrôlement');
    }
  };

  const handleClear = async () => {
    if (!vehicle) return;
    try {
      await enroll.mutateAsync({
        id: vehicle.id,
        driverId: null,
        pdaId: null,
        startsAt: new Date().toISOString(),
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <Modal
      isOpen={!!vehicle}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Enrôler équipage · ${vehicle?.matricule ?? ''}`}
      subtitle="Crew (chauffeur + PDA) sur ce véhicule, avec période d'effet. L'historique est conservé."
      size="lg"
    >
      {!vehicle ? null : (
        <div className="space-y-5">
          <form onSubmit={handleSave} className="space-y-4">
            <Select
              label="Chauffeur"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              options={[
                { label: '— Aucun —', value: '' },
                ...drivers.map((d) => ({
                  label: `${d.firstName} ${d.lastName}`,
                  value: d.id,
                })),
              ]}
            />

            <Select
              label="PDA (terminal portable)"
              value={pdaId}
              onChange={(e) => setPdaId(e.target.value)}
              options={[
                { label: '— Aucun —', value: '' },
                ...availablePdas.map((p) => ({
                  label: p.brand
                    ? `${p.reference} · ${p.brand}${p.model ? ' ' + p.model : ''}`
                    : p.reference,
                  value: p.id,
                })),
              ]}
              hint={`${availablePdas.length} PDA(s) actif(s)`}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Début"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
              <Input
                label="Fin (optionnelle)"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                hint="Vide = enrollement actif jusqu'à nouveau changement"
              />
            </div>

            {error && (
              <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {vehicle.enrolledDriverId || vehicle.enrolledPdaId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClear}
                  className="gap-1.5"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                  Désenrôler
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" loading={enroll.isPending} className="gap-1.5">
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  Enrôler
                </Button>
              </div>
            </div>
          </form>

          {/* Historique */}
          {history.length > 0 && (
            <div className="border-t border-ink-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                <p className="caps">Historique · {history.length}</p>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {history.map((h) => {
                  const active = h.endsAt === null;
                  return (
                    <div
                      key={h.id}
                      className={`p-2.5 rounded-input border-hairline text-sm ${
                        active
                          ? 'border-ok-200 bg-ok-50'
                          : 'border-ink-200 bg-paper-2'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {active && (
                            <span className="inline-block w-2 h-2 rounded-full bg-ok-600 shrink-0" />
                          )}
                          <span className="font-semibold text-ink-900 truncate">
                            {h.driver
                              ? `${h.driver.firstName} ${h.driver.lastName}`
                              : '— Pas de chauffeur'}
                          </span>
                        </div>
                        {h.pda && (
                          <span className="font-mono text-tiny text-ink-700 shrink-0">
                            {h.pda.reference}
                          </span>
                        )}
                      </div>
                      <p className="text-tiny text-ink-500">
                        Du{' '}
                        <span className="font-mono">
                          {format(new Date(h.startsAt), 'd MMM yyyy', { locale: frLocale })}
                        </span>
                        {' '}
                        {h.endsAt ? (
                          <>
                            au{' '}
                            <span className="font-mono">
                              {format(new Date(h.endsAt), 'd MMM yyyy', { locale: frLocale })}
                            </span>
                          </>
                        ) : (
                          <span className="text-ok-700 font-semibold">· en cours</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Date → "YYYY-MM-DDTHH:mm" (datetime-local, locale). */
function toLocalDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-surface p-4">
      <p className="caps">{label}</p>
      <p className="font-mono text-2xl font-semibold text-ink-900 tnum mt-1">{value}</p>
      <p className="text-tiny text-ink-500 mt-0.5">{sub}</p>
    </div>
  );
}
