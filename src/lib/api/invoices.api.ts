import { api } from './client';

export interface ApiInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  weight: number | null;
  unitPriceFcfa: string;
  totalFcfa: string;
  order?: { orderNumber: string } | null;
}

export interface ApiInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: { id: string; name: string; type: string };
  tariffId: string | null;
  periodStart: string;
  periodEnd: string;
  invoiceDate: string;
  dueDate: string;
  paidDate: string | null;
  subtotalFcfa: string;
  taxRate: string;
  taxAmountFcfa: string;
  totalFcfa: string;
  paidAmountFcfa: string | null;
  paymentMethod: string | null;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  pdfUrl: string | null;
  notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  lines?: ApiInvoiceLine[];
}

const STATUS_FR: Record<ApiInvoice['status'], 'Payée' | 'En attente' | 'En retard' | 'Brouillon'> = {
  paid: 'Payée',
  pending: 'En attente',
  overdue: 'En retard',
  draft: 'Brouillon',
  cancelled: 'Brouillon',
};

/** Format compatible avec la shape attendue par InvoicesPage (cf. invoices.json). */
export function mapApiInvoice(i: ApiInvoice) {
  const totalAmount = Number(i.totalFcfa);
  const paidAmount = i.paidAmountFcfa ? Number(i.paidAmountFcfa) : 0;
  const subtotal = Number(i.subtotalFcfa);
  const taxAmount = Number(i.taxAmountFcfa);
  return {
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    orderId: '',
    orderReference: '',
    clientId: i.clientId,
    clientName: i.client?.name ?? '—',
    invoiceDate: i.invoiceDate,
    dueDate: i.dueDate,
    status: STATUS_FR[i.status],
    subtotal,
    taxRate: Number(i.taxRate),
    taxAmount,
    totalAmount,
    paidAmount,
    paidDate: i.paidDate,
    paymentMethod: i.paymentMethod ?? '',
    pdfUrl: i.pdfUrl,
    version: i.version,
    items: (i.lines ?? []).map((l) => ({
      description: l.description,
      quantity: l.quantity,
      weight: l.weight ?? 0,
      unitPrice: Number(l.unitPriceFcfa),
      total: Number(l.totalFcfa),
      orderNumber: l.order?.orderNumber,
    })),
  };
}

export type MappedInvoice = ReturnType<typeof mapApiInvoice>;

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listInvoices(params: { status?: string; clientId?: string; pageSize?: number } = {}) {
  const { data } = await api.get<PageResult<ApiInvoice>>('/invoices', {
    params: { pageSize: 100, ...params },
  });
  return data.items.map(mapApiInvoice);
}
