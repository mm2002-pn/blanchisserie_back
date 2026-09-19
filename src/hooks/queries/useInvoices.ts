import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateInvoicePdf, listInvoices } from '@/lib/api/invoices.api';
import { useRealtime } from '../useRealtime';

export const invoicesKeys = {
  all: ['invoices'] as const,
  list: (params: object = {}) => [...invoicesKeys.all, 'list', params] as const,
};

export function useInvoices(params: { status?: string; clientId?: string } = {}) {
  return useQuery({
    queryKey: invoicesKeys.list(params),
    queryFn: () => listInvoices(params),
  });
}

export function useGenerateInvoicePdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; force?: boolean }) => generateInvoicePdf(vars.id, vars.force),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: invoicesKeys.all });
    },
  });
}

/** Invalidation auto sur events invoice:* (généré, payé, annulé). */
export function useInvoicesRealtime() {
  const { socket } = useRealtime();
  const qc = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    const events = ['invoice:generated', 'invoice:paid', 'invoice:cancelled'];
    const handler = () => {
      void qc.invalidateQueries({ queryKey: invoicesKeys.all });
    };
    events.forEach((e) => socket.on(e, handler));
    return () => events.forEach((e) => socket.off(e, handler));
  }, [socket, qc]);
}
