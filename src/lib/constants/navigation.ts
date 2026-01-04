import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  Calendar,
  Truck,
  Settings,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from './routes';
import { MODULES, type ModuleName } from './permissions';

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission: ModuleName;
}

export interface SettingsNavigationSection {
  section: string;
  items: Array<{
    label: string;
    path: string;
  }>;
}

/**
 * Main sidebar navigation configuration
 */
export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    label: 'Tableau de bord',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    permission: MODULES.DASHBOARD,
  },
  {
    label: 'Clients',
    path: ROUTES.CLIENTS,
    icon: Users,
    permission: MODULES.CLIENTS,
  },
  {
    label: 'Commandes',
    path: ROUTES.ORDERS,
    icon: ShoppingCart,
    permission: MODULES.ORDERS,
  },
  {
    label: 'Workflow Quotidien',
    path: ROUTES.PRODUCTION_WORKFLOW,
    icon: ClipboardList,
    permission: MODULES.PRODUCTION,
  },
  {
    label: 'Inventaire',
    path: ROUTES.INVENTORY,
    icon: Package,
    permission: MODULES.INVENTORY,
  },
  {
    label: 'Factures',
    path: ROUTES.INVOICES,
    icon: FileText,
    permission: MODULES.INVOICES,
  },
  {
    label: 'Rapports',
    path: ROUTES.REPORTS,
    icon: BarChart3,
    permission: MODULES.REPORTS,
  },
  {
    label: 'Planning',
    path: ROUTES.SCHEDULE,
    icon: Calendar,
    permission: MODULES.SCHEDULE,
  },
  {
    label: 'Tournées',
    path: ROUTES.ROUTE_PLANNING,
    icon: Truck,
    permission: MODULES.SCHEDULE,
  },
  {
    label: 'Paramètres',
    path: ROUTES.SETTINGS,
    icon: Settings,
    permission: MODULES.SETTINGS,
  },
];

/**
 * Settings module navigation (17 pages)
 */
export const SETTINGS_NAVIGATION: SettingsNavigationSection[] = [
  {
    section: 'Configuration de base',
    items: [
      {
        label: 'Types de linge',
        path: ROUTES.SETTINGS_LINEN_TYPES,
      },
      {
        label: 'Machines',
        path: ROUTES.SETTINGS_MACHINES,
      },
      {
        label: 'Programmes de lavage',
        path: ROUTES.SETTINGS_WASHING_PROGRAMS,
      },
      {
        label: 'Zones',
        path: ROUTES.SETTINGS_ZONES,
      },
      {
        label: 'Produits lessiviels',
        path: ROUTES.SETTINGS_PRODUCTS,
      },
    ],
  },
  {
    section: 'Commerce',
    items: [
      {
        label: 'Services additionnels',
        path: ROUTES.SETTINGS_ADDITIONAL_SERVICES,
      },
      {
        label: 'Grilles tarifaires',
        path: ROUTES.SETTINGS_TARIFFS,
      },
      {
        label: 'Modèles de contrat',
        path: ROUTES.SETTINGS_CONTRACTS,
      },
    ],
  },
  {
    section: 'Système',
    items: [
      {
        label: 'Jours fériés',
        path: ROUTES.SETTINGS_HOLIDAYS,
      },
      {
        label: 'Notifications',
        path: ROUTES.SETTINGS_NOTIFICATIONS,
      },
      {
        label: 'Utilisateurs et rôles',
        path: ROUTES.SETTINGS_USERS_ROLES,
      },
      {
        label: 'Paramètres entreprise',
        path: ROUTES.SETTINGS_COMPANY,
      },
      {
        label: 'Workflows',
        path: ROUTES.SETTINGS_WORKFLOWS,
      },
    ],
  },
  {
    section: 'Maintenance',
    items: [
      {
        label: "Import/Export",
        path: ROUTES.SETTINGS_IMPORT_EXPORT,
      },
      {
        label: "Journal d'audit",
        path: ROUTES.SETTINGS_AUDIT_LOGS,
      },
      {
        label: 'Diagnostic système',
        path: ROUTES.SETTINGS_DIAGNOSTICS,
      },
      {
        label: 'Sauvegarde',
        path: ROUTES.SETTINGS_BACKUP,
      },
    ],
  },
];
