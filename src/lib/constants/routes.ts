/**
 * Application route paths
 */
export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',

  // Main routes
  DASHBOARD: '/',

  // Operational routes
  CLIENTS: '/clients',
  ORDERS: '/orders',
  PRODUCTION: '/production',
  INVENTORY: '/inventory',
  INVOICES: '/invoices',
  REPORTS: '/reports',
  SCHEDULE: '/schedule',
  ROUTE_PLANNING: '/route-planning',
  RECEPTION: '/reception',
  TRIAGE: '/triage',
  PRODUCTION_WORKFLOW: '/production-workflow',
  WORKFLOW_TRACKING: '/workflow-tracking',
  ESTIMATION_ANALYTICS: '/estimation-analytics',

  // Settings module
  SETTINGS: '/settings',
  SETTINGS_LINEN_TYPES: '/settings/linen-types',
  SETTINGS_MACHINES: '/settings/machines',
  SETTINGS_WASHING_PROGRAMS: '/settings/washing-programs',
  SETTINGS_ZONES: '/settings/zones',
  SETTINGS_PRODUCTS: '/settings/products',
  SETTINGS_ADDITIONAL_SERVICES: '/settings/additional-services',
  SETTINGS_TARIFFS: '/settings/tariffs',
  SETTINGS_CONTRACTS: '/settings/contracts',
  SETTINGS_HOLIDAYS: '/settings/holidays',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_USERS_ROLES: '/settings/users-roles',
  SETTINGS_COMPANY: '/settings/company',
  SETTINGS_WORKFLOWS: '/settings/workflows',
  SETTINGS_IMPORT_EXPORT: '/settings/import-export',
  SETTINGS_AUDIT_LOGS: '/settings/audit-logs',
  SETTINGS_DIAGNOSTICS: '/settings/diagnostics',
  SETTINGS_BACKUP: '/settings/backup',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
