import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Shirt } from 'lucide-react';
import { Button, Modal, Input, Select, EmptyState, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import linenTypesData from '@/mocks/data/linenTypes.json';
import type { LinenType } from '@/types';

const CATEGORY_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  'Linge Plat': 'info',
  LP: 'info',
  'Linge Forme': 'success',
  LF: 'success',
  NAE: 'warning',
  'Nettoyage à sec': 'warning',
};

export default function LinenTypesPage() {
  const { canEdit } = usePermissions();
  const [linenTypes] = useState<LinenType[]>(linenTypesData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LinenType | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return linenTypes;
    return linenTypes.filter((t) =>
      `${t.code} ${t.name} ${t.category}`.toLowerCase().includes(q),
    );
  }, [linenTypes, search]);

  const byCategory = useMemo(() => {
    return linenTypes.reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [linenTypes]);

  const columns = [
    {
      header: 'Code',
      accessorKey: 'code' as keyof LinenType,
      cell: (row: LinenType) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Nom',
      accessorKey: 'name' as keyof LinenType,
      cell: (row: LinenType) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <Shirt className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-ink-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Catégorie',
      accessorKey: 'category' as keyof LinenType,
      cell: (row: LinenType) => (
        <Badge variant={CATEGORY_VARIANT[row.category] ?? 'neutral'} dot>
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Facturation',
      accessorKey: 'billingMode' as keyof LinenType,
      cell: (row: LinenType) => (
        <span className="text-sm text-ink-700">
          {row.billingMode === 'Poids' ? 'au kg' : 'à la pièce'}
        </span>
      ),
    },
    {
      header: 'Prix',
      accessorKey: 'unitPrice' as keyof LinenType,
      align: 'right' as const,
      cell: (row: LinenType) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'id' as keyof LinenType,
      align: 'right' as const,
      cell: (row: LinenType) =>
        canEdit('settings') && (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => {
                setSelectedType(row);
                setIsModalOpen(true);
              }}
              className="p-1.5 rounded-input hover:bg-paper-2 text-ink-500 hover:text-brand-800 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              className="p-1.5 rounded-input hover:bg-danger-100 text-ink-500 hover:text-danger-600 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Types de linge</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {linenTypes.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              types configurés
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Référentiel tarifaire par catégorie et mode de facturation.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter un type
          </Button>
        )}
      </div>

      {/* Category strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(byCategory).map(([cat, count]) => (
          <div key={cat} className="card-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-tiny font-medium text-ink-500">{cat}</p>
                <p className="font-serif text-2xl font-medium tnum tracking-tight text-ink-900 mt-1.5 leading-none">
                  {count}
                </p>
              </div>
              <Badge variant={CATEGORY_VARIANT[cat] ?? 'neutral'} dot>
                {cat}
              </Badge>
            </div>
          </div>
        ))}
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
            placeholder="Rechercher un type, un code…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {/* Table */}
      {linenTypes.length > 0 ? (
        <DataTable
          data={filtered}
          columns={columns}
          emptyMessage={
            search ? `Aucun résultat pour « ${search} »` : 'Aucun type de linge'
          }
        />
      ) : (
        <EmptyState
          icon={Plus}
          title="Aucun type de linge"
          message="Commence par ajouter des types de linge pour configurer ton système."
          actionLabel="Ajouter un type"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedType(null);
        }}
        title={selectedType ? 'Modifier le type de linge' : 'Nouveau type de linge'}
        subtitle="Code, catégorie, mode de facturation et prix unitaire"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Code" placeholder="LP-001" required />
            <Select
              label="Catégorie"
              options={[
                { label: 'Linge Plat', value: 'Linge Plat' },
                { label: 'Linge Forme', value: 'Linge Forme' },
                { label: 'NAE', value: 'NAE' },
              ]}
              required
            />
          </div>

          <Input label="Nom" placeholder="Drap 2 personnes" required />

          <Select
            label="Mode de facturation"
            options={[
              { label: 'Au poids (kg)', value: 'Poids' },
              { label: 'À la pièce', value: 'Pièce' },
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix unitaire (F CFA)" type="number" placeholder="500" required />
            <Input label="Temps de traitement (min)" type="number" placeholder="45" />
          </div>

          <Input
            label="Instructions spéciales"
            placeholder="Optionnel"
            hint="Visibles sur le bordereau de triage"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedType(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit">
              {selectedType ? 'Mettre à jour' : 'Créer le type'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
