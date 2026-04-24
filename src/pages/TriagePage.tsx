import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { Scale, Plus, Trash2, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { formatWeight, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WorkflowTabs } from '@/components/layout/WorkflowTabs';

// Import mock data
import ordersData from '@/mocks/data/orders.json';
import linenTypesData from '@/mocks/data/linenTypes.json';

interface TriageItem {
  linenTypeId: string;
  weight: number;
  pieces: number;
}

export default function TriagePage() {
  const [orders] = useState(ordersData);
  const [linenTypes] = useState(linenTypesData);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [triageItems, setTriageItems] = useState<TriageItem[]>([]);

  // Filter orders that are weighed but not triaged
  const ordersToTriage = orders.filter(o =>
    o.actualWeight && !o.triage
  );

  const selectedOrder = selectedOrderId
    ? orders.find(o => o.id === selectedOrderId)
    : null;

  const addTriageItem = () => {
    setTriageItems([
      ...triageItems,
      { linenTypeId: '', weight: 0, pieces: 0 }
    ]);
  };

  const removeTriageItem = (index: number) => {
    setTriageItems(triageItems.filter((_, i) => i !== index));
  };

  const updateTriageItem = (index: number, field: keyof TriageItem, value: string | number) => {
    const updated = [...triageItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setTriageItems(updated);
  };

  const getTotalWeight = (): number => {
    return triageItems.reduce((sum, item) => {
      const linenType = linenTypes.find(lt => lt.id === item.linenTypeId);
      if (linenType?.billingMode === 'Poids') {
        return sum + item.weight;
      } else if (linenType?.billingMode === 'Pièce') {
        return sum + (item.pieces * linenType.averageWeight);
      }
      return sum;
    }, 0);
  };

  const getTotalAmount = (): number => {
    return triageItems.reduce((sum, item) => {
      const linenType = linenTypes.find(lt => lt.id === item.linenTypeId);
      if (!linenType) return sum;

      if (linenType.billingMode === 'Poids') {
        return sum + ((item.weight / 1000) * linenType.unitPrice);
      } else if (linenType.billingMode === 'Pièce') {
        return sum + (item.pieces * linenType.unitPrice);
      }
      return sum;
    }, 0);
  };

  const getWeightDeviation = (): number => {
    if (!selectedOrder?.actualWeight) return 0;
    const total = getTotalWeight();
    return Math.round(((total - selectedOrder.actualWeight) / selectedOrder.actualWeight) * 100);
  };

  const isTriageComplete = (): boolean => {
    if (!selectedOrder?.actualWeight) return false;
    const deviation = Math.abs(getWeightDeviation());
    return deviation <= 5 && triageItems.length > 0 && triageItems.every(item => item.linenTypeId && (item.weight > 0 || item.pieces > 0));
  };

  const saveTriage = () => {
    if (!selectedOrder || !isTriageComplete()) return;
    // In real app, this would save the triage data
    console.log('Triage saved for order', selectedOrder.id, triageItems);
    alert('Triage enregistré avec succès!');
    setSelectedOrderId(null);
    setTriageItems([]);
  };

  const selectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setTriageItems([]);
  };

  const triagedCount = orders.filter(
    (o) =>
      o.triage?.completedAt &&
      new Date(o.triage.completedAt).toDateString() === new Date().toDateString(),
  ).length;

  const triagedWeight = orders
    .filter(
      (o) =>
        o.triage?.completedAt &&
        new Date(o.triage.completedAt).toDateString() === new Date().toDateString(),
    )
    .reduce((sum, o) => sum + (o.actualWeight || 0), 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Workflow quotidien</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Ventilation du poids par catégorie
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Ventilation précise du poids par type de linge pour la facturation · tolérance 5 %.
          </p>
        </div>
        <WorkflowTabs />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <TKpi label="En attente de triage" value={`${ordersToTriage.length}`} tint="warn" icon={Scale} />
        <TKpi label="Triés aujourd'hui" value={`${triagedCount}`} tint="ok" icon={CheckCircle} />
        <TKpi label="Poids total trié" value={formatWeight(triagedWeight)} tint="brand" icon={FileText} mono />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Commandes pesées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ordersToTriage.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 border-2 rounded-input cursor-pointer transition-colors ${
                      selectedOrderId === order.id
                        ? 'border-brand-800 bg-brand-50'
                        : 'border-ink-200 hover:border-ink-300'
                    }`}
                    onClick={() => selectOrder(order.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-ink-900">{order.clientName}</p>
                        <p className="text-sm text-ink-500">{order.orderNumber}</p>
                      </div>
                      <Badge variant="warning" className="text-xs">
                        À trier
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-ink-500">Pesé le:</span>
                        <span className="font-medium">
                          {order.weighingDateTime && format(new Date(order.weighingDateTime), 'dd/MM HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-500">Poids officiel:</span>
                        <span className="font-bold text-brand-800">
                          {formatWeight(order.actualWeight || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-500">Estimation:</span>
                        <span className="font-medium">
                          {formatWeight(order.estimatedWeight || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {ordersToTriage.length === 0 && (
                  <div className="text-center py-8 text-ink-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-ok-700" />
                    <p>Toutes les commandes sont triées</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Triage Form */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Triage - {selectedOrder.clientName}</CardTitle>
                    <p className="text-sm text-ink-500 mt-1">
                      Commande {selectedOrder.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-ink-500">Poids total officiel</p>
                    <p className="text-2xl font-bold text-brand-800">
                      {formatWeight(selectedOrder.actualWeight || 0)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress Bar */}
                <div className="mb-6 p-4 bg-paper-2 rounded-input">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink-500">TOTAL SAISI:</span>
                    <span className={`font-bold ${
                      getTotalWeight() === selectedOrder.actualWeight
                        ? 'text-ok-700'
                        : getTotalWeight() > (selectedOrder.actualWeight || 0)
                        ? 'text-danger-600'
                        : 'text-warn-700'
                    }`}>
                      {formatWeight(getTotalWeight())} / {formatWeight(selectedOrder.actualWeight || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-ink-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        getTotalWeight() > (selectedOrder.actualWeight || 0)
                          ? 'bg-danger'
                          : getTotalWeight() === selectedOrder.actualWeight
                          ? 'bg-success'
                          : 'bg-warning'
                      }`}
                      style={{
                        width: `${Math.min((getTotalWeight() / (selectedOrder.actualWeight || 1)) * 100, 100)}%`
                      }}
                    />
                  </div>
                  {getTotalWeight() > 0 && (
                    <p className="text-xs text-ink-500 mt-2 text-center">
                      Écart: {Math.abs(getWeightDeviation())}%
                      {Math.abs(getWeightDeviation()) <= 5 && ' ✓ (acceptable)'}
                    </p>
                  )}
                </div>

                {/* Triage Items */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-ink-900">VENTILER PAR CATÉGORIE:</h4>
                    <Button variant="outline" size="sm" onClick={addTriageItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une ligne
                    </Button>
                  </div>

                  {triageItems.map((item, index) => {
                    const selectedLinenType = linenTypes.find(lt => lt.id === item.linenTypeId);

                    return (
                      <div key={index} className="p-4 border border-ink-200 rounded-input bg-paper">
                        <div className="grid grid-cols-12 gap-3 items-end">
                          {/* Linen Type Select */}
                          <div className="col-span-5">
                            <label className="block text-xs text-ink-500 mb-1">Type de linge</label>
                            <select
                              className="w-full px-3 py-2 border border-ink-300 rounded-input focus:ring-2 focus:ring-brand-500 focus:border-brand-800"
                              value={item.linenTypeId}
                              onChange={(e) => updateTriageItem(index, 'linenTypeId', e.target.value)}
                            >
                              <option value="">Sélectionner...</option>
                              {linenTypes.map((lt) => (
                                <option key={lt.id} value={lt.id}>
                                  {lt.code} - {lt.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Weight or Pieces based on billing mode */}
                          {selectedLinenType?.billingMode === 'Poids' ? (
                            <div className="col-span-3">
                              <label className="block text-xs text-ink-500 mb-1">Poids (kg)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="w-full px-3 py-2 border border-ink-300 rounded-input focus:ring-2 focus:ring-brand-500 focus:border-brand-800"
                                value={item.weight / 1000 || ''}
                                onChange={(e) => updateTriageItem(index, 'weight', parseFloat(e.target.value || '0') * 1000)}
                              />
                            </div>
                          ) : selectedLinenType?.billingMode === 'Pièce' ? (
                            <div className="col-span-3">
                              <label className="block text-xs text-ink-500 mb-1">Pièces</label>
                              <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-ink-300 rounded-input focus:ring-2 focus:ring-brand-500 focus:border-brand-800"
                                value={item.pieces || ''}
                                onChange={(e) => updateTriageItem(index, 'pieces', parseInt(e.target.value || '0'))}
                              />
                            </div>
                          ) : (
                            <div className="col-span-3" />
                          )}

                          {/* Price */}
                          <div className="col-span-3">
                            <label className="block text-xs text-ink-500 mb-1">Montant</label>
                            <div className="px-3 py-2 bg-paper-2 border border-ink-200 rounded-input font-medium text-ink-900">
                              {selectedLinenType ? (
                                formatCurrency(
                                  selectedLinenType.billingMode === 'Poids'
                                    ? (item.weight / 1000) * selectedLinenType.unitPrice
                                    : item.pieces * selectedLinenType.unitPrice
                                )
                              ) : '-'}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="col-span-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTriageItem(index)}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {selectedLinenType && (
                          <div className="mt-2 flex items-center gap-4 text-xs text-ink-500">
                            <Badge variant="gray" className="text-xs">
                              {selectedLinenType.billingMode}
                            </Badge>
                            <span>Prix unitaire: {formatCurrency(selectedLinenType.unitPrice)}</span>
                            {selectedLinenType.billingMode === 'Pièce' && (
                              <span>Poids moyen: {selectedLinenType.averageWeight}g/pièce</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {triageItems.length === 0 && (
                    <div className="text-center py-8 text-ink-500 border-2 border-dashed border-ink-300 rounded-input">
                      <p className="mb-2">Aucune catégorie ajoutée</p>
                      <Button variant="outline" size="sm" onClick={addTriageItem}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter la première catégorie
                      </Button>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {triageItems.length > 0 && (
                  <div className="p-4 bg-paper-2 rounded-input border border-ink-200 mb-4">
                    <h4 className="font-semibold text-ink-900 mb-3">RÉSUMÉ DU TRIAGE:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-ink-500 mb-1">Poids total saisi:</p>
                        <p className="text-lg font-bold text-brand-800">{formatWeight(getTotalWeight())}</p>
                      </div>
                      <div>
                        <p className="text-ink-500 mb-1">Montant total facturé:</p>
                        <p className="text-lg font-bold text-ok-700">{formatCurrency(getTotalAmount())}</p>
                      </div>
                      <div>
                        <p className="text-ink-500 mb-1">Poids officiel:</p>
                        <p className="font-medium text-ink-900">{formatWeight(selectedOrder.actualWeight || 0)}</p>
                      </div>
                      <div>
                        <p className="text-ink-500 mb-1">Nombre de catégories:</p>
                        <p className="font-medium text-ink-900">{triageItems.length}</p>
                      </div>
                    </div>

                    {selectedOrder.estimatedInvoiceAmount && (
                      <div className="mt-3 pt-3 border-t border-primary-300">
                        <p className="text-xs text-ink-500 mb-1">Comparaison avec estimation:</p>
                        <div className="flex justify-between">
                          <span className="text-sm text-ink-500">Montant estimé:</span>
                          <span className="font-medium">{formatCurrency(selectedOrder.estimatedInvoiceAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-ink-500">Écart:</span>
                          <span className={`font-bold ${
                            getTotalAmount() > selectedOrder.estimatedInvoiceAmount ? 'text-danger-600' : 'text-ok-700'
                          }`}>
                            {getTotalAmount() > selectedOrder.estimatedInvoiceAmount ? '+' : ''}
                            {formatCurrency(getTotalAmount() - selectedOrder.estimatedInvoiceAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation */}
                {!isTriageComplete() && triageItems.length > 0 && (
                  <Card className="border-warn-600 bg-warn-100 mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-warn-700 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-warn-700">
                          {Math.abs(getWeightDeviation()) > 5 && (
                            <p>L'écart de poids est trop important ({Math.abs(getWeightDeviation())}%). Maximum accepté: 5%</p>
                          )}
                          {triageItems.some(item => !item.linenTypeId || (item.weight === 0 && item.pieces === 0)) && (
                            <p>Veuillez compléter toutes les lignes de triage.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedOrderId(null);
                      setTriageItems([]);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={saveTriage}
                    disabled={!isTriageComplete()}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider le triage et générer la facture
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-ink-200">
              <CardContent className="p-12 text-center">
                <Scale className="w-16 h-16 mx-auto mb-4 text-ink-400" />
                <h3 className="text-lg font-semibold text-ink-900 mb-2">
                  Sélectionnez une commande
                </h3>
                <p className="text-ink-500">
                  Choisissez une commande pesée dans la liste de gauche pour commencer le triage.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Card className="border-ink-200 bg-paper-2">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-ink-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-ink-900 mb-1">
                Processus de triage
              </h4>
              <p className="text-sm text-ink-700">
                Le triage consiste à ventiler le poids total pesé par catégorie de linge (draps, serviettes, nappes, uniformes).
                Certains articles sont facturés au poids (draps, serviettes), d'autres à la pièce (nappes, chemises).
                Le total saisi doit correspondre au poids officiel (écart maximum 5%).
                Une fois validé, la facture est automatiquement générée avec les montants détaillés.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TKpi({
  label,
  value,
  tint,
  icon: Icon,
  mono = false,
}: {
  label: string;
  value: string;
  tint: 'ok' | 'warn' | 'danger' | 'brand';
  icon: typeof Scale;
  mono?: boolean;
}) {
  const bg =
    tint === 'ok'
      ? 'bg-ok-100'
      : tint === 'warn'
        ? 'bg-warn-100'
        : tint === 'danger'
          ? 'bg-danger-100'
          : 'bg-brand-100';
  const fg =
    tint === 'ok'
      ? 'text-ok-700'
      : tint === 'warn'
        ? 'text-warn-700'
        : tint === 'danger'
          ? 'text-danger-600'
          : 'text-brand-800';

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p
            className={cn(
              'mt-1.5 leading-none tracking-tight text-ink-900',
              mono
                ? 'font-mono text-lg font-semibold tnum'
                : 'font-serif text-3xl font-medium tnum',
            )}
          >
            {value}
          </p>
        </div>
        <div className={cn('w-9 h-9 rounded-input flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
