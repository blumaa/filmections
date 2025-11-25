import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mond-design-system/theme';
import { ToastProvider } from './providers/ToastProvider';
import { ThemeContextProvider } from './providers/ThemeContext';
import { useThemeContext } from './providers/useThemeContext';
import { StorageProvider } from './providers/StorageProvider';
import { StatsProvider } from './providers/StatsProvider';
import { AuthProvider } from './providers/AuthProvider';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RequireAdmin } from './components/admin/RequireAdmin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { PuzzleQueue } from './pages/admin/PuzzleQueue';
import { GroupGeneratorPage } from './pages/admin/GroupGeneratorPage';
import { GroupPool } from './pages/admin/GroupPool';
import { PuzzleBuilder } from './pages/admin/PuzzleBuilder';
import { ThemeManager as AdminThemeManager } from './pages/admin/ThemeManager';
import { Analytics } from './pages/admin/Analytics';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
    },
  },
});

function ThemedApp() {
  const { theme } = useThemeContext();

  return (
    <ThemeProvider colorScheme={theme}>
      <ToastProvider>
        <BrowserRouter>
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              zIndex: 1000,
            }}
          >
            <ThemeToggle />
          </div>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected admin routes */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/puzzles"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <PuzzleQueue />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/generate"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <GroupGeneratorPage />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/groups"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <GroupPool />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/build"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <PuzzleBuilder />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/themes"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminThemeManager />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <Analytics />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StorageProvider>
          <StatsProvider>
            <ThemeContextProvider>
              <ThemedApp />
            </ThemeContextProvider>
          </StatsProvider>
        </StorageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
