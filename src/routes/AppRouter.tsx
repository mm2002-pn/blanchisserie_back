import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { MainLayout } from '@/components/layout';
import { ROUTES } from '@/lib/constants';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';

// Main pages
import DashboardPage from '@/pages/DashboardPage';

// Operational pages
import ClientsPage from '@/pages/ClientsPage';
import OrdersPage from '@/pages/OrdersPage';
import ProductionPage from '@/pages/ProductionPage';
import InventoryPage from '@/pages/InventoryPage';
import InvoicesPage from '@/pages/InvoicesPage';
import ReportsPage from '@/pages/ReportsPage';
import SchedulePage from '@/pages/SchedulePage';
import RoutePlanningPage from '@/pages/RoutePlanningPage';
import ReceptionPage from '@/pages/ReceptionPage';
import TriagePage from '@/pages/TriagePage';
import ProductionWorkflowPage from '@/pages/ProductionWorkflowPage';
import WorkflowTrackingPage from '@/pages/WorkflowTrackingPage';
import EstimationAnalyticsPage from '@/pages/EstimationAnalyticsPage';

// Settings pages
import SettingsPage from '@/pages/settings/SettingsPage';
import LinenTypesPage from '@/pages/settings/LinenTypesPage';
import MachinesPage from '@/pages/settings/MachinesPage';
import WashingProgramsPage from '@/pages/settings/WashingProgramsPage';
import ZonesPage from '@/pages/settings/ZonesPage';
import ProductsPage from '@/pages/settings/ProductsPage';
import AdditionalServicesPage from '@/pages/settings/AdditionalServicesPage';
import TariffsPage from '@/pages/settings/TariffsPage';
import ContractsPage from '@/pages/settings/ContractsPage';
import HolidaysPage from '@/pages/settings/HolidaysPage';
import NotificationsConfigPage from '@/pages/settings/NotificationsConfigPage';
import UsersAndRolesPage from '@/pages/settings/UsersAndRolesPage';
import CompanySettingsPage from '@/pages/settings/CompanySettingsPage';
import WorkflowConfigPage from '@/pages/settings/WorkflowConfigPage';
import DataImportExportPage from '@/pages/settings/DataImportExportPage';
import AuditLogsPage from '@/pages/settings/AuditLogsPage';
import DiagnosticsPage from '@/pages/settings/DiagnosticsPage';
import BackupSettingsPage from '@/pages/settings/BackupSettingsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

          {/* Settings module - nested routes */}
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />}>
            <Route index element={<Navigate to={ROUTES.SETTINGS_LINEN_TYPES} replace />} />
            <Route path="linen-types" element={<LinenTypesPage />} />
            <Route path="machines" element={<MachinesPage />} />
            <Route path="washing-programs" element={<WashingProgramsPage />} />
            <Route path="zones" element={<ZonesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="additional-services" element={<AdditionalServicesPage />} />
            <Route path="tariffs" element={<TariffsPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
            <Route path="notifications" element={<NotificationsConfigPage />} />
            <Route path="users-roles" element={<UsersAndRolesPage />} />
            <Route path="company" element={<CompanySettingsPage />} />
            <Route path="workflows" element={<WorkflowConfigPage />} />
            <Route path="import-export" element={<DataImportExportPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="diagnostics" element={<DiagnosticsPage />} />
            <Route path="backup" element={<BackupSettingsPage />} />
          </Route>

          {/* Operational routes */}
          <Route path={ROUTES.CLIENTS} element={<ClientsPage />} />
          <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
          <Route path={ROUTES.RECEPTION} element={<ReceptionPage />} />
          <Route path={ROUTES.TRIAGE} element={<TriagePage />} />
          <Route path={ROUTES.PRODUCTION_WORKFLOW} element={<ProductionWorkflowPage />} />
          <Route path={ROUTES.PRODUCTION} element={<ProductionPage />} />
          <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
          <Route path={ROUTES.INVOICES} element={<InvoicesPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.WORKFLOW_TRACKING} element={<WorkflowTrackingPage />} />
          <Route path={ROUTES.ESTIMATION_ANALYTICS} element={<EstimationAnalyticsPage />} />
          <Route path={ROUTES.SCHEDULE} element={<SchedulePage />} />
          <Route path={ROUTES.ROUTE_PLANNING} element={<RoutePlanningPage />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
