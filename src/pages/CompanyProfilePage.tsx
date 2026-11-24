import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError, resolveAssetUrl } from '../services/api';
import type { CompanyMemberResponse, CompanyRole } from '../types/api';
import { formatCnpj } from '../utils/cnpj';
import { formatDateTime, formatVerificationStatus, getInitials } from '../utils/formatters';
import { BRAZIL_STATES, formatCompanyRole, formatPlanLabel } from '../utils/constants';

export function CompanyProfilePage() {
  const { user, company, setCompanyData } = useAuth();
  const isAdmin = user?.companyRole === 'ADMIN';

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [description, setDescription] = useState('');

  const [members, setMembers] = useState<CompanyMemberResponse[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberRole, setMemberRole] = useState<CompanyRole>('RECRUITER');

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  const populateForm = useCallback((comp: NonNullable<typeof company>) => {
    setName(comp.name || '');
    setIndustry(comp.industry || '');
    setCompanySize(comp.companySize || '');
    setWebsite(comp.website || '');
    setLogoUrl(comp.logoUrl || '');
    setCity(comp.city || '');
    setStateUf(comp.state || '');
    setCountry(comp.country || 'Brasil');
    setDescription(comp.description || '');
  }, []);

  const loadProfileData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [compData, membersData] = await Promise.all([
        api.getMyCompany(),
        api.listCompanyMembers(),
      ]);
      setCompanyData(compData);
      populateForm(compData);
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados da empresa.');
    } finally {
      setIsLoading(false);
    }
  }, [populateForm, setCompanyData]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSaveCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);
    setSuccess(null);
    if (!name.trim()) {
      setError('O nome da empresa não pode ficar vazio.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await api.updateMyCompany({
        name: name.trim(),
        industry: industry.trim(),
        companySize: companySize.trim(),
        website: website.trim(),
        logoUrl: logoUrl.trim(),
        city: city.trim(),
        state: stateUf.trim(),
        country: country.trim() || 'Brasil',
        description: description.trim(),
      });
      setCompanyData(updated);
      populateForm(updated);
      setSuccess('Perfil institucional atualizado com sucesso.');
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error ? err.message : 'Erro ao salvar perfil.'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isAdmin) return;

    setError(null);
    setSuccess(null);
    if (file.size > 3 * 1024 * 1024) {
      setError('O arquivo do logotipo deve ter no máximo 3 MB (PNG, JPEG ou WEBP).');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const updated = await api.uploadCompanyLogo(file);
      setCompanyData(updated);
      populateForm(updated);
      setSuccess('Logotipo enviado e salvo com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar logotipo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setMemberError(null);
    setMemberSuccess(null);

    if (!memberEmail.trim() || memberPassword.length < 6) {
      setMemberError('Informe um e-mail válido e senha com no mínimo 6 caracteres.');
      return;
    }

    setIsAddingMember(true);
    try {
      const created = await api.addCompanyMember({
        email: memberEmail.trim(),
        password: memberPassword,
        companyRole: memberRole,
      });
      setMembers((prev) => [...prev, created]);
      setMemberEmail('');
      setMemberPassword('');
      setMemberSuccess(
        `Membro ${created.email} adicionado como ${formatCompanyRole(created.companyRole)}.`
      );
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Não foi possível adicionar o membro.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const previewLogo = resolveAssetUrl(logoUrl || company?.logoUrl);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Perfil da Empresa</h1>
          <p className="page-subtitle">
            Mantenha os dados institucionais, logotipo e equipe de recrutamento atualizados.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="profile-grid" aria-busy="true" aria-label="Carregando perfil da empresa">
          <div className="skeleton-card" style={{ minHeight: 360 }}>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton skeleton-line" />
          </div>
          <div className="skeleton-card" style={{ minHeight: 260 }}>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" style={{ width: '70%' }} />
          </div>
        </div>
      ) : (
        <div className="profile-grid">
          {/* Dados da empresa */}
          <section className="panel-surface">
            <div className="profile-hero-bar">
              <div className="demo-avatar-group">
                <div className="avatar-badge avatar-xl">
                  {previewLogo ? (
                    <img src={previewLogo} alt={company?.name || 'Logo'} />
                  ) : (
                    getInitials(company?.name)
                  )}
                </div>
                <div>
                  <h2 className="drawer-title">{company?.name}</h2>
                  <div className="mono text-xs text-muted" style={{ marginTop: 3 }}>
                    CNPJ {company?.cnpj ? formatCnpj(company.cnpj) : '—'}
                  </div>
                  <div className="row-wrap" style={{ marginTop: 8 }}>
                    <span className="badge badge-indigo">
                      {formatPlanLabel(company?.planType)}
                    </span>
                    <span
                      className={`badge ${
                        company?.verificationStatus === 'VERIFIED' ? 'badge-mint' : 'badge-neutral'
                      }`}
                    >
                      <ShieldCheck size={13} />
                      {formatVerificationStatus(company?.verificationStatus)}
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <label className="btn btn-secondary btn-sm">
                  <Upload size={15} />
                  {isUploadingLogo ? 'Enviando...' : 'Enviar logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleLogoFileChange}
                    disabled={isUploadingLogo}
                  />
                </label>
              )}
            </div>

            {!isAdmin && (
              <div className="alert alert-info">
                <Building2 size={17} className="icon-shrink" />
                <span>
                  Você acessa como <strong>Recrutador</strong>. Apenas administradores podem alterar
                  dados institucionais ou adicionar membros à equipe.
                </span>
              </div>
            )}

            {error && (
              <div className="alert alert-error" role="alert">
                <AlertCircle size={17} className="icon-shrink" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle2 size={17} className="icon-shrink" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="stack-md">
              <div className="form-grid-2">
                <div className="field">
                  <label htmlFor="comp-name" className="field-label">
                    Nome da empresa *
                  </label>
                  <input
                    id="comp-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="field">
                  <label htmlFor="comp-industry" className="field-label">
                    Setor de atuação
                  </label>
                  <input
                    id="comp-industry"
                    className="input"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Ex: Tecnologia da Informação"
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label htmlFor="comp-size" className="field-label">
                    Porte da empresa
                  </label>
                  <select
                    id="comp-size"
                    className="select"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    disabled={!isAdmin}
                  >
                    <option value="">Selecionar</option>
                    <option value="1-10">1-10 colaboradores</option>
                    <option value="11-50">11-50 colaboradores</option>
                    <option value="50-200">50-200 colaboradores</option>
                    <option value="200-1000">200-1000 colaboradores</option>
                    <option value="1000+">1000+ colaboradores</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="comp-website" className="field-label">
                    Website
                  </label>
                  <input
                    id="comp-website"
                    className="input"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://suaempresa.com.br"
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label htmlFor="comp-city" className="field-label">
                    Cidade
                  </label>
                  <input
                    id="comp-city"
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="field">
                  <label htmlFor="comp-state" className="field-label">
                    Estado (UF)
                  </label>
                  <select
                    id="comp-state"
                    className="select"
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value)}
                    disabled={!isAdmin}
                  >
                    <option value="">Selecionar UF</option>
                    {BRAZIL_STATES.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="comp-logo-url" className="field-label">
                  URL do logotipo (opcional se usar upload)
                </label>
                <input
                  id="comp-logo-url"
                  className="input"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://... ou /api/v1/files/..."
                  disabled={!isAdmin}
                />
              </div>

              <div className="field">
                <label htmlFor="comp-description" className="field-label">
                  Sobre a empresa
                </label>
                <textarea
                  id="comp-description"
                  className="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte sobre cultura, produtos, ambiente de trabalho e diferenciais."
                  disabled={!isAdmin}
                />
              </div>

              {isAdmin && (
                <div className="row-between" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
                  <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                    {isSavingProfile ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* Equipe de recrutamento */}
          <aside className="panel-surface">
            <div className="row-inline">
              <Users size={20} className="icon-primary" />
              <h2 className="job-row-title">Equipe de recrutamento</h2>
            </div>
            <p className="text-muted text-sm" style={{ marginTop: 6 }}>
              Recrutadores vinculados ao mesmo CNPJ compartilham vagas, triagem e conversas.
            </p>

            <div className="stack-sm" style={{ marginTop: 18 }}>
              {members.map((member) => (
                <div key={member.userId} className="member-row">
                  <div className="min-w-0">
                    <div className="sidebar-company-name truncate">{member.email}</div>
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                      Desde {formatDateTime(member.createdAt)}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      member.companyRole === 'ADMIN' ? 'badge-indigo' : 'badge-neutral'
                    }`}
                  >
                    {formatCompanyRole(member.companyRole)}
                  </span>
                </div>
              ))}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddMember} className="member-add-form">
                <div className="row-inline form-section-title">
                  <UserPlus size={17} className="icon-primary" />
                  Adicionar novo membro
                </div>

                {memberError && (
                  <div className="alert alert-error alert-compact" role="alert">
                    <AlertCircle size={16} className="icon-shrink" />
                    <span>{memberError}</span>
                  </div>
                )}

                {memberSuccess && (
                  <div className="alert alert-success alert-compact">
                    <CheckCircle2 size={16} className="icon-shrink" />
                    <span>{memberSuccess}</span>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="member-email" className="field-label">
                    E-mail do membro
                  </label>
                  <input
                    id="member-email"
                    type="email"
                    className="input"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="recrutador@empresa.com"
                  />
                </div>

                <div className="field">
                  <label htmlFor="member-password" className="field-label">
                    Senha inicial
                  </label>
                  <input
                    id="member-password"
                    type="password"
                    className="input"
                    value={memberPassword}
                    onChange={(e) => setMemberPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="field">
                  <label htmlFor="member-role" className="field-label">
                    Papel na empresa
                  </label>
                  <select
                    id="member-role"
                    className="select"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as CompanyRole)}
                  >
                    <option value="RECRUITER">Recrutador (Vagas, triagem e chat)</option>
                    <option value="ADMIN">Administrador (Controle total da conta)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isAddingMember}>
                  {isAddingMember ? 'Adicionando...' : 'Adicionar à equipe'}
                </button>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
