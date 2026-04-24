import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import programsData from '@/mocks/data/washingPrograms.json';
import type { WashingProgram } from '@/types';

export default function WashingProgramsPage() {
  const { canEdit } = usePermissions();
  const [programs] = useState<WashingProgram[]>(programsData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Code', accessorKey: 'code' as keyof WashingProgram },
    { header: 'Nom', accessorKey: 'name' as keyof WashingProgram },
    {
      header: 'Température',
      accessorKey: 'temperature' as keyof WashingProgram,
      cell: (row: WashingProgram) => `${row.temperature}°C`,
    },
    {
      header: 'Durée',
      accessorKey: 'duration' as keyof WashingProgram,
      cell: (row: WashingProgram) => `${row.duration} min`,
    },
    {
      header: 'Essorage',
      accessorKey: 'spinLevel' as keyof WashingProgram,
      cell: (row: WashingProgram) => `${row.spinLevel} tr/min`,
    },
    { header: 'Lessive', accessorKey: 'detergentType' as keyof WashingProgram },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-ink-900">Programmes de lavage</h2>
          <p className="text-ink-500 mt-1">{programs.length} programmes configurés</p>
        </div>
        {canEdit('settings') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un programme
          </Button>
        )}
      </div>

      <DataTable data={programs} columns={columns} />

      {/* Modal d'ajout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau programme de lavage"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Code" placeholder="PROG-001" required />
            <Input label="Nom" placeholder="Coton blanc 60°C" required />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Température (°C)" type="number" placeholder="60" required />
            <Input label="Durée (min)" type="number" placeholder="90" required />
            <Input label="Vitesse essorage (rpm)" type="number" placeholder="1200" required />
          </div>

          <Input label="Consommation d'eau (L)" type="number" placeholder="150" required />

          <Select
            label="Type de détergent"
            options={[
              { label: 'Standard', value: 'standard' },
              { label: 'Hypoallergénique', value: 'hypoallergénique' },
              { label: 'Écologique', value: 'écologique' },
            ]}
            required
          />

          <Input label="Description" placeholder="Programme pour linge blanc en coton..." />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
