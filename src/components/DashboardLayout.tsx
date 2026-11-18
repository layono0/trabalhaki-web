import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Flame,
  LogOut,
  Menu,
  MessageSquare,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, resolveAssetUrl } from '../services/api';
import { getInitials } from '../utils/formatters';

export function DashboardLayout() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingApplicantsTotal, setPendingApplicantsTotal] = useState(0);
  const [matchesTotal, setMatchesTotal] = useState(0);

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
          className="overlay-backdrop"
          style={{ justifyContent: 'flex-start' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Menu empresarial">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/" className="brand-mark">
              <span className="brand-icon" aria-hidden="true">
                <Briefcase size={19} strokeWidth={2.3} />
              </span>
              <span>Trabalhaki</span>
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
            <div className="avatar-badge" style={{ width: 40, height: 40, fontSize: '0.82rem' }}>
              {logoSrc ? (
                <img src={logoSrc} alt={company?.name || 'Logo da empresa'} />
              ) : (
                getInitials(company?.name || user?.email)
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {company?.name || 'Sua empresa'}
              </div>
              <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className={`badge ${company?.planType === 'PREMIUM' ? 'badge-indigo' : 'badge-mint'}`}
                  style={{ padding: '2px 7px', fontSize: '0.7rem' }}
                >
                  Plano {company?.planType || 'FREE'}
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
                <Flame size={18} />
                Swipe de Candidatos
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
          <div style={{ padding: '0 6px' }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {user?.companyRole === 'ADMIN' ? 'Administrador da conta' : 'Recrutador'}
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
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
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
