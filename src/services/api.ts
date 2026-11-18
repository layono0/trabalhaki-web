import type {
  AddCompanyMemberRequest,
  AuthUser,
  CompanyMemberResponse,
  CompanyResponse,
  ConversationResponse,
  CreateJobRequest,
  JobApplicantResponse,
  JobResponse,
  LikeResponse,
  LoginResponse,
  MatchResponse,
  ProcessStatus,
  SelectionProcessResponse,
  UpdateCompanyRequest,
  UpdateJobRequest,
} from '../types/api';
import { cleanCnpj } from '../utils/cnpj';

const STORAGE_KEYS = {
  accessToken: 'trabalhaki_access_token',
  refreshToken: 'trabalhaki_refresh_token',
  user: 'trabalhaki_user',
  apiUrl: 'trabalhaki_api_url',
};

const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export function getApiBaseUrl(): string {
  const custom = localStorage.getItem(STORAGE_KEYS.apiUrl);
  return (custom || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
}

export function setApiBaseUrl(url: string): string {
  const normalized = url.trim().replace(/\/+$/, '') || DEFAULT_API_BASE_URL;
  localStorage.setItem(STORAGE_KEYS.apiUrl, normalized);
  return normalized;
}

export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  try {
    const apiOrigin = new URL(getApiBaseUrl()).origin;
    return trimmed.startsWith('/') ? `${apiOrigin}${trimmed}` : `${apiOrigin}/${trimmed}`;
  } catch {
    return trimmed;
  }
}

export function getStoredSession(): {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
} {
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  const userRaw = localStorage.getItem(STORAGE_KEYS.user);
  let user: AuthUser | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as AuthUser;
    } catch {
      user = null;
    }
  }
  return { accessToken, refreshToken, user };
}

export function persistSession(data: LoginResponse): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, data.refreshToken);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
}

export function persistUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body === 'object') {
      if (body.validationErrors && typeof body.validationErrors === 'object') {
        const vals = Object.values(body.validationErrors).filter(Boolean).map(String);
        if (vals.length > 0) return vals.join(' ');
      }
      if (body.errors && typeof body.errors === 'object') {
        const vals = Object.values(body.errors).filter(Boolean).map(String);
        if (vals.length > 0) return vals.join(' ');
      }
      if (typeof body.message === 'string' && body.message.trim()) {
        return body.message;
      }
      if (typeof body.error === 'string' && body.error.trim()) {
        return body.error;
      }
    }
  } catch {
    // ignore non-json error bodies
  }
  return `Erro HTTP ${response.status}: ${response.statusText || 'Falha na comunicação com o servidor'}`;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const { refreshToken } = getStoredSession();
  if (!refreshToken) return false;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const data = (await response.json()) as LoginResponse;
      persistSession(data);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; retryOn401?: boolean } = {}
): Promise<T> {
  const { skipAuth = false, retryOn401 = true, headers: customHeaders, body, ...rest } = options;
  const { accessToken } = getStoredSession();

  const headers = new Headers(customHeaders);
  headers.set('Accept', 'application/json');
  if (!(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor do Trabalhaki. Verifique se o back-end está em execução.'
    );
  }

  if (response.status === 401 && !skipAuth && retryOn401) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...options, retryOn401: false });
    }
    clearSession();
    window.dispatchEvent(new Event('trabalhaki:unauthorized'));
  }

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  // Auth
  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email: email.trim(), password }),
    });
  },

  registerCompany(payload: {
    companyName: string;
    cnpj: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/register-company', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        companyName: payload.companyName.trim(),
        cnpj: cleanCnpj(payload.cnpj),
        email: payload.email.trim(),
        password: payload.password,
      }),
    });
  },

  getMe(): Promise<AuthUser> {
    return request<AuthUser>('/auth/me');
  },

  // Company profile & members
  getMyCompany(): Promise<CompanyResponse> {
    return request<CompanyResponse>('/companies/me');
  },

  updateMyCompany(payload: UpdateCompanyRequest): Promise<CompanyResponse> {
    return request<CompanyResponse>('/companies/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  uploadCompanyLogo(file: File): Promise<CompanyResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return request<CompanyResponse>('/companies/me/logo', {
      method: 'POST',
      body: formData,
    });
  },

  listCompanyMembers(): Promise<CompanyMemberResponse[]> {
    return request<CompanyMemberResponse[]>('/companies/members');
  },

  addCompanyMember(payload: AddCompanyMemberRequest): Promise<CompanyMemberResponse> {
    return request<CompanyMemberResponse>('/companies/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Jobs
  listMyJobs(): Promise<JobResponse[]> {
    return request<JobResponse[]>('/jobs/my');
  },

  createJob(payload: CreateJobRequest): Promise<JobResponse> {
    return request<JobResponse>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateJob(jobId: number, payload: UpdateJobRequest): Promise<JobResponse> {
    return request<JobResponse>(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  closeJob(jobId: number): Promise<JobResponse> {
    return request<JobResponse>(`/jobs/${jobId}/close`, {
      method: 'PATCH',
    });
  },

  getJobApplicants(jobId: number): Promise<JobApplicantResponse[]> {
    return request<JobApplicantResponse[]>(`/jobs/${jobId}/applicants`);
  },

  // Swipe / Likes / Passes
  likeCandidate(jobId: number, candidateId: number): Promise<LikeResponse> {
    return request<LikeResponse>(`/likes/company/job/${jobId}/candidate/${candidateId}`, {
      method: 'POST',
    });
  },

  passCandidate(jobId: number, candidateId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/likes/company/job/${jobId}/candidate/${candidateId}/pass`, {
      method: 'POST',
    });
  },

  undoPassCandidate(jobId: number, candidateId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/likes/company/job/${jobId}/candidate/${candidateId}/pass`, {
      method: 'DELETE',
    });
  },

  // Matches, Chat & Selection Process
  getMatches(): Promise<MatchResponse[]> {
    return request<MatchResponse[]>('/matches');
  },

  getMatchById(matchId: number): Promise<MatchResponse> {
    return request<MatchResponse>(`/matches/${matchId}`);
  },

  getConversation(matchId: number): Promise<ConversationResponse> {
    return request<ConversationResponse>(`/matches/${matchId}/chat`);
  },

  sendMessage(matchId: number, content: string) {
    return request<ConversationResponse['messages'][number]>(`/matches/${matchId}/chat/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: content.trim() }),
    });
  },

  getProcess(matchId: number): Promise<SelectionProcessResponse> {
    return request<SelectionProcessResponse>(`/matches/${matchId}/process`);
  },

  advanceProcess(
    matchId: number,
    newStatus: ProcessStatus,
    note?: string
  ): Promise<SelectionProcessResponse> {
    return request<SelectionProcessResponse>(`/matches/${matchId}/process/advance`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus, note: note?.trim() || null }),
    });
  },
};
