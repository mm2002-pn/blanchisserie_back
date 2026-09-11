import { api } from './client';
import type { UserRole } from '@/types';

/** Rôle tel que renvoyé par l'API. */
export type ApiRole =
  | 'admin'
  | 'manager'
  | 'supervisor'
  | 'operator'
  | 'driver'
  | 'hotel';

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ApiRole;
  clientId?: string | null;
}

export interface LoginResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

const ROLE_MAP: Record<ApiRole, UserRole> = {
  admin: 'Administrateur',
  manager: 'Responsable production',
  supervisor: 'Responsable production',
  operator: 'Opérateur production',
  driver: 'Chauffeur',
  hotel: 'Commercial', // les hôtels ne se connectent pas au web admin (refusé en amont)
};

export function mapApiUser(u: ApiUser) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: ROLE_MAP[u.role] ?? 'Commercial',
    isActive: true,
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function me(): Promise<ApiUser> {
  const { data } = await api.get<ApiUser>('/auth/me');
  return data;
}

export async function logoutApi(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;
  try {
    await api.post('/auth/logout', { refreshToken });
  } catch {
    // best-effort — on flush local quoi qu'il arrive
  }
}
