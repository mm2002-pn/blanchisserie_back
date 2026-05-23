import { api } from './client';
import type { UserRole } from '@/types';

export interface ApiUserRow {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'supervisor' | 'operator' | 'driver' | 'hotel';
  isActive: boolean;
  lastLoginAt: string | null;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
}

const ROLE_FR: Record<ApiUserRow['role'], UserRole> = {
  admin: 'Administrateur',
  manager: 'Responsable production',
  supervisor: 'Responsable production',
  operator: 'Opérateur production',
  driver: 'Chauffeur',
  hotel: 'Commercial',
};

export interface MappedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
}

export function mapApiUser(u: ApiUserRow): MappedUser {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone ?? undefined,
    role: ROLE_FR[u.role],
    isActive: u.isActive,
    lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
  };
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listUsers(params: { search?: string; role?: string; pageSize?: number } = {}) {
  const { data } = await api.get<PageResult<ApiUserRow>>('/users', {
    params: { pageSize: 200, ...params },
  });
  return data.items.map(mapApiUser);
}

export type ApiRole = ApiUserRow['role'];

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: ApiRole;
  clientId?: string;
}

export async function createUser(input: CreateUserInput): Promise<MappedUser> {
  const { data } = await api.post<ApiUserRow>('/users', input);
  return mapApiUser(data);
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: ApiRole;
  isActive?: boolean;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<MappedUser> {
  const { data } = await api.patch<ApiUserRow>(`/users/${id}`, input);
  return mapApiUser(data);
}

export async function deactivateUser(id: string): Promise<MappedUser> {
  const { data } = await api.delete<ApiUserRow>(`/users/${id}`);
  return mapApiUser(data);
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await api.post(`/users/${id}/reset-password`, { newPassword });
}
