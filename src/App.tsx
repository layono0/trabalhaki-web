import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { JobsPage } from './pages/JobsPage';
import { CandidateSwipePage } from './pages/CandidateSwipePage';
import { ChatPage } from './pages/ChatPage';
import { CompanyProfilePage } from './pages/CompanyProfilePage';

function ProtectedCompanyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        Verificando sessão da empresa...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route path="/cadastro" element={<AuthPage initialMode="register" />} />

      <Route path="/painel" element={<ProtectedCompanyRoute />}>
        <Route index element={<Navigate to="/painel/vagas" replace />} />
        <Route path="vagas" element={<JobsPage />} />
        <Route path="swipe" element={<CandidateSwipePage />} />
        <Route path="swipe/:jobId" element={<CandidateSwipePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:matchId" element={<ChatPage />} />
        <Route path="empresa" element={<CompanyProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
