import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button, Modal, Input, Select, EmptyState, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import linenTypesData from '@/mocks/data/linenTypes.json';
import type { LinenType } from '@/types';

export default function LinenTypesPage() {
  const { canEdit } = usePermissions();
  const [linenTypes] = useState<LinenType[]>(linenTypesData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LinenType | null>(null);

  const columns = [
    {
      header: 'Code',
      accessorKey: 'code' as keyof LinenType,
    },
    {
      header: 'Nom',
      accessorKey: 'name' as keyof LinenType,
    },
    {
      header: 'Catégorie',
      accessorKey: 'category' as keyof LinenType,
      cell: (row: LinenType) => (
        <Badge
          variant={
            row.category === 'Linge Plat'
              ? 'info'
              : row.category === 'Linge Forme'
              ? 'success'
              : 'warning'
          }
        >
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Mode facturation',
      accessorKey: 'billingMode' as keyof LinenType,
    },
    {
      header: 'Prix unitaire',
      accessorKey: 'unitPrice' as keyof LinenType,
      cell: (row: LinenType) => formatCurrency(row.unitPrice),
    },
    {
      header: 'Actions',
      accessorKey: 'id' as keyof LinenType,
      cell: (row: LinenType) =>
        canEdit('settings') && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedType(row);
                setIsModalOpen(true);
              }}
              className="text-gray-600 hover:text-accent-600"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button className="text-gray-600 hover:text-error">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Types de linge</h2>
          <p className="text-gray-600 mt-1">{linenTypes.length} types configurés</p>
        </div>
        {canEdit('settings') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un type
          </Button>
        )}
      </div>

      {/* Table */}
      {linenTypes.length > 0 ? (
        <DataTable data={linenTypes} columns={columns} />
      ) : (
        <EmptyState
          icon={Plus}
          title="Aucun type de linge"
          message="Commencez par ajouter des types de linge pour configurer votre système"
          actionLabel="Ajouter un type"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedType(null);
        }}
        title={selectedType ? 'Modifier le type de linge' : 'Nouveau type de linge'}
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
            label="Mode facturation"
            options={[
              { label: 'Au poids', value: 'Poids' },
              { label: 'À la pièce', value: 'Pièce' },
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix unitaire (XOF)" type="number" placeholder="500" required />
            <Input label="Temps de traitement (min)" type="number" placeholder="45" />
          </div>

          <Input label="Instructions spéciales" placeholder="Optionnel" />

          <div className="flex justify-end gap-3 pt-4">
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
              {selectedType ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
