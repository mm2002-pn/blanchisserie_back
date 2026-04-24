import { useMemo, useState } from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Button, Modal, Input, Select, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import servicesData from '@/mocks/data/additionalServices.json';
import type { AdditionalService } from '@/types';

export default function AdditionalServicesPage() {
  const { canEdit } = usePermissions();
  const [services] = useState<AdditionalService[]>(servicesData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) =>
      `${s.code} ${s.name} ${s.description}`.toLowerCase().includes(q),
    );
  }, [services, search]);

  const columns = [
    {
      header: 'Code',
      accessorKey: 'code' as keyof AdditionalService,
      cell: (row: AdditionalService) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Service',
      accessorKey: 'name' as keyof AdditionalService,
      cell: (row: AdditionalService) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-terra-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-terra-700" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">{row.name}</p>
            <p className="text-tiny text-ink-500 truncate">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Tarif',
      accessorKey: 'unitPrice' as keyof AdditionalService,
      align: 'right' as const,
      cell: (row: AdditionalService) => (
        <div>
          <p className="font-mono text-sm font-semibold text-ink-900 tnum">
            {formatCurrency(row.unitPrice)}
          </p>
          <p className="text-tiny text-ink-500">par {row.unit}</p>
        </div>
      ),
    },
    {
      header: 'Unité',
      accessorKey: 'unit' as keyof AdditionalService,
      cell: (row: AdditionalService) => (
        <Badge variant="neutral">{row.unit}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Services additionnels</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {services.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              services disponibles
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Prestations annexes (repassage, détachage, reprises) facturables en
            complément.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter un service
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="caps">Catalogue · {filtered.length}</div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un service, un code…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage={search ? `Aucun résultat pour « ${search} »` : 'Aucun service'}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau service additionnel"
        subtitle="Libellé, unité de facturation et prix"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Code" placeholder="SRV-001" required />
            <Input label="Nom" placeholder="Repassage" required />
          </div>
          <Input
            label="Description"
            placeholder="Service de repassage à la vapeur"
            hint="Apparaît sur les devis et factures"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix unitaire (F CFA)" type="number" placeholder="500" required />
            <Select
              label="Unité"
              options={[
                { label: 'Pièce', value: 'pièce' },
                { label: 'Heure', value: 'heure' },
                { label: 'Forfait', value: 'forfait' },
              ]}
              required
            />
          </div>
          <Input label="Temps estimé (min)" type="number" placeholder="30" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter le service</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
