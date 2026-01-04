import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table';
import { Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatWeight } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import mock data
import batchesData from '@/mocks/data/batches.json';
import machinesData from '@/mocks/data/machines.json';

export default function ProductionPage() {
  const [batches] = useState(batchesData);
  const [machines] = useState(machinesData);

  // Status badge variant mapping
  const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'gray'> = {
    'Terminé': 'success',
    'En cours': 'warning',
    'En attente': 'gray',
    'Planifié': 'gray',
  };

  // Machine status
  const getMachineStatus = (machineId: string) => {
    const batch = batches.find(b => b.machineId === machineId && b.status === 'En cours');
    return batch ? 'En cours' : 'Disponible';
  };

  // Columns for batches table
  const batchColumns = [
    {
      header: 'N° Lot',
      accessorKey: 'batchNumber',
      cell: (row: typeof batches[0]) => (
        <span className="font-medium text-gray-900">{row.batchNumber}</span>
      ),
    },
    {
      header: 'Client',
      accessorKey: 'clientName',
      cell: (row: typeof batches[0]) => (
        <div>
          <p className="font-medium text-gray-900">{row.clientName}</p>
          <p className="text-sm text-gray-500">{row.orderReference}</p>
        </div>
      ),
    },
    {
      header: 'Machine',
      accessorKey: 'machineReference',
      cell: (row: typeof batches[0]) => (
        <span className="text-sm text-gray-600">{row.machineReference}</span>
      ),
    },
    {
      header: 'Programme',
      accessorKey: 'programName',
      cell: (row: typeof batches[0]) => (
        <span className="text-sm text-gray-600">{row.programName}</span>
      ),
    },
    {
      header: 'Poids',
      accessorKey: 'weight',
      cell: (row: typeof batches[0]) => (
        <span className="text-sm text-gray-600">{formatWeight(row.weight)}</span>
      ),
    },
    {
      header: 'Opérateur',
      accessorKey: 'operator',
      cell: (row: typeof batches[0]) => (
        <span className="text-sm text-gray-600">{row.operator || '-'}</span>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'status',
      cell: (row: typeof batches[0]) => (
        <div className="space-y-1">
          <Badge variant={statusVariants[row.status] || 'gray'}>
            {row.status}
          </Badge>
          {row.status === 'En cours' && row.progress && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-accent-600 h-1.5 rounded-full transition-all"
                style={{ width: `${row.progress}%` }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Heure',
      accessorKey: 'startTime',
      cell: (row: typeof batches[0]) => (
        <div className="text-sm text-gray-600">
          {row.startTime ? (
            <>
              <p>{format(new Date(row.startTime), 'HH:mm', { locale: fr })}</p>
              {row.estimatedEndTime && row.status === 'En cours' && (
                <p className="text-xs text-gray-500">
                  Fin: {format(new Date(row.estimatedEndTime), 'HH:mm', { locale: fr })}
                </p>
              )}
            </>
          ) : (
            '-'
          )}
        </div>
      ),
    },
  ];

  // Active machines count
  const activeMachines = batches.filter(b => b.status === 'En cours').length;
  const completedToday = batches.filter(b => b.status === 'Terminé').length;
  const pendingBatches = batches.filter(b => b.status === 'En attente' || b.status === 'Planifié').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Production</h1>
        <p className="text-gray-600 mt-1">Suivi des lots et machines</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Machines actives</p>
              <p className="text-2xl font-bold text-gray-900">{activeMachines}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <Play className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Lots terminés</p>
              <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{pendingBatches}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total lots</p>
              <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Machine Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>État des machines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {machines.slice(0, 8).map((machine) => {
              const status = getMachineStatus(machine.id);
              const isActive = status === 'En cours';
              return (
                <div
                  key={machine.id}
                  className={`p-4 rounded-lg border-2 ${
                    isActive
                      ? 'border-warning-300 bg-warning-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{machine.reference}</p>
                      <p className="text-xs text-gray-600">{machine.brand} {machine.model}</p>
                    </div>
                    <Badge
                      variant={isActive ? 'warning' : 'success'}
                      className="text-xs"
                    >
                      {status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{machine.capacity} kg</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lots de production</CardTitle>
            <Button size="sm">
              + Nouveau lot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={batches}
            columns={batchColumns as any}
          />
        </CardContent>
      </Card>
    </div>
  );
}
