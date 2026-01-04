import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table';
import { FileText, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import mock data
import invoicesData from '@/mocks/data/invoices.json';

export default function InvoicesPage() {
  const [invoices] = useState(invoicesData);

  // Status badge variant mapping
  const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'gray'> = {
    'Payée': 'success',
    'En attente': 'warning',
    'En retard': 'error',
    'Brouillon': 'gray',
  };

  // Columns for invoices table
  const invoiceColumns = [
    {
      header: 'N° Facture',
      accessorKey: 'invoiceNumber',
      cell: (row: typeof invoices[0]) => (
        <div>
          <p className="font-medium text-gray-900">{row.invoiceNumber}</p>
          <p className="text-sm text-gray-500">{row.orderReference}</p>
        </div>
      ),
    },
    {
      header: 'Client',
      accessorKey: 'clientName',
      cell: (row: typeof invoices[0]) => (
        <span className="text-sm text-gray-900">{row.clientName}</span>
      ),
    },
    {
      header: 'Date facture',
      accessorKey: 'invoiceDate',
      cell: (row: typeof invoices[0]) => (
        <span className="text-sm text-gray-600">
          {format(new Date(row.invoiceDate), 'dd/MM/yyyy', { locale: fr })}
        </span>
      ),
    },
    {
      header: 'Date échéance',
      accessorKey: 'dueDate',
      cell: (row: typeof invoices[0]) => {
        const dueDate = new Date(row.dueDate);
        const isOverdue = row.status === 'En retard';
        return (
          <span className={`text-sm ${isOverdue ? 'text-danger font-medium' : 'text-gray-600'}`}>
            {format(dueDate, 'dd/MM/yyyy', { locale: fr })}
          </span>
        );
      },
    },
    {
      header: 'Montant HT',
      accessorKey: 'subtotal',
      cell: (row: typeof invoices[0]) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(row.subtotal)}
        </span>
      ),
    },
    {
      header: 'TVA',
      accessorKey: 'taxAmount',
      cell: (row: typeof invoices[0]) => (
        <span className="text-sm text-gray-600">
          {formatCurrency(row.taxAmount)}
        </span>
      ),
    },
    {
      header: 'Montant TTC',
      accessorKey: 'totalAmount',
      cell: (row: typeof invoices[0]) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'status',
      cell: (row: typeof invoices[0]) => (
        <div>
          <Badge variant={statusVariants[row.status] || 'gray'}>
            {row.status}
          </Badge>
          {row.paidDate && (
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(row.paidDate), 'dd/MM/yyyy', { locale: fr })}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (_row: typeof invoices[0]) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Voir
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'Payée').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'En attente').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'En retard').length;

  const totalRevenue = invoices
    .filter(inv => inv.status === 'Payée')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'En attente' || inv.status === 'En retard')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Factures</h1>
        <p className="text-gray-600 mt-1">Gestion de la facturation</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total factures</p>
              <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <FileText className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Payées</p>
              <p className="text-2xl font-bold text-success">{paidInvoices}</p>
              <p className="text-sm text-gray-600 mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En attente</p>
              <p className="text-2xl font-bold text-warning">{pendingInvoices}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En retard</p>
              <p className="text-2xl font-bold text-danger">{overdueInvoices}</p>
              <p className="text-sm text-gray-600 mt-1">{formatCurrency(pendingAmount)}</p>
            </div>
            <div className="p-3 bg-danger-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-danger" />
            </div>
          </div>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueInvoices > 0 && (
        <Card className="border-danger-200 bg-danger-50">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-danger-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-danger-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-danger-900 mb-1">
                  Factures en retard
                </h3>
                <p className="text-sm text-danger-700">
                  {overdueInvoices} facture(s) en retard nécessitent une relance
                </p>
              </div>
              <Button variant="danger" size="sm">
                Relancer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des factures</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Exporter PDF
              </Button>
              <Button size="sm">
                + Nouvelle facture
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={invoices}
            columns={invoiceColumns as any}
          />
        </CardContent>
      </Card>
    </div>
  );
}
