import { Check, GraduationCap, Heart, MapPin, Sparkles, X } from 'lucide-react';
import type { JobApplicantResponse, JobResponse } from '../types/api';
import { resolveAssetUrl } from '../services/api';
import {
  formatCurrency,
  formatDateTime,
  formatLocation,
  formatModality,
  getInitials,
} from '../utils/formatters';

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
};

export function CandidateDetailDrawer({
  applicant,
  selectedJob,
  onClose,
  onPass,
  onLike,
}: CandidateDetailDrawerProps) {
  if (!applicant) return null;

  const photoSrc = resolveAssetUrl(applicant.photoUrl);
  const jobSkillSet = new Set(
    (selectedJob?.skills || []).map((s) => s.skillName.trim().toLowerCase())
  );

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-labelledby="candidate-drawer-title">
      <div className="drawer-panel">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar-badge" style={{ width: 48, height: 48 }}>
              {photoSrc ? (
                <img src={photoSrc} alt={applicant.name} />
              ) : (
                getInitials(applicant.name)
              )}
            </div>
            <div>
              <h2 id="candidate-drawer-title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {applicant.name}
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                {applicant.desiredRole || 'Candidato'} • {applicant.area || 'Área não informada'}
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar detalhes">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <span className="score-pill">
              <Sparkles size={14} />
              {applicant.compatibilityScore}% de compatibilidade
            </span>
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
            <div className="panel-surface" style={{ padding: 14 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Experiência</div>
              <div style={{ fontWeight: 700, marginTop: 2 }} className="tabular-nums">
                {applicant.experienceYears != null ? `${applicant.experienceYears} ano(s)` : 'Não informada'}
              </div>
            </div>
            <div className="panel-surface" style={{ padding: 14 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Pretensão mínima
              </div>
              <div style={{ fontWeight: 700, marginTop: 2 }} className="tabular-nums">
                {formatCurrency(applicant.minimumSalaryExpectation)}
              </div>
            </div>
            <div className="panel-surface" style={{ padding: 14 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Modalidade</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>
                {formatModality(applicant.preferredModality)}
              </div>
            </div>
            <div className="panel-surface" style={{ padding: 14 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Contrato</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>
                {applicant.preferredContractType || 'Não especificado'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem' }}>
              <MapPin size={16} color="#393be7" />
              <span>{formatLocation(applicant.city, applicant.state, applicant.country)}</span>
            </div>
            {applicant.education && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem' }}>
                <GraduationCap size={16} color="#393be7" />
                <span>{applicant.education}</span>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8 }}>
              Competências do candidato
            </h3>
            {applicant.skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {applicant.skills.map((skill) => {
                  const matches = jobSkillSet.has(skill.trim().toLowerCase());
                  return (
                    <span key={skill} className={`chip ${matches ? 'chip-skill-soft' : 'chip-skill'}`}>
                      {matches && <Check size={13} />}
                      {skill}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                Nenhuma habilidade cadastrada.
              </p>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 10 }}>
              Detalhamento completo da compatibilidade
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(applicant.explanation || {}).map(([key, message]) => (
                <div
                  key={key}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor: 'var(--color-surface-muted)',
                    fontSize: '0.86rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {EXPLANATION_LABELS[key] || key}
                  </div>
                  <div style={{ marginTop: 2, color: 'var(--color-text)' }}>{message}</div>
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
