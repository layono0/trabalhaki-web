import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Flame,
  MapPin,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import type { CreateJobRequest, JobResponse, JobStatus } from '../types/api';
import { formatJobStatus, formatLocation, formatModality, formatSalaryRange } from '../utils/formatters';
import { JobFormDrawer } from '../components/JobFormDrawer';

type StatusFilter = 'ALL' | JobStatus;

export function JobsPage() {
  const { company } = useAuth();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobResponse | null>(null);
  const [confirmCloseJob, setConfirmCloseJob] = useState<JobResponse | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [jobsData, matchesData] = await Promise.all([api.listMyJobs(), api.getMatches()]);
      setJobs(jobsData);
      setMatchesCount(matchesData.length);
      window.dispatchEvent(new Event('trabalhaki:refresh-nav'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as vagas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeJobsCount = useMemo(
    () => jobs.filter((job) => job.status === 'ACTIVE').length,
    [jobs]
  );

  const totalPendingApplicants = useMemo(
    () => jobs.reduce((acc, job) => acc + (job.pendingApplicantsCount || 0), 0),
    [jobs]
  );

  const isFreePlanAtLimit = company?.planType === 'FREE' && activeJobsCount >= 3;

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== 'ALL' && job.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesSkill = job.skills.some((s) => s.skillName.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSkill) return false;
      }
      return true;
    });
  }, [jobs, statusFilter, searchTerm]);

  const handleSaveJob = async (payload: CreateJobRequest, editingJobId?: number) => {
    setFeedback(null);
    if (editingJobId) {
      await api.updateJob(editingJobId, payload);
      setFeedback(`Vaga "${payload.title}" atualizada com sucesso.`);
    } else {
      await api.createJob(payload);
      setFeedback(`Vaga "${payload.title}" publicada com sucesso.`);
    }
    await loadData();
  };

  const handleTogglePause = async (job: JobResponse) => {
    setActionBusyId(job.id);
    setFeedback(null);
    setError(null);
    const nextStatus: JobStatus = job.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.updateJob(job.id, { status: nextStatus });
      setFeedback(
        nextStatus === 'PAUSED'
          ? `Vaga "${job.title}" pausada. Ela não aparecerá em novas recomendações até ser reativada.`
          : `Vaga "${job.title}" reativada com sucesso.`
      );
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Erro ao atualizar status da vaga.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCloseJob = async () => {
    if (!confirmCloseJob) return;
    setActionBusyId(confirmCloseJob.id);
    setFeedback(null);
    setError(null);
    try {
      await api.closeJob(confirmCloseJob.id);
      setFeedback(`Vaga "${confirmCloseJob.title}" encerrada definitivamente.`);
      setConfirmCloseJob(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Erro ao encerrar vaga.');
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel de Vagas</h1>
          <p className="page-subtitle">
            Publique oportunidades estruturadas e acompanhe os candidatos interessados para o swipe.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingJob(null);
            setDrawerOpen(true);
          }}
        >
          <Plus size={18} />
          Nova Vaga
        </button>
      </div>

      <section className="summary-strip" aria-label="Resumo operacional">
        <div className="summary-tile">
          <div>
            <div className="summary-value">
              {company?.planType === 'FREE' ? `${activeJobsCount} / 3` : activeJobsCount}
            </div>
            <div className="summary-label">
              {company?.planType === 'FREE' ? 'Vagas ativas no plano FREE' : 'Vagas ativas no plano PREMIUM'}
            </div>
          </div>
          <span className="badge badge-indigo">
            <Briefcase size={14} />
            {company?.planType || 'FREE'}
          </span>
        </div>

        <div className="summary-tile">
          <div>
            <div className="summary-value">{totalPendingApplicants}</div>
            <div className="summary-label">Candidatos aguardando swipe</div>
          </div>
          <Link to="/painel/swipe" className="btn btn-secondary btn-sm">
            Abrir swipe
          </Link>
        </div>

        <div className="summary-tile">
          <div>
            <div className="summary-value">{matchesCount}</div>
            <div className="summary-label">Matches realizados</div>
          </div>
          <Link to="/painel/chat" className="btn btn-secondary btn-sm">
            Ver chat
          </Link>
        </div>
      </section>

      {isFreePlanAtLimit && (
        <div className="alert alert-info" style={{ marginBottom: 18 }}>
          <Sparkles size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Sua empresa atingiu o limite de <strong>3 vagas ativas</strong> do plano gratuito. Para
            publicar outra vaga agora, pause ou encerre uma vaga ativa.
          </span>
        </div>
      )}

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: 18 }}>
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 18 }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="toolbar-row">
        <div className="filter-pills" role="group" aria-label="Filtrar vagas por status">
          {[
            { key: 'ALL', label: `Todas (${jobs.length})` },
            { key: 'ACTIVE', label: 'Ativas' },
            { key: 'PAUSED', label: 'Pausadas' },
            { key: 'CLOSED', label: 'Encerradas' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`filter-pill ${statusFilter === item.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(item.key as StatusFilter)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-secondary)',
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: 36, minHeight: 38 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou skill..."
            aria-label="Buscar vagas"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <p style={{ color: 'var(--color-text-secondary)' }}>Carregando vagas da empresa...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Briefcase size={24} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {jobs.length === 0 ? 'Nenhuma vaga publicada ainda' : 'Nenhuma vaga encontrada com esse filtro'}
          </h2>
          <p style={{ maxWidth: 420, color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
            {jobs.length === 0
              ? 'Crie a primeira vaga para que os candidatos no aplicativo mobile possam descobrir e demonstrar interesse.'
              : 'Limpe o campo de busca ou altere o filtro de status para visualizar suas oportunidades.'}
          </p>
          {jobs.length === 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingJob(null);
                setDrawerOpen(true);
              }}
            >
              <Plus size={17} />
              Publicar primeira vaga
            </button>
          )}
        </div>
      ) : (
        <div className="jobs-list">
          {filteredJobs.map((job) => {
            const statusInfo = formatJobStatus(job.status);
            const badgeClass =
              statusInfo.tone === 'active'
                ? 'badge-mint'
                : statusInfo.tone === 'paused'
                  ? 'badge-amber'
                  : 'badge-danger';

            return (
              <article key={job.id} className="job-row">
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{job.title}</h2>
                    <span className={`badge ${badgeClass}`}>{statusInfo.label}</span>
                    {job.pendingApplicantsCount > 0 && (
                      <span className="badge badge-indigo tabular-nums">
                        <Users size={13} />
                        {job.pendingApplicantsCount} interessado(s) pendente(s)
                      </span>
                    )}
                  </div>

                  <div className="job-row-meta">
                    <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--color-secondary-text)' }}>
                      {formatSalaryRange(job.minimumSalary, job.maximumSalary)}
                    </span>
                    <span>•</span>
                    <span>{formatModality(job.modality)}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} />
                      {formatLocation(job.city, job.state, job.country)}
                    </span>
                    <span>•</span>
                    <span>
                      {job.contractType} • {job.seniorityLevel} ({job.experienceYears} anos)
                    </span>
                  </div>

                  {job.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                      {job.skills.map((skill) => (
                        <span
                          key={`${job.id}-${skill.skillName}`}
                          className={`chip ${skill.skillType === 'REQUIRED' ? 'chip-skill' : ''}`}
                        >
                          {skill.skillName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="job-row-actions">
                  <Link to={`/painel/swipe/${job.id}`} className="btn btn-primary btn-sm">
                    <Flame size={15} />
                    Avaliar ({job.pendingApplicantsCount})
                  </Link>

                  {job.status !== 'CLOSED' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={actionBusyId === job.id}
                        onClick={() => {
                          setEditingJob(job);
                          setDrawerOpen(true);
                        }}
                      >
                        <Pencil size={15} />
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={actionBusyId === job.id}
                        onClick={() => handleTogglePause(job)}
                      >
                        {job.status === 'ACTIVE' ? (
                          <>
                            <PauseCircle size={15} />
                            Pausar
                          </>
                        ) : (
                          <>
                            <PlayCircle size={15} />
                            Reativar
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger-outline btn-sm"
                        disabled={actionBusyId === job.id}
                        onClick={() => setConfirmCloseJob(job)}
                      >
                        <XCircle size={15} />
                        Encerrar
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <JobFormDrawer
        open={drawerOpen}
        editingJob={editingJob}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSaveJob}
      />

      {confirmCloseJob && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="close-job-title">
          <div className="modal-card" style={{ textAlign: 'left' }}>
            <h2 id="close-job-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Encerrar vaga definitivamente?
            </h2>
            <p style={{ marginTop: 10, color: 'var(--color-text-secondary)', fontSize: '0.93rem' }}>
              A vaga <strong>{confirmCloseJob.title}</strong> deixará de receber novas candidaturas e
              matches imediatamente.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmCloseJob(null)}
                disabled={actionBusyId === confirmCloseJob.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger-outline"
                style={{ backgroundColor: 'var(--color-danger)', color: '#ffffff', borderColor: 'transparent' }}
                onClick={handleCloseJob}
                disabled={actionBusyId === confirmCloseJob.id}
              >
                {actionBusyId === confirmCloseJob.id ? 'Encerrando...' : 'Confirmar encerramento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
