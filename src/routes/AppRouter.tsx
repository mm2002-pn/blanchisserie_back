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
import OrdersKanbanPage from '@/pages/OrdersKanbanPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import TraitementJourPage from '@/pages/TraitementJourPage';
import AtelierJourLayout from '@/pages/AtelierJourLayout';
import InventoryPage from '@/pages/InventoryPage';
import InvoicesPage from '@/pages/InvoicesPage';
import ReportsPage from '@/pages/ReportsPage';
import RoutePlanningPage from '@/pages/RoutePlanningPage';
import RoutePlanningNewPage from '@/pages/RoutePlanningNewPage';
import ReceptionPage from '@/pages/ReceptionPage';
import TriagePage from '@/pages/TriagePage';
import ProductionWorkflowPage from '@/pages/ProductionWorkflowPage';
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
import VehiclesPage from '@/pages/settings/VehiclesPage';
import PdasPage from '@/pages/settings/PdasPage';
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
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="pdas" element={<PdasPage />} />
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
          <Route path={ROUTES.ORDERS_KANBAN} element={<OrdersKanbanPage />} />
          <Route path={ROUTES.ORDER_DETAIL} element={<OrderDetailPage />} />
          {/* Atelier du jour — wrapper unique avec stepper Pesée → Triage → Production.
              Les anciennes routes /reception, /triage, /traitement-jour redirigent vers les sous-routes. */}
          <Route path={ROUTES.ATELIER} element={<AtelierJourLayout />}>
            <Route index element={<Navigate to="pesee" replace />} />
            <Route path="pesee" element={<ReceptionPage />} />
            <Route path="triage" element={<TriagePage />} />
            <Route path="production" element={<TraitementJourPage />} />
          </Route>
          {/* Anciennes URLs → redirections vers le wrapper Atelier */}
          <Route path="/reception" element={<Navigate to={ROUTES.RECEPTION} replace />} />
          <Route path="/triage" element={<Navigate to={ROUTES.TRIAGE} replace />} />
          <Route path="/traitement-jour" element={<Navigate to={ROUTES.TRAITEMENT_JOUR} replace />} />
          <Route
            path={ROUTES.PRODUCTION_DAY}
            element={<Navigate to={ROUTES.ATELIER} replace />}
          />
          <Route path={ROUTES.PRODUCTION} element={<Navigate to={ROUTES.ATELIER} replace />} />
          {/* /workflow-tracking redirige vers le Kanban (vue plus claire) */}
          <Route path={ROUTES.WORKFLOW_TRACKING} element={<Navigate to={ROUTES.ORDERS_KANBAN} replace />} />
          {/* Pages techniques toujours accessibles par URL directe */}
          <Route path={ROUTES.PRODUCTION_WORKFLOW} element={<ProductionWorkflowPage />} />
          <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
          <Route path={ROUTES.INVOICES} element={<InvoicesPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.ESTIMATION_ANALYTICS} element={<EstimationAnalyticsPage />} />
          {/* /schedule redirige vers /route-planning (les tournées couvrent collecte ET livraison) */}
          <Route path={ROUTES.SCHEDULE} element={<Navigate to={ROUTES.ROUTE_PLANNING} replace />} />
          <Route path={ROUTES.ROUTE_PLANNING} element={<RoutePlanningPage />} />
          <Route path={ROUTES.ROUTE_PLANNING_NEW} element={<RoutePlanningNewPage />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
