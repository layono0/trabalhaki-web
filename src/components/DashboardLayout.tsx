import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  LogOut,
  Menu,
  MessageSquare,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, resolveAssetUrl } from '../services/api';
import { getInitials } from '../utils/formatters';
import { formatCompanyRole, formatPlanLabel } from '../utils/constants';
import { BrandMark, TriageIcon } from './BrandMark';
import { useDialogA11y } from '../hooks/useDialogA11y';

export function DashboardLayout() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingApplicantsTotal, setPendingApplicantsTotal] = useState(0);
  const [matchesTotal, setMatchesTotal] = useState(0);

  const { containerRef: sidebarRef, handleBackdropClick } = useDialogA11y<HTMLElement>({
    open: mobileMenuOpen,
    onClose: () => setMobileMenuOpen(false),
  });

  const loadNavCounts = useCallback(async () => {
    try {
      const [jobs, matches] = await Promise.all([api.listMyJobs(), api.getMatches()]);
      const pending = jobs.reduce((acc, j) => acc + (j.pendingApplicantsCount || 0), 0);
      setPendingApplicantsTotal(pending);
      setMatchesTotal(matches.length);
    } catch {
      // Keep previous counts if transient failure occurs
    }
  }, []);

  useEffect(() => {
    loadNavCounts();
    const handler = () => loadNavCounts();
    window.addEventListener('trabalhaki:refresh-nav', handler);
    return () => window.removeEventListener('trabalhaki:refresh-nav', handler);
  }, [loadNavCounts]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const logoSrc = resolveAssetUrl(company?.logoUrl);

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <div
          className="overlay-backdrop overlay-backdrop-start"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        tabIndex={mobileMenuOpen ? -1 : undefined}
        className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        aria-label="Menu empresarial"
      >
        <div>
          <div className="row-between">
            <Link to="/" aria-label="Trabalhaki — Página inicial">
              <BrandMark compact />
            </Link>
            {mobileMenuOpen && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="sidebar-company-box">
            <div className="avatar-badge avatar-sm">
              {logoSrc ? (
                <img src={logoSrc} alt={company?.name || 'Logo da empresa'} />
              ) : (
                getInitials(company?.name || user?.email)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="sidebar-company-name truncate">
                {company?.name || 'Sua empresa'}
              </div>
              <div className="sidebar-company-plan">
                <span
                  className={`badge badge-xs ${
                    company?.planType === 'PREMIUM' ? 'badge-indigo' : 'badge-mint'
                  }`}
                >
                  {formatPlanLabel(company?.planType)}
                </span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/painel/vagas"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sidebar-link-main">
                <Briefcase size={18} />
                Minhas Vagas
              </span>
            </NavLink>

            <NavLink
              to="/painel/swipe"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sidebar-link-main">
                <TriageIcon size={18} />
                Triagem de Candidatos
              </span>
              {pendingApplicantsTotal > 0 && (
                <span className="sidebar-count">{pendingApplicantsTotal}</span>
              )}
            </NavLink>

            <NavLink
              to="/painel/chat"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sidebar-link-main">
                <MessageSquare size={18} />
                Matches & Chat
              </span>
              {matchesTotal > 0 && <span className="sidebar-count">{matchesTotal}</span>}
            </NavLink>

            <NavLink
              to="/painel/empresa"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sidebar-link-main">
                <Building2 size={18} />
                Perfil da Empresa
              </span>
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-meta">
            <div className="sidebar-user-email truncate">{user?.email}</div>
            <div className="sidebar-user-role">
              {formatCompanyRole(user?.companyRole)}
            </div>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            <LogOut size={15} />
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-topbar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={18} />
            Menu
          </button>
          <span className="sidebar-company-name truncate">
            {company?.name || 'Trabalhaki Empresas'}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout} aria-label="Sair">
            <LogOut size={16} />
          </button>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
