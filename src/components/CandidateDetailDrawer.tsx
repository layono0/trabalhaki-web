import { Check, GraduationCap, Heart, MapPin, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import type { JobApplicantResponse, JobResponse } from '../types/api';
import { resolveAssetUrl } from '../services/api';
import {
  formatCurrency,
  formatDateTime,
  formatLocation,
  formatModality,
  getInitials,
} from '../utils/formatters';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface CandidateDetailDrawerProps {
  applicant: JobApplicantResponse | null;
  selectedJob: JobResponse | null;
  onClose: () => void;
  onPass: (applicant: JobApplicantResponse) => void;
  onLike: (applicant: JobApplicantResponse) => void;
}

const EXPLANATION_LABELS: Record<string, string> = {
  skills: 'Competências',
  experience: 'Experiência',
  salary: 'Faixa salarial',
  modality: 'Modalidade',
  location: 'Localização',
  certificates: 'Certificações verificadas',
};

export function CandidateDetailDrawer({
  applicant,
  selectedJob,
  onClose,
  onPass,
  onLike,
}: CandidateDetailDrawerProps) {
  const { containerRef, handleBackdropClick } = useDialogA11y({
    open: Boolean(applicant),
    onClose,
  });

  if (!applicant) return null;

  const photoSrc = resolveAssetUrl(applicant.photoUrl);
  const jobSkillSet = new Set(
    (selectedJob?.skills || []).map((s) => s.skillName.trim().toLowerCase())
  );
  const verifiedSkillSet = new Set(
    (applicant.verifiedSkills || []).map((s) => s.trim().toLowerCase())
  );

  return (
    <div
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-drawer-title"
      onClick={handleBackdropClick}
    >
      <div ref={containerRef} tabIndex={-1} className="drawer-panel">
        <div className="drawer-header">
          <div className="demo-avatar-group">
            <div className="avatar-badge avatar-md">
              {photoSrc ? (
                <img src={photoSrc} alt={applicant.name} />
              ) : (
                getInitials(applicant.name)
              )}
            </div>
            <div className="min-w-0">
              <h2 id="candidate-drawer-title" className="drawer-title">
                {applicant.name}
              </h2>
              <p className="drawer-subtitle">
                {applicant.desiredRole || 'Candidato'} · {applicant.area || 'Área não informada'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="row-wrap">
            <span className="score-pill">
              <SlidersHorizontal size={14} />
              {applicant.compatibilityScore}% de compatibilidade
            </span>
            {(applicant.priorityBonus ?? 0) > 0 && (
              <span className="badge badge-mint tabular-nums">
                <ShieldCheck size={13} />
                +{applicant.priorityBonus} pts certificação
              </span>
            )}
            {applicant.completionPercentage != null && (
              <span className="badge badge-neutral tabular-nums">
                Perfil {applicant.completionPercentage}% completo
              </span>
            )}
            <span className="badge badge-indigo">
              Candidatou-se em {formatDateTime(applicant.appliedAt)}
            </span>
          </div>

          <div className="form-grid-2">
            <div className="stat-tile">
              <div className="stat-tile-label">Experiência</div>
              <div className="stat-tile-value tabular-nums">
                {applicant.experienceYears != null
                  ? `${applicant.experienceYears} ano(s)`
                  : 'Não informada'}
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Pretensão mínima</div>
              <div className="stat-tile-value tabular-nums">
                {formatCurrency(applicant.minimumSalaryExpectation)}
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Modalidade</div>
              <div className="stat-tile-value">
                {formatModality(applicant.preferredModality)}
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Contrato</div>
              <div className="stat-tile-value">
                {applicant.preferredContractType || 'Não especificado'}
              </div>
            </div>
          </div>

          <div className="stack-xs text-sm">
            <div className="row-inline">
              <MapPin size={16} className="icon-primary" />
              <span>{formatLocation(applicant.city, applicant.state, applicant.country)}</span>
            </div>
            {applicant.education && (
              <div className="row-inline">
                <GraduationCap size={16} className="icon-primary" />
                <span>{applicant.education}</span>
              </div>
            )}
          </div>

          <div className="stack-xs">
            <h3 className="form-section-title">Competências do candidato</h3>
            {applicant.skills.length > 0 ? (
              <div className="row-wrap">
                {applicant.skills.map((skill) => {
                  const matches = jobSkillSet.has(skill.trim().toLowerCase());
                  const isVerified = verifiedSkillSet.has(skill.trim().toLowerCase());
                  return (
                    <span
                      key={skill}
                      className={`chip ${matches || isVerified ? 'chip-skill-soft' : 'chip-skill'}`}
                    >
                      {isVerified ? <ShieldCheck size={13} /> : matches && <Check size={13} />}
                      {skill}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma habilidade cadastrada.</p>
            )}
          </div>

          <div className="stack-sm">
            <h3 className="form-section-title">Detalhamento da compatibilidade</h3>
            <div className="stack-sm">
              {Object.entries(applicant.explanation || {}).map(([key, message]) => (
                <div key={key} className="explanation-item">
                  <div className="explanation-item-label">{EXPLANATION_LABELS[key] || key}</div>
                  <div className="explanation-item-text">{message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onClose();
              onPass(applicant);
            }}
          >
            <X size={16} />
            Passar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onLike(applicant);
            }}
          >
            <Heart size={16} />
            Tenho interesse
          </button>
        </div>
      </div>
    </div>
  );
}
