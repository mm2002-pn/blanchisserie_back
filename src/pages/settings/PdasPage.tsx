import { useMemo, useRef, useState } from 'react';
import { Plus, Search, Smartphone, RefreshCw, X, Check, Pencil } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import {
  useCreatePda,
  usePdas,
  useSetPdaStatus,
  useUpdatePda,
} from '@/hooks/queries/usePdas';
import { PDA_STATUS_FR, type ApiPda, type PdaStatus } from '@/lib/api/pdas.api';

const STATUS_VARIANT: Record<PdaStatus, 'success' | 'info' | 'warning' | 'error'> = {
  available: 'success',
  in_use: 'info',
  maintenance: 'warning',
  out_of_service: 'error',
};

export default function PdasPage() {
  const { canEdit } = usePermissions();
  const { data: pdas = [], isLoading, error } = usePdas();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPda | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pdas;
    return pdas.filter((p) =>
      `${p.reference} ${p.brand ?? ''} ${p.model ?? ''}`.toLowerCase().includes(q),
    );
  }, [pdas, search]);

  const byStatus = useMemo(() => {
    const m = { available: 0, in_use: 0, maintenance: 0, out_of_service: 0 };
    for (const p of pdas) m[p.status] += 1;
    return m;
  }, [pdas]);

  const columns = [
    {
      header: 'PDA',
      accessorKey: 'reference' as keyof ApiPda,
      cell: (row: ApiPda) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 font-mono">{row.reference}</p>
            <p className="text-tiny text-ink-500 truncate">
              {row.brand ?? '—'} {row.model ?? ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'status' as keyof ApiPda,
      cell: (row: ApiPda) => (
        <Badge variant={STATUS_VARIANT[row.status]} dot>
          {PDA_STATUS_FR[row.status]}
        </Badge>
      ),
    },
    {
      header: 'Dernière sync',
      accessorKey: 'lastSyncAt' as keyof ApiPda,
      cell: (row: ApiPda) =>
        row.lastSyncAt ? (
          <span className="inline-flex items-center gap-1 text-tiny text-ink-700">
            <RefreshCw className="w-3 h-3 text-ink-500" strokeWidth={1.75} />
            {new Date(row.lastSyncAt).toLocaleString('fr-FR')}
          </span>
        ) : (
          <span className="text-ink-400 text-tiny">jamais</span>
        ),
    },
    {
      header: '',
      accessorKey: 'id' as keyof ApiPda,
      cell: (row: ApiPda) =>
        canEdit('settings') ? (
          <button
            onClick={() => {
              setEditing(row);
              setModalOpen(true);
            }}
            className="p-1.5 text-ink-500 hover:text-ink-900"
            title="Modifier"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">PDA · Terminaux portables</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {pdas.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">PDAs enregistrés</span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Scanners portables utilisés par les chauffeurs sur le terrain.
          </p>
        </div>
        {canEdit('settings') && (
          <Button
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter un PDA
          </Button>
        )}
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard label="Disponibles" count={byStatus.available} variant="success" />
        <StatusCard label="En tournée" count={byStatus.in_use} variant="info" />
        <StatusCard label="Maintenance" count={byStatus.maintenance} variant="warning" />
        <StatusCard label="Hors service" count={byStatus.out_of_service} variant="error" />
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="caps">Liste · {filtered.length}</div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Impossible de charger les PDAs : {(error as Error).message}
        </div>
      ) : pdas.length > 0 || isLoading ? (
        <DataTable
          data={filtered}
          columns={columns}
          emptyMessage={
            isLoading
              ? 'Chargement…'
              : search
                ? `Aucun résultat pour « ${search} »`
                : 'Aucun PDA'
          }
        />
      ) : (
        <EmptyState
          icon={Smartphone}
          title="Aucun PDA configuré"
          message="Ajoute les terminaux portables utilisés par tes chauffeurs."
          actionLabel="Ajouter un PDA"
          onAction={() => setModalOpen(true)}
        />
      )}

      <PdaModal
        open={modalOpen}
        selected={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function StatusCard({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: 'success' | 'info' | 'warning' | 'error';
}) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p className="font-serif text-2xl font-medium tnum text-ink-900 mt-1.5 leading-none">
            {count}
          </p>
        </div>
        <Badge variant={variant} dot>
          {label}
        </Badge>
      </div>
    </div>
  );
}

/* ─── Modale création / édition ─── */

function PdaModal({
  open,
  selected,
  onClose,
}: {
  open: boolean;
  selected: ApiPda | null;
  onClose: () => void;
}) {
  const referenceRef = useRef<HTMLInputElement | null>(null);
  const brandRef = useRef<HTMLInputElement | null>(null);
  const modelRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const [status, setStatus] = useState<PdaStatus>(selected?.status ?? 'available');
  const [error, setError] = useState<string | null>(null);

  const create = useCreatePda();
  const update = useUpdatePda();
  const setStatusMut = useSetPdaStatus();

  // Reset form when modal opens with new selection
  if (open && selected && referenceRef.current && referenceRef.current.value !== selected.reference) {
    if (referenceRef.current) referenceRef.current.value = selected.reference;
    if (brandRef.current) brandRef.current.value = selected.brand ?? '';
    if (modelRef.current) modelRef.current.value = selected.model ?? '';
    if (notesRef.current) notesRef.current.value = selected.notes ?? '';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const reference = referenceRef.current?.value.trim() ?? '';
    if (!reference) {
      setError('La référence est obligatoire');
      return;
    }

    const payload = {
      reference,
      brand: brandRef.current?.value.trim() || null,
      model: modelRef.current?.value.trim() || null,
      status,
      notes: notesRef.current?.value.trim() || null,
    };

    try {
      if (selected) {
        await update.mutateAsync({ id: selected.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleStatusChange = async (newStatus: PdaStatus) => {
    setStatus(newStatus);
    if (selected && newStatus !== selected.status) {
      try {
        await setStatusMut.mutateAsync({ id: selected.id, status: newStatus });
      } catch {
        /* swallow, will revert on next data refresh */
      }
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={selected ? 'Modifier le PDA' : 'Nouveau PDA'}
      subtitle="Référence, statut et batterie. L'affectation chauffeur se fait sur le véhicule (enrollement)."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            ref={referenceRef}
            label="Référence"
            placeholder="PDA-001"
            defaultValue={selected?.reference ?? ''}
            required
          />
          <Select
            label="Statut"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as PdaStatus)}
            options={[
              { label: 'Disponible', value: 'available' },
              { label: 'En tournée', value: 'in_use' },
              { label: 'Maintenance', value: 'maintenance' },
              { label: 'Hors service', value: 'out_of_service' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            ref={brandRef}
            label="Marque"
            placeholder="Zebra, Honeywell…"
            defaultValue={selected?.brand ?? ''}
          />
          <Input
            ref={modelRef}
            label="Modèle"
            placeholder="TC52, EDA52…"
            defaultValue={selected?.model ?? ''}
          />
        </div>

        <div>
          <label className="block text-tiny font-medium text-ink-700 mb-1.5">
            Notes
          </label>
          <textarea
            ref={notesRef}
            defaultValue={selected?.notes ?? ''}
            placeholder="Notes internes…"
            rows={3}
            className="w-full px-3 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2 resize-none"
          />
        </div>

        {error && (
          <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="gap-1.5">
            <X className="w-3.5 h-3.5" strokeWidth={2} />
            Annuler
          </Button>
          <Button
            type="submit"
            loading={create.isPending || update.isPending}
            className="gap-1.5"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            {selected ? 'Mettre à jour' : 'Créer le PDA'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
