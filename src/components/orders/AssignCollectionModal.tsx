import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { UsersRound, Smartphone, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Select, Input } from '@/components/ui';
import { confirmCollection, type ApiOrder } from '@/lib/api/orders.api';
import { useVehicles } from '@/hooks/queries/useVehicles';

/**
 * Modale d'affectation collecte (pattern ENROLLEMENT).
 *
 * L'utilisateur ne choisit QUE le véhicule (+ le créneau). Le chauffeur et le PDA
 * sont automatiquement dérivés de l'enrollement du véhicule
 * (Vehicle.enrolledDriver + Vehicle.enrolledPda).
 *
 * Si le véhicule n'a pas d'équipage enrôlé, on affiche un warning + lien vers
 * Paramètres → Véhicules pour configurer l'enrollement.
 */
export function AssignCollectionModal({
  open,
  order,
  onClose,
}: {
  open: boolean;
  order: ApiOrder;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [vehicleId, setVehicleId] = useState(order.collectionVehicleId ?? '');
  const [plannedAt, setPlannedAt] = useState(() => {
    const d = order.collectionPlannedAt
      ? new Date(order.collectionPlannedAt)
      : new Date(order.collectionDate);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setVehicleId(order.collectionVehicleId ?? '');
      setError(null);
    }
  }, [open, order]);

  const { data: vehicles = [] } = useVehicles();

  // Véhicules dispo + celui déjà affecté (pour pouvoir le garder visible)
  const availableVehicles = vehicles.filter(
    (v) => v.status === 'Disponible' || v.id === order.collectionVehicleId,
  );
  const selected = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!vehicleId) throw new Error('Sélectionne un véhicule');
      const iso = new Date(plannedAt).toISOString();
      return confirmCollection(order.id, {
        // L'API dérive driver+PDA depuis Vehicle.enrolled* — pas besoin de les envoyer.
        collectionVehicleId: vehicleId,
        collectionPlannedAt: iso,
        expectedVersion: order.version,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', order.id] });
      qc.invalidateQueries({ queryKey: ['pdas'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Échec affectation');
    },
  });

  const hasEnrollment = selected?.enrolledDriverId || selected?.enrolledPdaId;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Affecter la collecte"
      subtitle={`Commande ${order.orderNumber} — sélectionne le véhicule (équipage dérivé de l'enrollement)`}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
        className="space-y-4"
      >
        {/* Vehicle */}
        <Select
          label="Véhicule"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          required
          options={[
            { label: '— Choisir un véhicule —', value: '' },
            ...availableVehicles.map((v) => {
              const crew = v.enrolledDriver
                ? `${v.enrolledDriver.firstName} ${v.enrolledDriver.lastName}`
                : 'sans chauffeur';
              return {
                label: `${v.matricule} · ${v.brand} ${v.model} — ${crew}`,
                value: v.id,
              };
            }),
          ]}
          hint={`${availableVehicles.length} véhicule(s) disponible(s)`}
        />

        {/* Aperçu équipage enrôlé */}
        {selected && (
          <div
            className={`rounded-input border-hairline p-3 space-y-2 ${
              hasEnrollment
                ? 'bg-brand-50 border-brand-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <p className="caps text-ink-700">Équipage du véhicule</p>
            <div className="flex items-center gap-2 text-sm">
              <UsersRound className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
              {selected.enrolledDriver ? (
                <span className="font-semibold text-ink-900">
                  {selected.enrolledDriver.firstName} {selected.enrolledDriver.lastName}
                  {selected.enrolledDriver.phone && (
                    <span className="ml-2 font-mono text-tiny text-ink-500">
                      {selected.enrolledDriver.phone}
                    </span>
                  )}
                </span>
              ) : (
                <span className="italic text-ink-500">Aucun chauffeur enrôlé</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
              {selected.enrolledPda ? (
                <span className="font-mono text-ink-900">
                  {selected.enrolledPda.reference}
                  {selected.enrolledPda.batteryLevel != null && (
                    <span className="ml-2 text-tiny text-ink-500">
                      🔋 {selected.enrolledPda.batteryLevel}%
                    </span>
                  )}
                </span>
              ) : (
                <span className="italic text-ink-500">Aucun PDA enrôlé</span>
              )}
            </div>
            {!hasEnrollment && (
              <p className="text-tiny text-amber-800 flex items-center gap-1.5 mt-2">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
                Ce véhicule n'a pas d'équipage. Configure l'enrollement dans
                Paramètres → Véhicules.
              </p>
            )}
          </div>
        )}

        {/* Slot */}
        <Input
          label="Créneau collecte"
          type="datetime-local"
          value={plannedAt}
          onChange={(e) => setPlannedAt(e.target.value)}
          required
        />

        {error && (
          <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <p className="text-tiny text-ink-500">
            Date prévue : {format(new Date(plannedAt), "d MMM yyyy 'à' HH:mm")}
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!vehicleId || !hasEnrollment}
            >
              {order.collectionDriverId ? 'Mettre à jour' : 'Affecter'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
