import type { CompanyRole, PlanType } from '../types/api';

export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
] as const;

export function formatPlanLabel(planType?: PlanType | string | null): string {
  return planType === 'PREMIUM' ? 'Plano Premium' : 'Plano Gratuito';
}

export function formatPlanShort(planType?: PlanType | string | null): string {
  return planType === 'PREMIUM' ? 'Premium' : 'Gratuito';
}

export function formatCompanyRole(role?: CompanyRole | string | null): string {
  return role === 'ADMIN' ? 'Administrador' : 'Recrutador';
}
