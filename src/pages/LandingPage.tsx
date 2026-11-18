import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Heart,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  breakdown: string[];
}

const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    id: 1,
    name: 'Ana Clara Costa',
    initials: 'AC',
    role: 'Engenheira de Software Backend',
    location: 'Belo Horizonte, MG',
    experience: '4 anos de exp.',
    salary: 'Pretensão R$ 6.200',
    modality: 'Remoto',
    score: 96,
    skills: ['Java', 'Spring Boot', 'SQL', 'Docker', 'AWS'],
    breakdown: [
      '3/3 competências obrigatórias e 2/2 diferenciais',
      'Experiência de 4 anos atende ao mínimo de 2 anos',
      'Pretensão salarial dentro da faixa de R$ 5.000 — R$ 7.500',
    ],
  },
  {
    id: 2,
    name: 'Lucas Henrique Mendes',
    initials: 'LM',
    role: 'Desenvolvedor Full Stack',
    location: 'Curitiba, PR',
    experience: '3 anos de exp.',
    salary: 'Pretensão R$ 5.800',
    modality: 'Remoto',
    score: 84,
    skills: ['Java', 'REST API', 'React', 'TypeScript', 'PostgreSQL'],
    breakdown: [
      '1/3 obrigatórias em Java + base sólida em APIs REST',
      'Experiência de 3 anos compatível com nível Pleno',
      'Modalidade remota alinhada à preferência declarada',
    ],
  },
  {
    id: 3,
    name: 'Mariana Rocha',
    initials: 'MR',
    role: 'Desenvolvedora Java Júnior',
    location: 'Campinas, SP',
    experience: '1 ano de exp.',
    salary: 'Pretensão R$ 4.200',
    modality: 'Híbrido',
    score: 74,
    skills: ['Java', 'SQL', 'Git', 'REST API'],
    breakdown: [
      '2/3 competências obrigatórias atendidas (Java e SQL)',
      'Compatibilidade parcial de experiência (1 ano vs 2 exigidos)',
      'Pretensão abaixo do teto da oportunidade',
    ],
  },
];

