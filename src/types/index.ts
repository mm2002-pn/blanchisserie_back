// ============= TYPES DE LINGE =============
export interface LinenType {
  id: string;
  code: string; // Ex: LP-001
  name: string; // Ex: Drap simple 1 personne
  category: 'Linge Plat' | 'Linge Forme' | 'NAE';
  averageWeight: number; // en grammes
  billingMode: 'Poids' | 'Pièce';
  unitPrice: number;
  estimatedProcessingTime: number; // en minutes
  specialInstructions?: string;
}

// ============= MACHINES =============
export type MachineType = 'Laveuse' | 'Sécheuse' | 'Calandreuse' | 'Repasseuse';
export type MachineStatus = 'Active' | 'En maintenance' | 'Hors service';
export type MachineLocation = 'Zone sale' | 'Zone propre' | 'Zone intermédiaire';

export interface Machine {
  id: string;
  reference: string;
  type: MachineType;
  brand: string;
  model: string;
  capacity: number; // en kg ou kg/h
  location: MachineLocation;
  status: MachineStatus;
  lastMaintenance?: Date;
  dateInstalled: Date;
  waterConsumption?: number;
  electricityConsumption?: number;
  compatiblePrograms: string[]; // IDs des programmes
  maintenanceFrequency?: number; // jours
  maintenanceCost?: number;
  maintenanceProvider?: string;
}

// ============= PROGRAMMES DE LAVAGE =============
export interface WashingProgram {
  id: string;
  code: string;
  name: string;
  temperature: number; // °C
  duration: number; // minutes
  spinLevel: number;
  compatibleLinenTypes: string[]; // IDs des types de linge
  compatibleMachines: string[]; // IDs des machines
  detergentType?: string;
  detergentDosage?: number;
  operatorInstructions?: string;
}

// ============= ZONES ET EMPLACEMENTS =============
export type ZoneType = 'sale' | 'propre' | 'intermédiaire';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  responsibles: string[]; // IDs des utilisateurs
  accessRules?: string;
  equipment: string[]; // IDs des équipements
  allowedTransitions: string[]; // IDs des zones accessibles depuis celle-ci
}

// ============= PRODUITS LESSIVIELS =============
export interface Product {
  id: string;
  reference: string;
  name: string;
  supplier: string;
  currentStock: number;
  minimumStock: number;
  unit: 'litre' | 'kg' | 'bidon';
  unitPrice: number;
  technicalSpecs?: {
    pH?: number;
    composition?: string;
  };
  storageConditions?: string;
  deliveryDelay?: number; // jours
}

// ============= SERVICES ADDITIONNELS =============
export interface AdditionalService {
  id: string;
  code: string;
  name: string;
  description: string;
  unitPrice: number;
  unit: 'pièce' | 'heure' | 'forfait';
  estimatedTime?: number; // minutes
  requiredSkills?: string[];
  compatibleLinenTypes?: string[];
}

// ============= TARIFS =============
export interface PricingTier {
  minWeight: number; // kg
  maxWeight: number; // kg
  pricePerKg: number;
}

export interface Tariff {
  id: string;
  linenTypeId: string;
  defaultPrice: number;
  pricingTiers?: PricingTier[];
  effectiveDate: Date;
}

export interface ClientSpecificTariff {
  id: string;
  clientId: string;
  tariffs: Tariff[];
}

export interface Subscription {
  id: string;
  name: string;
  monthlyPrice: number;
  includedWeight: number; // kg
  overagePrice: number; // prix par kg au-delà
}

// ============= CONTRATS =============
export interface ContractTemplate {
  id: string;
  name: string;
  clientType: string;
  minimumDuration: number; // mois
  noticePeriod: number; // jours
  content: string; // avec variables {NOM_CLIENT}, etc.
  sections: {
    clientCommitments: string;
    laundryCommitments: string;
    paymentTerms: string;
    warranties: string;
    termination: string;
  };
}

// ============= JOURS FÉRIÉS =============
export type ClosureType = 'totale' | 'partielle';

export interface Holiday {
  id: string;
  date: Date;
  name: string;
  closureType: ClosureType;
  description?: string;
}

// ============= NOTIFICATIONS =============
export type NotificationType =
  | 'Nouvelle commande'
  | 'Collecte en retard'
  | 'Machine en panne'
  | 'Stock produit bas'
  | 'Facture impayée'
  | 'Livraison effectuée';

export type NotificationChannel = 'email' | 'sms' | 'app';

export interface NotificationConfig {
  id: string;
  type: NotificationType;
  recipients: string[]; // emails ou numéros
  channels: NotificationChannel[];
  trigger: string;
  messageTemplate: string;
  enabled: boolean;
}

// ============= UTILISATEURS ET RÔLES =============
export type UserRole =
  | 'Administrateur'
  | 'Responsable production'
  | 'Opérateur production'
  | 'Responsable logistique'
  | 'Chauffeur'
  | 'Comptable'
  | 'Commercial';

export interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canValidate?: boolean;
}

export interface Role {
  id: string;
  name: UserRole;
  permissions: Permission[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  customPermissions?: Permission[];
  isActive: boolean;
  lastLogin?: Date;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'Création' | 'Modification' | 'Suppression';
  module: string;
  details: {
    oldValue?: any;
    newValue?: any;
  };
}

// ============= PARAMÈTRES ENTREPRISE =============
export interface CompanySettings {
  id: string;
  officialName: string;
  address: string;
  siret: string;
  phone: string;
  email: string;
  logo?: string;
  signature?: string;
  currency: 'XOF' | 'EUR';
  weightUnit: 'kg' | 'lb';
  dateFormat: string;
  timezone: string;
  integrations?: {
    scalesAPI?: {
      ipAddress: string;
      protocol: string;
    };
    gpsService?: {
      apiKey: string;
    };
    paymentGateway?: {
      apiKey: string;
    };
    emailSMS?: {
      apiKey: string;
    };
  };
  backupSchedule?: {
    frequency: 'daily' | 'weekly';
    time: string;
    location: string;
  };
}

// ============= WORKFLOWS =============
export interface WorkflowStep {
  id: string;
  name: string;
  estimatedDuration: number; // minutes
  responsibleRole: UserRole;
  validationRequired: boolean;
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  applicableLinenTypes?: string[];
  isDefault: boolean;
}

// ============= CLIENTS =============
export interface Client {
  id: string;
  name: string;
  type: 'Hôtel 3 étoiles' | 'Hôtel 4 étoiles' | 'Hôtel 5 étoiles' | 'Restaurant';
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  contractId?: string;
  tariffId?: string;
  isActive: boolean;
  createdAt: Date;
}

// ============= COMMANDES =============
export type OrderStatus =
  | 'En attente'
  | 'Collectée'
  | 'En traitement'
  | 'Terminée'
  | 'Livrée';

export interface OrderItem {
  linenTypeId: string;
  quantity: number;
  weight: number;
  additionalServices?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalWeight: number;
  collectionDate: Date;
  deliveryDate: Date;
  assignedDriverId?: string;
  notes?: string;
  createdAt: Date;
}

// ============= PRODUCTION =============
export interface ProductionBatch {
  id: string;
  orderId: string;
  machineId: string;
  programId: string;
  weight: number;
  linenTypes: string[];
  startTime?: Date;
  endTime?: Date;
  operatorId: string;
  status: 'En attente' | 'En cours' | 'Terminé';
}

// ============= DASHBOARD STATS =============
export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalWeight: number;
  weightChange: number;
  activeClients: number;
  clientsChange: number;
}
