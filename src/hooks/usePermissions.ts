import { useAuthStore } from '@/stores/authStore';
import { DEFAULT_PERMISSIONS, type ModuleName } from '@/lib/constants/permissions';
import type { Permission } from '@/types';

/**
 * Custom hook for checking user permissions
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  /**
   * Check if user has a specific permission for a module
   */
  const hasPermission = (module: ModuleName, action: keyof Permission): boolean => {
    if (!user) return false;

    // Administrateur has full access
    if (user.role === 'Administrateur') return true;

    // Check custom permissions first (if user has custom permissions)
    if (user.customPermissions) {
      const customPerm = user.customPermissions.find((p) => p.module === module);
      if (customPerm) {
        return Boolean(customPerm[action] ?? false);
      }
    }

    // Fall back to default role permissions
    const defaultPerms = DEFAULT_PERMISSIONS[user.role];
    const permission = defaultPerms.find((p) => p.module === module);

    return Boolean(permission?.[action] ?? false);
  };

  /**
   * Check if user can view a module
   */
  const canView = (module: ModuleName): boolean => {
    return hasPermission(module, 'canView');
  };

  /**
   * Check if user can create in a module
   */
  const canCreate = (module: ModuleName): boolean => {
    return hasPermission(module, 'canCreate');
  };

  /**
   * Check if user can edit in a module
   */
  const canEdit = (module: ModuleName): boolean => {
    return hasPermission(module, 'canEdit');
  };

  /**
   * Check if user can delete in a module
   */
  const canDelete = (module: ModuleName): boolean => {
    return hasPermission(module, 'canDelete');
  };

  /**
   * Check if user can validate in a module
   */
  const canValidate = (module: ModuleName): boolean => {
    return hasPermission(module, 'canValidate');
  };

  /**
   * Check if user is administrator
   */
  const isAdmin = (): boolean => {
    return user?.role === 'Administrateur';
  };

  /**
   * Get all permissions for a module
   */
  const getModulePermissions = (module: ModuleName): Permission | undefined => {
    if (!user) return undefined;

    // Check custom permissions first
    if (user.customPermissions) {
      const customPerm = user.customPermissions.find((p) => p.module === module);
      if (customPerm) return customPerm;
    }

    // Fall back to default permissions
    const defaultPerms = DEFAULT_PERMISSIONS[user.role];
    return defaultPerms.find((p) => p.module === module);
  };

  return {
    user,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canValidate,
    isAdmin,
    getModulePermissions,
  };
}