const SCORE_WEIGHTS = [
  { label: 'Competências obrigatórias', points: 35, detail: 'Correspondência direta com os requisitos principais da vaga.' },
  { label: 'Competências diferenciais', points: 15, detail: 'Habilidades desejáveis que aceleram a adaptação no time.' },
  { label: 'Experiência profissional', points: 20, detail: 'Integral ao atingir o mínimo exigido e proporcional abaixo dele.' },
  { label: 'Pretensão salarial', points: 15, detail: 'Compatibilidade entre a expectativa do candidato e o teto da vaga.' },
  { label: 'Modalidade e localização', points: 15, detail: 'Vagas remotas pontuam integralmente; presenciais e híbridas consideram cidade e UF.' },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [demoIndex, setDemoIndex] = useState(0);
  const [matchedDemoCandidate, setMatchedDemoCandidate] = useState<DemoCandidate | null>(null);

  const currentDemo = demoIndex < DEMO_CANDIDATES.length ? DEMO_CANDIDATES[demoIndex] : null;

  const handleDemoPass = () => {
    setDemoIndex((prev) => prev + 1);
  };

  const handleDemoLike = () => {
    if (currentDemo) {
      setMatchedDemoCandidate(currentDemo);
    }
  };

  const resetDemo = () => {
    setMatchedDemoCandidate(null);
    setDemoIndex(0);
  };

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="container landing-nav-inner">
          <Link to="/" className="brand-mark">
            <span className="brand-icon" aria-hidden="true">
              <Briefcase size={20} strokeWidth={2.3} />
            </span>
            <span>Trabalhaki</span>
            <span className="badge badge-indigo">Empresas</span>
          </Link>

          <nav className="landing-links" aria-label="Navegação principal">
            <a href="#contexto">Cenário</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#compatibilidade">Compatibilidade</a>
            <a href="#planos">Planos</a>
          </nav>

          <div className="landing-actions">
            <Link to="/cadastro" className="btn btn-secondary btn-sm">
              Cadastrar empresa
            </Link>
            <Link to={isAuthenticated ? '/painel/vagas' : '/login'} className="btn btn-primary btn-sm">
              {isAuthenticated ? 'Ir para o Painel' : 'Acessar Painel'}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero assimétrico com demonstração interativa real do swipe */}
        <section className="hero-band">
          <div className="container hero-grid">
            <div>
              <h1 className="hero-title">Contrate quem já escolheu a sua vaga.</h1>
              <p className="hero-lead">
                O Trabalhaki conecta o aplicativo mobile dos candidatos ao portal web da sua empresa.
                Publique vagas com critérios claros, avalie no swipe apenas profissionais que já
                demonstraram interesse e inicie a conversa assim que o match acontecer.
              </p>

              <div className="hero-cta-row">
                <Link
                  to={isAuthenticated ? '/painel/vagas' : '/login'}
                  className="btn btn-primary btn-lg"
                >
                  {isAuthenticated ? 'Abrir Painel da Empresa' : 'Acessar Painel da Empresa'}
                  <ArrowRight size={18} />
                </Link>
                <Link to="/cadastro" className="btn btn-secondary btn-lg">
                  Criar conta gratuita
                </Link>
              </div>

              <div className="hero-pillars">
                <span className="hero-pillar-item">
                  <CheckCircle2 size={17} color="#393be7" />
                  Apenas candidatos interessados na fila
                </span>
                <span className="hero-pillar-item">
                  <SlidersHorizontal size={17} color="#393be7" />
                  Score de compatibilidade explicado (0–100)
                </span>
                <span className="hero-pillar-item">
                  <MessageSquare size={17} color="#393be7" />
                  Chat direto iniciado pela empresa
                </span>
              </div>
            </div>

            <div className="demo-stage" aria-label="Demonstração interativa de triagem por swipe">
              <div className="demo-stage-bar">
                <div>
                  <div className="demo-stage-title">Vaga: Desenvolvedor Java Backend Pleno</div>
                  <div className="demo-stage-sub tabular-nums">
                    Remoto • R$ 5.000 — R$ 7.500 • {Math.max(DEMO_CANDIDATES.length - demoIndex, 0)} interessados
                  </div>
                </div>
                <span className="badge badge-indigo">Prévia do Painel</span>
              </div>

              {matchedDemoCandidate ? (
                <div className="demo-match-banner">
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      margin: '0 auto 12px',
                      borderRadius: 16,
                      background: '#86e5a1',
                      color: '#12152e',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Sparkles size={24} />
                  </div>
                  <h3>Match confirmado com {matchedDemoCandidate.name}</h3>
                  <p>
                    Como {matchedDemoCandidate.name.split(' ')[0]} já havia curtido esta vaga no
                    aplicativo, sua aprovação liberou o chat pós-match imediatamente.
                  </p>
                  <div className="demo-controls" style={{ marginTop: 20 }}>
                    <button type="button" className="btn btn-secondary" onClick={resetDemo}>
                      <RotateCcw size={16} />
                      Testar novamente
                    </button>
                    <Link to="/login" className="btn btn-mint">
                      Acessar painel real
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ) : currentDemo ? (
                <div className="demo-card" key={currentDemo.id}>
                  <div className="demo-card-top">
                    <div className="demo-avatar-group">
                      <div className="avatar-badge" style={{ width: 48, height: 48, fontSize: '0.95rem' }}>
                        {currentDemo.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{currentDemo.name}</div>
                        <div style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                          {currentDemo.role}
                        </div>
                      </div>
                    </div>
                    <span className="score-pill">{currentDemo.score}% compatível</span>
                  </div>

                  <div className="demo-meta-row">
                    <span className="chip">
                      <MapPin size={14} />
                      {currentDemo.location}
                    </span>
                    <span className="chip">{currentDemo.experience}</span>
                    <span className="chip tabular-nums">{currentDemo.salary}</span>
                    <span className="chip">{currentDemo.modality}</span>
                  </div>

                  <div className="demo-meta-row">
                    {currentDemo.skills.map((skill) => (
                      <span key={skill} className="chip chip-skill">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="demo-breakdown">
                    {currentDemo.breakdown.map((item) => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Check size={14} color="#0f6b3a" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="demo-controls">
                    <button type="button" className="btn btn-secondary" onClick={handleDemoPass}>
                      <X size={18} />
                      Passar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleDemoLike}>
                      <Heart size={18} />
                      Tenho interesse
                    </button>
                  </div>
                </div>
              ) : (
                <div className="demo-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    Você revisou todos os candidatos da prévia.
                  </p>
                  <p style={{ marginTop: 6, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    No painel completo você pode desfazer o último descarte ou alternar entre vagas.
                  </p>
                  <div style={{ marginTop: 18 }}>
                    <button type="button" className="btn btn-secondary" onClick={resetDemo}>
                      <RotateCcw size={16} />
                      Reiniciar prévia
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Evidências de mercado fundamentadas */}
        <section id="contexto" className="section-band section-band-white">
          <div className="container">
            <h2 className="section-heading">
              Por que processos longos e opacos afastam bons profissionais
            </h2>
            <p className="section-lead">
              Recrutar exige clareza dos dois lados. Levantamentos do setor mostram onde o atrito de
              descoberta e a falta de transparência geram perda de tempo para empresas e candidatos.
            </p>

            <div className="market-grid">
              <article className="market-stat-block">
                <div className="market-stat-number">80%</div>
                <p className="market-stat-text">
                  dos empregadores brasileiros relatam dificuldade para encontrar os talentos de que
                  precisam (contra 72% na média global).
                </p>
                <div className="market-stat-source">
                  ManpowerGroup, Pesquisa de Escassez de Talentos, 2026
                </div>
              </article>

              <article className="market-stat-block">
                <div className="market-stat-number">59%</div>
                <p className="market-stat-text">
                  dos candidatos entrevistados afirmaram já ter desistido de uma candidatura por ela
                  demorar demais para ser concluída.
                </p>
                <div className="market-stat-source">
                  Hireology, Hospitality Applicant Study, 2022
                </div>
              </article>

              <article className="market-stat-block">
                <div className="market-stat-number">18%–22%</div>
                <p className="market-stat-text">
                  das vagas publicadas em um trimestre típico foram classificadas como vagas
                  fantasmas na base analisada pelo levantamento.
                </p>
                <div className="market-stat-source">
                  Greenhouse, State of Job Hunting Report, 2024
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Integração Mobile + Web */}
        <section id="como-funciona" className="section-band">
          <div className="container">
            <h2 className="section-heading">
              Dois ambientes, um único back-end em tempo real
            </h2>
            <p className="section-lead">
              Cada lado opera na superfície ideal para sua rotina. Os interesses registrados no
              aplicativo mobile alimentam imediatamente a fila de triagem do portal web empresarial.
            </p>

            <div className="flow-split">
              <div className="flow-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Smartphone size={22} color="#393be7" />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No App do Candidato</h3>
                </div>
                <ul className="flow-list">
                  <li>
                    <CheckCircle2 size={18} color="#393be7" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Perfil estruturado reutilizável com habilidades, experiência, modalidade e
                      pretensão salarial.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} color="#393be7" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Visualização transparente de salário e condições antes de curtir a vaga.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} color="#393be7" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Vagas encerradas pela empresa saem automaticamente da descoberta e das curtidas.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flow-panel flow-panel-company">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={22} color="#280f9f" />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No Portal da Empresa</h3>
                </div>
                <ul className="flow-list">
                  <li>
                    <CheckCircle2 size={18} color="#280f9f" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Painel completo para publicar, editar, pausar ou encerrar vagas com requisitos e
                      benefícios claros.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} color="#280f9f" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Swipe dedicado aos candidatos que já se candidataram naquela vaga, ordenados
                      por compatibilidade.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} color="#280f9f" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Chat pós-match iniciado pelo recrutador, snapshot imutável do perfil e avanço de
                      etapas seletivas.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Transparência do Algoritmo */}
        <section id="compatibilidade" className="section-band section-band-dark">
          <div className="container algo-layout">
            <div>
              <h2 className="section-heading">Compatibilidade explicada em 5 critérios objetivos</h2>
              <p className="section-lead">
                Em vez de ocultar candidatos atrás de filtros opacos, o algoritmo do Trabalhaki calcula
                uma pontuação determinística de 0 a 100 pontos e explica exatamente o porquê de cada
                nota no cartão do candidato.
              </p>
              <div style={{ marginTop: 28 }}>
                <Link to="/cadastro" className="btn btn-mint btn-lg">
                  Publicar primeira vaga
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="weight-bars">
              {SCORE_WEIGHTS.map((item) => (
                <div key={item.label} className="weight-row">
                  <div className="weight-row-top">
                    <span>{item.label}</span>
                    <span className="tabular-nums" style={{ color: '#86e5a1' }}>
                      até {item.points} pts
                    </span>
                  </div>
                  <div className="weight-track">
                    <div className="weight-fill" style={{ width: `${item.points * 2}%` }} />
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#c2c9e6' }}>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="section-band section-band-white">
          <div className="container">
            <h2 className="section-heading">Comece grátis e escale conforme seu time</h2>
            <p className="section-lead">
              Toda conta empresarial já nasce pronta para publicar vagas, triar candidatos interessados
              e conduzir entrevistas no mesmo lugar.
            </p>

            <div className="plans-grid">
              <div className="plan-box">
                <div>
                  <span className="badge badge-mint">Plano FREE</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 12 }}>
                    Essencial para contratar
                  </h3>
                  <p style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>
                    Ideal para validar vagas reais e experimentar o match por interesse recíproco.
                  </p>
                  <ul className="flow-list">
                    <li>
                      <Check size={17} color="#0f6b3a" />
                      <span>Até 3 vagas ativas simultaneamente</span>
                    </li>
                    <li>
                      <Check size={17} color="#0f6b3a" />
                      <span>Swipe de candidatos que curtiram suas vagas</span>
                    </li>
                    <li>
                      <Check size={17} color="#0f6b3a" />
                      <span>Compatibilidade explicada e chat pós-match</span>
                    </li>
                    <li>
                      <Check size={17} color="#0f6b3a" />
                      <span>Gestão de etapas seletivas e equipe de recrutamento</span>
                    </li>
                  </ul>
                </div>

                <Link to="/cadastro" className="btn btn-secondary btn-lg">
                  Cadastrar empresa grátis
                </Link>
              </div>

              <div className="plan-box plan-box-featured">
                <div>
                  <span className="badge badge-indigo">Plano PREMIUM</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 12 }}>
                    Operação contínua sem limite de vagas
                  </h3>
                  <p style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>
                    Para empresas com recrutamento recorrente em múltiplas áreas e squads.
                  </p>
                  <ul className="flow-list">
                    <li>
                      <Check size={17} color="#393be7" />
                      <span>Publicação ilimitada de vagas ativas</span>
                    </li>
                    <li>
                      <Check size={17} color="#393be7" />
                      <span>Múltiplos recrutadores e administradores no mesmo CNPJ</span>
                    </li>
                    <li>
                      <Check size={17} color="#393be7" />
                      <span>Histórico auditável de processos e snapshots preservados</span>
                    </li>
                    <li>
                      <Check size={17} color="#393be7" />
                      <span>Suporte dedicado na operação do portal web</span>
                    </li>
                  </ul>
                </div>

                <Link to="/login" className="btn btn-primary btn-lg">
                  Acessar Painel da Empresa
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={18} color="#393be7" />
            <span>Trabalhaki Empresas — Portal Web integrado à API oficial do Trabalhaki.</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontWeight: 600 }}>
            <Link to="/login">Entrar como empresa</Link>
            <Link to="/cadastro">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
