import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  Shield,
  UserMinus,
  User as UserIcon,
} from 'lucide-react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  useCreateUser,
  useDeactivateUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
} from '@/hooks/queries/useUsers';
import type { ApiRole } from '@/lib/api/users.api';
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

const ROLE_OPTIONS: { label: string; value: ApiRole }[] = [
  { label: 'Administrateur', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Superviseur', value: 'supervisor' },
  { label: 'Opérateur', value: 'operator' },
  { label: 'Chauffeur', value: 'driver' },
  { label: 'Hôtel (client)', value: 'hotel' },
];

/** Devine le code rôle API depuis le libellé FR utilisé dans le tableau. */
function guessApiRole(frRole: string): ApiRole {
  if (frRole.toLowerCase().includes('admin')) return 'admin';
  if (frRole.toLowerCase().includes('responsable')) return 'manager';
  if (frRole.toLowerCase().includes('opérateur')) return 'operator';
  if (frRole.toLowerCase().includes('chauffeur')) return 'driver';
  if (frRole.toLowerCase().includes('commercial')) return 'hotel';
  return 'operator';
}

const EMPTY_CREATE = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'operator' as ApiRole,
  password: '',
};

export default function UsersAndRolesPage() {
  const { canEdit } = usePermissions();
  const { data, isLoading, error } = useUsers();
  const users: User[] = (data ?? []) as unknown as User[];
  const [search, setSearch] = useState('');

  // CRUD mutations
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const deactivateMut = useDeactivateUser();
  const resetMut = useResetUserPassword();

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    role: ApiRole;
    isActive: boolean;
  } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(q),
    );
  }, [users, search]);

  const activeCount = users.filter((u) => u.isActive).length;
  const rolesCount = new Set(users.map((u) => u.role)).size;

  /* ── handlers ─────────────────────────────────────────────────────── */

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE);
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createMut.mutateAsync({
        email: createForm.email.trim(),
        password: createForm.password,
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        phone: createForm.phone.trim() || undefined,
        role: createForm.role,
      });
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Échec de la création.');
    }
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditForm({
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone ?? '',
      role: guessApiRole(u.role),
      isActive: u.isActive,
    });
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editForm) return;
    setEditError(null);
    try {
      await updateMut.mutateAsync({
        id: editTarget.id,
        input: {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          phone: editForm.phone.trim() || undefined,
          role: editForm.role,
          isActive: editForm.isActive,
        },
      });
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Échec de la mise à jour.');
    }
  };

  const handleDeactivate = async (u: User) => {
    if (!confirm(`Désactiver ${u.firstName} ${u.lastName} ? Il ne pourra plus se connecter.`)) return;
    try {
      await deactivateMut.mutateAsync(u.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la désactivation.');
    }
  };

  const openReset = (u: User) => {
    setResetTarget(u);
    setResetPwd('');
    setResetError(null);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);
    try {
      await resetMut.mutateAsync({ id: resetTarget.id, newPassword: resetPwd });
      setResetTarget(null);
      toast.success('Mot de passe réinitialisé. Communique-le à l\'utilisateur.');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Échec de la réinitialisation.');
    }
  };

  /* ── columns ──────────────────────────────────────────────────────── */

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
        <span className="font-mono text-tiny text-ink-700 tnum">{row.phone ?? '—'}</span>
      ),
    },
    {
      header: 'Rôle',
      accessorKey: 'role' as keyof User,
      cell: (row: User) => (
        <Badge variant={(ROLE_TINT[row.role] ?? 'neutral') as 'brand' | 'terra' | 'warning' | 'success' | 'neutral' | 'info'}>
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
    {
      header: 'Actions',
      accessorKey: 'id' as keyof User,
      cell: (row: User) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="Modifier"
            onClick={() => openEdit(row)}
            className="px-2"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Réinitialiser le mot de passe"
            onClick={() => openReset(row)}
            className="px-2"
          >
            <KeyRound className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Button>
          {row.isActive && (
            <Button
              variant="ghost"
              size="sm"
              title="Désactiver"
              onClick={() => handleDeactivate(row)}
              className="px-2 !text-danger-600 hover:!bg-danger-50"
            >
              <UserMinus className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Button>
          )}
        </div>
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
          <Button size="sm" className="gap-1.5 shrink-0" onClick={openCreate}>
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

      {error ? (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Impossible de charger les utilisateurs : {(error as Error).message}
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          emptyMessage={
            isLoading
              ? 'Chargement…'
              : search
                ? `Aucun résultat pour « ${search} »`
                : 'Aucun utilisateur dans cette catégorie'
          }
        />
      )}

      {/* Modal CREATE */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvel utilisateur"
        subtitle="Les permissions seront appliquées en fonction du rôle choisi"
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              placeholder="Jean"
              value={createForm.firstName}
              onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Nom"
              placeholder="Dupont"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="jean.dupont@example.com"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            required
          />
          <Input
            label="Téléphone"
            placeholder="+221 77 123 45 67"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
          />
          <Select
            label="Rôle"
            options={ROLE_OPTIONS}
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as ApiRole })}
            required
          />
          <Input
            label="Mot de passe initial"
            type="password"
            placeholder="••••••••"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            required
            hint="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre. L'utilisateur pourra le modifier."
          />
          {createError && (
            <p className="text-sm text-danger-600 bg-danger-100 border-hairline border-danger-600 px-3 py-2 rounded-input">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createMut.isPending}>
              Ajouter l'utilisateur
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal EDIT */}
      <Modal
        isOpen={Boolean(editTarget && editForm)}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Modifier ${editTarget.firstName} ${editTarget.lastName}` : ''}
        subtitle="L'email ne peut pas être modifié"
        size="lg"
      >
        {editForm && editTarget && (
          <form className="space-y-4" onSubmit={handleEdit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                required
              />
              <Input
                label="Nom"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                required
              />
            </div>
            <Input
              label="Téléphone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <Select
              label="Rôle"
              options={ROLE_OPTIONS}
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as ApiRole })}
            />
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                className="w-4 h-4 accent-brand-800"
              />
              Compte actif (peut se connecter)
            </label>
            {editError && (
              <p className="text-sm text-danger-600 bg-danger-100 border-hairline border-danger-600 px-3 py-2 rounded-input">
                {editError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setEditTarget(null)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={updateMut.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal RESET PASSWORD */}
      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={resetTarget ? `Réinitialiser le mot de passe` : ''}
        subtitle={resetTarget ? `${resetTarget.firstName} ${resetTarget.lastName} · ${resetTarget.email}` : ''}
      >
        <form className="space-y-4" onSubmit={handleReset}>
          <Input
            label="Nouveau mot de passe"
            type="password"
            placeholder="••••••••"
            value={resetPwd}
            onChange={(e) => setResetPwd(e.target.value)}
            required
            hint="Min. 8 caractères. Communique-le ensuite à l'utilisateur."
          />
          {resetError && (
            <p className="text-sm text-danger-600 bg-danger-100 border-hairline border-danger-600 px-3 py-2 rounded-input">
              {resetError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setResetTarget(null)}>
              Annuler
            </Button>
            <Button type="submit" variant="danger" isLoading={resetMut.isPending}>
              Réinitialiser
            </Button>
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
