import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { clearSession } from '../services/api';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderWithRoute(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

const mockCompany = {
  id: 1,
  name: 'Tech Corp Brasil',
  cnpj: '33000167000101',
  description: 'Empresa de tecnologia',
  industry: 'Tecnologia da Informação',
  companySize: '50-200',
  website: 'https://techcorp.com.br',
  logoUrl: null,
  city: 'São Paulo',
  state: 'SP',
  country: 'Brasil',
  latitude: null,
  longitude: null,
  verificationStatus: 'VERIFIED',
  planType: 'FREE',
  active: true,
  createdAt: '2026-10-20T12:00:00',
  updatedAt: null,
};

const mockJobs = [
  {
    id: 1,
    companyId: 1,
    companyName: 'Tech Corp Brasil',
    companyLogoUrl: null,
    title: 'Desenvolvedor Java Backend Pleno',
    description: 'Microsserviços com Spring Boot.',
    minimumSalary: 5000,
    maximumSalary: 7500,
    modality: 'REMOTE',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    contractType: 'CLT',
    seniorityLevel: 'Pleno',
    experienceYears: 2,
    status: 'ACTIVE',
    benefits: ['Vale Refeição'],
    skills: [{ skillName: 'Java', skillType: 'REQUIRED' }],
    version: 1,
    createdAt: '2026-10-20T12:00:00',
    totalApplicantsCount: 2,
    pendingApplicantsCount: 2,
  },
];

const mockApplicants = [
  {
    candidateId: 2,
    name: 'Ana Clara Costa',
    photoUrl: null,
    desiredRole: 'Engenheira de Software Backend',
    area: 'Tecnologia',
    experienceYears: 4,
    education: 'Engenharia de Software',
    city: 'Belo Horizonte',
    state: 'MG',
    country: 'Brasil',
    preferredModality: 'REMOTE',
    preferredContractType: 'CLT',
    minimumSalaryExpectation: 6200,
    completionPercentage: 95,
    skills: ['Java', 'Spring Boot', 'SQL'],
    compatibilityScore: 95,
    explanation: { skills: 'Atende 1 de 1 obrigatórias' },
    appliedAt: '2026-10-21T10:00:00',
  },
  {
    candidateId: 3,
    name: 'Lucas Henrique Mendes',
    photoUrl: null,
    desiredRole: 'Desenvolvedor Full Stack',
    area: 'Tecnologia',
    experienceYears: 3,
    education: 'Sistemas de Informação',
    city: 'Curitiba',
    state: 'PR',
    country: 'Brasil',
    preferredModality: 'REMOTE',
    preferredContractType: 'CLT',
    minimumSalaryExpectation: 5800,
    completionPercentage: 90,
    skills: ['React', 'Java'],
    compatibilityScore: 84,
    explanation: { skills: 'Atende 1 de 1 obrigatórias' },
    appliedAt: '2026-10-21T09:00:00',
  },
];

describe('Trabalhaki Empresas Web Portal', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Landing Page with interactive swipe preview and panel access CTA', async () => {
    const user = userEvent.setup();
    renderWithRoute('/');

    expect(
      screen.getByRole('heading', { name: /Contrate quem já escolheu a sua vaga/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Ana Clara Costa')).toBeInTheDocument();

    // Interactive swipe demo match
    await user.click(screen.getByRole('button', { name: /Tenho interesse/i }));
    expect(screen.getByText(/Match confirmado com Ana Clara Costa/i)).toBeInTheDocument();

    // Navigate to company login
    await user.click(screen.getByRole('link', { name: /^Acessar Painel$/i }));
    expect(screen.getByRole('heading', { name: /Acesso da Empresa/i })).toBeInTheDocument();
  });

  it('blocks CANDIDATE login and accepts COMPANY login redirecting to jobs panel', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) {
        const body = JSON.parse(String(init?.body || '{}'));
        if (body.email === 'candidato@trabalhaki.com') {
          return jsonResponse({
            accessToken: 'cand-jwt',
            refreshToken: 'cand-ref',
            tokenType: 'Bearer',
            expiresInMs: 86400000,
            user: {
              id: 2,
              email: 'candidato@trabalhaki.com',
              role: 'CANDIDATE',
              companyRole: null,
              companyId: null,
            },
          });
        }
        return jsonResponse({
          accessToken: 'comp-jwt',
          refreshToken: 'comp-ref',
          tokenType: 'Bearer',
          expiresInMs: 86400000,
          user: {
            id: 1,
            email: 'empresa@trabalhaki.com',
            role: 'COMPANY',
            companyRole: 'ADMIN',
            companyId: 1,
          },
        });
      }
      if (url.endsWith('/companies/me')) return jsonResponse(mockCompany);
      if (url.endsWith('/jobs/my')) return jsonResponse(mockJobs);
      if (url.endsWith('/matches')) return jsonResponse([]);
      return jsonResponse({});
    });

    renderWithRoute('/login');

    await user.type(screen.getByLabelText(/E-mail corporativo/i), 'candidato@trabalhaki.com');
    await user.type(screen.getByLabelText(/^Senha/i), '123456');
    await user.click(screen.getByRole('button', { name: /Acessar Painel da Empresa/i }));

    expect(
      await screen.findByText(/Este portal web é exclusivo para empresas contratantes/i)
    ).toBeInTheDocument();

    // Now use demo quick fill for COMPANY login
    await user.click(screen.getByRole('button', { name: /empresa@trabalhaki\.com/i }));
    await user.click(screen.getByRole('button', { name: /Acessar Painel da Empresa/i }));

    expect(await screen.findByRole('heading', { name: 'Painel de Vagas' })).toBeInTheDocument();
    expect(await screen.findByText('Desenvolvedor Java Backend Pleno')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('validates invalid CNPJ on company registration', async () => {
    const user = userEvent.setup();
    renderWithRoute('/cadastro');

    await user.type(screen.getByLabelText(/Nome da empresa/i), 'Empresa Nova');
    await user.type(screen.getByLabelText(/CNPJ/i), '11111111111111');
    await user.type(screen.getByLabelText(/E-mail corporativo/i), 'rh@nova.com');
    await user.type(screen.getByLabelText(/^Senha/i), '123456');
    await user.click(screen.getByRole('button', { name: /Criar conta e acessar painel/i }));

    expect(
      await screen.findByText(/O CNPJ informado não é válido estruturalmente/i)
    ).toBeInTheDocument();
  });

  it('handles applicant swipe queue (pass, undo, and like triggering match)', async () => {
    const user = userEvent.setup();
    localStorage.setItem('trabalhaki_access_token', 'comp-jwt');
    localStorage.setItem('trabalhaki_refresh_token', 'comp-ref');
    localStorage.setItem(
      'trabalhaki_user',
      JSON.stringify({
        id: 1,
        email: 'empresa@trabalhaki.com',
        role: 'COMPANY',
        companyRole: 'ADMIN',
        companyId: 1,
      })
    );

    let applicantsState = [...mockApplicants];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method || 'GET';
      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          id: 1,
          email: 'empresa@trabalhaki.com',
          role: 'COMPANY',
          companyRole: 'ADMIN',
          companyId: 1,
        });
      }
      if (url.endsWith('/companies/me')) return jsonResponse(mockCompany);
      if (url.endsWith('/jobs/my')) return jsonResponse(mockJobs);
      if (url.endsWith('/matches')) return jsonResponse([]);
      if (url.endsWith('/jobs/1/applicants')) return jsonResponse(applicantsState);
      if (url.endsWith('/likes/company/job/1/candidate/2/pass') && method === 'POST') {
        applicantsState = applicantsState.filter((a) => a.candidateId !== 2);
        return jsonResponse({ message: 'Candidato descartado' });
      }
      if (url.endsWith('/likes/company/job/1/candidate/2/pass') && method === 'DELETE') {
        applicantsState = [...mockApplicants];
        return jsonResponse({ message: 'Descarte desfeito' });
      }
      if (url.endsWith('/likes/company/job/1/candidate/2') && method === 'POST') {
        applicantsState = applicantsState.filter((a) => a.candidateId !== 2);
        return jsonResponse({
          isMatch: true,
          matchId: 10,
          message: 'Match consumado com sucesso!',
        });
      }
      return jsonResponse({});
    });

    renderWithRoute('/painel/swipe/1');

    expect(await screen.findByText('Ana Clara Costa')).toBeInTheDocument();

    // Pass first applicant -> Lucas appears
    await user.click(screen.getByRole('button', { name: /^Passar$/i }));
    await waitFor(() => {
      expect(screen.getByText('Lucas Henrique Mendes')).toBeInTheDocument();
    });

    // Undo pass -> Ana returns
    await user.click(screen.getByTitle(/Desfazer último descarte/i));
    expect(await screen.findByText('Ana Clara Costa')).toBeInTheDocument();

    // Like Ana -> Match Modal opens
    await user.click(screen.getByRole('button', { name: /Tenho interesse/i }));
    expect(await screen.findByText('Match confirmado!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar conversa agora/i })).toBeInTheDocument();
  });

  it('loads post-match chat and sends first company message', async () => {
    const user = userEvent.setup();
    localStorage.setItem('trabalhaki_access_token', 'comp-jwt');
    localStorage.setItem('trabalhaki_refresh_token', 'comp-ref');
    localStorage.setItem(
      'trabalhaki_user',
      JSON.stringify({
        id: 1,
        email: 'empresa@trabalhaki.com',
        role: 'COMPANY',
        companyRole: 'ADMIN',
        companyId: 1,
      })
    );

    const matchList = [
      {
        id: 10,
        jobId: 1,
        jobTitle: 'Desenvolvedor Java Backend Pleno',
        companyName: 'Tech Corp Brasil',
        companyLogoUrl: null,
        candidateId: 2,
        candidateName: 'Ana Clara Costa',
        candidatePhotoUrl: null,
        compatibilityScore: 95,
        compatibilityExplanationJson: '{}',
        createdAt: '2026-10-21T12:00:00',
        processStatus: 'MATCHED',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method || 'GET';
      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          id: 1,
          email: 'empresa@trabalhaki.com',
          role: 'COMPANY',
          companyRole: 'ADMIN',
          companyId: 1,
        });
      }
      if (url.endsWith('/companies/me')) return jsonResponse(mockCompany);
      if (url.endsWith('/jobs/my')) return jsonResponse(mockJobs);
      if (url.endsWith('/matches')) return jsonResponse(matchList);
      if (url.endsWith('/matches/10/chat') && method === 'GET') {
        return jsonResponse({ id: 5, matchId: 10, messages: [] });
      }
      if (url.endsWith('/matches/10/chat/messages') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        return jsonResponse(
          {
            id: 99,
            senderId: 1,
            senderName: 'Tech Corp Brasil',
            content: body.content,
            createdAt: '2026-10-21T12:05:00',
            senderRole: 'COMPANY',
          },
          201
        );
      }
      return jsonResponse({});
    });

    renderWithRoute('/painel/chat/10');

    expect(
      await screen.findByText(/Envie a primeira mensagem para Ana Clara Costa/i)
    ).toBeInTheDocument();

    const msgBox = screen.getByLabelText(/Mensagem do chat/i);
    await user.type(msgBox, 'Olá Ana, vamos conversar?');
    await user.click(screen.getByRole('button', { name: /Enviar/i }));

    expect(await screen.findByText('Olá Ana, vamos conversar?')).toBeInTheDocument();
  });

  it('creates a new job from the Jobs panel drawer and lists it', async () => {
    const user = userEvent.setup();
    localStorage.setItem('trabalhaki_access_token', 'comp-jwt');
    localStorage.setItem('trabalhaki_refresh_token', 'comp-ref');
    localStorage.setItem(
      'trabalhaki_user',
      JSON.stringify({
        id: 1,
        email: 'empresa@trabalhaki.com',
        role: 'COMPANY',
        companyRole: 'ADMIN',
        companyId: 1,
      })
    );

    const jobsState = [...mockJobs];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method || 'GET';
      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          id: 1,
          email: 'empresa@trabalhaki.com',
          role: 'COMPANY',
          companyRole: 'ADMIN',
          companyId: 1,
        });
      }
      if (url.endsWith('/companies/me')) return jsonResponse(mockCompany);
      if (url.endsWith('/jobs/my')) return jsonResponse(jobsState);
      if (url.endsWith('/matches')) return jsonResponse([]);
      if (url.endsWith('/jobs') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const created = {
          ...mockJobs[0],
          id: 2,
          title: body.title,
          description: body.description,
          minimumSalary: body.minimumSalary,
          maximumSalary: body.maximumSalary,
          totalApplicantsCount: 0,
          pendingApplicantsCount: 0,
        };
        jobsState.push(created);
        return jsonResponse(created, 201);
      }
      return jsonResponse({});
    });

    renderWithRoute('/painel/vagas');

    expect(await screen.findByText('Desenvolvedor Java Backend Pleno')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Nova Vaga/i }));

    await user.type(screen.getByLabelText(/Título da vaga/i), 'Pessoa Desenvolvedora React Sênior');
    await user.type(
      screen.getByLabelText(/Descrição e responsabilidades/i),
      'Liderar arquitetura front-end do portal empresarial.'
    );
    await user.click(screen.getByRole('button', { name: /Publicar vaga/i }));

    expect(await screen.findByText('Pessoa Desenvolvedora React Sênior')).toBeInTheDocument();
  });

  it('displays company profile and adds a recruitment team member', async () => {
    const user = userEvent.setup();
    localStorage.setItem('trabalhaki_access_token', 'comp-jwt');
    localStorage.setItem('trabalhaki_refresh_token', 'comp-ref');
    localStorage.setItem(
      'trabalhaki_user',
      JSON.stringify({
        id: 1,
        email: 'empresa@trabalhaki.com',
        role: 'COMPANY',
        companyRole: 'ADMIN',
        companyId: 1,
      })
    );

    const membersState = [
      {
        userId: 1,
        email: 'empresa@trabalhaki.com',
        companyRole: 'ADMIN',
        active: true,
        createdAt: '2026-10-20T12:00:00',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method || 'GET';
      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          id: 1,
          email: 'empresa@trabalhaki.com',
          role: 'COMPANY',
          companyRole: 'ADMIN',
          companyId: 1,
        });
      }
      if (url.endsWith('/companies/me')) return jsonResponse(mockCompany);
      if (url.endsWith('/jobs/my')) return jsonResponse(mockJobs);
      if (url.endsWith('/matches')) return jsonResponse([]);
      if (url.endsWith('/companies/members') && method === 'GET') return jsonResponse(membersState);
      if (url.endsWith('/companies/members') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const created = {
          userId: 9,
          email: body.email,
          companyRole: body.companyRole,
          active: true,
          createdAt: '2026-10-21T14:00:00',
        };
        membersState.push(created);
        return jsonResponse(created, 201);
      }
      return jsonResponse({});
    });

    renderWithRoute('/painel/empresa');

    expect(await screen.findByText('33.000.167/0001-01', { exact: false })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/E-mail do membro/i), 'recrutador@techcorp.com.br');
    await user.type(screen.getByLabelText(/Senha inicial/i), '123456');
    await user.click(screen.getByRole('button', { name: /Adicionar à equipe/i }));

    expect(await screen.findByText('recrutador@techcorp.com.br')).toBeInTheDocument();
  });
});
