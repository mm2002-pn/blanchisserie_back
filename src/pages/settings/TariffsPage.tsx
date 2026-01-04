import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import tariffsData from '@/mocks/data/tariffs.json';

export default function TariffsPage() {
  const { canEdit } = usePermissions();
  const [tariffs] = useState(tariffsData);
  const [selectedTariff, setSelectedTariff] = useState(tariffs[0]);

  const typeBadgeVariants: Record<string, 'success' | 'warning' | 'gray' | 'info'> = {
    'Standard': 'gray',
    'Premium': 'success',
    'Service': 'warning',
    'Segment': 'info',
    'Forfait': 'info',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Grilles tarifaires</h2>
          <p className="text-gray-600 mt-1">{tariffs.length} grilles configurées</p>
        </div>
        {canEdit('settings') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle grille
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tariffs List */}
        <div className="lg:col-span-1 space-y-3">
          {tariffs.map((tariff) => (
            <Card
              key={tariff.id}
              className={`cursor-pointer transition-all ${
                selectedTariff.id === tariff.id
                  ? 'border-accent-500 border-2 bg-accent-50'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedTariff(tariff)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{tariff.name}</h3>
                      {tariff.isDefault && (
                        <Badge variant="success" className="text-xs">Par défaut</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{tariff.code}</p>
                  </div>
                  <Badge variant={typeBadgeVariants[tariff.type]} className="text-xs">
                    {tariff.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{tariff.description}</p>
                {tariff.type === 'Forfait' && (
                  <div className="text-sm font-medium text-accent-600">
                    {formatCurrency(tariff.monthlyPrice || 0)}/mois
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={tariff.isActive ? 'success' : 'error'} className="text-xs">
                    {tariff.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  {tariff.items && tariff.items.length > 0 && (
                    <span className="text-xs text-gray-500">{tariff.items.length} tarifs</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tariff Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedTariff.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{selectedTariff.description}</p>
                </div>
                {canEdit('settings') && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    {!selectedTariff.isDefault && (
                      <Button variant="danger" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Tariff Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Code</p>
                  <p className="font-medium text-gray-900">{selectedTariff.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <Badge variant={typeBadgeVariants[selectedTariff.type]}>
                    {selectedTariff.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valide du</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedTariff.validFrom).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valide jusqu'au</p>
                  <p className="font-medium text-gray-900">
                    {selectedTariff.validUntil
                      ? new Date(selectedTariff.validUntil).toLocaleDateString('fr-FR')
                      : 'Indéterminé'}
                  </p>
                </div>
              </div>

              {/* Forfait Details */}
              {selectedTariff.type === 'Forfait' && (
                <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Détails du forfait</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Prix mensuel</p>
                      <p className="text-lg font-bold text-primary-600">
                        {formatCurrency(selectedTariff.monthlyPrice || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Volume inclus</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedTariff.monthlyKgLimit} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dépassement</p>
                      <p className="text-lg font-bold text-warning-600">
                        {formatCurrency(selectedTariff.overagePricePerKg || 0)}/kg
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Applicable Clients */}
              {selectedTariff.applicableClients && selectedTariff.applicableClients.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Clients applicables</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTariff.applicableClients.map((client, index) => (
                      <Badge key={index} variant="gray">
                        {client}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Items Table */}
              {selectedTariff.items && selectedTariff.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Détail des tarifs</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Code
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Type de linge
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            Prix au kg
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            Prix à la pièce
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                            Mode facturation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTariff.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              {item.linenTypeCode}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.linenTypeName}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-900">
                              {formatCurrency(item.pricePerKg)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-900">
                              {item.pricePerPiece ? formatCurrency(item.pricePerPiece) : '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={item.billingMode === 'piece' ? 'info' : 'warning'} className="text-xs">
                                {item.billingMode === 'piece' ? 'À la pièce' : 'Au kg'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedTariff.items && selectedTariff.items.length === 0 && selectedTariff.type === 'Forfait' && (
                <div className="text-center py-8 text-gray-500">
                  <p>Ce forfait s'applique à tous les types de linge</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
