import type { UserRole, Permission } from '@/types';

/**
 * Application modules for permission management
 */
export const MODULES = {
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  ORDERS: 'orders',
  PRODUCTION: 'production',
  INVENTORY: 'inventory',
  INVOICES: 'invoices',
  REPORTS: 'reports',
  SCHEDULE: 'schedule',
  SETTINGS: 'settings',
} as const;

export type ModuleKey = keyof typeof MODULES;
export type ModuleName = typeof MODULES[ModuleKey];

/**
 * Default permissions for each role
 * Settings module: Only Administrateur can edit, all can view
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  Administrateur: [
    // Full access to all modules
    {
      module: MODULES.DASHBOARD,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canValidate: true,
    },
    {
      module: MODULES.CLIENTS,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      module: MODULES.ORDERS,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canValidate: true,
    },
    {
      module: MODULES.PRODUCTION,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canValidate: true,
    },
    {
      module: MODULES.INVENTORY,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      module: MODULES.INVOICES,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      module: MODULES.REPORTS,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      module: MODULES.SCHEDULE,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      module: MODULES.SETTINGS,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
  ],

  'Responsable production': [
    {
      module: MODULES.DASHBOARD,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.PRODUCTION,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canValidate: true,
    },
    {
      module: MODULES.ORDERS,
      canView: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
    },
    {
      module: MODULES.INVENTORY,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      module: MODULES.REPORTS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.SETTINGS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  ],

  'Opérateur production': [
    {
      module: MODULES.PRODUCTION,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      module: MODULES.ORDERS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.SETTINGS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  ],

  'Responsable logistique': [
    {
      module: MODULES.DASHBOARD,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.SCHEDULE,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      module: MODULES.ORDERS,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      module: MODULES.CLIENTS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.REPORTS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.SETTINGS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  ],

  Chauffeur: [
    {
      module: MODULES.SCHEDULE,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.ORDERS,
      canView: true,
      canCreate: false,
      canEdit: true, // Can update collection status
      canDelete: false,
    },
  ],

  Comptable: [
    {
      module: MODULES.DASHBOARD,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.INVOICES,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      module: MODULES.REPORTS,
      canView: true,
      canCreate: true,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.CLIENTS,
      canView: true,
      canCreate: false,
      canEdit: true, // Can edit billing info
      canDelete: false,
    },
    {
      module: MODULES.ORDERS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.SETTINGS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  ],

  Commercial: [
    {
      module: MODULES.DASHBOARD,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.CLIENTS,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      module: MODULES.ORDERS,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      module: MODULES.REPORTS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      module: MODULES.SETTINGS,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  ],
};

/**
 * Check if a user role has access to a module
 */
export function hasModuleAccess(role: UserRole, module: ModuleName): boolean {
  const permissions = DEFAULT_PERMISSIONS[role];
  return permissions.some((p) => p.module === module && p.canView);
}

/**
 * Get permission for a specific module and role
 */
export function getModulePermission(
  role: UserRole,
  module: ModuleName
): Permission | undefined {
  const permissions = DEFAULT_PERMISSIONS[role];
  return permissions.find((p) => p.module === module);
}
