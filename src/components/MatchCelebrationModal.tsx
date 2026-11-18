import { MessageSquare, Sparkles } from 'lucide-react';
import type { JobApplicantResponse, JobResponse } from '../types/api';
import { resolveAssetUrl } from '../services/api';
import { getInitials } from '../utils/formatters';

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
  if (!applicant) return null;
  const candidatePhoto = resolveAssetUrl(applicant.photoUrl);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="match-modal-title">
      <div className="modal-card">
        <div
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 14px',
            borderRadius: 18,
            backgroundColor: 'var(--color-secondary-soft)',
            color: 'var(--color-secondary-text)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Sparkles size={26} />
        </div>

        <h2 id="match-modal-title" style={{ fontSize: '1.65rem', fontWeight: 800 }}>
          Match confirmado!
        </h2>
        <p style={{ marginTop: 8, color: 'var(--color-text-secondary)', fontSize: '0.94rem' }}>
          Você e <strong>{applicant.name}</strong> demonstraram interesse recíproco para a vaga{' '}
          <strong>{job?.title}</strong>.
        </p>

        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 16,
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
          }}
        >
          <div className="avatar-badge" style={{ width: 52, height: 52 }}>
            {candidatePhoto ? <img src={candidatePhoto} alt={applicant.name} /> : getInitials(applicant.name)}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700 }}>{applicant.name}</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
              {applicant.desiredRole || 'Candidato'} • {applicant.compatibilityScore}% compatível
            </div>
          </div>
        </div>

        <p style={{ marginTop: 14, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          No Trabalhaki, a empresa envia a primeira mensagem no chat pós-match.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
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
  );
}
