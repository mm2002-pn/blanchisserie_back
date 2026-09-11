import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  deactivateUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/api/users.api';

export const usersKeys = {
  all: ['users'] as const,
  list: (search?: string) => [...usersKeys.all, 'list', search ?? null] as const,
};

export function useUsers(search?: string) {
  return useQuery({
    queryKey: usersKeys.list(search),
    queryFn: () => listUsers(search ? { search } : {}),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: UpdateUserInput }) =>
      updateUser(vars.id, vars.input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (vars: { id: string; newPassword: string }) =>
      resetUserPassword(vars.id, vars.newPassword),
  });
}
