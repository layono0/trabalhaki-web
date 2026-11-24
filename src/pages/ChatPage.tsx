import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError, resolveAssetUrl } from '../services/api';
import type {
  ChatMessageResponse,
  MatchResponse,
  ProcessStatus,
  SelectionProcessResponse,
  WorkModality,
} from '../types/api';
import {
  formatCurrency,
  formatDateTime,
  formatModality,
  formatProcessStatus,
  formatSalaryRange,
  formatTimeOnly,
  getInitials,
} from '../utils/formatters';
import { TriageIcon } from '../components/BrandMark';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface CandidateSnapshot {
  name?: string;
  desiredRole?: string;
  area?: string;
  experienceYears?: number;
  education?: string;
  city?: string;
  state?: string;
  minimumSalaryExpectation?: number;
  preferredModality?: WorkModality;
  preferredContractType?: string;
  skills?: string[];
}

interface JobSnapshot {
  jobVersionAtMatch?: number;
  jobData?: {
    title?: string;
    minimumSalary?: number;
    maximumSalary?: number;
    modality?: WorkModality;
    contractType?: string;
    seniorityLevel?: string;
  };
}

const PROCESS_TRANSITIONS: { value: ProcessStatus; label: string }[] = [
  { value: 'IN_REVIEW', label: 'Em análise' },
  { value: 'INTERVIEW', label: 'Entrevista' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'REJECTED', label: 'Reprovado' },
];

