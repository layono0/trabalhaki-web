import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandMark';

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
  const loginHref = isAuthenticated ? '/painel/vagas' : '/login';
  const loginLabel = isAuthenticated ? 'Abrir painel' : 'Entrar';

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
          <Link to="/" aria-label="Trabalhaki — Página inicial">
            <BrandMark badge="Empresas" hideBadgeOnMobile />
          </Link>

          <nav className="landing-links" aria-label="Navegação principal">
            <a href="#contexto">Cenário</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#compatibilidade">Compatibilidade</a>
            <a href="#planos">Planos</a>
          </nav>

          <div className="landing-actions">
            <Link to="/cadastro" className="btn btn-secondary btn-sm hide-on-mobile">
              Criar conta gratuita
            </Link>
            <Link to={loginHref} className="btn btn-primary btn-sm">
              {loginLabel}
              <ArrowRight size={15} />
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
                Publique vagas com critérios claros, avalie na triagem apenas profissionais que já
                demonstraram interesse e inicie a conversa assim que o match acontecer.
              </p>

              <div className="hero-cta-row">
                <Link to="/cadastro" className="btn btn-primary btn-lg">
                  Criar conta gratuita
                  <ArrowRight size={18} />
                </Link>
                <Link to={loginHref} className="btn btn-secondary btn-lg">
                  {loginLabel}
                </Link>
              </div>

              <div className="hero-pillars">
                <span className="hero-pillar-item">
                  <CheckCircle2 size={17} className="icon-primary" />
                  Apenas candidatos interessados na fila
                </span>
                <span className="hero-pillar-item">
                  <SlidersHorizontal size={17} className="icon-primary" />
                  Compatibilidade explicada de 0 a 100
                </span>
                <span className="hero-pillar-item">
                  <MessageSquare size={17} className="icon-primary" />
                  Chat direto iniciado pela empresa
                </span>
              </div>
            </div>

            <div className="demo-stage" aria-label="Demonstração interativa de triagem">
              <div className="demo-stage-bar">
                <div className="min-w-0">
                  <div className="demo-stage-title truncate">
                    Vaga: Desenvolvedor Java Backend Pleno
                  </div>
                  <div className="demo-stage-sub tabular-nums">
                    Remoto · R$ 5.000 — R$ 7.500 · {Math.max(DEMO_CANDIDATES.length - demoIndex, 0)} interessados
                  </div>
                </div>
                <span className="badge badge-indigo">Exemplo</span>
              </div>

              {matchedDemoCandidate ? (
                <div className="demo-match-banner">
                  <div className="demo-match-seal" aria-hidden="true">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3>Match confirmado com {matchedDemoCandidate.name}</h3>
                  <p>
                    Como {matchedDemoCandidate.name.split(' ')[0]} já havia curtido esta vaga no
                    aplicativo, sua aprovação liberou o chat pós-match imediatamente.
                  </p>
                  <div className="demo-controls">
                    <button type="button" className="btn btn-secondary" onClick={resetDemo}>
                      <RotateCcw size={16} />
                      Testar novamente
                    </button>
                    <Link to="/cadastro" className="btn btn-mint">
                      Criar conta gratuita
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ) : currentDemo ? (
                <div className="demo-card" key={currentDemo.id}>
                  <div className="demo-card-top">
                    <div className="demo-avatar-group">
                      <div className="avatar-badge avatar-md">{currentDemo.initials}</div>
                      <div className="min-w-0">
                        <div className="demo-candidate-name">{currentDemo.name}</div>
                        <div className="demo-candidate-role">{currentDemo.role}</div>
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
                      <div key={item} className="demo-breakdown-item">
                        <Check size={14} className="icon-success flow-list-icon" />
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
                <div className="demo-card demo-card-empty">
                  <p className="demo-candidate-name">
                    Você revisou todos os candidatos da prévia.
                  </p>
                  <p className="text-muted text-sm" style={{ marginTop: 6 }}>
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
              Candidatos no app, sua equipe no portal web
            </h2>
            <p className="section-lead">
              Cada lado opera na experiência ideal para sua rotina. Os interesses registrados no
              aplicativo mobile aparecem imediatamente na fila de triagem da sua empresa.
            </p>

            <div className="flow-split">
              <div className="flow-panel">
                <div className="flow-panel-header">
                  <Smartphone size={22} className="icon-primary" />
                  <h3 className="flow-panel-title">No App do Candidato</h3>
                </div>
                <ul className="flow-list">
                  <li>
                    <CheckCircle2 size={18} className="icon-primary flow-list-icon" />
                    <span>
                      Perfil estruturado reutilizável com habilidades, experiência, modalidade e
                      pretensão salarial.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="icon-primary flow-list-icon" />
                    <span>
                      Visualização transparente de salário e condições antes de curtir a vaga.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="icon-primary flow-list-icon" />
                    <span>
                      Vagas encerradas pela empresa saem automaticamente da descoberta e das curtidas.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flow-panel flow-panel-company">
                <div className="flow-panel-header">
                  <Users size={22} className="icon-accent" />
                  <h3 className="flow-panel-title">No Portal da Empresa</h3>
                </div>
                <ul className="flow-list">
                  <li>
                    <CheckCircle2 size={18} className="icon-accent flow-list-icon" />
                    <span>
                      Painel completo para publicar, editar, pausar ou encerrar vagas com requisitos e
                      benefícios claros.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="icon-accent flow-list-icon" />
                    <span>
                      Triagem dedicada aos candidatos que já se candidataram naquela vaga, ordenados
                      por compatibilidade.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="icon-accent flow-list-icon" />
                    <span>
                      Chat pós-match iniciado pelo recrutador, registro preservado do perfil e avanço de
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
                Em vez de ocultar candidatos atrás de filtros opacos, o Trabalhaki calcula
                uma pontuação transparente de 0 a 100 pontos e explica exatamente o porquê de cada
                nota no cartão do candidato.
              </p>
              <div className="section-cta-wrap">
                <Link to="/cadastro" className="btn btn-mint btn-lg">
                  Criar conta gratuita
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="weight-bars">
              {SCORE_WEIGHTS.map((item) => (
                <div key={item.label} className="weight-row">
                  <div className="weight-row-top">
                    <span>{item.label}</span>
                    <span className="tabular-nums weight-points">
                      {item.points} de 100 pts
                    </span>
                  </div>
                  <div className="weight-track" aria-hidden="true">
                    <div className="weight-fill" style={{ width: `${item.points}%` }} />
                  </div>
                  <span className="weight-detail">{item.detail}</span>
                </div>
              ))}
              <div className="weight-scale-caption tabular-nums">
                <span>Escala real proporcional ao total de 100 pontos</span>
                <span>Soma: 100 pts</span>
              </div>
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
                  <span className="badge badge-mint">Plano Gratuito</span>
                  <h3 className="plan-title">Essencial para contratar</h3>
                  <div className="plan-price-row">
                    <span className="plan-price">R$ 0</span>
                    <span className="plan-period">/mês · sem cartão</span>
                  </div>
                  <p className="plan-desc">
                    Ideal para validar vagas reais e experimentar o match por interesse recíproco.
                  </p>
                  <ul className="flow-list">
                    <li>
                      <Check size={17} className="icon-success flow-list-icon" />
                      <span>Até 3 vagas ativas simultaneamente</span>
                    </li>
                    <li>
                      <Check size={17} className="icon-success flow-list-icon" />
                      <span>Triagem de candidatos que curtiram suas vagas</span>
                    </li>
                    <li>
                      <Check size={17} className="icon-success flow-list-icon" />
                      <span>Compatibilidade explicada e chat pós-match</span>
                    </li>
                    <li>
                      <Check size={17} className="icon-success flow-list-icon" />
                      <span>Gestão de etapas seletivas e equipe de recrutamento</span>
                    </li>
                  </ul>
                </div>

                <Link to="/cadastro" className="btn btn-secondary btn-lg">
                  Criar conta gratuita
                </Link>
              </div>

              <div className="plan-box plan-box-featured">
                <div>
                  <span className="badge badge-indigo">Plano Premium</span>
                  <h3 className="plan-title">Operação contínua sem limite de vagas</h3>
                  <div className="plan-price-row">
                    <span className="plan-price">R$ 249</span>
                    <span className="plan-period">/mês · cancele quando quiser</span>
                  </div>
                  <p className="plan-desc">
                    Para empresas com recrutamento recorrente em múltiplas áreas e times.
                  </p>
                  <ul className="flow-list">
                    <li>
                      <Check size={17} className="icon-primary flow-list-icon" />
                      <span>Publicação ilimitada de vagas ativas</span>
                    </li>
                    <li>
                      <Check size={17} className="icon-primary flow-list-icon" />
                      <span>Múltiplos recrutadores e administradores no mesmo CNPJ</span>
                    </li>
                    <li>
                      <Check size={17} className="icon-primary flow-list-icon" />
                      <span>Histórico completo de etapas e candidaturas preservadas</span>
                    </li>
                    <li>
                      <Check size={17} className="icon-primary flow-list-icon" />
                      <span>Suporte dedicado na operação do portal web</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="mailto:comercial@trabalhaki.com.br?subject=Plano%20Premium%20Trabalhaki"
                  className="btn btn-primary btn-lg"
                >
                  <Mail size={17} />
                  Falar com o comercial
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <div className="row-inline">
            <ShieldCheck size={18} className="icon-primary" />
            <span>Trabalhaki Empresas — Recrutamento por interesse recíproco.</span>
          </div>
          <div className="landing-footer-links">
            <Link to={loginHref}>{loginLabel}</Link>
            <Link to="/cadastro">Criar conta gratuita</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
