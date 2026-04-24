import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatRelativeDate } from '@/lib/utils';
import usersData from '@/mocks/data/users.json';
import type { User } from '@/types';

export default function UsersAndRolesPage() {
  const { canEdit } = usePermissions();
  const [users] = useState<User[]>(usersData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <h2 className="text-2xl font-serif font-bold text-ink-900">Utilisateurs et rôles</h2>
          <p className="text-ink-500 mt-1">{users.length} utilisateurs</p>
        </div>
        {canEdit('settings') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        )}
      </div>

      <DataTable data={users} columns={columns} />

      {/* Modal d'ajout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvel utilisateur"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" placeholder="Jean" required />
            <Input label="Nom" placeholder="Dupont" required />
          </div>

          <Input label="Email" type="email" placeholder="jean.dupont@example.com" required />

          <Input label="Téléphone" placeholder="+221 77 123 45 67" required />

          <Select
            label="Rôle"
            options={[
              { label: 'Administrateur', value: 'admin' },
              { label: 'Manager', value: 'manager' },
              { label: 'Opérateur', value: 'operator' },
              { label: 'Chauffeur', value: 'driver' },
              { label: 'Superviseur', value: 'supervisor' },
            ]}
            required
          />

          <Input label="Mot de passe" type="password" placeholder="••••••••" required />

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
