import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Server,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { formatCnpj, isValidCnpj } from '../utils/cnpj';

interface AuthPageProps {
  initialMode: 'login' | 'register';
}

export function AuthPage({ initialMode }: AuthPageProps) {
  const { isAuthenticated, loginCompany, registerCompany } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showServerConfig, setShowServerConfig] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(() => getApiBaseUrl());
  const [serverSavedNotice, setServerSavedNotice] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/painel/vagas" replace />;
  }

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError(null);
    navigate(nextMode === 'login' ? '/login' : '/cadastro', { replace: true });
  };

  const fillDemoAccount = () => {
    setError(null);
    setEmail('empresa@trabalhaki.com');
    setPassword('123456');
  };

  const handleSaveServerUrl = () => {
    const saved = setApiBaseUrl(apiUrlInput);
    setApiUrlInput(saved);
    setServerSavedNotice(`Servidor configurado para ${saved}`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setError('Informe o e-mail corporativo e a senha para entrar.');
        return;
      }
    } else {
      if (!companyName.trim() || !cnpj.trim() || !email.trim() || !password) {
        setError('Preencha todos os campos obrigatórios para cadastrar sua empresa.');
        return;
      }
      if (!isValidCnpj(cnpj)) {
        setError('O CNPJ informado não é válido estruturalmente. Confira os 14 dígitos.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginCompany(email, password);
      } else {
        await registerCompany({ companyName, cnpj, email, password });
      }
      navigate('/painel/vagas', { replace: true });
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError('Não foi possível concluir a autenticação. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div>
          <Link to="/" className="brand-mark" style={{ color: '#ffffff' }}>
            <span className="brand-icon" aria-hidden="true">
              <Briefcase size={20} strokeWidth={2.3} />
            </span>
            <span>Trabalhaki Empresas</span>
          </Link>

          <div style={{ marginTop: 48 }}>
            <h1>Gerencie vagas e dê match nos talentos certos.</h1>
            <p className="auth-aside-lead">
              Acesso exclusivo para empresas contratantes e recrutadores. Candidatos utilizam o
              aplicativo mobile para explorar vagas e demonstrar interesse.
            </p>
          </div>

          <div className="auth-highlights">
            <div className="auth-highlight-item">
              <CheckCircle2 size={18} color="#86e5a1" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Crie e controle suas vagas com requisitos, salário e benefícios.</span>
            </div>
            <div className="auth-highlight-item">
              <CheckCircle2 size={18} color="#86e5a1" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Avalie no swipe apenas profissionais que já curtiram a vaga.</span>
            </div>
            <div className="auth-highlight-item">
              <CheckCircle2 size={18} color="#86e5a1" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Inicie o chat pós-match e conduza etapas do processo seletivo.</span>
            </div>
          </div>
        </div>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#c2c9e6',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} />
          Voltar para a página inicial
        </Link>
      </aside>

      <main className="auth-main">
        <div className="auth-panel">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <Link to="/" className="btn btn-ghost btn-sm" style={{ paddingLeft: 6 }}>
              <ArrowLeft size={15} />
              Início
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowServerConfig((prev) => !prev)}
            >
              <Server size={15} />
              API
            </button>
          </div>

          {showServerConfig && (
            <div
              className="alert alert-info"
              style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: 18 }}
            >
              <label htmlFor="api-base-url" className="field-label">
                URL base do back-end
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="api-base-url"
                  className="input"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="http://localhost:8080/api/v1"
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveServerUrl}>
                  Salvar
                </button>
              </div>
              {serverSavedNotice && (
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{serverSavedNotice}</span>
              )}
            </div>
          )}

          <div className="auth-tabs" role="tablist" aria-label="Modo de autenticação empresarial">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className="auth-tab"
              onClick={() => switchMode('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className="auth-tab"
              onClick={() => switchMode('register')}
            >
              Cadastrar empresa
            </button>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {mode === 'login' ? 'Acesso da Empresa' : 'Cadastre sua empresa'}
          </h2>
          <p style={{ marginTop: 6, marginBottom: 20, color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
            {mode === 'login'
              ? 'Entre com uma conta empresarial (ADMIN ou RECRUITER) para acessar o painel.'
              : 'Crie o perfil da empresa com CNPJ e conta administradora para publicar vagas.'}
          </p>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 18 }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <>
                <div className="field">
                  <label htmlFor="companyName" className="field-label">
                    Nome da empresa *
                  </label>
                  <input
                    id="companyName"
                    className="input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Tech Corp Brasil"
                  />
                </div>

                <div className="field">
                  <label htmlFor="cnpj" className="field-label">
                    CNPJ *
                  </label>
                  <input
                    id="cnpj"
                    className="input mono"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    inputMode="numeric"
                  />
                </div>
              </>
            )}

            <div className="field">
              <label htmlFor="email" className="field-label">
                E-mail corporativo *
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rh@suaempresa.com.br"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password" className="field-label">
                Senha *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingRight: 44 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 0,
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    padding: 6,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ marginTop: 6, width: '100%' }}
            >
              {isSubmitting
                ? 'Autenticando...'
                : mode === 'login'
                  ? 'Acessar Painel da Empresa'
                  : 'Criar conta e acessar painel'}
            </button>
          </form>

          {mode === 'login' && (
            <div
              style={{
                marginTop: 22,
                padding: 14,
                borderRadius: 14,
                backgroundColor: '#eef2ff',
                border: '1px solid rgba(57, 59, 231, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                }}
              >
                <Sparkles size={15} />
                Conta de demonstração empresarial
              </div>
              <p style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Use os dados pré-carregados no servidor para testar vagas, swipe de candidatos e chat.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10, width: '100%', justifyContent: 'flex-start' }}
                onClick={fillDemoAccount}
              >
                <Building2 size={15} color="#393be7" />
                <span className="mono" style={{ fontSize: '0.8rem' }}>
                  empresa@trabalhaki.com / 123456
                </span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
