import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { formatCnpj, isValidCnpj } from '../utils/cnpj';
import { BrandMark } from '../components/BrandMark';

interface AuthPageProps {
  initialMode: 'login' | 'register';
}

const isDevMode = import.meta.env.DEV;

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
          <Link to="/" aria-label="Trabalhaki Empresas — Página inicial">
            <BrandMark variant="inverted" badge="Empresas" />
          </Link>

          <div className="auth-aside-body">
            <h1>Gerencie vagas e dê match nos talentos certos.</h1>
            <p className="auth-aside-lead">
              Acesso exclusivo para empresas contratantes e recrutadores. Candidatos utilizam o
              aplicativo mobile para explorar vagas e demonstrar interesse.
            </p>
          </div>

          <div className="auth-highlights">
            <div className="auth-highlight-item">
              <CheckCircle2 size={18} className="icon-mint flow-list-icon" />
              <span>Crie e controle suas vagas com requisitos, salário e benefícios.</span>
            </div>
            <div className="auth-highlight-item">
              <CheckCircle2 size={18} className="icon-mint flow-list-icon" />
              <span>Avalie na triagem apenas profissionais que já curtiram a vaga.</span>
            </div>
            <div className="auth-highlight-item">
              <CheckCircle2 size={18} className="icon-mint flow-list-icon" />
              <span>Inicie o chat pós-match e conduza etapas do processo seletivo.</span>
            </div>
          </div>
        </div>

        <Link to="/" className="auth-aside-back">
          <ArrowLeft size={16} />
          Voltar para a página inicial
        </Link>
      </aside>

      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Link to="/" aria-label="Trabalhaki Empresas — Página inicial">
            <BrandMark compact badge="Empresas" />
          </Link>
          <Link to="/" className="btn btn-ghost btn-sm">
            <ArrowLeft size={15} />
            Início
          </Link>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-top">
            <Link to="/" className="btn btn-ghost btn-sm hide-on-mobile">
              <ArrowLeft size={15} />
              Início
            </Link>
            {isDevMode && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowServerConfig((prev) => !prev)}
              >
                <Server size={15} />
                API
              </button>
            )}
          </div>

          {isDevMode && showServerConfig && (
            <div className="alert alert-info alert-stack">
              <label htmlFor="api-base-url" className="field-label">
                URL base do servidor (modo desenvolvimento)
              </label>
              <div className="row-wrap">
                <input
                  id="api-base-url"
                  className="input flex-1"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="http://localhost:8080/api/v1"
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveServerUrl}>
                  Salvar
                </button>
              </div>
              {serverSavedNotice && <span className="text-xs">{serverSavedNotice}</span>}
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

          <h2 className="auth-panel-title">
            {mode === 'login' ? 'Acesso da Empresa' : 'Cadastre sua empresa'}
          </h2>
          <p className="auth-panel-subtitle">
            {mode === 'login'
              ? 'Entre com sua conta empresarial para acessar o painel.'
              : 'Crie o perfil da empresa com CNPJ e conta administradora para publicar vagas.'}
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} className="icon-shrink" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack-md">
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
              <div className="input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input input-with-toggle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Autenticando...'
                : mode === 'login'
                  ? 'Acessar Painel da Empresa'
                  : 'Criar conta e acessar painel'}
            </button>
          </form>

          {isDevMode && mode === 'login' && (
            <div className="auth-dev-section">
              <div className="auth-dev-heading">
                <ShieldCheck size={15} />
                Conta de demonstração (ambiente local)
              </div>
              <p className="text-xs text-muted">
                Use os dados locais para testar vagas, triagem de candidatos e chat.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm auth-dev-btn"
                onClick={fillDemoAccount}
              >
                <Building2 size={15} className="icon-primary" />
                <span className="mono text-xs">empresa@trabalhaki.com / 123456</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
