import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatRelativeDate } from '@/lib/utils';
import usersData from '@/mocks/data/users.json';
import type { User } from '@/types';

export default function UsersAndRolesPage() {
  const { canEdit } = usePermissions();
  const [users] = useState<User[]>(usersData as any);

  const columns = [
    {
      header: 'Nom complet',
      accessorKey: 'firstName' as keyof User,
      cell: (row: User) => `${row.firstName} ${row.lastName}`,
    },
    { header: 'Email', accessorKey: 'email' as keyof User },
    { header: 'Téléphone', accessorKey: 'phone' as keyof User },
    { header: 'Rôle', accessorKey: 'role' as keyof User },
    {
      header: 'Statut',
      accessorKey: 'isActive' as keyof User,
      cell: (row: User) => (
        <Badge variant={row.isActive ? 'success' : 'error'}>
          {row.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      header: 'Dernière connexion',
      accessorKey: 'lastLogin' as keyof User,
      cell: (row: User) => (row.lastLogin ? formatRelativeDate(row.lastLogin) : 'Jamais'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Utilisateurs et rôles</h2>
          <p className="text-gray-600 mt-1">{users.length} utilisateurs</p>
        </div>
        {canEdit('settings') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        )}
      </div>

      <DataTable data={users} columns={columns} />
    </div>
  );
}
