import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Eye,
  Heart,
  RefreshCw,
  Undo2,
  Users,
  X,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import type { JobApplicantResponse, JobResponse } from '../types/api';
import { formatModality, formatSalaryRange } from '../utils/formatters';
import { CandidateSwipeCard } from '../components/CandidateSwipeCard';
import { CandidateDetailDrawer } from '../components/CandidateDetailDrawer';
import { MatchCelebrationModal } from '../components/MatchCelebrationModal';

export function CandidateSwipePage() {
  const { jobId: routeJobId } = useParams<{ jobId?: string }>();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<JobApplicantResponse[]>([]);
  const [lastPassed, setLastPassed] = useState<JobApplicantResponse | null>(null);

  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [inspectingApplicant, setInspectingApplicant] = useState<JobApplicantResponse | null>(null);
  const [matchedModal, setMatchedModal] = useState<{
    applicant: JobApplicantResponse;
    matchId: number | null;
  } | null>(null);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const loadJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    setError(null);
    try {
      const list = await api.listMyJobs();
      setJobs(list);
      const requestedId = routeJobId ? Number(routeJobId) : null;
      if (requestedId && list.some((j) => j.id === requestedId)) {
        setSelectedJobId(requestedId);
      } else if (list.length > 0) {
        const jobWithPending = list.find((j) => j.pendingApplicantsCount > 0) || list[0];
        setSelectedJobId(jobWithPending.id);
      } else {
        setSelectedJobId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vagas da empresa.');
    } finally {
      setIsLoadingJobs(false);
    }
  }, [routeJobId]);

  const loadApplicants = useCallback(async (jobId: number) => {
    setIsLoadingApplicants(true);
    setError(null);
    setLastPassed(null);
    try {
      const list = await api.getJobApplicants(jobId);
      setApplicants(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os candidatos interessados.');
    } finally {
      setIsLoadingApplicants(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (selectedJobId !== null) {
      loadApplicants(selectedJobId);
    }
  }, [selectedJobId, loadApplicants]);

  const handleSelectJob = (nextId: number) => {
    setSelectedJobId(nextId);
    setNotice(null);
    navigate(`/painel/swipe/${nextId}`, { replace: true });
  };

  const handleSwipe = useCallback(
    async (applicant: JobApplicantResponse, direction: 'left' | 'right') => {
      if (!selectedJobId || isSubmitting) return;
      setIsSubmitting(true);
      setError(null);
      setNotice(null);

      // Optimistic removal for snappy card stack transition
      setApplicants((prev) => prev.filter((item) => item.candidateId !== applicant.candidateId));

      try {
        if (direction === 'left') {
          await api.passCandidate(selectedJobId, applicant.candidateId);
          setLastPassed(applicant);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === selectedJobId
                ? { ...j, pendingApplicantsCount: Math.max(0, j.pendingApplicantsCount - 1) }
                : j
            )
          );
          window.dispatchEvent(new Event('trabalhaki:refresh-nav'));
        } else {
          const result = await api.likeCandidate(selectedJobId, applicant.candidateId);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === selectedJobId
                ? { ...j, pendingApplicantsCount: Math.max(0, j.pendingApplicantsCount - 1) }
                : j
            )
          );
          window.dispatchEvent(new Event('trabalhaki:refresh-nav'));

          if (result.isMatch) {
            setMatchedModal({ applicant, matchId: result.matchId });
          } else {
            setNotice(result.message || `Interesse registrado em ${applicant.name}.`);
          }
        }
      } catch (err) {
        // Restore card on failure
        setApplicants((prev) =>
          prev.some((item) => item.candidateId === applicant.candidateId) ? prev : [applicant, ...prev]
        );
        setError(
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'Não foi possível registrar sua decisão. O candidato voltou para a fila.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedJobId, isSubmitting]
  );

  const handleUndoPass = useCallback(async () => {
    if (!selectedJobId || !lastPassed || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.undoPassCandidate(selectedJobId, lastPassed.candidateId);
      setApplicants((prev) =>
        prev.some((item) => item.candidateId === lastPassed.candidateId) ? prev : [lastPassed, ...prev]
      );
      setJobs((prev) =>
        prev.map((j) =>
          j.id === selectedJobId
            ? { ...j, pendingApplicantsCount: j.pendingApplicantsCount + 1 }
            : j
        )
      );
      setLastPassed(null);
      window.dispatchEvent(new Event('trabalhaki:refresh-nav'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível desfazer o último descarte.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedJobId, lastPassed, isSubmitting]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (inspectingApplicant || matchedModal || isSubmitting || applicants.length === 0) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && lastPassed && !isSubmitting) {
          e.preventDefault();
          handleUndoPass();
        }
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipe(applicants[0], 'left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipe(applicants[0], 'right');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && lastPassed) {
        e.preventDefault();
        handleUndoPass();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applicants, inspectingApplicant, matchedModal, isSubmitting, lastPassed, handleSwipe, handleUndoPass]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Swipe de Candidatos</h1>
          <p className="page-subtitle">
            Avalie apenas profissionais que já curtiram a vaga selecionada no aplicativo mobile.
          </p>
        </div>

        {jobs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <label htmlFor="swipe-job-select" className="sr-only">
              Selecionar vaga para triagem
            </label>
            <select
              id="swipe-job-select"
              className="select"
              style={{ minWidth: 300 }}
              value={selectedJobId ?? ''}
              onChange={(e) => handleSelectJob(Number(e.target.value))}
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.pendingApplicantsCount} pendente(s))
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={!selectedJobId || isLoadingApplicants}
              onClick={() => selectedJobId && loadApplicants(selectedJobId)}
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div className="alert alert-success" style={{ marginBottom: 18 }}>
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 18 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {isLoadingJobs ? (
        <div className="empty-state">
          <p style={{ color: 'var(--color-text-secondary)' }}>Carregando suas vagas...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Briefcase size={24} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Crie uma vaga antes de iniciar o swipe</h2>
          <p style={{ maxWidth: 440, color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
            Assim que sua empresa tiver uma vaga ativa, os candidatos interessados aparecerão aqui
            ordenados por compatibilidade.
          </p>
          <Link to="/painel/vagas" className="btn btn-primary">
            Ir para Minhas Vagas
          </Link>
        </div>
      ) : (
        <div className="swipe-layout">
          <div>
            {isLoadingApplicants ? (
              <div className="empty-state" style={{ height: 550, justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Carregando fila de candidatos que se candidataram...
                </p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 440, justifyContent: 'center' }}>
                <div className="empty-state-icon">
                  <Users size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Nenhum candidato pendente nesta vaga
                </h2>
                <p style={{ maxWidth: 400, color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
                  {selectedJob?.status === 'CLOSED'
                    ? 'Esta vaga está encerrada. Selecione outra vaga ativa no topo.'
                    : 'Você já avaliou todos os profissionais que curtiram esta vaga até o momento.'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 6 }}>
                  {lastPassed && (
                    <button type="button" className="btn btn-secondary" onClick={handleUndoPass}>
                      <Undo2 size={16} />
                      Desfazer último descarte ({lastPassed.name})
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => selectedJobId && loadApplicants(selectedJobId)}
                  >
                    <RefreshCw size={16} />
                    Verificar novos interessados
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="swipe-deck-wrap">
                  {applicants
                    .slice(0, 3)
                    .map((applicant, index) => (
                      <CandidateSwipeCard
                        key={applicant.candidateId}
                        applicant={applicant}
                        selectedJob={selectedJob}
                        isFront={index === 0}
                        stackIndex={index}
                        disabled={isSubmitting}
                        onSwipe={handleSwipe}
                        onInspect={setInspectingApplicant}
                      />
                    ))
                    .reverse()}
                </div>

                <div className="swipe-actions-bar">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    title="Desfazer último descarte (Ctrl+Z)"
                    disabled={!lastPassed || isSubmitting}
                    onClick={handleUndoPass}
                  >
                    <Undo2 size={18} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={isSubmitting || selectedJob?.status === 'CLOSED'}
                    onClick={() => handleSwipe(applicants[0], 'left')}
                  >
                    <X size={18} />
                    Passar
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    title="Ver detalhes do candidato"
                    onClick={() => setInspectingApplicant(applicants[0])}
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1.5 }}
                    disabled={isSubmitting || selectedJob?.status === 'CLOSED'}
                    onClick={() => handleSwipe(applicants[0], 'right')}
                  >
                    <Heart size={18} />
                    Tenho interesse
                  </button>
                </div>

                <p
                  style={{
                    marginTop: 10,
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Arraste o cartão ou use ← Passar / → Tenho interesse. Como o candidato já curtiu esta
                  vaga, sua curtida gera o Match na hora.
                </p>
              </>
            )}
          </div>

          {/* Painel lateral com contexto da vaga e fila */}
          {selectedJob && (
            <aside className="swipe-side-panel">
              <div>
                <span className="badge badge-indigo">Vaga em avaliação</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 10 }}>
                  {selectedJob.title}
                </h2>
                <p
                  className="tabular-nums"
                  style={{
                    marginTop: 6,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: 'var(--color-secondary-text)',
                  }}
                >
                  {formatSalaryRange(selectedJob.minimumSalary, selectedJob.maximumSalary)}
                </p>
                <p style={{ marginTop: 4, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                  {formatModality(selectedJob.modality)} • {selectedJob.contractType} •{' '}
                  {selectedJob.seniorityLevel}
                </p>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: 'var(--color-surface-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.86rem',
                }}
              >
                <span>Na fila agora</span>
                <strong className="tabular-nums">{applicants.length} candidato(s)</strong>
              </div>

              {selectedJob.skills.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>
                    Requisitos buscados
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedJob.skills.map((s) => (
                      <span
                        key={s.skillName}
                        className={`chip ${s.skillType === 'REQUIRED' ? 'chip-skill' : ''}`}
                      >
                        {s.skillName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link to="/painel/chat" className="btn btn-secondary btn-sm">
                Ir para Matches & Chat
              </Link>
            </aside>
          )}
        </div>
      )}

      <CandidateDetailDrawer
        applicant={inspectingApplicant}
        selectedJob={selectedJob}
        onClose={() => setInspectingApplicant(null)}
        onPass={(applicant) => handleSwipe(applicant, 'left')}
        onLike={(applicant) => handleSwipe(applicant, 'right')}
      />

      <MatchCelebrationModal
        applicant={matchedModal?.applicant || null}
        job={selectedJob}
        matchId={matchedModal?.matchId ?? null}
        onContinue={() => setMatchedModal(null)}
        onStartChat={(matchId) => {
          setMatchedModal(null);
          navigate(matchId ? `/painel/chat/${matchId}` : '/painel/chat');
        }}
      />
    </div>
  );
}
