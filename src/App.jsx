import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { PageLoader } from './components/ui/Feedback.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const LoginPage = lazy(() => import('./pages/admin/LoginPage.jsx'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const ApplicationsPage = lazy(() => import('./pages/admin/ApplicationsPage.jsx'));
const ApplicationDetailPage = lazy(() => import('./pages/admin/ApplicationDetailPage.jsx'));
const DepartmentsPage = lazy(() => import('./pages/admin/DepartmentsPage.jsx'));
const AuditPage = lazy(() => import('./pages/admin/AuditPage.jsx'));
const IntegrationPage = lazy(() => import('./pages/admin/IntegrationPage.jsx'));
const AttendancePage = lazy(() => import('./pages/admin/AttendancePage.jsx'));
const SvPersonnelPage = lazy(() => import('./pages/admin/SvPersonnelPage.jsx'));
const SvPersonPage = lazy(() => import('./pages/admin/SvPersonPage.jsx'));
const DevicesPage = lazy(() => import('./pages/admin/DevicesPage.jsx'));
const LogsPage = lazy(() => import('./pages/admin/LogsPage.jsx'));

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="/admin" replace />} />
          <Route path="admin/login" element={<LoginPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="arizalar" element={<ApplicationsPage />} />
            <Route path="arizalar/:id" element={<ApplicationDetailPage />} />
            <Route path="bolimlar" element={<DepartmentsPage />} />
            <Route path="jurnal" element={<AuditPage />} />
            <Route path="integratsiya" element={<IntegrationPage />} />
            <Route path="davomat" element={<AttendancePage />} />
            <Route path="xodimlar" element={<SvPersonnelPage />} />
            <Route path="xodimlar/:recordId" element={<SvPersonPage />} />
            <Route path="qurilmalar" element={<DevicesPage />} />
            <Route path="kirish-chiqish" element={<LogsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontSize: '14px', maxWidth: '420px' },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
