import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  Check,
  Clock,
  GraduationCap,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { JobApplicantResponse, JobResponse } from '../types/api';
import { resolveAssetUrl } from '../services/api';
import {
  formatCurrency,
  formatLocation,
  formatModality,
  formatRelativeDate,
  getInitials,
} from '../utils/formatters';

interface CandidateSwipeCardProps {
  applicant: JobApplicantResponse;
  selectedJob: JobResponse | null;
  isFront: boolean;
  stackIndex: number;
  disabled?: boolean;
  onSwipe: (applicant: JobApplicantResponse, direction: 'left' | 'right') => void;
  onInspect: (applicant: JobApplicantResponse) => void;
}

export function CandidateSwipeCard({
  applicant,
  selectedJob,
  isFront,
  stackIndex,
  disabled = false,
  onSwipe,
  onInspect,
}: CandidateSwipeCardProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const draggedDistanceRef = useRef(0);

  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    startPointRef.current = null;
  }, [applicant.candidateId]);

  const photoSrc = resolveAssetUrl(applicant.photoUrl);

  const jobSkillSet = new Set(
    (selectedJob?.skills || []).map((s) => s.skillName.trim().toLowerCase())
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isFront || disabled) return;
    if ((e.target as HTMLElement).closest('button')) return;
    startPointRef.current = { x: e.clientX, y: e.clientY };
    draggedDistanceRef.current = 0;
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isFront || !isDragging || !startPointRef.current) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = (e.clientY - startPointRef.current.y) * 0.28;
    draggedDistanceRef.current = Math.abs(dx);
    setDragOffset({ x: dx, y: dy });
  };

  const finishDrag = () => {
    if (!isFront || !isDragging) return;
    setIsDragging(false);
    startPointRef.current = null;

    if (dragOffset.x > 110) {
      onSwipe(applicant, 'right');
      return;
    }
    if (dragOffset.x < -110) {
      onSwipe(applicant, 'left');
      return;
    }
    setDragOffset({ x: 0, y: 0 });
  };

  if (!isFront) {
    const translateY = stackIndex === 1 ? 12 : 24;
    const scale = stackIndex === 1 ? 0.96 : 0.92;
    const opacity = stackIndex === 1 ? 0.86 : 0.7;

    return (
      <div
        className="swipe-card"
        aria-hidden="true"
        style={{
          transform: `translateY(${translateY}px) scale(${scale})`,
          opacity,
          zIndex: 10 - stackIndex,
          pointerEvents: 'none',
        }}
      >
        <div className="swipe-card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar-badge" style={{ width: 52, height: 52 }}>
              {getInitials(applicant.name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{applicant.name}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                {applicant.desiredRole || 'Candidato'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rotationDeg = Math.max(-14, Math.min(14, (dragOffset.x / 220) * 14));
  const likeOpacity = Math.max(0, Math.min(1, dragOffset.x / 100));
  const passOpacity = Math.max(0, Math.min(1, -dragOffset.x / 100));

  return (
    <article
      className="swipe-card swipe-card-front"
      style={{
        zIndex: 20,
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotationDeg}deg)`,
        transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {likeOpacity > 0.05 && (
        <div className="swipe-stamp swipe-stamp-like" style={{ opacity: likeOpacity }}>
          INTERESSADO
        </div>
      )}
      {passOpacity > 0.05 && (
        <div className="swipe-stamp swipe-stamp-pass" style={{ opacity: passOpacity }}>
          PASSAR
        </div>
      )}

      <div className="swipe-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div className="avatar-badge" style={{ width: 60, height: 60, fontSize: '1.1rem' }}>
              {photoSrc ? (
                <img src={photoSrc} alt={applicant.name} />
              ) : (
                getInitials(applicant.name)
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2 }}>
                {applicant.name}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 2 }}>
                {applicant.desiredRole || 'Cargo desejado não informado'}
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 5,
                  fontSize: '0.78rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <Clock size={13} />
                Candidatou-se {formatRelativeDate(applicant.appliedAt)}
              </div>
            </div>
          </div>

          <span className="score-pill">
            <Sparkles size={14} />
            {applicant.compatibilityScore}%
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="chip">
            <MapPin size={14} />
            {formatLocation(applicant.city, applicant.state, applicant.country)}
          </span>
          <span className="chip">{formatModality(applicant.preferredModality)}</span>
          <span className="chip tabular-nums">
            {applicant.experienceYears != null
              ? `${applicant.experienceYears} ano(s) de exp.`
              : 'Exp. não informada'}
          </span>
          <span className="chip tabular-nums">
            Pretensão: {formatCurrency(applicant.minimumSalaryExpectation)}
          </span>
          {applicant.preferredContractType && (
            <span className="chip">
              <Briefcase size={14} />
              {applicant.preferredContractType}
            </span>
          )}
        </div>

        {applicant.education && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 12,
              backgroundColor: 'var(--color-surface-muted)',
              fontSize: '0.88rem',
            }}
          >
            <GraduationCap size={17} color="#393be7" />
            <span>
              <strong>Formação:</strong> {applicant.education}
            </span>
          </div>
        )}

        <div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 8 }}>
            Competências declaradas ({applicant.skills.length})
          </div>
          {applicant.skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {applicant.skills.map((skill) => {
                const isMatch = jobSkillSet.has(skill.trim().toLowerCase());
                return (
                  <span
                    key={skill}
                    className={`chip ${isMatch ? 'chip-skill-soft' : 'chip-skill'}`}
                  >
                    {isMatch && <Check size={13} />}
                    {skill}
                  </span>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
              Candidato ainda não listou competências no perfil.
            </p>
          )}
        </div>

        {Object.keys(applicant.explanation || {}).length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              Por que deu {applicant.compatibilityScore}% de compatibilidade
            </div>
            {Object.entries(applicant.explanation)
              .slice(0, 3)
              .map(([key, text]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 7,
                    fontSize: '0.82rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Check size={14} color="#0f6b3a" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{text}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (draggedDistanceRef.current < 8) {
              onInspect(applicant);
            }
          }}
        >
          Ver perfil completo e explicação detalhada
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}
