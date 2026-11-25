import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Heart,
  Mail,
  RotateCcw,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandIcon, BrandMark } from '../components/BrandMark';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import '../styles/landing.css';

interface DemoCandidate {
  id: number;
  name: string;
  initials: string;
  role: string;
  location: string;
  experience: string;
  salary: string;
  modality: string;
  score: number;
  skills: string[];
  highlight: string;
  metrics: {
    stack: number;
    experience: number;
    salary: number;
  };
}

const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    id: 1,
    name: 'Ana Clara Costa',
    initials: 'AC',
    role: 'Engenheira de Software Backend',
    location: 'Belo Horizonte, MG',
    experience: '4 anos',
    salary: 'R$ 6.200',
    modality: 'Remoto',
    score: 96,
    skills: ['Java', 'Spring Boot', 'SQL', 'Docker', 'AWS'],
    highlight: '5 de 5 critérios alinhados com a vaga.',
    metrics: { stack: 1, experience: 1, salary: 1 },
  },
  {
    id: 2,
    name: 'Lucas Henrique Mendes',
    initials: 'LM',
    role: 'Desenvolvedor Full Stack',
    location: 'Curitiba, PR',
    experience: '3 anos',
    salary: 'R$ 5.800',
    modality: 'Remoto',
    score: 84,
    skills: ['Java', 'REST API', 'React', 'TypeScript'],
    highlight: 'Experiência Pleno e pretensão dentro do teto.',
    metrics: { stack: 0.82, experience: 0.9, salary: 1 },
  },
  {
    id: 3,
    name: 'Mariana Rocha',
    initials: 'MR',
    role: 'Desenvolvedora Java Júnior',
    location: 'Campinas, SP',
    experience: '1 ano',
    salary: 'R$ 4.200',
    modality: 'Híbrido',
    score: 74,
    skills: ['Java', 'SQL', 'Git', 'REST API'],
    highlight: 'Base sólida em Java/SQL abaixo do teto da vaga.',
    metrics: { stack: 0.78, experience: 0.52, salary: 1 },
  },
];

interface ShowcaseTab {
  id: string;
  label: string;
  title: string;
  description: string;
  points: string[];
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: 'vaga',
    label: 'Vaga aberta',
    title: 'Condições claras desde o primeiro segundo.',
    description:
      'Defina faixa salarial, modelo de trabalho e requisitos essenciais em menos de dois minutos. Sem surpresas no meio do processo.',
    points: [
      'Faixa salarial visível no app mobile',
      'Requisitos obrigatórios e diferenciais separados',
      'Publicação imediata ou pausa em um clique',
    ],
  },
  {
    id: 'fila',
    label: 'Fila real',
    title: 'Só entra na triagem quem escolheu sua vaga.',
    description:
      'Esqueça currículos em massa. Sua fila mostra exclusivamente profissionais que viram as condições e demonstraram interesse.',
    points: [
      'Candidatos ordenados por compatibilidade',
      'Gestos rápidos ou atalhos de teclado',
      'Desfaça o último descarte quando precisar',
    ],
  },
  {
    id: 'chat',
    label: 'Chat direto',
    title: 'Match confirmado, conversa aberta na hora.',
    description:
      'A aprovação da empresa libera o chat direto com o candidato no app e salva o snapshot do perfil para todo o processo seletivo.',
    points: [
      'Primeira mensagem da empresa inicia a conversa',
      'Etapas seletivas registradas no mesmo lugar',
      'Snapshot preservado do momento do match',
    ],
  },
];

const CHAT_STAGES = ['Match', 'Entrevista', 'Proposta'] as const;

interface ScoreCriterion {
  label: string;
  maxPoints: number;
  accent?: boolean;
}

const SCORE_CRITERIA: ScoreCriterion[] = [
  { label: 'Habilidades obrigatórias', maxPoints: 35, accent: true },
  { label: 'Experiência profissional', maxPoints: 20 },
  { label: 'Habilidades diferenciais', maxPoints: 15 },
  { label: 'Faixa salarial', maxPoints: 15 },
  { label: 'Modalidade e local', maxPoints: 15 },
];

