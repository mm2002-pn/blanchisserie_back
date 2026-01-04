import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { Truck, User, Package, Calendar, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { formatWeight } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import mock data
import ordersData from '@/mocks/data/orders.json';
import usersData from '@/mocks/data/users.json';
import vehiclesData from '@/mocks/data/vehicles.json';

interface DeliveryAssignment {
  orderId: string;
  driverId: string;
  vehicleId: string;
  scheduledDate: string;
  scheduledTime: string;
}

export default function SchedulePage() {
  // Filter orders ready for delivery (status: "En production", "Prêt", etc.)
  const readyOrders = useMemo(() => {
    return ordersData.filter(order =>
      order.status === 'En production' ||
      order.triage !== null // Orders that have been sorted are ready for delivery planning
    );
  }, []);

  // Get available drivers
  const drivers = useMemo(() => {
    return usersData.filter(user => user.role === 'Chauffeur' && user.isActive);
  }, []);

  // Get available vehicles
  const vehicles = useMemo(() => {
    return vehiclesData.filter(vehicle => vehicle.status === 'Disponible' || vehicle.status === 'En tournée');
  }, []);

  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showDriverCircuit, setShowDriverCircuit] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    driverId: '',
    vehicleId: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    scheduledTime: '09:00',
  });

  // Check if order is already assigned
  /* const _isOrderAssigned = (orderId: string) => {
    return assignments.some(a => a.orderId === orderId);
  }; */

  // Get assignment for order
  const getAssignment = (orderId: string) => {
    return assignments.find(a => a.orderId === orderId);
  };

  // Handle assignment creation
  const handleAssign = () => {
    if (!selectedOrder || !assignmentForm.driverId || !assignmentForm.vehicleId) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const newAssignment: DeliveryAssignment = {
      orderId: selectedOrder,
      driverId: assignmentForm.driverId,
      vehicleId: assignmentForm.vehicleId,
      scheduledDate: assignmentForm.scheduledDate,
      scheduledTime: assignmentForm.scheduledTime,
    };

    setAssignments([...assignments, newAssignment]);
    setShowAssignModal(false);
    setSelectedOrder(null);
    setAssignmentForm({
      driverId: '',
      vehicleId: '',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
      scheduledTime: '09:00',
    });

    alert('Livraison planifiée avec succès!');
  };

  // Remove assignment
  const handleRemoveAssignment = (orderId: string) => {
    setAssignments(assignments.filter(a => a.orderId !== orderId));
  };

  // Get driver name
  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : 'N/A';
  };

  // Get vehicle info
  /* const _getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.marque} ${vehicle.modele} (${vehicle.matricule})` : 'N/A';
  }; */

  // Get driver's circuit (all deliveries sorted by time)
  const getDriverCircuit = (driverId: string) => {
    const driverAssignments = assignments
      .filter(a => a.driverId === driverId)
      .sort((a, b) => {
        // Sort by date, then by time
        const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
        if (dateCompare !== 0) return dateCompare;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });

    return driverAssignments.map(assignment => {
      const order = readyOrders.find(o => o.id === assignment.orderId);
      return {
        assignment,
        order,
      };
    });
  };

  // Handle driver click to show circuit
  const handleDriverClick = (driverId: string) => {
    const circuit = getDriverCircuit(driverId);
    if (circuit.length === 0) {
      alert('Ce chauffeur n\'a pas encore de livraisons planifiées');
      return;
    }
    setSelectedDriverId(driverId);
    setShowDriverCircuit(true);
  };

  // Calculate stats
  const totalReadyOrders = readyOrders.length;
  const totalAssigned = assignments.length;
  const totalUnassigned = totalReadyOrders - totalAssigned;
  const totalWeight = readyOrders.reduce((sum, order) => sum + (order.actualWeight || order.estimatedWeight || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Planning des Livraisons</h1>
          <p className="text-gray-600 mt-1">
            Affectation des chauffeurs aux commandes prêtes pour livraison
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Commandes prêtes</p>
              <p className="text-2xl font-bold text-gray-900">{totalReadyOrders}</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <Package className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Livraisons planifiées</p>
              <p className="text-2xl font-bold text-success">{totalAssigned}</p>
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
              <p className="text-2xl font-bold text-warning">{totalUnassigned}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Poids total</p>
              <p className="text-2xl font-bold text-gray-900">{formatWeight(totalWeight || 0)}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ready Orders (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Prêtes pour Livraison</CardTitle>
            </CardHeader>
            <CardContent>
              {readyOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucune commande prête pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {readyOrders.map((order) => {
                    const assignment = getAssignment(order.id);
                    const isAssigned = !!assignment;

                    return (
                      <Card key={order.id} padding="sm" className="hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {order.orderNumber}
                              </h4>
                              <Badge variant={isAssigned ? 'success' : 'warning'}>
                                {isAssigned ? 'Planifiée' : 'En attente'}
                              </Badge>
                              <Badge variant="gray">
                                {order.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-4">
                                <span className="font-medium">{order.clientName}</span>
                                <span>•</span>
                                <span>{formatWeight(order.actualWeight || order.estimatedWeight || 0)}</span>
                                {order.triage && (
                                  <>
                                    <span>•</span>
                                    <span>{order.triage.totalPieces} pièces</span>
                                  </>
                                )}
                              </div>
                              {isAssigned && assignment && (
                                <div className="flex items-center gap-2 mt-2 text-success">
                                  <Truck className="w-4 h-4" />
                                  <span className="font-medium">{getDriverName(assignment.driverId)}</span>
                                  <span>•</span>
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {format(new Date(assignment.scheduledDate), 'dd/MM/yyyy', { locale: fr })} à {assignment.scheduledTime}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAssigned ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(order.id)}
                                >
                                  Annuler
                                </Button>
                                <Button variant="success" size="sm">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Planifiée
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order.id);
                                  setShowAssignModal(true);
                                }}
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                Planifier
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Drivers & Vehicles (1/3 width) */}
        <div className="space-y-4">
          {/* Available Drivers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chauffeurs Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {drivers.map((driver) => {
                  const assignedCount = assignments.filter(a => a.driverId === driver.id).length;
                  return (
                    <div
                      key={driver.id}
                      onClick={() => assignedCount > 0 && handleDriverClick(driver.id)}
                      className={`flex items-center justify-between p-2 bg-gray-50 rounded-lg transition-all ${
                        assignedCount > 0
                          ? 'cursor-pointer hover:bg-gray-100 hover:shadow-md'
                          : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {driver.firstName} {driver.lastName}
                          </p>
                          <p className="text-xs text-gray-600">{driver.phone}</p>
                        </div>
                      </div>
                      {assignedCount > 0 && (
                        <Badge variant="success" className="text-xs">
                          {assignedCount} livraison{assignedCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Available Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Véhicules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">
                        {vehicle.marque} {vehicle.modele}
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 ml-6">
                      <p>{vehicle.matricule}</p>
                      <p>{vehicle.tonnage}kg • {vehicle.volumeM3}m³</p>
                      <Badge
                        variant={vehicle.status === 'Disponible' ? 'success' : 'warning'}
                        className="mt-1 text-xs"
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Driver Circuit Modal */}
      {showDriverCircuit && selectedDriverId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Circuit de Livraison</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Chauffeur: <span className="font-medium">{getDriverName(selectedDriverId)}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDriverCircuit(false);
                    setSelectedDriverId(null);
                  }}
                >
                  Fermer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {(() => {
                const circuit = getDriverCircuit(selectedDriverId);
                const totalCircuitWeight = circuit.reduce(
                  (sum, item) => sum + (item.order?.actualWeight || item.order?.estimatedWeight || 0),
                  0
                );
                const firstAssignment = circuit[0]?.assignment;
                const vehicle = firstAssignment ? vehicles.find(v => v.id === firstAssignment.vehicleId) : null;

                return (
                  <div className="space-y-6">
                    {/* Circuit Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-accent-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Nombre d'arrêts</p>
                        <p className="text-2xl font-bold text-gray-900">{circuit.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Poids total</p>
                        <p className="text-2xl font-bold text-gray-900">{formatWeight(totalCircuitWeight)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Véhicule</p>
                        <p className="text-sm font-medium text-gray-900">
                          {vehicle ? `${vehicle.marque} ${vehicle.modele}` : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600">{vehicle?.matricule}</p>
                      </div>
                    </div>

                    {/* Timeline Circuit */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-accent-600" />
                        Itinéraire du jour
                      </h3>
                      <div className="relative">
                        {circuit.map((item, index) => {
                          const { assignment, order } = item;
                          if (!order) return null;

                          return (
                            <div key={assignment.orderId} className="relative pb-8">
                              {/* Timeline connector */}
                              {index < circuit.length - 1 && (
                                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-accent-300" />
                              )}

                              {/* Stop card */}
                              <div className="flex items-start gap-4">
                                {/* Stop number badge */}
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-lg shadow-lg z-10">
                                    {index + 1}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-2 font-medium">
                                    {assignment.scheduledTime}
                                  </div>
                                </div>

                                {/* Stop details */}
                                <Card className="flex-1 hover:shadow-lg transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-semibold text-gray-900">
                                            {order.clientName}
                                          </h4>
                                          <Badge variant="success" className="text-xs">
                                            Livraison
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          Commande: {order.orderNumber}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <Badge variant="gray" className="text-xs">
                                          {format(new Date(assignment.scheduledDate), 'dd/MM/yyyy', { locale: fr })}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <p className="text-gray-600 mb-1">Poids</p>
                                        <p className="font-medium text-gray-900">
                                          {formatWeight(order.actualWeight || order.estimatedWeight || 0)}
                                        </p>
                                      </div>
                                      {order.triage && (
                                        <div>
                                          <p className="text-gray-600 mb-1">Pièces</p>
                                          <p className="font-medium text-gray-900">
                                            {order.triage.totalPieces} pièces
                                          </p>
                                        </div>
                                      )}
                                      {order.triage && (
                                        <div>
                                          <p className="text-gray-600 mb-1">Montant</p>
                                          <p className="font-medium text-success">
                                            {order.triage.totalAmount.toLocaleString()} FCFA
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Additional info */}
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      <div className="flex items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>Heure prévue: {assignment.scheduledTime}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            Date collecte: {format(new Date(order.collectionDate), 'dd/MM', { locale: fr })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* End marker */}
                      <div className="flex items-center gap-4 ml-1">
                        <div className="w-12 h-12 rounded-full bg-success text-white flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Fin du circuit</p>
                          <p className="text-sm text-gray-600">Retour à la blanchisserie</p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button variant="outline" className="flex-1">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Imprimer feuille de route
                      </Button>
                      <Button variant="primary" className="flex-1">
                        <Truck className="w-4 h-4 mr-2" />
                        Démarrer la tournée
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Planifier la Livraison</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Commande: {readyOrders.find(o => o.id === selectedOrder)?.orderNumber}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Driver Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chauffeur *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    value={assignmentForm.driverId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, driverId: e.target.value })}
                  >
                    <option value="">Sélectionner un chauffeur</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Véhicule *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    value={assignmentForm.vehicleId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, vehicleId: e.target.value })}
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.marque} {vehicle.modele} ({vehicle.matricule})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de livraison *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    value={assignmentForm.scheduledDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, scheduledDate: e.target.value })}
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de livraison *
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    value={assignmentForm.scheduledTime}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, scheduledTime: e.target.value })}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedOrder(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleAssign}
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
