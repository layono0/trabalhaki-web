import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ClipboardList,
  Flame,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError, resolveAssetUrl } from '../services/api';
import type {
  ChatMessageResponse,
  MatchResponse,
  ProcessStatus,
  SelectionProcessResponse,
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

interface CandidateSnapshot {
  name?: string;
  desiredRole?: string;
  area?: string;
  experienceYears?: number;
  education?: string;
  city?: string;
  state?: string;
  minimumSalaryExpectation?: number;
  preferredModality?: string;
  preferredContractType?: string;
  skills?: string[];
}

interface JobSnapshot {
  jobVersionAtMatch?: number;
  jobData?: {
    title?: string;
    minimumSalary?: number;
    maximumSalary?: number;
    modality?: string;
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

  const loadConversation = useCallback(
    async (matchId: number, silent = false) => {
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
    },
    []
  );

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
        <div className="alert alert-error" role="alert" style={{ marginBottom: 18 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {isLoadingMatches ? (
        <div className="empty-state">
          <p style={{ color: 'var(--color-text-secondary)' }}>Carregando conversas...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageSquare size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nenhum match confirmado ainda</h2>
          <p style={{ maxWidth: 440, color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
            Acesse o Swipe de Candidatos para avaliar os profissionais que se candidataram às suas
            vagas. Ao curtir um interessado, o match e o canal de conversa abrem aqui automaticamente.
          </p>
          <Link to="/painel/swipe" className="btn btn-primary">
            <Flame size={17} />
            Ir para o Swipe de Candidatos
          </Link>
        </div>
      ) : (
        <div className="chat-shell">
          {/* Coluna esquerda: lista de matches */}
          <aside className="chat-list-pane" aria-label="Lista de matches">
            <div className="chat-list-header">
              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: 34, minHeight: 38, fontSize: '0.88rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar candidato ou vaga..."
                  aria-label="Buscar matches"
                />
              </div>

              {uniqueJobs.length > 1 && (
                <select
                  className="select"
                  style={{ minHeight: 36, fontSize: '0.84rem' }}
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
                <div style={{ padding: 20, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
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
                        navigate(`/painel/chat/${match.id}`, { replace: true });
                      }}
                    >
                      <div className="avatar-badge" style={{ width: 44, height: 44, fontSize: '0.85rem' }}>
                        {photoSrc ? (
                          <img src={photoSrc} alt={match.candidateName} />
                        ) : (
                          getInitials(match.candidateName)
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.92rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {match.candidateName}
                          </span>
                          {match.compatibilityScore != null && (
                            <span
                              className="tabular-nums"
                              style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)' }}
                            >
                              {match.compatibilityScore}%
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: 2,
                          }}
                        >
                          {match.jobTitle}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <span className={`badge ${stageClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            {stage.label}
                          </span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar-badge" style={{ width: 42, height: 42, fontSize: '0.85rem' }}>
                      {resolveAssetUrl(selectedMatch.candidatePhotoUrl) ? (
                        <img
                          src={resolveAssetUrl(selectedMatch.candidatePhotoUrl)}
                          alt={selectedMatch.candidateName}
                        />
                      ) : (
                        getInitials(selectedMatch.candidateName)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                        {selectedMatch.candidateName}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                        {selectedMatch.jobTitle} • Match em {formatDateTime(selectedMatch.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={openProcessDrawer}
                    >
                      <ClipboardList size={15} />
                      Snapshot & Etapas
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
                    <p style={{ color: 'var(--color-text-secondary)', margin: 'auto' }}>
                      Carregando histórico da conversa...
                    </p>
                  ) : messages.length === 0 ? (
                    <div
                      style={{
                        margin: 'auto',
                        maxWidth: 500,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div className="empty-state-icon">
                        <Sparkles size={22} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                        Envie a primeira mensagem para {selectedMatch.candidateName}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                        No Trabalhaki, a empresa inicia a conversa após o match para liberar a
                        resposta do candidato no aplicativo mobile.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 6 }}>
                        {starterTemplates.map((template) => (
                          <button
                            key={template}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              height: 'auto',
                              minHeight: 40,
                              padding: '10px 14px',
                              textAlign: 'left',
                              justifyContent: 'flex-start',
                              whiteSpace: 'normal',
                              fontWeight: 500,
                            }}
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
                          <span
                            className="tabular-nums"
                            style={{
                              marginTop: 4,
                              fontSize: '0.72rem',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {msg.senderName} • {formatTimeOnly(msg.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {chatError && (
                  <div className="alert alert-error" style={{ margin: '0 16px 10px' }}>
                    <AlertCircle size={16} />
                    <span>{chatError}</span>
                  </div>
                )}

                <form className="chat-compose-bar" onSubmit={handleSendMessage}>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 46, maxHeight: 130, resize: 'none', padding: '11px 14px' }}
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
              <div style={{ margin: 'auto', padding: 24, color: 'var(--color-text-secondary)' }}>
                Selecione um match à esquerda para visualizar a conversa.
              </div>
            )}
          </section>
        </div>
      )}

      {/* Drawer de Snapshot do Match & Evolução de Etapa */}
      {processDrawerOpen && selectedMatch && (
        <div
          className="overlay-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="process-drawer-title"
        >
          <div className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2 id="process-drawer-title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Processo Seletivo & Snapshot
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {selectedMatch.candidateName} • {selectedMatch.jobTitle}
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
                <div className="alert alert-error" role="alert">
                  <AlertCircle size={17} />
                  <span>{stageError}</span>
                </div>
              )}

              {/* Snapshot Imutável do Match (Candidato e Vaga) */}
              {(candidateSnapshot || jobSnapshot?.jobData) && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Snapshot congelado no momento do Match
                  </div>

                  {jobSnapshot?.jobData && (
                    <div
                      style={{
                        paddingBottom: 10,
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: '0.86rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div>
                        <strong>Vaga (v{jobSnapshot.jobVersionAtMatch ?? 1}):</strong>{' '}
                        {jobSnapshot.jobData.title || selectedMatch.jobTitle}
                      </div>
                      <div className="tabular-nums">
                        <strong>Faixa e condições:</strong>{' '}
                        {formatSalaryRange(
                          jobSnapshot.jobData.minimumSalary,
                          jobSnapshot.jobData.maximumSalary
                        )}{' '}
                        • {formatModality(jobSnapshot.jobData.modality as any)}
                      </div>
                    </div>
                  )}

                  {candidateSnapshot && (
                    <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div>
                        <strong>Cargo desejado:</strong> {candidateSnapshot.desiredRole || 'Não informado'}
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
                        {formatModality(candidateSnapshot.preferredModality as any)} •{' '}
                        {formatCurrency(candidateSnapshot.minimumSalaryExpectation)}
                      </div>
                      {candidateSnapshot.skills && candidateSnapshot.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
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
                <p style={{ color: 'var(--color-text-secondary)' }}>Carregando etapas do processo...</p>
              ) : processInfo ? (
                <>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>Etapa atual</div>
                    <div style={{ marginTop: 6 }}>
                      <span className="badge badge-indigo">
                        {formatProcessStatus(processInfo.currentStatus).label}
                      </span>
                    </div>
                  </div>

                  {processInfo.currentStatus !== 'WITHDRAWN' && (
                    <form
                      onSubmit={handleAdvanceProcess}
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Avançar etapa</div>

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

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 10 }}>
                      Histórico auditável ({processInfo.history.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {processInfo.history.map((entry, idx) => (
                        <div
                          key={`${entry.changedAt}-${idx}`}
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            border: '1px solid var(--color-border)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <strong>{formatProcessStatus(entry.toStatus).label}</strong>
                            <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                              {formatDateTime(entry.changedAt)}
                            </span>
                          </div>
                          {entry.note && (
                            <p style={{ marginTop: 4, color: 'var(--color-text-secondary)' }}>{entry.note}</p>
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
