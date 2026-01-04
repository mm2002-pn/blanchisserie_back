import { create } from 'zustand';
import type {
  LinenType,
  Machine,
  WashingProgram,
  Zone,
  Product,
  AdditionalService,
  Tariff,
  CompanySettings,
  Workflow,
  NotificationConfig,
  Holiday,
  ContractTemplate,
  Role,
} from '@/types';

interface SettingsState {
  // Data
  linenTypes: LinenType[];
  machines: Machine[];
  washingPrograms: WashingProgram[];
  zones: Zone[];
  products: Product[];
  additionalServices: AdditionalService[];
  tariffs: Tariff[];
  company: CompanySettings | null;
  workflows: Workflow[];
  notifications: NotificationConfig[];
  holidays: Holiday[];
  contracts: ContractTemplate[];
  roles: Role[];

  // State
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  setLoaded: (loaded: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // CRUD Actions for Linen Types
  setLinenTypes: (types: LinenType[]) => void;
  addLinenType: (type: LinenType) => void;
  updateLinenType: (id: string, updates: Partial<LinenType>) => void;
  deleteLinenType: (id: string) => void;

  // CRUD Actions for Machines
  setMachines: (machines: Machine[]) => void;
  addMachine: (machine: Machine) => void;
  updateMachine: (id: string, updates: Partial<Machine>) => void;
  deleteMachine: (id: string) => void;

  // CRUD Actions for Washing Programs
  setWashingPrograms: (programs: WashingProgram[]) => void;
  addWashingProgram: (program: WashingProgram) => void;
  updateWashingProgram: (id: string, updates: Partial<WashingProgram>) => void;
  deleteWashingProgram: (id: string) => void;

  // CRUD Actions for Zones
  setZones: (zones: Zone[]) => void;
  addZone: (zone: Zone) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;

  // CRUD Actions for Products
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // CRUD Actions for Additional Services
  setAdditionalServices: (services: AdditionalService[]) => void;
  addAdditionalService: (service: AdditionalService) => void;
  updateAdditionalService: (id: string, updates: Partial<AdditionalService>) => void;
  deleteAdditionalService: (id: string) => void;

  // CRUD Actions for Tariffs
  setTariffs: (tariffs: Tariff[]) => void;
  addTariff: (tariff: Tariff) => void;
  updateTariff: (id: string, updates: Partial<Tariff>) => void;
  deleteTariff: (id: string) => void;

  // Company Settings
  setCompany: (company: CompanySettings) => void;
  updateCompany: (updates: Partial<CompanySettings>) => void;

  // Workflows
  setWorkflows: (workflows: Workflow[]) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;

  // Notifications
  setNotifications: (notifications: NotificationConfig[]) => void;
  addNotification: (notification: NotificationConfig) => void;
  updateNotification: (id: string, updates: Partial<NotificationConfig>) => void;
  deleteNotification: (id: string) => void;

  // Holidays
  setHolidays: (holidays: Holiday[]) => void;
  addHoliday: (holiday: Holiday) => void;
  updateHoliday: (id: string, updates: Partial<Holiday>) => void;
  deleteHoliday: (id: string) => void;

  // Contracts
  setContracts: (contracts: ContractTemplate[]) => void;
  addContract: (contract: ContractTemplate) => void;
  updateContract: (id: string, updates: Partial<ContractTemplate>) => void;
  deleteContract: (id: string) => void;

  // Roles
  setRoles: (roles: Role[]) => void;
  addRole: (role: Role) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // Initial Data
  linenTypes: [],
  machines: [],
  washingPrograms: [],
  zones: [],
  products: [],
  additionalServices: [],
  tariffs: [],
  company: null,
  workflows: [],
  notifications: [],
  holidays: [],
  contracts: [],
  roles: [],

  // Initial State
  isLoaded: false,
  isLoading: false,
  error: null,

  // Load Settings
  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      // This will be implemented with mock services
      // For now, just mark as loaded
      set({ isLoaded: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load settings',
        isLoading: false,
      });
    }
  },

  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Linen Types
  setLinenTypes: (types) => set({ linenTypes: types }),
  addLinenType: (type) => set((state) => ({ linenTypes: [...state.linenTypes, type] })),
  updateLinenType: (id, updates) =>
    set((state) => ({
      linenTypes: state.linenTypes.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteLinenType: (id) =>
    set((state) => ({ linenTypes: state.linenTypes.filter((t) => t.id !== id) })),

  // Machines
  setMachines: (machines) => set({ machines }),
  addMachine: (machine) => set((state) => ({ machines: [...state.machines, machine] })),
  updateMachine: (id, updates) =>
    set((state) => ({
      machines: state.machines.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  deleteMachine: (id) => set((state) => ({ machines: state.machines.filter((m) => m.id !== id) })),

  // Washing Programs
  setWashingPrograms: (programs) => set({ washingPrograms: programs }),
  addWashingProgram: (program) =>
    set((state) => ({ washingPrograms: [...state.washingPrograms, program] })),
  updateWashingProgram: (id, updates) =>
    set((state) => ({
      washingPrograms: state.washingPrograms.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteWashingProgram: (id) =>
    set((state) => ({ washingPrograms: state.washingPrograms.filter((p) => p.id !== id) })),

  // Zones
  setZones: (zones) => set({ zones }),
  addZone: (zone) => set((state) => ({ zones: [...state.zones, zone] })),
  updateZone: (id, updates) =>
    set((state) => ({ zones: state.zones.map((z) => (z.id === id ? { ...z, ...updates } : z)) })),
  deleteZone: (id) => set((state) => ({ zones: state.zones.filter((z) => z.id !== id) })),

  // Products
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProduct: (id) => set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

  // Additional Services
  setAdditionalServices: (services) => set({ additionalServices: services }),
  addAdditionalService: (service) =>
    set((state) => ({ additionalServices: [...state.additionalServices, service] })),
  updateAdditionalService: (id, updates) =>
    set((state) => ({
      additionalServices: state.additionalServices.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  deleteAdditionalService: (id) =>
    set((state) => ({ additionalServices: state.additionalServices.filter((s) => s.id !== id) })),

  // Tariffs
  setTariffs: (tariffs) => set({ tariffs }),
  addTariff: (tariff) => set((state) => ({ tariffs: [...state.tariffs, tariff] })),
  updateTariff: (id, updates) =>
    set((state) => ({
      tariffs: state.tariffs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTariff: (id) => set((state) => ({ tariffs: state.tariffs.filter((t) => t.id !== id) })),

  // Company
  setCompany: (company) => set({ company }),
  updateCompany: (updates) => set((state) => ({ company: state.company ? { ...state.company, ...updates } : null })),

  // Workflows
  setWorkflows: (workflows) => set({ workflows }),
  addWorkflow: (workflow) => set((state) => ({ workflows: [...state.workflows, workflow] })),
  updateWorkflow: (id, updates) =>
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
  deleteWorkflow: (id) => set((state) => ({ workflows: state.workflows.filter((w) => w.id !== id) })),

  // Notifications
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [...state.notifications, notification] })),
  updateNotification: (id, updates) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  deleteNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  // Holidays
  setHolidays: (holidays) => set({ holidays }),
  addHoliday: (holiday) => set((state) => ({ holidays: [...state.holidays, holiday] })),
  updateHoliday: (id, updates) =>
    set((state) => ({
      holidays: state.holidays.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),
  deleteHoliday: (id) => set((state) => ({ holidays: state.holidays.filter((h) => h.id !== id) })),

  // Contracts
  setContracts: (contracts) => set({ contracts }),
  addContract: (contract) => set((state) => ({ contracts: [...state.contracts, contract] })),
  updateContract: (id, updates) =>
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? { ...c, ...updates} : c)),
    })),
  deleteContract: (id) => set((state) => ({ contracts: state.contracts.filter((c) => c.id !== id) })),

  // Roles
  setRoles: (roles) => set({ roles }),
  addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
  updateRole: (id, updates) =>
    set((state) => ({ roles: state.roles.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
  deleteRole: (id) => set((state) => ({ roles: state.roles.filter((r) => r.id !== id) })),
}));
