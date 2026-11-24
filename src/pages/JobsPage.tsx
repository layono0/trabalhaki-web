import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Info,
  MapPin,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import type { CreateJobRequest, JobResponse, JobStatus } from '../types/api';
import { formatJobStatus, formatLocation, formatModality, formatSalaryRange } from '../utils/formatters';
import { formatPlanShort } from '../utils/constants';
import { JobFormDrawer } from '../components/JobFormDrawer';
import { TriageIcon } from '../components/BrandMark';
import { useDialogA11y } from '../hooks/useDialogA11y';

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

  const { containerRef: closeModalRef, handleBackdropClick: handleCloseBackdrop } = useDialogA11y({
    open: Boolean(confirmCloseJob),
    onClose: () => {
      if (actionBusyId === null) setConfirmCloseJob(null);
    },
  });

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
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Erro ao atualizar status da vaga.'
      );
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
      setError(
        err instanceof ApiError || err instanceof Error ? err.message : 'Erro ao encerrar vaga.'
      );
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
            Publique oportunidades estruturadas e acompanhe os candidatos interessados para triagem.
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
              {company?.planType === 'PREMIUM'
                ? 'Vagas ativas no plano Premium'
                : 'Vagas ativas no plano gratuito'}
            </div>
          </div>
          <span className="badge badge-indigo">
            <Briefcase size={14} />
            {formatPlanShort(company?.planType)}
          </span>
        </div>

        <div className="summary-tile">
          <div>
            <div className="summary-value">{totalPendingApplicants}</div>
            <div className="summary-label">Candidatos aguardando triagem</div>
          </div>
          <Link to="/painel/swipe" className="btn btn-secondary btn-sm">
            Abrir triagem
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
        <div className="alert alert-info">
          <Info size={18} className="icon-shrink" />
          <span>
            Sua empresa atingiu o limite de <strong>3 vagas ativas</strong> do plano gratuito. Para
            publicar outra vaga agora, pause ou encerre uma vaga ativa.
          </span>
        </div>
      )}

      {feedback && (
        <div className="alert alert-success">
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} className="icon-shrink" />
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

        <div className="input-wrap toolbar-search">
          <Search size={16} className="input-leading-icon" />
          <input
            className="input input-compact input-with-icon"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou competência..."
            aria-label="Buscar vagas"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="jobs-list" aria-busy="true" aria-label="Carregando vagas">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="skeleton-card">
              <div className="row-wrap">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-pill" />
              </div>
              <div className="skeleton skeleton-line" style={{ width: '74%' }} />
              <div className="row-wrap">
                <div className="skeleton skeleton-pill" />
                <div className="skeleton skeleton-pill" />
                <div className="skeleton skeleton-pill" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Briefcase size={24} />
          </div>
          <h2 className="drawer-title">
            {jobs.length === 0
              ? 'Nenhuma vaga publicada ainda'
              : 'Nenhuma vaga encontrada com esse filtro'}
          </h2>
          <p className="text-muted text-sm" style={{ maxWidth: 420 }}>
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
                  <div className="row-wrap">
                    <h2 className="job-row-title">{job.title}</h2>
                    <span className={`badge ${badgeClass}`}>{statusInfo.label}</span>
                    {job.pendingApplicantsCount > 0 && (
                      <span className="badge badge-indigo tabular-nums">
                        <Users size={13} />
                        {job.pendingApplicantsCount} interessado(s) pendente(s)
                      </span>
                    )}
                  </div>

                  <div className="job-row-meta">
                    <span className="tabular-nums job-row-salary">
                      {formatSalaryRange(job.minimumSalary, job.maximumSalary)}
                    </span>
                    <span>·</span>
                    <span>{formatModality(job.modality)}</span>
                    <span>·</span>
                    <span className="row-inline">
                      <MapPin size={14} />
                      {formatLocation(job.city, job.state, job.country)}
                    </span>
                    <span>·</span>
                    <span>
                      {job.contractType} · {job.seniorityLevel} ({job.experienceYears} anos)
                    </span>
                  </div>

                  {job.skills.length > 0 && (
                    <div className="job-row-skills">
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
                    <TriageIcon size={15} />
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
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="close-job-title"
          onClick={handleCloseBackdrop}
        >
          <div ref={closeModalRef} tabIndex={-1} className="modal-card modal-card-left">
            <h2 id="close-job-title" className="drawer-title">
              Encerrar vaga definitivamente?
            </h2>
            <p className="text-muted text-sm" style={{ marginTop: 10 }}>
              A vaga <strong>{confirmCloseJob.title}</strong> deixará de receber novas candidaturas e
              matches imediatamente.
            </p>
            <div className="drawer-footer" style={{ padding: '20px 0 0', borderTop: 0 }}>
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
                className="btn btn-danger-solid"
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
