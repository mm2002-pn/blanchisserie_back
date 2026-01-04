import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { CheckCircle, Scale, Scissors, FileText, Truck, AlertTriangle, Printer, Droplets, Wind, Sparkles } from 'lucide-react';
import { formatWeight, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import mock data
import ordersData from '@/mocks/data/orders.json';
import vehiclesData from '@/mocks/data/vehicles.json';
import linenTypesData from '@/mocks/data/linenTypes.json';
import machinesData from '@/mocks/data/machines.json';
import washingProgramsData from '@/mocks/data/washingPrograms.json';
import dryingProgramsData from '@/mocks/data/dryingPrograms.json';
import calandringProgramsData from '@/mocks/data/calandringPrograms.json';

type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface WeighedItem {
  linenType: string;
  quantity: number;
  weight: number; // en grammes
}

interface WeighedOrder {
  orderId: string;
  items: WeighedItem[];
  totalWeight: number;
}

interface TriageItem {
  linenTypeId: string;
  weight: number;
  pieces: number;
}

interface OrderTriage {
  orderId: string;
  items: TriageItem[];
}

interface WashingBatch {
  id: string;
  machineId: string;
  machineName: string;
  programId: string;
  programName: string;
  items: {
    linenTypeId: string;
    linenTypeName: string;
    quantity: number;
    weight: number;
  }[];
  totalWeight: number;
  capacity: number;
  utilizationRate: number;
  estimatedDuration: number;
  waterConsumption: number;
}

interface DryingBatch {
  id: string;
  machineId: string;
  machineName: string;
  programId: string;
  programName: string;
  items: {
    linenTypeId: string;
    linenTypeName: string;
    quantity: number;
    weight: number;
  }[];
  totalWeight: number;
  capacity: number;
  utilizationRate: number;
  estimatedDuration: number;
  energyConsumption: number;
}

interface CalandringBatch {
  id: string;
  machineId: string;
  machineName: string;
  programId: string;
  programName: string;
  items: {
    linenTypeId: string;
    linenTypeName: string;
    quantity: number;
  }[];
  totalPieces: number;
  capacity: number;
  utilizationRate: number;
  estimatedDuration: number;
  energyConsumption: number;
}

export default function ProductionWorkflowPage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  const [orders] = useState(ordersData);
  const [vehicles] = useState(vehiclesData);
  const [linenTypes] = useState(linenTypesData);
  const [machines] = useState(machinesData);
  const [washingPrograms] = useState(washingProgramsData);
  const [dryingPrograms] = useState(dryingProgramsData);
  const [calandringPrograms] = useState(calandringProgramsData);

  // Step 1: Selected orders
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Step 2: Weighed orders (par type)
  const [weighedOrders, setWeighedOrders] = useState<WeighedOrder[]>([]);
  const [currentWeighingOrderId, setCurrentWeighingOrderId] = useState<string | null>(null);
  const [currentWeighingItems, setCurrentWeighingItems] = useState<WeighedItem[]>([]);

  // Step 3: Triaged orders (vérification)
  const [triagedOrders, setTriagedOrders] = useState<OrderTriage[]>([]);
  const [currentTriageOrderId, setCurrentTriageOrderId] = useState<string | null>(null);
  const [currentTriageItems, setCurrentTriageItems] = useState<TriageItem[]>([]);

  // Step 4: Washing batches (lavage)
  const [washingBatches, setWashingBatches] = useState<WashingBatch[]>([]);

  // Step 5: Drying batches (séchage)
  const [dryingBatches, setDryingBatches] = useState<DryingBatch[]>([]);

  // Step 6: Calandring batches (calandrage/repassage)
  const [calandringBatches, setCalandringBatches] = useState<CalandringBatch[]>([]);

  // Filter orders collected today
  const todayOrders = orders.filter(o =>
    o.status === 'Collectée' &&
    new Date(o.collectionDate).toDateString() === new Date().toDateString()
  );

  // Group by vehicle
  const ordersByVehicle = todayOrders.reduce((acc, order) => {
    if (order.vehicleId) {
      if (!acc[order.vehicleId]) {
        acc[order.vehicleId] = [];
      }
      acc[order.vehicleId].push(order);
    }
    return acc;
  }, {} as Record<string, typeof orders>);

  // Helper function to map simple linen type names to linenType IDs
  const mapLinenTypeNameToId = (simpleName: string): string => {
    const mapping: Record<string, string> = {
      'drap': 'lt-002',        // Drap 2 personnes (par défaut)
      'taie': 'lt-003',        // Taie d'oreiller
      'serviette': 'lt-005',   // Grande serviette (par défaut)
      'nappe': 'lt-007',       // Nappe légère (par défaut)
      'torchon': 'lt-009',     // Torchon
      'rideau': 'lt-001',      // Mapping temporaire (à ajuster)
      'couverture': 'lt-004',  // Housse de couette (temporaire)
      'housse': 'lt-004',      // Housse de couette
      'peignoir': 'lt-015',    // T-shirt (temporaire - à ajuster)
      'tapis': 'lt-001',       // Mapping temporaire (à ajuster)
    };
    return mapping[simpleName.toLowerCase()] || 'lt-001';
  };

  // Pre-fill triage items when currentTriageOrderId changes
  useEffect(() => {
    if (currentTriageOrderId) {
      const order = orders.find(o => o.id === currentTriageOrderId);
      if (order?.services && Array.isArray(order.services)) {
        const items: TriageItem[] = [];
        order.services.forEach((service: any) => {
          if (service.items && Array.isArray(service.items)) {
            service.items.forEach((item: any) => {
              items.push({
                linenTypeId: mapLinenTypeNameToId(item.type),
                weight: 0,
                pieces: item.quantity || 0
              });
            });
          }
        });
        setCurrentTriageItems(items);
      }
    }
  }, [currentTriageOrderId, orders]);

  // STEP 1 FUNCTIONS
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const goToWeighing = () => {
    if (selectedOrders.length > 0) {
      setCurrentStep(2);
      const firstOrder = orders.find(o => o.id === selectedOrders[0]);

      // Préparer les items à peser depuis les données collectées
      if (firstOrder?.services && Array.isArray(firstOrder.services)) {
        const items: WeighedItem[] = [];
        firstOrder.services.forEach((service: any) => {
          if (service.items && Array.isArray(service.items)) {
            service.items.forEach((item: any) => {
              items.push({
                linenType: item.type,
                quantity: item.quantity,
                weight: 0
              });
            });
          }
        });
        setCurrentWeighingItems(items);
      }

      setCurrentWeighingOrderId(selectedOrders[0]);
    }
  };

  // STEP 2 FUNCTIONS
  const updateItemWeight = (index: number, weightKg: number) => {
    setCurrentWeighingItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        weight: weightKg * 1000 // Convert to grams
      };
      return updated;
    });
  };

  const validateOrderWeighing = () => {
    if (!currentWeighingOrderId) return;

    // Vérifier que tous les items ont été pesés
    const allWeighed = currentWeighingItems.every(item => item.weight > 0);
    if (!allWeighed) {
      alert('⚠️ Veuillez peser tous les types de linge avant de valider.');
      return;
    }

    const totalWeight = currentWeighingItems.reduce((sum, item) => sum + item.weight, 0);

    setWeighedOrders(prev => [...prev, {
      orderId: currentWeighingOrderId,
      items: currentWeighingItems,
      totalWeight
    }]);

    alert(`✓ Bordereau de réception généré\n\nPoids total: ${(totalWeight/1000).toFixed(2)} kg\nImprimez et collez sur le chariot.`);

    // Move to next order
    const currentIndex = selectedOrders.indexOf(currentWeighingOrderId);
    if (currentIndex < selectedOrders.length - 1) {
      const nextOrder = orders.find(o => o.id === selectedOrders[currentIndex + 1]);

      // Préparer les items du prochain ordre
      if (nextOrder?.services && Array.isArray(nextOrder.services)) {
        const items: WeighedItem[] = [];
        nextOrder.services.forEach((service: any) => {
          if (service.items && Array.isArray(service.items)) {
            service.items.forEach((item: any) => {
              items.push({
                linenType: item.type,
                quantity: item.quantity,
                weight: 0
              });
            });
          }
        });
        setCurrentWeighingItems(items);
      }

      setCurrentWeighingOrderId(selectedOrders[currentIndex + 1]);
    } else {
      setCurrentWeighingOrderId(null);
      setCurrentWeighingItems([]);
    }
  };

  const goToTriage = () => {
    if (weighedOrders.length === selectedOrders.length) {
      setCurrentStep(3);
      setCurrentTriageOrderId(selectedOrders[0]);
    }
  };

  // STEP 3 FUNCTIONS (Triage = Vérification)
  const addTriageItem = () => {
    setCurrentTriageItems(prev => [...prev, { linenTypeId: '', weight: 0, pieces: 0 }]);
  };

  const updateTriageItem = (index: number, field: keyof TriageItem, value: string | number) => {
    setCurrentTriageItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTriageItem = (index: number) => {
    setCurrentTriageItems(prev => prev.filter((_, i) => i !== index));
  };

  /* const _getTotalTriageWeight = (): number => {
    return currentTriageItems.reduce((sum, item) => {
      const linenType = linenTypes.find(lt => lt.id === item.linenTypeId);
      if (linenType?.billingMode === 'Poids') {
        return sum + item.weight;
      } else if (linenType?.billingMode === 'Pièce') {
        // Pour les pièces, on n'ajoute pas de poids
        return sum;
      }
      return sum;
    }, 0);
  }; */

  const validateTriage = () => {
    if (!currentTriageOrderId) return;

    const weighedOrder = weighedOrders.find(w => w.orderId === currentTriageOrderId);
    if (!weighedOrder) return;

    setTriagedOrders(prev => [...prev, { orderId: currentTriageOrderId, items: currentTriageItems }]);

    alert(`✓ Fiche de triage validée\n\n${currentTriageItems.length} catégories vérifiées\nQR codes générés\nImprimez et collez sur les bacs.`);

    // Move to next order (useEffect will pre-fill items automatically)
    const currentIndex = selectedOrders.indexOf(currentTriageOrderId);
    if (currentIndex < selectedOrders.length - 1) {
      setCurrentTriageOrderId(selectedOrders[currentIndex + 1]);
    } else {
      setCurrentTriageOrderId(null);
      setCurrentTriageItems([]);
    }
  };

  const goToWashing = () => {
    if (triagedOrders.length === selectedOrders.length) {
      // Générer les batches de lavage avec l'algorithme d'optimisation
      const batches = optimizeWashingBatches();
      setWashingBatches(batches);
      setCurrentStep(4);
    }
  };

  // STEP 4 FUNCTIONS (Lavage - Washing)
  const optimizeWashingBatches = (): WashingBatch[] => {
    const batches: WashingBatch[] = [];
    let batchCounter = 1;

    // Récupérer tous les items de triage
    const allItems: { linenTypeId: string; quantity: number; weight: number }[] = [];
    triagedOrders.forEach(triage => {
      triage.items.forEach(item => {
        allItems.push({
          linenTypeId: item.linenTypeId,
          quantity: item.pieces,
          weight: item.weight || 0
        });
      });
    });

    // Grouper par catégorie de linge (Linge Plat vs Linge Forme)
    const linenByCategory = allItems.reduce((acc, item) => {
      const linenType = linenTypes.find(lt => lt.id === item.linenTypeId);
      if (!linenType) return acc;

      const category = linenType.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push({ ...item, linenType });
      return acc;
    }, {} as Record<string, any[]>);

    // Pour chaque catégorie, dispatcher dans les machines
    Object.entries(linenByCategory).forEach(([category, items]) => {
      // Choisir le programme approprié
      const program = washingPrograms.find(p =>
        p.suitable.includes(category)
      ) || washingPrograms[0];

      // Récupérer les machines compatibles et disponibles
      const compatibleMachines = machines
        .filter(m =>
          m.type === 'Laveuse' &&
          m.status === 'Active' &&
          m.compatiblePrograms?.includes(program.id)
        )
        .sort((a, b) => b.capacity - a.capacity); // Plus grandes d'abord

      let remainingItems = [...items];

      while (remainingItems.length > 0 && compatibleMachines.length > 0) {
        // Trouver la meilleure machine pour minimiser les cycles
        let bestMachine = compatibleMachines[0];
        let currentBatch: typeof remainingItems = [];
        let currentWeight = 0;

        // Remplir la machine jusqu'à sa capacité
        for (let i = 0; i < remainingItems.length; i++) {
          const item = remainingItems[i];
          const estimatedWeight = (item.weight || item.quantity * 500) / 1000; // kg

          if (currentWeight + estimatedWeight <= bestMachine.capacity) {
            currentBatch.push(item);
            currentWeight += estimatedWeight;
          }
        }

        // Si on a trouvé des items pour ce batch
        if (currentBatch.length > 0) {
          const totalWeight = currentBatch.reduce((sum, item) =>
            sum + (item.weight || item.quantity * 500), 0
          );

          batches.push({
            id: `batch-${batchCounter++}`,
            machineId: bestMachine.id,
            machineName: `${bestMachine.brand} ${bestMachine.model}`,
            programId: program.id,
            programName: program.name,
            items: currentBatch.map(item => ({
              linenTypeId: item.linenTypeId,
              linenTypeName: item.linenType.name,
              quantity: item.quantity,
              weight: item.weight || item.quantity * 500
            })),
            totalWeight,
            capacity: bestMachine.capacity * 1000,
            utilizationRate: (totalWeight / (bestMachine.capacity * 1000)) * 100,
            estimatedDuration: program.duration,
            waterConsumption: program.waterConsumption
          });

          // Retirer les items utilisés
          remainingItems = remainingItems.filter(item => !currentBatch.includes(item));
        } else {
          break; // Plus de place disponible
        }
      }
    });

    return batches;
  };

  const startWashing = () => {
    alert(`✓ Lancement du lavage !\n\n${washingBatches.length} cycles programmés\n\nLes machines vont démarrer automatiquement.\nDurée estimée: ${Math.max(...washingBatches.map(b => b.estimatedDuration))} min`);

    // Générer automatiquement les batches de séchage
    const dryBatches = optimizeDryingBatches();
    setDryingBatches(dryBatches);
    setCurrentStep(5);
  };

  // STEP 5 FUNCTIONS (Séchage - Drying)
  const optimizeDryingBatches = (): DryingBatch[] => {
    const batches: DryingBatch[] = [];
    let batchCounter = 1;

    // Récupérer tous les items des batches de lavage (qui seront secs après)
    const allItems: { linenTypeId: string; linenTypeName: string; quantity: number; weight: number; category: string }[] = [];

    washingBatches.forEach(washBatch => {
      washBatch.items.forEach(item => {
        const linenType = linenTypes.find(lt => lt.name === item.linenTypeName);
        allItems.push({
          ...item,
          category: linenType?.category || 'Linge Plat'
        });
      });
    });

    // Grouper par catégorie
    const itemsByCategory = allItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof allItems>);

    // Pour chaque catégorie, dispatcher dans les sécheuses
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      // Choisir le programme approprié
      const program = dryingPrograms.find(p => p.suitable.includes(category)) || dryingPrograms[0];

      // Récupérer les sécheuses disponibles
      const availableDryers = machines
        .filter(m => m.type === 'Sécheuse' && m.status === 'Active')
        .sort((a, b) => b.capacity - a.capacity);

      let remainingItems = [...items];

      while (remainingItems.length > 0 && availableDryers.length > 0) {
        let bestDryer = availableDryers[0];
        let currentBatch: typeof remainingItems = [];
        let currentWeight = 0;

        // Remplir la sécheuse jusqu'à sa capacité
        for (let i = 0; i < remainingItems.length; i++) {
          const item = remainingItems[i];
          const itemWeight = item.weight / 1000; // kg

          if (currentWeight + itemWeight <= bestDryer.capacity) {
            currentBatch.push(item);
            currentWeight += itemWeight;
          }
        }

        if (currentBatch.length > 0) {
          const totalWeight = currentBatch.reduce((sum, item) => sum + item.weight, 0);

          batches.push({
            id: `dry-batch-${batchCounter++}`,
            machineId: bestDryer.id,
            machineName: `${bestDryer.brand} ${bestDryer.model}`,
            programId: program.id,
            programName: program.name,
            items: currentBatch.map(item => ({
              linenTypeId: item.linenTypeId,
              linenTypeName: item.linenTypeName,
              quantity: item.quantity,
              weight: item.weight
            })),
            totalWeight,
            capacity: bestDryer.capacity * 1000,
            utilizationRate: (totalWeight / (bestDryer.capacity * 1000)) * 100,
            estimatedDuration: program.duration,
            energyConsumption: program.energyConsumption
          });

          remainingItems = remainingItems.filter(item => !currentBatch.includes(item));
        } else {
          break;
        }
      }
    });

    return batches;
  };

  const startDrying = () => {
    alert(`✓ Lancement du séchage !\n\n${dryingBatches.length} cycles programmés\n\nLes sécheuses vont démarrer automatiquement.\nDurée estimée: ${Math.max(...dryingBatches.map(b => b.estimatedDuration))} min`);

    // Générer automatiquement les batches de calandrage
    const calBatches = optimizeCalandringBatches();
    setCalandringBatches(calBatches);
    setCurrentStep(6);
  };

  // STEP 6 FUNCTIONS (Calandrage - Ironing/Pressing)
  const optimizeCalandringBatches = (): CalandringBatch[] => {
    const batches: CalandringBatch[] = [];
    let batchCounter = 1;

    // Récupérer tous les items des batches de séchage
    // Seul le linge plat va au calandrage, le linge forme va au pressage
    const allItems: { linenTypeId: string; linenTypeName: string; quantity: number; category: string }[] = [];

    dryingBatches.forEach(dryBatch => {
      dryBatch.items.forEach(item => {
        const linenType = linenTypes.find(lt => lt.name === item.linenTypeName);
        allItems.push({
          linenTypeId: item.linenTypeId,
          linenTypeName: item.linenTypeName,
          quantity: item.quantity,
          category: linenType?.category || 'Linge Plat'
        });
      });
    });

    // Grouper par catégorie
    const itemsByCategory = allItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof allItems>);

    // Pour chaque catégorie, dispatcher dans les machines appropriées
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      // Choisir le programme et type de machine appropriés
      const program = calandringPrograms.find(p => p.suitable.includes(category)) || calandringPrograms[0];

      // Récupérer les machines appropriées (Calandre pour Linge Plat, Presse pour Linge Forme)
      const machineType = category === 'Linge Plat' ? 'Calandre' : 'Presse';
      const availableMachines = machines
        .filter(m => m.type === machineType && m.status === 'Active')
        .sort((a, b) => b.capacity - a.capacity);

      let remainingItems = [...items];

      while (remainingItems.length > 0 && availableMachines.length > 0) {
        let bestMachine = availableMachines[0];
        let currentBatch: typeof remainingItems = [];
        let currentPieces = 0;

        // Remplir la machine jusqu'à sa capacité (en nombre de pièces)
        for (let i = 0; i < remainingItems.length; i++) {
          const item = remainingItems[i];

          if (currentPieces + item.quantity <= bestMachine.capacity) {
            currentBatch.push(item);
            currentPieces += item.quantity;
          }
        }

        if (currentBatch.length > 0) {
          const totalPieces = currentBatch.reduce((sum, item) => sum + item.quantity, 0);

          batches.push({
            id: `cal-batch-${batchCounter++}`,
            machineId: bestMachine.id,
            machineName: `${bestMachine.brand} ${bestMachine.model}`,
            programId: program.id,
            programName: program.name,
            items: currentBatch.map(item => ({
              linenTypeId: item.linenTypeId,
              linenTypeName: item.linenTypeName,
              quantity: item.quantity
            })),
            totalPieces,
            capacity: bestMachine.capacity,
            utilizationRate: (totalPieces / bestMachine.capacity) * 100,
            estimatedDuration: program.duration,
            energyConsumption: program.energyConsumption
          });

          remainingItems = remainingItems.filter(item => !currentBatch.includes(item));
        } else {
          break;
        }
      }
    });

    return batches;
  };

  const startCalandring = () => {
    alert(`✓ Lancement du calandrage/pressage !\n\n${calandringBatches.length} cycles programmés\n\nLes machines vont démarrer automatiquement.\nDurée estimée: ${Math.max(...calandringBatches.map(b => b.estimatedDuration))} min`);
    setCurrentStep(7);
  };

  // STEP 7 FUNCTIONS (Récapitulatif)
  const calculateInvoiceAmount = (orderId: string): number => {
    const triage = triagedOrders.find(t => t.orderId === orderId);
    const weighed = weighedOrders.find(w => w.orderId === orderId);
    if (!triage || !weighed) return 0;

    return triage.items.reduce((sum, item) => {
      const linenType = linenTypes.find(lt => lt.id === item.linenTypeId);
      if (!linenType) return sum;

      if (linenType.billingMode === 'Poids') {
        return sum + ((item.weight / 1000) * linenType.unitPrice);
      } else {
        return sum + (item.pieces * linenType.unitPrice);
      }
    }, 0);
  };

  const generateInvoices = () => {
    alert(`✓ Factures générées pour ${selectedOrders.length} commandes\n\nMontant total: ${formatCurrency(
      selectedOrders.reduce((sum, orderId) => sum + calculateInvoiceAmount(orderId), 0)
    )}\n\nLes factures sont prêtes à être envoyées aux clients.`);
  };

  const printDeliverySlips = () => {
    alert(`✓ Bons de livraison imprimés pour ${selectedOrders.length} commandes\n\nRemettez-les aux chauffeurs pour la livraison du linge propre.`);
  };

  const finishDay = () => {
    alert(`✓ Journée terminée !\n\n${selectedOrders.length} commandes traitées\n${weighedOrders.reduce((sum, w) => sum + w.totalWeight, 0) / 1000} kg traités\n\nTout est archivé. À demain !`);

    // Reset for new day
    setCurrentStep(1);
    setSelectedOrders([]);
    setWeighedOrders([]);
    setTriagedOrders([]);
  };

  const currentWeighingOrder = currentWeighingOrderId
    ? orders.find(o => o.id === currentWeighingOrderId)
    : null;

  const currentTriageOrder = currentTriageOrderId
    ? orders.find(o => o.id === currentTriageOrderId)
    : null;

  const currentTriageWeight = currentTriageOrderId
    ? weighedOrders.find(w => w.orderId === currentTriageOrderId)?.totalWeight || 0
    : 0;

  // Helpers pour afficher les noms de types de linge
  const getLinenTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      drap: 'Drap',
      taie: 'Taie d\'oreiller',
      serviette: 'Serviette',
      nappe: 'Nappe',
      torchon: 'Torchon',
      rideau: 'Rideau',
      couverture: 'Couverture',
      housse: 'Housse de couette',
      peignoir: 'Peignoir',
      tapis: 'Tapis'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Workflow Production Quotidien
        </h1>
        <p className="text-gray-600 mt-1">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'COMMANDES', icon: Truck },
              { step: 2, label: 'PESÉE', icon: Scale },
              { step: 3, label: 'VÉRIFICATION', icon: Scissors },
              { step: 4, label: 'LAVAGE', icon: Droplets },
              { step: 5, label: 'SÉCHAGE', icon: Wind },
              { step: 6, label: 'CALANDRAGE', icon: Sparkles },
              { step: 7, label: 'PRÉPARATION', icon: FileText },
            ].map((item, index) => {
              const Icon = item.icon;
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <div key={item.step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted ? 'bg-success text-white' :
                      isActive ? 'bg-accent-500 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <p className={`text-sm font-semibold ${
                      isActive ? 'text-accent-600' : 'text-gray-600'
                    }`}>
                      {item.step}. {item.label}
                    </p>
                  </div>
                  {index < 3 && (
                    <div className={`h-1 flex-1 mx-2 ${
                      currentStep > item.step ? 'bg-success' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* STEP 1: COMMANDES */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Commandes à traiter aujourd'hui</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Vérifiez les commandes collectées ce matin avec les détails saisis par les chauffeurs.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(ordersByVehicle).map(([vehicleId, vehicleOrders]) => {
                const vehicle = vehicles.find(v => v.id === vehicleId);
                if (!vehicle) return null;

                return (
                  <div key={vehicleId} className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-accent-50 rounded-lg">
                      <Truck className="w-5 h-5 text-accent-600" />
                      <div>
                        <p className="font-bold text-gray-900">
                          {vehicle.matricule} - CHAUFFEUR {vehicle.assignedDriverName?.toUpperCase() || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Arrivé à {format(new Date(), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>

                    {vehicleOrders.map((order) => {
                      // Calculer le total d'articles
                      let totalItems = 0;
                      const orderServices: any[] = [];

                      if (order.services && Array.isArray(order.services)) {
                        order.services.forEach((service: any) => {
                          if (service.items && Array.isArray(service.items)) {
                            service.items.forEach((item: any) => {
                              totalItems += item.quantity;
                              orderServices.push(item);
                            });
                          }
                        });
                      }

                      return (
                        <div
                          key={order.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedOrders.includes(order.id)
                              ? 'border-accent-500 bg-accent-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleOrderSelection(order.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                              selectedOrders.includes(order.id)
                                ? 'bg-accent-500 border-accent-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedOrders.includes(order.id) && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {order.clientName} - Commande #{order.orderNumber}
                              </p>

                              {/* Afficher les types et quantités collectés */}
                              <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-2">
                                  Articles collectés ({totalItems} pièces) :
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {orderServices.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <span className="text-gray-600">•</span>
                                      <span className="text-gray-900">
                                        {getLinenTypeName(item.type)}: <strong>{item.quantity}</strong>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {order.collectionPhotos && order.collectionPhotos.length > 0 && (
                                <p className="text-sm text-gray-600 mt-2">
                                  📸 Photos: {order.collectionPhotos.length}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Commandes sélectionnées</p>
                <p className="text-2xl font-bold text-primary-600">{selectedOrders.length} / {todayOrders.length}</p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={goToWeighing}
                disabled={selectedOrders.length === 0}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Passer à la pesée par type
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: PESÉE PAR TYPE */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Pesée par type de linge</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Pesez chaque type de linge individuellement. Le poids global sera calculé automatiquement.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression</span>
                  <span className="font-bold">{weighedOrders.length} / {selectedOrders.length} commandes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-accent-500 h-3 rounded-full transition-all"
                    style={{ width: `${(weighedOrders.length / selectedOrders.length) * 100}%` }}
                  />
                </div>
              </div>

              {currentWeighingOrder && currentWeighingItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-accent-50 border-2 border-accent-500 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {currentWeighingOrder.clientName} - #{currentWeighingOrder.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentWeighingItems.length} types de linge à peser
                    </p>
                  </div>

                  {/* Liste de tous les types de linge */}
                  <div className="space-y-3">
                    {currentWeighingItems.map((item, index) => (
                      <div key={index} className="p-4 border-2 border-primary-200 rounded-lg bg-white">
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600 mb-1">Type de linge</p>
                            <h4 className="text-lg font-bold text-primary-900">
                              {getLinenTypeName(item.linenType)}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Quantité: <strong>{item.quantity} pièces</strong>
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Poids (kg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="0.0"
                              className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-lg font-bold text-center focus:border-primary-500 focus:outline-none"
                              value={item.weight > 0 ? item.weight / 1000 : ''}
                              onChange={(e) => updateItemWeight(index, parseFloat(e.target.value || '0'))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Poids total */}
                  <div className="p-4 bg-primary-50 border-2 border-primary-300 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Poids total:</span>
                      <span className="text-3xl font-bold text-primary-900">
                        {(currentWeighingItems.reduce((sum, item) => sum + item.weight, 0) / 1000).toFixed(2)} kg
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={validateOrderWeighing}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Valider la pesée de cette commande
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Toutes les commandes ont été pesées !
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {weighedOrders.length} commandes • Total: {formatWeight(weighedOrders.reduce((sum, w) => sum + w.totalWeight, 0))}
                  </p>
                  <Button variant="primary" size="lg" onClick={goToTriage}>
                    <Scissors className="w-5 h-5 mr-2" />
                    Passer à la vérification du triage
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: VÉRIFICATION (Triage) */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Vérification du triage</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Vérifiez et confirmez le tri effectué par l'hôtel. Ajustez si nécessaire.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression</span>
                  <span className="font-bold">{triagedOrders.length} / {selectedOrders.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-accent-500 h-3 rounded-full transition-all"
                    style={{ width: `${(triagedOrders.length / selectedOrders.length) * 100}%` }}
                  />
                </div>
              </div>

              {currentTriageOrder ? (
                <div className="space-y-4">
                  <div className="p-4 bg-accent-50 border-2 border-accent-500 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {currentTriageOrder.clientName} - #{currentTriageOrder.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Poids total pesé: <strong>{formatWeight(currentTriageWeight)}</strong>
                    </p>
                  </div>

                  {/* Afficher ce qui a été pesé */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Articles pesés :</p>
                    {weighedOrders.find(w => w.orderId === currentTriageOrderId)?.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-blue-800 py-1">
                        <span>{getLinenTypeName(item.linenType)} ({item.quantity} pièces)</span>
                        <span className="font-semibold">{(item.weight / 1000).toFixed(2)} kg</span>
                      </div>
                    ))}
                  </div>

                  {/* Triage Items */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Vérification et ajustements (quantités du client) :
                    </p>
                    {currentTriageItems.map((item, index) => {
                      const selectedLinenType = linenTypes.find(lt => lt.id === item.linenTypeId);

                      return (
                        <div key={index} className="p-4 border-2 border-primary-200 rounded-lg bg-primary-50">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <select
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                  value={item.linenTypeId}
                                  onChange={(e) => updateTriageItem(index, 'linenTypeId', e.target.value)}
                                >
                                  <option value="">Sélectionner un type...</option>
                                  {linenTypes.map((lt) => (
                                    <option key={lt.id} value={lt.id}>
                                      {lt.name} ({lt.billingMode === 'Poids' ? 'au poids' : 'à la pièce'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {selectedLinenType && (
                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                  <label className="block text-sm text-gray-600 mb-1">
                                    Quantité (pièces)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-lg font-semibold"
                                    value={item.pieces || ''}
                                    onChange={(e) => updateTriageItem(index, 'pieces', parseInt(e.target.value || '0'))}
                                    placeholder="Quantité"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => removeTriageItem(index)}
                                  >
                                    Retirer
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <Button variant="outline" className="w-full" onClick={addTriageItem}>
                      + Ajouter un type de linge
                    </Button>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={validateTriage}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Valider la vérification
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Toutes les vérifications sont terminées !
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {triagedOrders.length} commandes vérifiées
                  </p>
                  <Button variant="primary" size="lg" onClick={goToWashing}>
                    <Scale className="w-5 h-5 mr-2" />
                    Passer au dispatching de lavage
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: LAVAGE (Dispatching intelligent) */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Dispatching intelligent - Lavage</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Optimisation automatique du chargement des machines pour économiser les ressources
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Statistiques globales */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                  <p className="text-sm text-gray-600 mb-1">Cycles programmés</p>
                  <p className="text-3xl font-bold text-primary-900">{washingBatches.length}</p>
                </div>
                <div className="p-4 bg-accent-50 rounded-lg border-2 border-accent-200">
                  <p className="text-sm text-gray-600 mb-1">Poids total</p>
                  <p className="text-3xl font-bold text-accent-900">
                    {formatWeight(washingBatches.reduce((sum, b) => sum + b.totalWeight, 0))}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Taux d'utilisation moyen</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {(washingBatches.reduce((sum, b) => sum + b.utilizationRate, 0) / washingBatches.length).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Liste des batches */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Plan de lavage optimisé</h3>
                {washingBatches.map((batch, index) => (
                  <div key={batch.id} className="p-4 border-2 border-gray-200 rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          Cycle {index + 1} - {batch.machineName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {batch.programName} • {batch.estimatedDuration} min
                        </p>
                      </div>
                      <Badge variant={batch.utilizationRate > 80 ? 'success' : batch.utilizationRate > 60 ? 'warning' : 'gray'}>
                        {batch.utilizationRate.toFixed(0)}% de capacité
                      </Badge>
                    </div>

                    {/* Types de linge dans ce batch */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {batch.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{item.linenTypeName}</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold">{item.quantity} pcs</span>
                            <span className="text-xs text-gray-500 ml-2">{formatWeight(item.weight)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Métriques du batch */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-xs text-gray-600">Poids total</p>
                        <p className="text-sm font-bold text-gray-900">{formatWeight(batch.totalWeight)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Capacité machine</p>
                        <p className="text-sm font-bold text-gray-900">{formatWeight(batch.capacity)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Eau consommée</p>
                        <p className="text-sm font-bold text-gray-900">{batch.waterConsumption}L</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="primary" size="lg" className="flex-1" onClick={startWashing}>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Lancer le lavage ({washingBatches.length} cycles)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: SÉCHAGE (Dispatching intelligent) */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Dispatching intelligent - Séchage</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Optimisation automatique du chargement des sécheuses pour économiser l'énergie
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Statistiques globales */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                  <p className="text-sm text-gray-600 mb-1">Cycles programmés</p>
                  <p className="text-3xl font-bold text-primary-900">{dryingBatches.length}</p>
                </div>
                <div className="p-4 bg-accent-50 rounded-lg border-2 border-accent-200">
                  <p className="text-sm text-gray-600 mb-1">Poids total</p>
                  <p className="text-3xl font-bold text-accent-900">
                    {formatWeight(dryingBatches.reduce((sum, b) => sum + b.totalWeight, 0))}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Taux d'utilisation moyen</p>
                  <p className="text-3xl font-bold text-green-900">
                    {(dryingBatches.reduce((sum, b) => sum + b.utilizationRate, 0) / dryingBatches.length).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Liste des batches */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Plan de séchage optimisé</h3>
                {dryingBatches.map((batch, index) => (
                  <div key={batch.id} className="p-4 border-2 border-gray-200 rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          Cycle {index + 1} - {batch.machineName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {batch.programName} • {batch.estimatedDuration} min
                        </p>
                      </div>
                      <Badge variant={batch.utilizationRate > 80 ? 'success' : batch.utilizationRate > 60 ? 'warning' : 'gray'}>
                        {batch.utilizationRate.toFixed(0)}% de capacité
                      </Badge>
                    </div>

                    {/* Types de linge dans ce batch */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {batch.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{item.linenTypeName}</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold">{item.quantity} pcs</span>
                            <span className="text-xs text-gray-500 ml-2">{formatWeight(item.weight)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Métriques du batch */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-xs text-gray-600">Poids total</p>
                        <p className="text-sm font-bold text-gray-900">{formatWeight(batch.totalWeight)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Capacité machine</p>
                        <p className="text-sm font-bold text-gray-900">{formatWeight(batch.capacity)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Énergie consommée</p>
                        <p className="text-sm font-bold text-gray-900">{batch.energyConsumption} kWh</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="primary" size="lg" className="flex-1" onClick={startDrying}>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Lancer le séchage ({dryingBatches.length} cycles)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: CALANDRAGE (Repassage/Finition) */}
      {currentStep === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Dispatching intelligent - Calandrage/Pressage</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Optimisation automatique pour le repassage et la finition du linge
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Statistiques globales */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                  <p className="text-sm text-gray-600 mb-1">Cycles programmés</p>
                  <p className="text-3xl font-bold text-primary-900">{calandringBatches.length}</p>
                </div>
                <div className="p-4 bg-accent-50 rounded-lg border-2 border-accent-200">
                  <p className="text-sm text-gray-600 mb-1">Pièces totales</p>
                  <p className="text-3xl font-bold text-accent-900">
                    {calandringBatches.reduce((sum, b) => sum + b.totalPieces, 0)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Taux d'utilisation moyen</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {(calandringBatches.reduce((sum, b) => sum + b.utilizationRate, 0) / calandringBatches.length).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Liste des batches */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Plan de calandrage/pressage optimisé</h3>
                {calandringBatches.map((batch, index) => (
                  <div key={batch.id} className="p-4 border-2 border-gray-200 rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          Cycle {index + 1} - {batch.machineName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {batch.programName} • {batch.estimatedDuration} min
                        </p>
                      </div>
                      <Badge variant={batch.utilizationRate > 80 ? 'success' : batch.utilizationRate > 60 ? 'warning' : 'gray'}>
                        {batch.utilizationRate.toFixed(0)}% de capacité
                      </Badge>
                    </div>

                    {/* Types de linge dans ce batch */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {batch.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{item.linenTypeName}</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold">{item.quantity} pièces</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Métriques du batch */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-xs text-gray-600">Pièces totales</p>
                        <p className="text-sm font-bold text-gray-900">{batch.totalPieces}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Capacité machine</p>
                        <p className="text-sm font-bold text-gray-900">{batch.capacity} pcs</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Énergie consommée</p>
                        <p className="text-sm font-bold text-gray-900">{batch.energyConsumption} kWh</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="primary" size="lg" className="flex-1" onClick={startCalandring}>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Lancer le calandrage/pressage ({calandringBatches.length} cycles)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 7: RÉCAPITULATIF */}
      {currentStep === 7 && (
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif final</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Vérifiez le récapitulatif. Les factures seront générées selon les modes de facturation configurés.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary for each order */}
              {selectedOrders.map((orderId, index) => {
                const order = orders.find(o => o.id === orderId);
                const weighed = weighedOrders.find(w => w.orderId === orderId);
                const triage = triagedOrders.find(t => t.orderId === orderId);
                if (!order || !weighed) return null;

                const invoiceAmount = calculateInvoiceAmount(orderId);

                return (
                  <div key={orderId} className="p-4 border-2 border-gray-200 rounded-lg bg-white">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {index + 1}. {order.clientName}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Poids total:</span>
                        <span className="font-bold">{formatWeight(weighed.totalWeight)}</span>
                      </div>
                      <div className="mt-2 p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 mb-2">Détail pesée par type:</p>
                        <ul className="space-y-1">
                          {weighed.items.map((item, idx) => (
                            <li key={idx} className="text-sm flex justify-between">
                              <span>{getLinenTypeName(item.linenType)} ({item.quantity} pcs)</span>
                              <span className="font-semibold">{formatWeight(item.weight)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {triage && triage.items.length > 0 && (
                        <div className="mt-2 p-3 bg-blue-50 rounded">
                          <p className="text-xs text-blue-800 mb-2">Ajustements de vérification:</p>
                          <ul className="space-y-1">
                            {triage.items.map((item, idx) => {
                              const lt = linenTypes.find(l => l.id === item.linenTypeId);
                              if (!lt) return null;
                              return (
                                <li key={idx} className="text-sm text-blue-900">
                                  - {lt.name}: {lt.billingMode === 'Poids'
                                    ? formatWeight(item.weight)
                                    : `${item.pieces} pièces`
                                  }
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="text-gray-600">→ Facture estimée:</span>
                        <span className="font-bold text-success text-lg">{formatCurrency(invoiceAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total Summary */}
              <div className="p-6 bg-primary-50 border-2 border-primary-200 rounded-lg">
                <h3 className="text-xl font-bold text-primary-900 mb-4">
                  TOTAL JOUR - {format(new Date(), 'd MMMM yyyy', { locale: fr })}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Poids total traité</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatWeight(weighedOrders.reduce((sum, w) => sum + w.totalWeight, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Montant total facturé</p>
                    <p className="text-3xl font-bold text-success">
                      {formatCurrency(selectedOrders.reduce((sum, orderId) => sum + calculateInvoiceAmount(orderId), 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button variant="primary" size="lg" onClick={generateInvoices}>
                  <FileText className="w-5 h-5 mr-2" />
                  Générer les factures
                </Button>
                <Button variant="outline" size="lg" onClick={printDeliverySlips}>
                  <Printer className="w-5 h-5 mr-2" />
                  Imprimer bons de livraison
                </Button>
                <Button variant="secondary" size="lg" onClick={finishDay}>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Terminer la journée
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-primary-900 mb-1">
                Nouveau workflow avec pesée par type
              </h4>
              <p className="text-sm text-primary-700">
                Chaque type de linge est pesé individuellement pour une facturation précise.
                L'étape de vérification permet de confirmer le tri effectué par l'hôtel et d'ajuster si nécessaire.
                La facturation se fait selon le mode configuré (poids ou pièce) pour chaque type de linge.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
