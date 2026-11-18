import type { JobStatus, ProcessStatus, VerificationStatus, WorkModality } from '../types/api';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'A combinar';
  }
  return currencyFormatter.format(value);
}

export function formatSalaryRange(min?: number | null, max?: number | null): string {
  if (min == null || max == null) return 'A combinar';
  return `${formatCurrency(min)} — ${formatCurrency(max)}`;
}

export function formatModality(modality?: WorkModality | null): string {
  switch (modality) {
    case 'REMOTE':
      return 'Remoto';
    case 'HYBRID':
      return 'Híbrido';
    case 'ONSITE':
      return 'Presencial';
    default:
      return 'Não informada';
  }
}

export function formatLocation(city?: string | null, state?: string | null, country?: string | null): string {
  const parts = [city?.trim(), state?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return country?.trim() || 'Brasil';
}

export function formatJobStatus(status: JobStatus): { label: string; tone: 'active' | 'paused' | 'closed' } {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Ativa', tone: 'active' };
    case 'PAUSED':
      return { label: 'Pausada', tone: 'paused' };
    case 'CLOSED':
      return { label: 'Encerrada', tone: 'closed' };
  }
}

export function formatProcessStatus(
  status?: ProcessStatus | null
): { label: string; tone: 'indigo' | 'mint' | 'amber' | 'danger' | 'neutral' } {
  switch (status) {
    case 'MATCHED':
      return { label: 'Match confirmado', tone: 'indigo' };
    case 'IN_REVIEW':
      return { label: 'Em análise', tone: 'amber' };
    case 'INTERVIEW':
      return { label: 'Entrevista', tone: 'indigo' };
    case 'APPROVED':
      return { label: 'Aprovado', tone: 'mint' };
    case 'REJECTED':
      return { label: 'Reprovado', tone: 'danger' };
    case 'WITHDRAWN':
      return { label: 'Desistência', tone: 'neutral' };
    default:
      return { label: 'Match confirmado', tone: 'indigo' };
  }
}

export function formatVerificationStatus(status?: VerificationStatus): string {
  switch (status) {
    case 'VERIFIED':
      return 'Empresa verificada';
    case 'PENDING':
      return 'Verificação pendente';
    case 'REJECTED':
      return 'Verificação recusada';
    case 'UNVERIFIED':
    default:
      return 'Cadastro não verificado';
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'Recente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeDate(value?: string | null): string {
  if (!value) return 'Recente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recente';
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Agora há pouco';
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  return `Há ${diffDays} dias`;
}

export function formatTimeOnly(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getInitials(name?: string | null): string {
  if (!name) return 'TK';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TK';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
