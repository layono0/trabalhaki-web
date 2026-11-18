import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  api,
  ApiError,
  clearSession,
  getStoredSession,
  persistSession,
  persistUser,
} from '../services/api';
import type { AuthUser, CompanyResponse } from '../types/api';

interface AuthContextValue {
  user: AuthUser | null;
  company: CompanyResponse | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  loginCompany: (email: string, password: string) => Promise<void>;
  registerCompany: (payload: {
    companyName: string;
    cnpj: string;
    email: string;
    password: string;
  }) => Promise<void>;
  refreshCompany: () => Promise<CompanyResponse | null>;
  setCompanyData: (company: CompanyResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CANDIDATE_PORTAL_BLOCK_MESSAGE =
  'Este portal web é exclusivo para empresas contratantes. Para buscar vagas como candidato, utilize o aplicativo mobile Trabalhaki.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getStoredSession();
    if (stored.user?.role === 'COMPANY' && stored.accessToken) {
      return stored.user;
    }
    return null;
  });
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(() => {
    const stored = getStoredSession();
    return Boolean(stored.accessToken && stored.user?.role === 'COMPANY');
  });

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setCompany(null);
  }, []);

  const refreshCompany = useCallback(async (): Promise<CompanyResponse | null> => {
    try {
      const comp = await api.getMyCompany();
      setCompany(comp);
      return comp;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('trabalhaki:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('trabalhaki:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored.accessToken) {
      setIsInitializing(false);
      return;
    }
    if (stored.user && stored.user.role !== 'COMPANY') {
      clearSession();
      setUser(null);
      setIsInitializing(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        const me = await api.getMe();
        if (!active) return;
        if (me.role !== 'COMPANY') {
          clearSession();
          setUser(null);
          setCompany(null);
          return;
        }
        persistUser(me);
        setUser(me);
        const comp = await api.getMyCompany();
        if (active) setCompany(comp);
      } catch {
        // If session became invalid, unauthorized listener or stored state handles it
        const afterCheck = getStoredSession();
        if (active && !afterCheck.accessToken) {
          setUser(null);
          setCompany(null);
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const loginCompany = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.user.role !== 'COMPANY') {
      clearSession();
      throw new ApiError(CANDIDATE_PORTAL_BLOCK_MESSAGE, 403);
    }
    persistSession(response);
    setUser(response.user);
    try {
      const comp = await api.getMyCompany();
      setCompany(comp);
    } catch {
      // Non-fatal if company details fetch fails immediately after login
    }
  }, []);

  const registerCompany = useCallback(
    async (payload: { companyName: string; cnpj: string; email: string; password: string }) => {
      const response = await api.registerCompany(payload);
      if (response.user.role !== 'COMPANY') {
        clearSession();
        throw new ApiError(CANDIDATE_PORTAL_BLOCK_MESSAGE, 403);
      }
      persistSession(response);
      setUser(response.user);
      try {
        const comp = await api.getMyCompany();
        setCompany(comp);
      } catch {
        // Non-fatal
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isInitializing,
        isAuthenticated: Boolean(user && user.role === 'COMPANY'),
        loginCompany,
        registerCompany,
        refreshCompany,
        setCompanyData: setCompany,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return ctx;
}
