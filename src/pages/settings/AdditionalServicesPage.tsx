import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import servicesData from '@/mocks/data/additionalServices.json';
import type { AdditionalService } from '@/types';

export default function AdditionalServicesPage() {
  const { canEdit } = usePermissions();
  const [services] = useState<AdditionalService[]>(servicesData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Code', accessorKey: 'code' as keyof AdditionalService },
    { header: 'Nom', accessorKey: 'name' as keyof AdditionalService },
    { header: 'Description', accessorKey: 'description' as keyof AdditionalService },
    {
      header: 'Prix',
      accessorKey: 'unitPrice' as keyof AdditionalService,
      cell: (row: AdditionalService) => `${formatCurrency(row.unitPrice)} / ${row.unit}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Services additionnels</h2>
          <p className="text-gray-600 mt-1">{services.length} services disponibles</p>
        </div>
        {canEdit('settings') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un service
          </Button>
        )}
      </div>

      <DataTable data={services} columns={columns} />

      {/* Modal d'ajout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau service additionnel"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Code" placeholder="SRV-001" required />
            <Input label="Nom" placeholder="Repassage" required />
          </div>

          <Input label="Description" placeholder="Service de repassage à la vapeur" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix unitaire (XOF)" type="number" placeholder="500" required />
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

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
