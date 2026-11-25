export type Role = 'CANDIDATE' | 'COMPANY';
export type CompanyRole = 'ADMIN' | 'RECRUITER';
export type WorkModality = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type JobStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type SkillType = 'REQUIRED' | 'PREFERRED';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PlanType = 'FREE' | 'PREMIUM';
export type ProcessStatus =
  | 'MATCHED'
  | 'IN_REVIEW'
  | 'INTERVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  companyRole: CompanyRole | null;
  companyId: number | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: AuthUser;
}

export interface CompanyResponse {
  id: number;
  name: string;
  cnpj: string;
  description: string | null;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  verificationStatus: VerificationStatus;
  planType: PlanType;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateCompanyRequest {
  name?: string;
  description?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  logoUrl?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CompanyMemberResponse {
  userId: number;
  email: string;
  companyRole: CompanyRole;
  active: boolean;
  createdAt: string;
}

export interface AddCompanyMemberRequest {
  email: string;
  password: string;
  companyRole: CompanyRole;
}

export interface JobSkillPayload {
  skillName: string;
  skillType: SkillType;
}

export interface JobResponse {
  id: number;
  companyId: number;
  companyName: string;
  companyLogoUrl: string | null;
  title: string;
  description: string;
  minimumSalary: number;
  maximumSalary: number;
  modality: WorkModality;
  city: string | null;
  state: string | null;
  country: string | null;
  contractType: string;
  seniorityLevel: string;
  experienceYears: number;
  status: JobStatus;
  benefits: string[];
  skills: JobSkillPayload[];
  version: number;
  createdAt: string;
  totalApplicantsCount: number;
  pendingApplicantsCount: number;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  minimumSalary: number;
  maximumSalary: number;
  modality: WorkModality;
  city?: string;
  state?: string;
  country?: string;
  contractType: string;
  seniorityLevel: string;
  experienceYears: number;
  benefits: string[];
  skills: JobSkillPayload[];
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: JobStatus;
}

export interface JobApplicantResponse {
  candidateId: number;
  name: string;
  photoUrl: string | null;
  desiredRole: string | null;
  area: string | null;
  experienceYears: number | null;
  education: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  preferredModality: WorkModality | null;
  preferredContractType: string | null;
  minimumSalaryExpectation: number | null;
  completionPercentage: number | null;
  skills: string[];
  compatibilityScore: number;
  explanation: Record<string, string>;
  appliedAt: string;
  verifiedSkills?: string[];
  priorityBonus?: number;
}

export interface LikeResponse {
  isMatch: boolean;
  matchId: number | null;
  message: string;
}

export interface MatchResponse {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string | null;
  candidateId: number;
  candidateName: string;
  candidatePhotoUrl: string | null;
  compatibilityScore: number | null;
  compatibilityExplanationJson: string | null;
  createdAt: string;
  jobSnapshotJson?: string | null;
  candidateSnapshotJson?: string | null;
  processStatus?: ProcessStatus | null;
}

export interface ChatMessageResponse {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
  senderRole?: Role;
}

export interface ConversationResponse {
  id: number;
  matchId: number;
  messages: ChatMessageResponse[];
}

export interface ProcessHistoryEntry {
  fromStatus: ProcessStatus | null;
  toStatus: ProcessStatus;
  note: string | null;
  changedByUserId: number;
  changedAt: string;
}

export interface SelectionProcessResponse {
  id: number;
  matchId: number;
  currentStatus: ProcessStatus;
  history: ProcessHistoryEntry[];
  createdAt: string;
  updatedAt: string | null;
}