interface ScoreScenario {
  id: string;
  label: string;
  role: string;
  summary: string;
  points: [number, number, number, number, number];
}

const SCORE_SCENARIOS: ScoreScenario[] = [
  {
    id: 'senior',
    label: 'Alinhamento sênior · 96%',
    role: 'Engenheira Backend · 4 anos exp.',
    summary: 'Atende toda a stack obrigatória e faixa salarial.',
    points: [35, 20, 11, 15, 15],
  },
  {
    id: 'pleno',
    label: 'Pleno compatível · 83%',
    role: 'Desenvolvedor Full Stack · 3 anos exp.',
    summary: 'Forte aderência prática com margem para evolução.',
    points: [28, 20, 5, 15, 15],
  },
  {
    id: 'junior',
    label: 'Júnior em transição · 72%',
    role: 'Desenvolvedora Júnior · 1 ano exp.',
    summary: 'Boa base técnica com pontuação proporcional em experiência.',
    points: [28, 10, 5, 15, 14],
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // Interactive hero swipe deck state
  const [demoIndex, setDemoIndex] = useState(0);
  const [exitingCandidate, setExitingCandidate] = useState<DemoCandidate | null>(null);
  const [matchedDemoCandidate, setMatchedDemoCandidate] = useState<DemoCandidate | null>(null);

  // Drag physics
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; time: number; pointerId: number } | null>(
    null
  );
  const exitTimerRef = useRef<number | null>(null);

  // Product showcase switcher & interactive stage pill
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [hasSwitchedTab, setHasSwitchedTab] = useState(false);
  const [activeChatStage, setActiveChatStage] = useState<number>(1);

  // Score 0-100 simulator
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);

  const productReveal = useRevealOnScroll<HTMLElement>();
  const scoreReveal = useRevealOnScroll<HTMLElement>();
  const plansReveal = useRevealOnScroll<HTMLElement>();

  const currentDemo = demoIndex < DEMO_CANDIDATES.length ? DEMO_CANDIDATES[demoIndex] : null;
  const remainingCount = Math.max(DEMO_CANDIDATES.length - demoIndex, 0);
  const loginHref = isAuthenticated ? '/painel/vagas' : '/login';
  const loginLabel = isAuthenticated ? 'Abrir painel' : 'Entrar';

  const activeTab = SHOWCASE_TABS[activeTabIdx];
  const activeScenario = SCORE_SCENARIOS[selectedScenarioIdx];
  const scenarioTotal = activeScenario.points.reduce((sum, val) => sum + val, 0);

  // Right floating widget reflects matched or current candidate smoothly
  const inspectedCandidate = matchedDemoCandidate ?? currentDemo ?? DEMO_CANDIDATES[0];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const resetDrag = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDemoPass = () => {
    if (!currentDemo) return;
    resetDrag();
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
    }
    setExitingCandidate(currentDemo);
    setDemoIndex((prev) => prev + 1);
    exitTimerRef.current = window.setTimeout(() => {
      setExitingCandidate(null);
    }, 300);
  };

  const handleDemoLike = () => {
    if (!currentDemo) return;
    resetDrag();
    setExitingCandidate(null);
    setMatchedDemoCandidate(currentDemo);
  };

  const resetDemo = () => {
    resetDrag();
    setExitingCandidate(null);
    setMatchedDemoCandidate(null);
    setDemoIndex(0);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!currentDemo || matchedDemoCandidate) return;
    if ((e.target as HTMLElement).closest('button, a')) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      pointerId: e.pointerId,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    if (e.pointerId !== dragStartRef.current.pointerId) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = (e.clientY - dragStartRef.current.y) * 0.18;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    if (e.pointerId !== dragStartRef.current.pointerId) return;
    const finalX = dragOffset.x;
    const elapsed = Math.max(performance.now() - dragStartRef.current.time, 1);
    const velocity = Math.abs(finalX) / elapsed;
    resetDrag();

    if (finalX > 85 || (finalX > 36 && velocity > 0.45)) {
      handleDemoLike();
    } else if (finalX < -85 || (finalX < -36 && velocity > 0.45)) {
      handleDemoPass();
    }
  };

  const dragRotation = Math.max(-9, Math.min(9, (dragOffset.x / 210) * 9));
  const likeStampOpacity = Math.max(0, Math.min(1, dragOffset.x / 80));
  const passStampOpacity = Math.max(0, Math.min(1, -dragOffset.x / 80));

  return (
    <div className="lp-root">
      <a href="#conteudo-principal" className="lp-skip">
        Ir para o conteúdo
      </a>

      {/* Floating Glass Pill Navigation */}
      <header className="lp-nav-shell">
        <div className={`lp-nav ${isScrolled ? 'is-scrolled' : ''}`}>
          <Link to="/" className="lp-brand-link" aria-label="Trabalhaki — Página inicial">
            <BrandMark badge="Empresas" compact hideBadgeOnMobile iconInverted />
          </Link>

          <nav className="lp-nav-links" aria-label="Navegação principal">
            <a href="#produto">Produto</a>
            <a href="#compatibilidade">Score</a>
            <a href="#planos">Planos</a>
          </nav>

          <div className="lp-nav-actions">
            <Link to={loginHref} className="lp-btn lp-btn-ghost lp-btn-sm">
              {loginLabel}
            </Link>
            <Link to="/cadastro" className="lp-btn lp-btn-dark lp-btn-sm lp-nav-cta-desktop">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <main id="conteudo-principal">
        {/* Hero: Monumental Centered Copy + Sculptural Floating Workspace Stage */}
        <section className="lp-hero">
          <div className="lp-wrap">
            <div className="lp-hero-header">
              <h1 className="lp-hero-title lp-enter-1">
                Contrate quem já escolheu a sua vaga.
              </h1>
              <p className="lp-hero-subtitle lp-enter-2">
                Publique com salário aberto, avalie apenas profissionais que curtiram no app e
                converse direto após o match.
              </p>

              <div className="lp-hero-cta lp-enter-3">
                <Link to="/cadastro" className="lp-btn lp-btn-dark lp-btn-lg">
                  Criar conta grátis
                  <ArrowRight size={17} className="lp-btn-arrow" />
                </Link>
                <Link to={loginHref} className="lp-btn lp-btn-soft lp-btn-lg">
                  {loginLabel}
                </Link>
              </div>

              <p className="lp-hero-footnote lp-enter-3">
                Grátis até 3 vagas ativas · Sem cartão de crédito
              </p>
            </div>

            {/* Interactive Spatial Stage (idle.space + Mobbin craft) */}
            <div
              className="lp-stage-frame lp-enter-4"
              aria-label="Demonstração interativa de triagem de candidatos"
            >
              <div className="lp-stage-topbar">
                <div className="lp-stage-job-pill">
                  <span className="lp-stage-dot" aria-hidden="true" />
                  <span className="truncate">Desenvolvedor Java Backend Pleno</span>
                  <span className="lp-stage-job-meta tabular-nums">· R$ 5.000 — R$ 7.500</span>
                </div>
                <span
                  className={`lp-stage-status-pill ${matchedDemoCandidate ? 'is-matched' : ''}`}
                  aria-live="polite"
                >
                  {matchedDemoCandidate ? 'Match ativo' : `${remainingCount} interessados`}
                </span>
              </div>

              <div className="lp-stage-arena">
                {/* Left Floating Tile: Active Role Spec */}
                <aside className="lp-widget lp-widget-left" aria-hidden="true">
                  <span className="lp-widget-label">Vaga publicada no app</span>
                  <div className="lp-widget-title">Java Backend Pleno</div>
                  <div className="lp-widget-salary">R$ 5.000 — R$ 7.500</div>
                  <div className="lp-widget-tags">
                    <span className="lp-micro-chip lp-micro-chip-brand">Java</span>
                    <span className="lp-micro-chip lp-micro-chip-brand">Spring</span>
                    <span className="lp-micro-chip">Remoto</span>
                    <span className="lp-micro-chip">CLT</span>
                  </div>
                </aside>

                {/* Center: Tactile Interactive Swipe Deck */}
                <div className="lp-deck-wrap">
                  {!matchedDemoCandidate && currentDemo && remainingCount > 1 && (
                    <div className="lp-deck-ghost lp-deck-ghost-1" aria-hidden="true" />
                  )}
                  {!matchedDemoCandidate && currentDemo && remainingCount > 2 && (
                    <div className="lp-deck-ghost lp-deck-ghost-2" aria-hidden="true" />
                  )}

                  {exitingCandidate && (
                    <div className="lp-deck-card lp-deck-card-exit" aria-hidden="true">
                      <div className="lp-candidate-head">
                        <div className="lp-candidate-id">
                          <div className="lp-avatar">{exitingCandidate.initials}</div>
                          <div className="min-w-0">
                            <div className="lp-candidate-name truncate">{exitingCandidate.name}</div>
                            <div className="lp-candidate-role truncate">{exitingCandidate.role}</div>
                          </div>
                        </div>
                        <span className="lp-score-chip">{exitingCandidate.score}%</span>
                      </div>
                    </div>
                  )}

                  {matchedDemoCandidate ? (
                    <div className="lp-match-card" role="status" aria-live="polite">
                      <div className="lp-match-pair" aria-hidden="true">
                        <div className="lp-match-avatar lp-match-avatar-cand">
                          {matchedDemoCandidate.initials}
                        </div>
                        <div className="lp-match-seal">
                          <Check size={16} strokeWidth={3} />
                        </div>
                        <div className="lp-match-avatar lp-match-avatar-job">TK</div>
                      </div>

                      <h3>Match confirmado com {matchedDemoCandidate.name}</h3>
                      <p>
                        {matchedDemoCandidate.name.split(' ')[0]} já havia curtido sua vaga no app.
                        O chat direto está liberado.
                      </p>

                      <div className="lp-match-chat-pill">
                        “Olá, {matchedDemoCandidate.name.split(' ')[0]}! Gostamos do seu perfil —
                        podemos conversar esta semana?”
                      </div>

                      <div className="lp-match-actions">
                        <button
                          type="button"
                          className="lp-btn lp-btn-on-dark-muted"
                          onClick={resetDemo}
                        >
                          <RotateCcw size={15} />
                          Testar novamente
                        </button>
                        <Link to="/cadastro" className="lp-btn lp-btn-white">
                          Criar conta
                          <ArrowRight size={15} className="lp-btn-arrow" />
                        </Link>
                      </div>
                    </div>
                  ) : currentDemo ? (
                    <div
                      key={currentDemo.id}
                      className="lp-deck-card lp-deck-card-draggable"
                      style={{
                        transform:
                          dragOffset.x !== 0 || dragOffset.y !== 0
                            ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragRotation}deg)`
                            : undefined,
                        transition: isDragging
                          ? 'none'
                          : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerEnd}
                      onPointerCancel={resetDrag}
                      onLostPointerCapture={resetDrag}
                    >
                      {likeStampOpacity > 0.08 && (
                        <span
                          className="lp-stamp lp-stamp-like"
                          style={{ opacity: likeStampOpacity }}
                        >
                          INTERESSADO
                        </span>
                      )}
                      {passStampOpacity > 0.08 && (
                        <span
                          className="lp-stamp lp-stamp-pass"
                          style={{ opacity: passStampOpacity }}
                        >
                          PASSAR
                        </span>
                      )}

                      <div className="lp-candidate-head">
                        <div className="lp-candidate-id">
                          <div className="lp-avatar">{currentDemo.initials}</div>
                          <div className="min-w-0">
                            <div className="lp-candidate-name">{currentDemo.name}</div>
                            <div className="lp-candidate-role">{currentDemo.role}</div>
                          </div>
                        </div>
                        <span className="lp-score-chip">{currentDemo.score}% match</span>
                      </div>

                      <div className="lp-candidate-facts">
                        <div className="lp-fact-cell">
                          <span className="lp-fact-k">Pretensão</span>
                          <span className="lp-fact-v">{currentDemo.salary}</span>
                        </div>
                        <div className="lp-fact-cell">
                          <span className="lp-fact-k">Experiência</span>
                          <span className="lp-fact-v">{currentDemo.experience}</span>
                        </div>
                        <div className="lp-fact-cell">
                          <span className="lp-fact-k">Modelo</span>
                          <span className="lp-fact-v">{currentDemo.modality}</span>
                        </div>
                      </div>

                      <div className="lp-skills-row">
                        {currentDemo.skills.map((skill, idx) => (
                          <span
                            key={skill}
                            className={`lp-skill-tag ${idx < 2 ? 'lp-skill-tag-primary' : ''}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="lp-deck-note">
                        <Check size={15} className="icon-success icon-shrink" />
                        <span>{currentDemo.highlight}</span>
                      </div>

                      <div className="lp-deck-actions">
                        <button
                          type="button"
                          className="lp-btn lp-btn-soft"
                          onClick={handleDemoPass}
                        >
                          <X size={17} />
                          Passar
                        </button>
                        <button
                          type="button"
                          className="lp-btn lp-btn-dark"
                          onClick={handleDemoLike}
                        >
                          <Heart size={16} />
                          Tenho interesse
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="lp-deck-card lp-empty-card">
                      <div className="lp-candidate-name">Prévia concluída</div>
                      <p className="lp-candidate-role" style={{ maxWidth: '30ch' }}>
                        No painel real você pode desfazer o último descarte ou alternar entre vagas.
                      </p>
                      <button
                        type="button"
                        className="lp-btn lp-btn-dark"
                        onClick={resetDemo}
                        style={{ marginTop: 4 }}
                      >
                        <RotateCcw size={15} />
                        Reiniciar prévia
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Floating Tile: Live Synced Compatibility */}
                <aside className="lp-widget lp-widget-right" aria-hidden="true">
                  <span className="lp-widget-label">
                    {matchedDemoCandidate ? 'Status do match' : 'Leitura de compatibilidade'}
                  </span>
                  <div className="lp-widget-score-big">
                    <span className="lp-widget-score-num">{inspectedCandidate.score}%</span>
                    <span className="lp-widget-score-badge">
                      {matchedDemoCandidate ? 'Chat livre' : 'Alinhado'}
                    </span>
                  </div>
                  <div className="lp-widget-mini-bars">
                    <div className="lp-mini-bar-row">
                      <div className="lp-mini-bar-meta">
                        <span>Stack</span>
                        <span>{Math.round(inspectedCandidate.metrics.stack * 100)}%</span>
                      </div>
                      <div className="lp-mini-bar-track">
                        <div
                          className="lp-mini-bar-fill"
                          style={{ transform: `scaleX(${inspectedCandidate.metrics.stack})` }}
                        />
                      </div>
                    </div>
                    <div className="lp-mini-bar-row">
                      <div className="lp-mini-bar-meta">
                        <span>Experiência</span>
                        <span>{Math.round(inspectedCandidate.metrics.experience * 100)}%</span>
                      </div>
                      <div className="lp-mini-bar-track">
                        <div
                          className="lp-mini-bar-fill"
                          style={{
                            transform: `scaleX(${inspectedCandidate.metrics.experience})`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="lp-mini-bar-row">
                      <div className="lp-mini-bar-meta">
                        <span>Salário</span>
                        <span>{Math.round(inspectedCandidate.metrics.salary * 100)}%</span>
                      </div>
                      <div className="lp-mini-bar-track">
                        <div
                          className="lp-mini-bar-fill lp-mini-bar-fill-mint"
                          style={{ transform: `scaleX(${inspectedCandidate.metrics.salary})` }}
                        />
                      </div>
                    </div>
                  </div>
                </aside>
              </div>

              <p className="lp-deck-hint">
                Arraste o cartão para os lados ou clique para simular o match.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Segmented Product Showcase */}
        <section
          id="produto"
          ref={productReveal.ref}
          className={`lp-section lp-reveal ${productReveal.isVisible ? 'is-visible' : ''}`}
        >
          <div className="lp-wrap">
            <div className="lp-section-head">
              <h2 className="lp-h2">Do anúncio à entrevista, sem ruído.</h2>
              <p className="lp-lead">
                Candidatos usam um perfil único no celular. Sua equipe recebe apenas quem já tem
                interesse real.
              </p>
            </div>

            <div className="lp-segmented-wrap">
              <div
                className="lp-segmented"
                role="tablist"
                aria-label="Etapas do fluxo de contratação"
              >
                <div
                  className="lp-segmented-thumb"
                  style={{ transform: `translateX(${activeTabIdx * 100}%)` }}
                  aria-hidden="true"
                />
                {SHOWCASE_TABS.map((tab, idx) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={activeTabIdx === idx}
                    aria-controls={`panel-${tab.id}`}
                    className="lp-segmented-btn"
                    onClick={() => {
                      setHasSwitchedTab(true);
                      setActiveTabIdx(idx);
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              id={`panel-${activeTab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab.id}`}
              className="lp-showcase-shell"
            >
              <div
                key={activeTab.id}
                className={`lp-showcase-copy ${hasSwitchedTab ? 'lp-tab-animate' : ''}`}
              >
                <h3 className="lp-showcase-title">{activeTab.title}</h3>
                <p className="lp-showcase-desc">{activeTab.description}</p>
                <ul className="lp-showcase-facts">
                  {activeTab.points.map((point) => (
                    <li key={point}>
                      <span className="lp-check-circle" aria-hidden="true">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                key={`visual-${activeTab.id}`}
                className={`lp-showcase-canvas ${hasSwitchedTab ? 'lp-tab-animate' : ''}`}
              >
                {activeTabIdx === 0 && (
                  <>
                    <div className="lp-mock-header">
                      <div>
                        <div className="lp-mock-title">Engenharia de Software Backend</div>
                        <div className="lp-mock-sub">Publicada no app mobile</div>
                      </div>
                      <span className="lp-micro-chip lp-micro-chip-mint">Ativa</span>
                    </div>

                    <div className="lp-mock-grid-2">
                      <div className="lp-mock-field">
                        <span className="lp-mock-field-label">Faixa salarial aberta</span>
                        <span className="lp-mock-field-val">R$ 5.000 — R$ 7.500</span>
                      </div>
                      <div className="lp-mock-field">
                        <span className="lp-mock-field-label">Modelo e contrato</span>
                        <span className="lp-mock-field-val">Remoto · CLT</span>
                      </div>
                    </div>

                    <div className="lp-skills-row">
                      <span className="lp-skill-tag lp-skill-tag-primary">Java</span>
                      <span className="lp-skill-tag lp-skill-tag-primary">Spring Boot</span>
                      <span className="lp-skill-tag lp-skill-tag-primary">SQL</span>
                      <span className="lp-skill-tag">Docker</span>
                      <span className="lp-skill-tag">AWS</span>
                    </div>
                  </>
                )}

                {activeTabIdx === 1 && (
                  <>
                    <div className="lp-mock-header">
                      <div>
                        <div className="lp-mock-title">Fila de interessados</div>
                        <div className="lp-mock-sub">Ordenada por compatibilidade</div>
                      </div>
                      <span className="lp-micro-chip lp-micro-chip-brand">3 perfis</span>
                    </div>

                    <div className="lp-queue-list">
                      <div className="lp-queue-row lp-queue-row-top">
                        <div className="lp-queue-person">
                          <div className="lp-avatar-sm">AC</div>
                          <div className="min-w-0">
                            <div className="lp-mock-title truncate">Ana Clara Costa</div>
                            <div className="lp-mock-sub truncate">4 anos · Curtiu há 12 min</div>
                          </div>
                        </div>
                        <span className="lp-score-chip">96%</span>
                      </div>

                      <div className="lp-queue-row">
                        <div className="lp-queue-person">
                          <div className="lp-avatar-sm lp-avatar-sm-soft">BN</div>
                          <div className="min-w-0">
                            <div className="lp-mock-title truncate">Beatriz Nogueira</div>
                            <div className="lp-mock-sub truncate">3 anos · Curtiu há 28 min</div>
                          </div>
                        </div>
                        <span className="lp-micro-chip lp-micro-chip-mint">91%</span>
                      </div>

                      <div className="lp-queue-row">
                        <div className="lp-queue-person">
                          <div className="lp-avatar-sm lp-avatar-sm-soft">RT</div>
                          <div className="min-w-0">
                            <div className="lp-mock-title truncate">Rafael Tavares</div>
                            <div className="lp-mock-sub truncate">3 anos · Curtiu há 1 h</div>
                          </div>
                        </div>
                        <span className="lp-micro-chip">84%</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTabIdx === 2 && (
                  <>
                    <div className="lp-mock-header">
                      <div className="lp-queue-person">
                        <div className="lp-avatar-sm">AC</div>
                        <div>
                          <div className="lp-mock-title">Ana Clara Costa</div>
                          <div className="lp-mock-sub">Match 96% · Snapshot salvo</div>
                        </div>
                      </div>
                      <span className="lp-micro-chip lp-micro-chip-mint">Chat ativo</span>
                    </div>

                    <div className="lp-chat-thread">
                      <div className="lp-bubble lp-bubble-company">
                        Oi Ana! Adoramos seu perfil para Java Backend. Podemos conversar amanhã às
                        15h?
                      </div>
                      <div className="lp-bubble lp-bubble-candidate">
                        Oi! Perfeito, às 15h funciona ótimo para mim.
                      </div>
                    </div>

                    <div className="lp-stage-track" role="group" aria-label="Etapa do processo">
                      {CHAT_STAGES.map((stage, sIdx) => (
                        <button
                          key={stage}
                          type="button"
                          className={`lp-stage-pill ${
                            activeChatStage === sIdx ? 'lp-stage-pill-active' : ''
                          }`}
                          aria-pressed={activeChatStage === sIdx}
                          onClick={() => setActiveChatStage(sIdx)}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive Score 0–100 Studio */}
        <section
          id="compatibilidade"
          ref={scoreReveal.ref}
          className={`lp-section-tight lp-reveal ${scoreReveal.isVisible ? 'is-visible' : ''}`}
        >
          <div className="lp-wrap">
            <div className="lp-section-head">
              <h2 className="lp-h2">Compatibilidade sem caixa-preta.</h2>
              <p className="lp-lead">
                Cinco pesos objetivos explicam cada ponto na tela. Ninguém é eliminado no escuro.
              </p>
            </div>

            <div
              className="lp-score-pills"
              role="group"
              aria-label="Simular perfis de compatibilidade"
            >
              {SCORE_SCENARIOS.map((scenario, idx) => (
                <button
                  key={scenario.id}
                  type="button"
                  aria-pressed={selectedScenarioIdx === idx}
                  className="lp-scenario-btn"
                  onClick={() => setSelectedScenarioIdx(idx)}
                >
                  {scenario.label}
                </button>
              ))}
            </div>

            <div className="lp-score-bento">
              <div className="lp-score-hero-tile">
                <div className="lp-score-giant-wrap">
                  <span className="lp-score-giant" aria-hidden="true">
                    {scenarioTotal}
                  </span>
                  <span className="lp-score-unit">{scenarioTotal} / 100 pts</span>
                </div>

                <div className="lp-score-role-box">
                  <div className="lp-score-role-title">{activeScenario.role}</div>
                  <div className="lp-score-role-sub">{activeScenario.summary}</div>
                </div>
              </div>

              <div className="lp-score-meters-tile">
                {SCORE_CRITERIA.map((criterion, idx) => {
                  const earned = activeScenario.points[idx];
                  const ratio = earned / criterion.maxPoints;
                  return (
                    <div key={criterion.label} className="lp-meter-row">
                      <div className="lp-meter-head">
                        <span className="lp-meter-label">{criterion.label}</span>
                        <span className="lp-meter-pts">
                          {earned} / {criterion.maxPoints} pts
                        </span>
                      </div>
                      <div className="lp-meter-track" aria-hidden="true">
                        <div
                          className={`lp-meter-fill ${
                            criterion.accent ? 'lp-meter-fill-accent' : ''
                          }`}
                          style={{ transform: `scaleX(${ratio})` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Minimalist Plans */}
        <section
          id="planos"
          ref={plansReveal.ref}
          className={`lp-section-tight lp-reveal ${plansReveal.isVisible ? 'is-visible' : ''}`}
        >
          <div className="lp-wrap">
            <div className="lp-section-head">
              <h2 className="lp-h2">Simples para começar.</h2>
              <p className="lp-lead">
                Comece grátis hoje e evolua quando o seu volume de vagas crescer.
              </p>
            </div>

            <div className="lp-plans-grid">
              <article className="lp-plan-card lp-plan-free">
                <div>
                  <div className="lp-plan-name">Gratuito</div>
                  <div className="lp-plan-price-line">
                    <span className="lp-plan-price">R$ 0</span>
                    <span className="lp-plan-period">/ mês</span>
                  </div>
                  <ul className="lp-plan-list">
                    <li>
                      <Check size={16} className="icon-success icon-shrink" />
                      <span>Até 3 vagas ativas</span>
                    </li>
                    <li>
                      <Check size={16} className="icon-success icon-shrink" />
                      <span>Triagem com score 0–100</span>
                    </li>
                    <li>
                      <Check size={16} className="icon-success icon-shrink" />
                      <span>Chat direto pós-match</span>
                    </li>
                  </ul>
                </div>

                <Link to="/cadastro" className="lp-btn lp-btn-dark lp-btn-lg w-full">
                  Criar conta grátis
                </Link>
              </article>

              <article className="lp-plan-card lp-plan-pro">
                <div>
                  <div className="lp-plan-name">Premium</div>
                  <div className="lp-plan-price-line">
                    <span className="lp-plan-price">R$ 249</span>
                    <span className="lp-plan-period">/ mês</span>
                  </div>
                  <ul className="lp-plan-list">
                    <li>
                      <Check size={16} className="icon-mint icon-shrink" />
                      <span>Vagas ativas ilimitadas</span>
                    </li>
                    <li>
                      <Check size={16} className="icon-mint icon-shrink" />
                      <span>Múltiplos recrutadores no CNPJ</span>
                    </li>
                    <li>
                      <Check size={16} className="icon-mint icon-shrink" />
                      <span>Suporte dedicado na operação</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="mailto:comercial@trabalhaki.com.br?subject=Plano%20Premium%20Trabalhaki"
                  className="lp-btn lp-btn-white lp-btn-lg w-full"
                >
                  <Mail size={16} />
                  Falar com o comercial
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* Section 5: Serene Closing Statement */}
        <section className="lp-closing">
          <div className="lp-wrap lp-closing-inner">
            <BrandIcon size={46} inverted />
            <h2 className="lp-closing-title">
              Sua próxima contratação já deu o primeiro passo.
            </h2>
            <div className="lp-closing-actions">
              <Link to="/cadastro" className="lp-btn lp-btn-dark lp-btn-lg">
                Criar conta grátis
                <ArrowRight size={17} className="lp-btn-arrow" />
              </Link>
              <Link to={loginHref} className="lp-btn lp-btn-soft lp-btn-lg">
                {loginLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <BrandMark compact iconInverted />
          <div className="lp-footer-links">
            <a href="#produto">Produto</a>
            <a href="#compatibilidade">Score</a>
            <a href="#planos">Planos</a>
            <Link to={loginHref}>{loginLabel}</Link>
            <Link to="/cadastro">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
