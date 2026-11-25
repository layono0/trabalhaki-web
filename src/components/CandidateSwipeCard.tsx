import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  Check,
  Clock,
  GraduationCap,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
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
  const startPointRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const draggedDistanceRef = useRef(0);

  const resetDrag = useCallback(() => {
    setIsDragging(false);
    startPointRef.current = null;
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetDrag();
  }, [applicant.candidateId, resetDrag]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('blur', resetDrag);
    return () => window.removeEventListener('blur', resetDrag);
  }, [isDragging, resetDrag]);

  const photoSrc = resolveAssetUrl(applicant.photoUrl);

  const jobSkillSet = new Set(
    (selectedJob?.skills || []).map((s) => s.skillName.trim().toLowerCase())
  );
  const verifiedSkillSet = new Set(
    (applicant.verifiedSkills || []).map((s) => s.trim().toLowerCase())
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isFront || disabled || isDragging) return;
    if ((e.target as HTMLElement).closest('button')) return;
    startPointRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    draggedDistanceRef.current = 0;
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isFront || !isDragging || !startPointRef.current) return;
    if (e.pointerId !== startPointRef.current.pointerId) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = (e.clientY - startPointRef.current.y) * 0.25;
    draggedDistanceRef.current = Math.abs(dx);
    setDragOffset({ x: dx, y: dy });
  };

  const finishDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isFront || !isDragging || !startPointRef.current) return;
    if (e.pointerId !== startPointRef.current.pointerId) return;
    const finalX = dragOffset.x;
    setIsDragging(false);
    startPointRef.current = null;

    if (finalX > 110) {
      onSwipe(applicant, 'right');
      return;
    }
    if (finalX < -110) {
      onSwipe(applicant, 'left');
      return;
    }
    setDragOffset({ x: 0, y: 0 });
  };

  if (!isFront) {
    const translateY = stackIndex === 1 ? 10 : 20;
    const scale = stackIndex === 1 ? 0.96 : 0.92;
    const opacity = stackIndex === 1 ? 0.88 : 0.72;

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
          <div className="demo-avatar-group">
            <div className="avatar-badge avatar-md">{getInitials(applicant.name)}</div>
            <div className="min-w-0">
              <div className="demo-candidate-name truncate">{applicant.name}</div>
              <div className="demo-candidate-role truncate">
                {applicant.desiredRole || 'Candidato'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rotationDeg = Math.max(-13, Math.min(13, (dragOffset.x / 220) * 13));
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
      onPointerCancel={resetDrag}
      onLostPointerCapture={resetDrag}
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
        <div className="demo-card-top">
          <div className="demo-avatar-group">
            <div className="avatar-badge avatar-lg">
              {photoSrc ? (
                <img src={photoSrc} alt={applicant.name} />
              ) : (
                getInitials(applicant.name)
              )}
            </div>
            <div className="min-w-0">
              <h2 className="swipe-card-name">{applicant.name}</h2>
              <p className="swipe-card-role">
                {applicant.desiredRole || 'Cargo desejado não informado'}
              </p>
              <div className="swipe-card-time">
                <Clock size={13} />
                Candidatou-se {formatRelativeDate(applicant.appliedAt)}
              </div>
            </div>
          </div>

          <div className="stack-xs" style={{ alignItems: 'flex-end' }}>
            <span className="score-pill">
              <SlidersHorizontal size={14} />
              {applicant.compatibilityScore}%
            </span>
            {(applicant.priorityBonus ?? 0) > 0 && (
              <span className="badge badge-mint badge-xs tabular-nums">
                <ShieldCheck size={12} />
                +{applicant.priorityBonus} pts certificação
              </span>
            )}
          </div>
        </div>

        <div className="row-wrap">
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
          <div className="swipe-edu-box">
            <GraduationCap size={17} className="icon-primary" />
            <span>
              <strong>Formação:</strong> {applicant.education}
            </span>
          </div>
        )}

        <div className="stack-xs">
          <div className="field-label">Competências declaradas ({applicant.skills.length})</div>
          {applicant.skills.length > 0 ? (
            <div className="row-wrap">
              {applicant.skills.map((skill) => {
                const isMatch = jobSkillSet.has(skill.trim().toLowerCase());
                const isVerified = verifiedSkillSet.has(skill.trim().toLowerCase());
                return (
                  <span
                    key={skill}
                    className={`chip ${isMatch || isVerified ? 'chip-skill-soft' : 'chip-skill'}`}
                    title={isVerified ? 'Competência verificada por certificado' : undefined}
                  >
                    {isVerified ? (
                      <ShieldCheck size={13} />
                    ) : (
                      isMatch && <Check size={13} />
                    )}
                    {skill}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Candidato ainda não listou competências no perfil.
            </p>
          )}
        </div>

        {Object.keys(applicant.explanation || {}).length > 0 && (
          <div className="swipe-explanation-box">
            <div className="swipe-explanation-title">
              Por que deu {applicant.compatibilityScore}% de compatibilidade
            </div>
            {Object.entries(applicant.explanation)
              .slice(0, 3)
              .map(([key, text]) => (
                <div key={key} className="swipe-explanation-row">
                  <Check size={14} className="icon-success flow-list-icon" />
                  <span>{text}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="swipe-card-footer">
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
