import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import servicesData from '@/mocks/data/additionalServices.json';
import type { AdditionalService } from '@/types';

export default function AdditionalServicesPage() {
  const { canEdit } = usePermissions();
  const [services] = useState<AdditionalService[]>(servicesData as any);

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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un service
          </Button>
        )}
      </div>

      <DataTable data={services} columns={columns} />
    </div>
  );
}
