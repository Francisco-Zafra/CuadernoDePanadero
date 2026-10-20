import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { ToastProvider } from '../components/Toast';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { BakesProvider } from '../hooks/useBakes';
import { CatalogProvider } from '../hooks/useCatalog';
import { BakeDetailPage } from '../pages/BakeDetail';
import { BakeEditor } from '../pages/BakeEditor';
import { Calculator } from '../pages/Calculator';
import { Journal } from '../pages/Journal';
import { ConfigMissing, FullPageLoading, Login, NoAccess } from '../pages/Login';
import { Settings } from '../pages/Settings';
import { Stats } from '../pages/Stats';
import { Layout } from './Layout';
import { ScrollToTop } from './ScrollToTop';

function ProtectedApp() {
  const { status } = useAuth();
  switch (status) {
    case 'unconfigured':
      return <ConfigMissing />;
    case 'loading':
    case 'checking':
      return <FullPageLoading />;
    case 'signedOut':
      return <Login />;
    case 'noAccess':
      return <NoAccess />;
    case 'ready':
      return (
        <BakesProvider>
          <CatalogProvider>
            <ScrollToTop />
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Journal />} />
                <Route path="bake/:id" element={<BakeDetailPage />} />
                <Route path="calculator" element={<Calculator />} />
                <Route path="stats" element={<Stats />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route element={<Layout mobileNav={false} />}>
                <Route path="new" element={<BakeEditor mode="new" />} />
                <Route path="new/quick" element={<BakeEditor mode="new" />} />
                <Route path="bake/:id/edit" element={<BakeEditor mode="edit" />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CatalogProvider>
        </BakesProvider>
      );
  }
}

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <ProtectedApp />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}