export function ChatPage() {
  const { matchId: routeMatchId } = useParams<{ matchId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>(
    routeMatchId ? 'thread' : 'list'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('ALL');

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const [processDrawerOpen, setProcessDrawerOpen] = useState(false);
  const [processInfo, setProcessInfo] = useState<SelectionProcessResponse | null>(null);
  const [processLoading, setProcessLoading] = useState(false);
  const [nextStage, setNextStage] = useState<ProcessStatus>('IN_REVIEW');
  const [stageNote, setStageNote] = useState('');
  const [isAdvancingStage, setIsAdvancingStage] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const { containerRef: processDrawerRef, handleBackdropClick: handleProcessBackdrop } =
    useDialogA11y({
      open: processDrawerOpen,
      onClose: () => setProcessDrawerOpen(false),
    });

  const loadMatches = useCallback(async () => {
    setIsLoadingMatches(true);
    setError(null);
    try {
      const list = await api.getMatches();
      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMatches(sorted);
      const requestedId = routeMatchId ? Number(routeMatchId) : null;
      if (requestedId && sorted.some((m) => m.id === requestedId)) {
        setSelectedMatchId(requestedId);
        setMobileView('thread');
      } else if (sorted.length > 0) {
        setSelectedMatchId((prev) =>
          prev && sorted.some((m) => m.id === prev) ? prev : sorted[0].id
        );
      } else {
        setSelectedMatchId(null);
      }
      window.dispatchEvent(new Event('trabalhaki:refresh-nav'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar seus matches.');
    } finally {
      setIsLoadingMatches(false);
    }
  }, [routeMatchId]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const uniqueJobs = useMemo(() => {
    const map = new Map<number, string>();
    matches.forEach((m) => map.set(m.jobId, m.jobTitle));
    return Array.from(map.entries());
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (jobFilter !== 'ALL' && String(m.jobId) !== jobFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        if (
          !m.candidateName.toLowerCase().includes(q) &&
          !m.jobTitle.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [matches, jobFilter, searchTerm]);

  const loadConversation = useCallback(async (matchId: number, silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) {
      setIsLoadingChat(true);
      setChatError(null);
    }
    try {
      const conv = await api.getConversation(matchId);
      setMessages(conv.messages || []);
      setChatError(null);
      if (!silent) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    } catch (err) {
      if (!silent) {
        setChatError(err instanceof Error ? err.message : 'Não foi possível carregar as mensagens.');
      }
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMatchId === null) return;
    loadConversation(selectedMatchId, false);
    const timer = window.setInterval(() => {
      loadConversation(selectedMatchId, true);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [selectedMatchId, loadConversation]);

  const loadProcess = useCallback(async (matchId: number) => {
    setProcessLoading(true);
    setStageError(null);
    try {
      const data = await api.getProcess(matchId);
      setProcessInfo(data);
      const nextDefault =
        data.currentStatus === 'MATCHED'
          ? 'IN_REVIEW'
          : data.currentStatus === 'IN_REVIEW'
            ? 'INTERVIEW'
            : 'APPROVED';
      setNextStage(nextDefault);
    } catch (err) {
      setStageError(err instanceof Error ? err.message : 'Erro ao carregar processo seletivo.');
    } finally {
      setProcessLoading(false);
    }
  }, []);

  const openProcessDrawer = () => {
    if (!selectedMatchId) return;
    setProcessDrawerOpen(true);
    loadProcess(selectedMatchId);
  };

  const currentDraft = selectedMatchId !== null ? drafts[selectedMatchId] || '' : '';

  const updateDraft = (text: string) => {
    if (selectedMatchId === null) return;
    setDrafts((prev) => ({ ...prev, [selectedMatchId]: text }));
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (selectedMatchId === null || isSending) return;
    const text = currentDraft.trim();
    if (!text) return;

    setIsSending(true);
    setChatError(null);
    try {
      const sent = await api.sendMessage(selectedMatchId, text);
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      updateDraft('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch (err) {
      setChatError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Erro ao enviar mensagem. Seu texto foi preservado.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleAdvanceProcess = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || isAdvancingStage) return;
    setIsAdvancingStage(true);
    setStageError(null);
    try {
      const updated = await api.advanceProcess(selectedMatchId, nextStage, stageNote);
      setProcessInfo(updated);
      setStageNote('');
      setMatches((prev) =>
        prev.map((m) =>
          m.id === selectedMatchId ? { ...m, processStatus: updated.currentStatus } : m
        )
      );
    } catch (err) {
      setStageError(err instanceof Error ? err.message : 'Não foi possível avançar a etapa.');
    } finally {
      setIsAdvancingStage(false);
    }
  };

  const candidateSnapshot = useMemo<CandidateSnapshot | null>(() => {
    if (!selectedMatch?.candidateSnapshotJson) return null;
    try {
      return JSON.parse(selectedMatch.candidateSnapshotJson) as CandidateSnapshot;
    } catch {
      return null;
    }
  }, [selectedMatch]);

  const jobSnapshot = useMemo<JobSnapshot | null>(() => {
    if (!selectedMatch?.jobSnapshotJson) return null;
    try {
      return JSON.parse(selectedMatch.jobSnapshotJson) as JobSnapshot;
    } catch {
      return null;
    }
  }, [selectedMatch]);

  const starterTemplates = selectedMatch
    ? [
        `Olá, ${selectedMatch.candidateName.split(' ')[0]}! Ficamos muito interessados no seu perfil para a vaga de ${selectedMatch.jobTitle}. Você tem disponibilidade para conversarmos esta semana?`,
        `Oi ${selectedMatch.candidateName.split(' ')[0]}, tudo bem? Vi seu match na vaga ${selectedMatch.jobTitle} e gostaria de compartilhar mais detalhes sobre o time e os próximos passos.`,
        `Olá! Obrigado pelo interesse na vaga de ${selectedMatch.jobTitle}. Quais horários funcionam melhor para uma conversa rápida de alinhamento?`,
      ]
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Matches & Chat Pós-Match</h1>
          <p className="page-subtitle">
            Converse com candidatos após o interesse recíproco e acompanhe as etapas seletivas.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadMatches}>
          <RefreshCw size={16} />
          Atualizar matches
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} className="icon-shrink" />
          <span>{error}</span>
        </div>
      )}

      {isLoadingMatches ? (
        <div className="chat-shell" aria-busy="true" aria-label="Carregando conversas">
          <div className="chat-list-pane" style={{ padding: 16 }}>
            <div className="stack-md">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="stack-xs">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-line" style={{ width: '75%' }} />
                </div>
              ))}
            </div>
          </div>
          <div className="chat-thread-pane" style={{ padding: 24 }}>
            <div className="stack-md">
              <div className="skeleton skeleton-title" style={{ width: '40%' }} />
              <div className="skeleton skeleton-line" style={{ width: '65%' }} />
              <div className="skeleton skeleton-line" style={{ width: '50%' }} />
            </div>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageSquare size={24} />
          </div>
          <h2 className="drawer-title">Nenhum match confirmado ainda</h2>
          <p className="text-muted text-sm" style={{ maxWidth: 440 }}>
            Acesse a Triagem de Candidatos para avaliar os profissionais que se candidataram às suas
            vagas. Ao curtir um interessado, o match e o canal de conversa abrem aqui automaticamente.
          </p>
          <Link to="/painel/swipe" className="btn btn-primary">
            <TriageIcon size={17} />
            Ir para Triagem de Candidatos
          </Link>
        </div>
      ) : (
        <div
          className={`chat-shell ${
            mobileView === 'thread' && selectedMatch ? 'mobile-show-thread' : 'mobile-show-list'
          }`}
        >
          {/* Coluna esquerda: lista de matches */}
          <aside className="chat-list-pane" aria-label="Lista de matches">
            <div className="chat-list-header">
              <div className="input-wrap">
                <Search size={15} className="input-leading-icon" />
                <input
                  className="input input-compact input-with-icon"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar candidato ou vaga..."
                  aria-label="Buscar matches"
                />
              </div>

              {uniqueJobs.length > 1 && (
                <select
                  className="select select-compact"
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  aria-label="Filtrar por vaga"
                >
                  <option value="ALL">Todas as vagas ({matches.length})</option>
                  {uniqueJobs.map(([id, title]) => (
                    <option key={id} value={String(id)}>
                      {title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="chat-list-scroll">
              {filteredMatches.length === 0 ? (
                <div className="text-muted text-sm" style={{ padding: 20 }}>
                  Nenhum match encontrado para o filtro aplicado.
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const photoSrc = resolveAssetUrl(match.candidatePhotoUrl);
                  const stage = formatProcessStatus(match.processStatus);
                  const stageClass =
                    stage.tone === 'mint'
                      ? 'badge-mint'
                      : stage.tone === 'amber'
                        ? 'badge-amber'
                        : stage.tone === 'danger'
                          ? 'badge-danger'
                          : stage.tone === 'neutral'
                            ? 'badge-neutral'
                            : 'badge-indigo';

                  return (
                    <button
                      key={match.id}
                      type="button"
                      className={`chat-match-item ${match.id === selectedMatchId ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedMatchId(match.id);
                        setMobileView('thread');
                        navigate(`/painel/chat/${match.id}`, { replace: true });
                      }}
                    >
                      <div className="avatar-badge avatar-sm">
                        {photoSrc ? (
                          <img src={photoSrc} alt={match.candidateName} />
                        ) : (
                          getInitials(match.candidateName)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="row-between">
                          <span className="chat-match-name truncate">{match.candidateName}</span>
                          {match.compatibilityScore != null && (
                            <span className="tabular-nums chat-match-score">
                              {match.compatibilityScore}%
                            </span>
                          )}
                        </div>
                        <div className="chat-match-job truncate">{match.jobTitle}</div>
                        <div style={{ marginTop: 6 }}>
                          <span className={`badge badge-xs ${stageClass}`}>{stage.label}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Coluna direita: thread ativa */}
          <section className="chat-thread-pane" aria-label="Conversa selecionada">
            {selectedMatch ? (
              <>
                <div className="chat-thread-header">
                  <div className="demo-avatar-group min-w-0">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm chat-mobile-back"
                      onClick={() => setMobileView('list')}
                      aria-label="Voltar para lista de matches"
                    >
                      <ArrowLeft size={16} />
                      Lista
                    </button>
                    <div className="avatar-badge avatar-sm">
                      {resolveAssetUrl(selectedMatch.candidatePhotoUrl) ? (
                        <img
                          src={resolveAssetUrl(selectedMatch.candidatePhotoUrl)}
                          alt={selectedMatch.candidateName}
                        />
                      ) : (
                        getInitials(selectedMatch.candidateName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="demo-candidate-name truncate">
                        {selectedMatch.candidateName}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {selectedMatch.jobTitle} · Match em {formatDateTime(selectedMatch.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="row-wrap">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={openProcessDrawer}
                    >
                      <ClipboardList size={15} />
                      Etapas e perfil
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label="Recarregar conversa"
                      onClick={() => loadConversation(selectedMatch.id, false)}
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>

                <div className="chat-messages-scroll">
                  {isLoadingChat ? (
                    <div className="stack-md" aria-busy="true" aria-label="Carregando mensagens">
                      <div className="skeleton skeleton-line" style={{ width: '52%' }} />
                      <div className="skeleton skeleton-line" style={{ width: '40%', alignSelf: 'flex-end' }} />
                      <div className="skeleton skeleton-line" style={{ width: '60%' }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="chat-starter-wrap">
                      <div className="empty-state-icon">
                        <CheckCircle2 size={22} />
                      </div>
                      <h3 className="job-row-title">
                        Envie a primeira mensagem para {selectedMatch.candidateName}
                      </h3>
                      <p className="text-sm text-muted">
                        No Trabalhaki, a empresa inicia a conversa após o match para liberar a
                        resposta do candidato no aplicativo mobile.
                      </p>

                      <div className="stack-xs w-full" style={{ marginTop: 6 }}>
                        {starterTemplates.map((template) => (
                          <button
                            key={template}
                            type="button"
                            className="btn btn-secondary btn-sm chat-starter-btn"
                            onClick={() => updateDraft(template)}
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isCompany =
                        msg.senderRole === 'COMPANY' ||
                        (msg.senderRole == null && msg.senderId === user?.id);

                      return (
                        <div key={msg.id} className={`chat-bubble-row ${isCompany ? 'me' : 'them'}`}>
                          <div className="chat-bubble">{msg.content}</div>
                          <span className="tabular-nums chat-bubble-meta">
                            {msg.senderName} · {formatTimeOnly(msg.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {chatError && (
                  <div className="alert alert-error" style={{ margin: '0 16px 10px' }}>
                    <AlertCircle size={16} className="icon-shrink" />
                    <span>{chatError}</span>
                  </div>
                )}

                <form className="chat-compose-bar" onSubmit={handleSendMessage}>
                  <textarea
                    className="textarea chat-compose-input"
                    rows={1}
                    value={currentDraft}
                    onChange={(e) => updateDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Escreva uma mensagem para o candidato..."
                    aria-label="Mensagem do chat"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSending || !currentDraft.trim()}
                  >
                    <Send size={17} />
                    Enviar
                  </button>
                </form>
              </>
            ) : (
              <div className="text-muted text-sm" style={{ margin: 'auto', padding: 24 }}>
                Selecione um match à esquerda para visualizar a conversa.
              </div>
            )}
          </section>
        </div>
      )}

      {/* Drawer de Etapas do Processo & Dados do Match */}
      {processDrawerOpen && selectedMatch && (
        <div
          className="overlay-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="process-drawer-title"
          onClick={handleProcessBackdrop}
        >
          <div ref={processDrawerRef} tabIndex={-1} className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2 id="process-drawer-title" className="drawer-title">
                  Etapas e dados do match
                </h2>
                <p className="drawer-subtitle">
                  {selectedMatch.candidateName} · {selectedMatch.jobTitle}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setProcessDrawerOpen(false)}
                aria-label="Fechar painel"
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {stageError && (
                <div className="alert alert-error alert-compact" role="alert">
                  <AlertCircle size={17} className="icon-shrink" />
                  <span>{stageError}</span>
                </div>
              )}

              {(candidateSnapshot || jobSnapshot?.jobData) && (
                <div className="chat-record-card">
                  <div className="chat-record-heading">
                    Dados registrados no momento do match
                  </div>

                  {jobSnapshot?.jobData && (
                    <div className="chat-record-divider stack-xs">
                      <div>
                        <strong>Vaga:</strong>{' '}
                        {jobSnapshot.jobData.title || selectedMatch.jobTitle}
                      </div>
                      <div className="tabular-nums">
                        <strong>Faixa e condições:</strong>{' '}
                        {formatSalaryRange(
                          jobSnapshot.jobData.minimumSalary,
                          jobSnapshot.jobData.maximumSalary
                        )}{' '}
                        · {formatModality(jobSnapshot.jobData.modality)}
                      </div>
                    </div>
                  )}

                  {candidateSnapshot && (
                    <div className="stack-xs text-sm">
                      <div>
                        <strong>Cargo desejado:</strong>{' '}
                        {candidateSnapshot.desiredRole || 'Não informado'}
                      </div>
                      <div>
                        <strong>Experiência:</strong>{' '}
                        {candidateSnapshot.experienceYears != null
                          ? `${candidateSnapshot.experienceYears} ano(s)`
                          : 'Não informada'}
                      </div>
                      <div>
                        <strong>Formação:</strong> {candidateSnapshot.education || 'Não informada'}
                      </div>
                      <div>
                        <strong>Modalidade / Pretensão:</strong>{' '}
                        {formatModality(candidateSnapshot.preferredModality)} ·{' '}
                        {formatCurrency(candidateSnapshot.minimumSalaryExpectation)}
                      </div>
                      {candidateSnapshot.skills && candidateSnapshot.skills.length > 0 && (
                        <div className="row-wrap" style={{ marginTop: 4 }}>
                          {candidateSnapshot.skills.map((skill) => (
                            <span key={skill} className="chip chip-skill">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {processLoading ? (
                <div className="stack-sm" aria-busy="true">
                  <div className="skeleton skeleton-pill" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line" style={{ width: '75%' }} />
                </div>
              ) : processInfo ? (
                <>
                  <div className="stack-xs">
                    <div className="field-label">Etapa atual</div>
                    <div>
                      <span className="badge badge-indigo">
                        {formatProcessStatus(processInfo.currentStatus).label}
                      </span>
                    </div>
                  </div>

                  {processInfo.currentStatus !== 'WITHDRAWN' && (
                    <form onSubmit={handleAdvanceProcess} className="chat-stage-form">
                      <div className="form-section-title">Avançar etapa</div>

                      <div className="field">
                        <label htmlFor="process-stage-select" className="field-label">
                          Nova etapa
                        </label>
                        <select
                          id="process-stage-select"
                          className="select"
                          value={nextStage}
                          onChange={(e) => setNextStage(e.target.value as ProcessStatus)}
                        >
                          {PROCESS_TRANSITIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="process-stage-note" className="field-label">
                          Observação registrada no histórico
                        </label>
                        <textarea
                          id="process-stage-note"
                          className="textarea"
                          style={{ minHeight: 74 }}
                          value={stageNote}
                          onChange={(e) => setStageNote(e.target.value)}
                          placeholder="Ex: Entrevista técnica marcada para quinta às 14h."
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isAdvancingStage || nextStage === processInfo.currentStatus}
                      >
                        {isAdvancingStage ? 'Atualizando...' : 'Registrar mudança de etapa'}
                      </button>
                    </form>
                  )}

                  <div className="stack-sm">
                    <div className="form-section-title">
                      Histórico de etapas ({processInfo.history.length})
                    </div>
                    <div className="stack-sm">
                      {processInfo.history.map((entry, idx) => (
                        <div key={`${entry.changedAt}-${idx}`} className="chat-history-entry">
                          <div className="row-between">
                            <strong>{formatProcessStatus(entry.toStatus).label}</strong>
                            <span className="tabular-nums text-xs text-muted">
                              {formatDateTime(entry.changedAt)}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                              {entry.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
