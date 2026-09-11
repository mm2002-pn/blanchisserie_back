import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTriage, type TriageInput } from '@/lib/api/triage.api';
import { ordersKeys } from './useOrders';

export function useCreateTriage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { orderId: string; data: TriageInput }) =>
      createTriage(vars.orderId, vars.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}
