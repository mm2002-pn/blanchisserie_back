import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@/lib/api/audit.api';

export const auditKeys = {
  all: ['audit'] as const,
  list: (params: object = {}) => [...auditKeys.all, 'list', params] as const,
};

export function useAuditLogs(params: { action?: string; entity?: string } = {}) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => listAuditLogs(params),
  });
}
