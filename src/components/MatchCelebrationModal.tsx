import { CheckCircle2, MessageSquare, X } from 'lucide-react';
import type { JobApplicantResponse, JobResponse } from '../types/api';
import { resolveAssetUrl } from '../services/api';
import { formatSalaryRange, getInitials } from '../utils/formatters';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface MatchCelebrationModalProps {
  applicant: JobApplicantResponse | null;
  job: JobResponse | null;
  matchId: number | null;
  onContinue: () => void;
  onStartChat: (matchId: number | null) => void;
}

export function MatchCelebrationModal({
  applicant,
  job,
  matchId,
  onContinue,
  onStartChat,
}: MatchCelebrationModalProps) {
  const { containerRef, handleBackdropClick } = useDialogA11y({
    open: Boolean(applicant),
    onClose: onContinue,
  });

  if (!applicant) return null;
  const candidatePhoto = resolveAssetUrl(applicant.photoUrl);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-modal-title"
      onClick={handleBackdropClick}
    >
      <div ref={containerRef} tabIndex={-1} className="modal-card match-modal-card">
        <div className="match-stage">
          <button
            type="button"
            className="btn btn-ghost btn-sm match-stage-close"
            onClick={onContinue}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          <span className="match-stage-pill">
            <CheckCircle2 size={14} />
            Match confirmado
          </span>

          <div className="match-cards-meet" aria-hidden="true">
            <div className="match-mini-card match-mini-card-candidate">
              <div className="row-inline">
                <div className="avatar-badge avatar-sm">
                  {candidatePhoto ? (
                    <img src={candidatePhoto} alt="" />
                  ) : (
                    getInitials(applicant.name)
                  )}
                </div>
                <span className="match-mini-card-kicker tabular-nums">
                  {applicant.compatibilityScore}% match
                </span>
              </div>
              <div className="match-mini-card-title truncate">{applicant.name}</div>
              <div className="match-mini-card-sub truncate">
                {applicant.desiredRole || 'Candidato'}
              </div>
            </div>

            <div className="match-seal-bridge">
              <CheckCircle2 size={22} strokeWidth={2.5} />
            </div>

            <div className="match-mini-card match-mini-card-job">
              <div className="match-mini-card-kicker">Vaga</div>
              <div className="match-mini-card-title truncate">
                {job?.title || 'Oportunidade'}
              </div>
              <div className="match-mini-card-sub truncate tabular-nums">
                {job ? formatSalaryRange(job.minimumSalary, job.maximumSalary) : 'Interesse mútuo'}
              </div>
            </div>
          </div>
        </div>

        <div className="match-modal-body">
          <h2 id="match-modal-title" className="match-modal-title">
            Match confirmado!
          </h2>
          <p className="match-modal-lead">
            Você e <strong>{applicant.name}</strong> demonstraram interesse recíproco para a vaga{' '}
            <strong>{job?.title}</strong>.
          </p>

          <p className="match-modal-rule">
            No Trabalhaki, a empresa envia a primeira mensagem para abrir a conversa no chat.
          </p>

          <div className="match-modal-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => onStartChat(matchId)}
            >
              <MessageSquare size={18} />
              Iniciar conversa agora
            </button>
            <button type="button" className="btn btn-secondary" onClick={onContinue}>
              Continuar avaliando candidatos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
