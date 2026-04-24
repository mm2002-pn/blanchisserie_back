import { useMemo, useState } from 'react';
import { Plus, Search, Shield, User as UserIcon } from 'lucide-react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import usersData from '@/mocks/data/users.json';
import type { User } from '@/types';

const ROLE_TINT: Record<string, 'brand' | 'terra' | 'warning' | 'success' | 'neutral' | 'info'> = {
  admin: 'brand',
  manager: 'info',
  operator: 'info',
  supervisor: 'warning',
  driver: 'success',
  Admin: 'brand',
  Manager: 'info',
  Opérateur: 'info',
  Superviseur: 'warning',
  Chauffeur: 'success',
};

export default function UsersAndRolesPage() {
  const { canEdit } = usePermissions();
  const [users] = useState<User[]>(usersData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(q),
    );
  }, [users, search]);

  const activeCount = users.filter((u) => u.isActive).length;
  const rolesCount = new Set(users.map((u) => u.role)).size;

  const columns = [
    {
      header: 'Utilisateur',
      accessorKey: 'firstName' as keyof User,
      cell: (row: User) => {
        const initials = `${row.firstName?.[0] ?? ''}${row.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-input bg-terra-600 flex items-center justify-center shrink-0">
              <span className="text-paper font-sans font-semibold text-tiny">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">
                {row.firstName} {row.lastName}
              </p>
              <p className="text-tiny text-ink-500">{row.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Téléphone',
      accessorKey: 'phone' as keyof User,
      cell: (row: User) => (
        <span className="font-mono text-tiny text-ink-700 tnum">{row.phone}</span>
      ),
    },
    {
      header: 'Rôle',
      accessorKey: 'role' as keyof User,
      cell: (row: User) => (
        <Badge variant={(ROLE_TINT[row.role] ?? 'neutral') as any}>
          {row.role}
        </Badge>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'isActive' as keyof User,
      cell: (row: User) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'} dot>
          {row.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      header: 'Dernière connexion',
      accessorKey: 'lastLogin' as keyof User,
      cell: (row: User) => (
        <span className="font-mono text-tiny text-ink-500 tnum">
          {row.lastLogin ? formatRelativeDate(row.lastLogin) : 'Jamais'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Utilisateurs & rôles</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {users.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              comptes configurés
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Qui a accès à quoi. Les permissions sont définies par rôle.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouvel utilisateur
          </Button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MiniTile icon={UserIcon} label="Utilisateurs actifs" value={`${activeCount}`} sub={`${users.length - activeCount} désactivés`} tint="ok" />
        <MiniTile icon={Shield} label="Rôles configurés" value={`${rolesCount}`} sub="admin, manager, opérateur…" tint="brand" />
        <MiniTile icon={UserIcon} label="Total comptes" value={`${users.length}`} sub="permissions héritées du rôle" tint="terra" />
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
            placeholder="Rechercher un utilisateur, un email, un rôle…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage={
          search ? `Aucun résultat pour « ${search} »` : 'Aucun utilisateur dans cette catégorie'
        }
      />

      {/* Modal d'ajout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvel utilisateur"
        subtitle="Les permissions seront appliquées en fonction du rôle choisi"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" placeholder="Jean" required />
            <Input label="Nom" placeholder="Dupont" required />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="jean.dupont@example.com"
            required
          />
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
          <Input
            label="Mot de passe initial"
            type="password"
            placeholder="••••••••"
            required
            hint="L'utilisateur devra le modifier à la première connexion."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter l'utilisateur</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MiniTile({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
  sub: string;
  tint: 'ok' | 'brand' | 'terra' | 'warn';
}) {
  const bg =
    tint === 'ok'
      ? 'bg-ok-100'
      : tint === 'warn'
        ? 'bg-warn-100'
        : tint === 'terra'
          ? 'bg-terra-100'
          : 'bg-brand-100';
  const fg =
    tint === 'ok'
      ? 'text-ok-700'
      : tint === 'warn'
        ? 'text-warn-700'
        : tint === 'terra'
          ? 'text-terra-700'
          : 'text-brand-800';

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p className="font-serif text-2xl font-medium tnum tracking-tight text-ink-900 mt-1.5 leading-none">
            {value}
          </p>
          <p className="text-tiny text-ink-500 mt-1.5">{sub}</p>
        </div>
        <div className={cn('w-9 h-9 rounded-input flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
