import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { Scale, Plus, Trash2, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { formatWeight, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Triage et Ventilation
        </h1>
        <p className="text-gray-600 mt-1">
          Ventilation du poids par catégorie de linge
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En attente de triage</p>
              <p className="text-2xl font-bold text-warning">{ordersToTriage.length}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <Scale className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Triés aujourd'hui</p>
              <p className="text-2xl font-bold text-success">
                {orders.filter(o =>
                  o.triage?.completedAt &&
                  new Date(o.triage.completedAt).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Poids total trié</p>
              <p className="text-2xl font-bold text-primary">
                {formatWeight(
                  orders
                    .filter(o => o.triage?.completedAt &&
                      new Date(o.triage.completedAt).toDateString() === new Date().toDateString()
                    )
                    .reduce((sum, o) => sum + (o.actualWeight || 0), 0)
                )}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
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
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedOrderId === order.id
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectOrder(order.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{order.clientName}</p>
                        <p className="text-sm text-gray-600">{order.orderNumber}</p>
                      </div>
                      <Badge variant="warning" className="text-xs">
                        À trier
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pesé le:</span>
                        <span className="font-medium">
                          {order.weighingDateTime && format(new Date(order.weighingDateTime), 'dd/MM HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Poids officiel:</span>
                        <span className="font-bold text-primary-600">
                          {formatWeight(order.actualWeight || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimation:</span>
                        <span className="font-medium">
                          {formatWeight(order.estimatedWeight || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {ordersToTriage.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
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
                    <p className="text-sm text-gray-600 mt-1">
                      Commande {selectedOrder.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Poids total officiel</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatWeight(selectedOrder.actualWeight || 0)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress Bar */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">TOTAL SAISI:</span>
                    <span className={`font-bold ${
                      getTotalWeight() === selectedOrder.actualWeight
                        ? 'text-success'
                        : getTotalWeight() > (selectedOrder.actualWeight || 0)
                        ? 'text-danger'
                        : 'text-warning'
                    }`}>
                      {formatWeight(getTotalWeight())} / {formatWeight(selectedOrder.actualWeight || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
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
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      Écart: {Math.abs(getWeightDeviation())}%
                      {Math.abs(getWeightDeviation()) <= 5 && ' ✓ (acceptable)'}
                    </p>
                  )}
                </div>

                {/* Triage Items */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">VENTILER PAR CATÉGORIE:</h4>
                    <Button variant="outline" size="sm" onClick={addTriageItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une ligne
                    </Button>
                  </div>

                  {triageItems.map((item, index) => {
                    const selectedLinenType = linenTypes.find(lt => lt.id === item.linenTypeId);

                    return (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="grid grid-cols-12 gap-3 items-end">
                          {/* Linen Type Select */}
                          <div className="col-span-5">
                            <label className="block text-xs text-gray-600 mb-1">Type de linge</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
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
                              <label className="block text-xs text-gray-600 mb-1">Poids (kg)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                                value={item.weight / 1000 || ''}
                                onChange={(e) => updateTriageItem(index, 'weight', parseFloat(e.target.value || '0') * 1000)}
                              />
                            </div>
                          ) : selectedLinenType?.billingMode === 'Pièce' ? (
                            <div className="col-span-3">
                              <label className="block text-xs text-gray-600 mb-1">Pièces</label>
                              <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                                value={item.pieces || ''}
                                onChange={(e) => updateTriageItem(index, 'pieces', parseInt(e.target.value || '0'))}
                              />
                            </div>
                          ) : (
                            <div className="col-span-3" />
                          )}

                          {/* Price */}
                          <div className="col-span-3">
                            <label className="block text-xs text-gray-600 mb-1">Montant</label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900">
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
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
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
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
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
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">RÉSUMÉ DU TRIAGE:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Poids total saisi:</p>
                        <p className="text-lg font-bold text-primary-600">{formatWeight(getTotalWeight())}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Montant total facturé:</p>
                        <p className="text-lg font-bold text-success">{formatCurrency(getTotalAmount())}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Poids officiel:</p>
                        <p className="font-medium text-gray-900">{formatWeight(selectedOrder.actualWeight || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Nombre de catégories:</p>
                        <p className="font-medium text-gray-900">{triageItems.length}</p>
                      </div>
                    </div>

                    {selectedOrder.estimatedInvoiceAmount && (
                      <div className="mt-3 pt-3 border-t border-primary-300">
                        <p className="text-xs text-gray-600 mb-1">Comparaison avec estimation:</p>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Montant estimé:</span>
                          <span className="font-medium">{formatCurrency(selectedOrder.estimatedInvoiceAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Écart:</span>
                          <span className={`font-bold ${
                            getTotalAmount() > selectedOrder.estimatedInvoiceAmount ? 'text-danger' : 'text-success'
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
                  <Card className="border-warning-200 bg-warning-50 mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-warning-700 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-warning-700">
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
            <Card className="border-gray-200">
              <CardContent className="p-12 text-center">
                <Scale className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sélectionnez une commande
                </h3>
                <p className="text-gray-600">
                  Choisissez une commande pesée dans la liste de gauche pour commencer le triage.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-primary-900 mb-1">
                Processus de triage
              </h4>
              <p className="text-sm text-primary-700">
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
