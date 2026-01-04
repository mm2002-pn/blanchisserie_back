import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import programsData from '@/mocks/data/washingPrograms.json';
import type { WashingProgram } from '@/types';

export default function WashingProgramsPage() {
  const { canEdit } = usePermissions();
  const [programs] = useState<WashingProgram[]>(programsData as any);

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
          <h2 className="text-2xl font-heading font-bold text-gray-900">Programmes de lavage</h2>
          <p className="text-gray-600 mt-1">{programs.length} programmes configurés</p>
        </div>
        {canEdit('settings') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Créer un programme
          </Button>
        )}
      </div>

      <DataTable data={programs} columns={columns} />
    </div>
  );
}
