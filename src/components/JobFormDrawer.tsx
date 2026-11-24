import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import type { CreateJobRequest, JobResponse, JobSkillPayload, SkillType, WorkModality } from '../types/api';
import { BRAZIL_STATES } from '../utils/constants';
import { useDialogA11y } from '../hooks/useDialogA11y';

const SUGGESTED_SKILLS = [
  'Java',
  'Spring Boot',
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Flutter',
  'Dart',
  'SQL',
  'PostgreSQL',
  'Docker',
  'AWS',
  'REST API',
  'Git',
  'Microservices',
];

const SUGGESTED_BENEFITS = [
  'Vale Refeição',
  'Plano de Saúde',
  'Auxílio Home Office',
  'Gympass',
  'Auxílio Educação',
  'Horário Flexível',
];

interface JobFormDrawerProps {
  open: boolean;
  editingJob: JobResponse | null;
  onClose: () => void;
  onSubmit: (payload: CreateJobRequest, editingJobId?: number) => Promise<void>;
}

export function JobFormDrawer({ open, editingJob, onClose, onSubmit }: JobFormDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minimumSalary, setMinimumSalary] = useState('4500');
  const [maximumSalary, setMaximumSalary] = useState('7500');
  const [modality, setModality] = useState<WorkModality>('REMOTE');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [contractType, setContractType] = useState('CLT');
  const [seniorityLevel, setSeniorityLevel] = useState('Pleno');
  const [experienceYears, setExperienceYears] = useState('2');

  const [skills, setSkills] = useState<JobSkillPayload[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillTypeInput, setSkillTypeInput] = useState<SkillType>('REQUIRED');

  const [benefits, setBenefits] = useState<string[]>([]);
  const [benefitInput, setBenefitInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { containerRef, handleBackdropClick } = useDialogA11y({
    open,
    onClose: () => {
      if (!isSaving) onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingJob) {
      setTitle(editingJob.title);
      setDescription(editingJob.description);
      setMinimumSalary(String(editingJob.minimumSalary));
      setMaximumSalary(String(editingJob.maximumSalary));
      setModality(editingJob.modality);
      setCity(editingJob.city || '');
      setStateUf(editingJob.state || '');
      setContractType(editingJob.contractType);
      setSeniorityLevel(editingJob.seniorityLevel);
      setExperienceYears(String(editingJob.experienceYears));
      setSkills(editingJob.skills || []);
      setBenefits(editingJob.benefits || []);
    } else {
      setTitle('');
      setDescription('');
      setMinimumSalary('4500');
      setMaximumSalary('7500');
      setModality('REMOTE');
      setCity('');
      setStateUf('');
      setContractType('CLT');
      setSeniorityLevel('Pleno');
      setExperienceYears('2');
      setSkills([]);
      setBenefits([]);
    }
    setSkillInput('');
    setBenefitInput('');
  }, [open, editingJob]);

  if (!open) return null;

  const addSkill = (name: string, type: SkillType) => {
    const clean = name.trim();
    if (!clean) return;
    setSkills((prev) => {
      const filtered = prev.filter((item) => item.skillName.toLowerCase() !== clean.toLowerCase());
      return [...filtered, { skillName: clean, skillType: type }];
    });
  };

  const removeSkill = (name: string) => {
    setSkills((prev) => prev.filter((item) => item.skillName.toLowerCase() !== name.toLowerCase()));
  };

  const addBenefit = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setBenefits((prev) => {
      if (prev.some((b) => b.toLowerCase() === clean.toLowerCase())) return prev;
      return [...prev, clean];
    });
  };

  const removeBenefit = (name: string) => {
    setBenefits((prev) => prev.filter((b) => b !== name));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const minSal = Number(minimumSalary);
    const maxSal = Number(maximumSalary);
    const exp = Number(experienceYears);

    if (!title.trim() || !description.trim() || !contractType.trim() || !seniorityLevel.trim()) {
      setError('Preencha título, descrição, contrato e senioridade da vaga.');
      return;
    }
    if (Number.isNaN(minSal) || Number.isNaN(maxSal) || minSal < 0 || maxSal < 0) {
      setError('Informe valores numéricos válidos para a faixa salarial.');
      return;
    }
    if (minSal > maxSal) {
      setError('O salário mínimo não pode ser maior que o salário máximo.');
      return;
    }
    if (Number.isNaN(exp) || exp < 0) {
      setError('Informe um número válido de anos de experiência (0 ou mais).');
      return;
    }
    if ((modality === 'HYBRID' || modality === 'ONSITE') && !city.trim() && !stateUf.trim()) {
      setError('Cidade ou Estado são obrigatórios para vagas presenciais ou híbridas.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          minimumSalary: minSal,
          maximumSalary: maxSal,
          modality,
          city: city.trim() || undefined,
          state: stateUf.trim() || undefined,
          country: 'Brasil',
          contractType: contractType.trim(),
          seniorityLevel: seniorityLevel.trim(),
          experienceYears: exp,
          benefits,
          skills,
        },
        editingJob?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a vaga.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-drawer-title"
      onClick={handleBackdropClick}
    >
      <div ref={containerRef} tabIndex={-1} className="drawer-panel">
        <div className="drawer-header">
          <div>
            <h2 id="job-drawer-title" className="drawer-title">
              {editingJob ? 'Editar vaga' : 'Publicar nova vaga'}
            </h2>
            <p className="drawer-subtitle">
              Os critérios abaixo alimentam diretamente o cálculo de compatibilidade com os candidatos.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Fechar painel"
          >
            <X size={20} />
          </button>
        </div>

        <form id="job-form" onSubmit={handleSubmit} className="drawer-body">
          {error && (
            <div className="alert alert-error alert-compact" role="alert">
              <AlertCircle size={18} className="icon-shrink" />
              <span>{error}</span>
            </div>
          )}

          {/* Seção 1: Informações principais */}
          <fieldset className="form-section">
            <legend className="form-section-title">1. Informações principais</legend>
            <p className="form-section-desc">
              Defina o cargo e os desafios para atrair profissionais alinhados.
            </p>

            <div className="field">
              <label htmlFor="job-title" className="field-label">
                Título da vaga *
              </label>
              <input
                id="job-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Pessoa Desenvolvedora Java Pleno"
              />
            </div>

            <div className="field">
              <label htmlFor="job-description" className="field-label">
                Descrição e responsabilidades *
              </label>
              <textarea
                id="job-description"
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva os desafios do time, stack utilizada e o que a pessoa fará no dia a dia."
              />
            </div>
          </fieldset>

          {/* Seção 2: Remuneração, formato e local */}
          <fieldset className="form-section">
            <legend className="form-section-title">2. Remuneração e formato de trabalho</legend>
            <p className="form-section-desc">
              A faixa salarial é exibida de forma transparente no cartão da vaga.
            </p>

            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="job-min-salary" className="field-label">
                  Salário mínimo (R$) *
                </label>
                <input
                  id="job-min-salary"
                  type="number"
                  min={0}
                  step="100"
                  className="input tabular-nums"
                  value={minimumSalary}
                  onChange={(e) => setMinimumSalary(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="job-max-salary" className="field-label">
                  Salário máximo (R$) *
                </label>
                <input
                  id="job-max-salary"
                  type="number"
                  min={0}
                  step="100"
                  className="input tabular-nums"
                  value={maximumSalary}
                  onChange={(e) => setMaximumSalary(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="job-modality" className="field-label">
                  Modalidade *
                </label>
                <select
                  id="job-modality"
                  className="select"
                  value={modality}
                  onChange={(e) => setModality(e.target.value as WorkModality)}
                >
                  <option value="REMOTE">Remoto</option>
                  <option value="HYBRID">Híbrido</option>
                  <option value="ONSITE">Presencial</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="job-contract" className="field-label">
                  Regime de contratação *
                </label>
                <select
                  id="job-contract"
                  className="select"
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                >
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="CLT / PJ">CLT / PJ</option>
                  <option value="Estágio">Estágio</option>
                  <option value="Temporário">Temporário</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="job-city" className="field-label">
                  Cidade {modality !== 'REMOTE' ? '*' : ''}
                </label>
                <input
                  id="job-city"
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div className="field">
                <label htmlFor="job-state" className="field-label">
                  Estado (UF) {modality !== 'REMOTE' ? '*' : ''}
                </label>
                <select
                  id="job-state"
                  className="select"
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value)}
                >
                  <option value="">Selecionar UF</option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Seção 3: Senioridade e experiência */}
          <fieldset className="form-section">
            <legend className="form-section-title">3. Perfil desejado</legend>
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="job-seniority" className="field-label">
                  Senioridade *
                </label>
                <select
                  id="job-seniority"
                  className="select"
                  value={seniorityLevel}
                  onChange={(e) => setSeniorityLevel(e.target.value)}
                >
                  <option value="Estágio">Estágio</option>
                  <option value="Júnior">Júnior</option>
                  <option value="Pleno">Pleno</option>
                  <option value="Sênior">Sênior</option>
                  <option value="Especialista">Especialista</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="job-exp" className="field-label">
                  Experiência mínima (anos) *
                </label>
                <input
                  id="job-exp"
                  type="number"
                  min={0}
                  max={40}
                  className="input tabular-nums"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Seção 4: Competências e benefícios */}
          <fieldset className="form-section">
            <legend className="form-section-title">4. Competências e benefícios</legend>

            <div className="field">
              <span className="field-label">Competências da vaga</span>
              <span className="field-hint">
                Obrigatórias valem até 35 pontos e diferenciais até 15 pontos no ranking.
              </span>

              <div className="row-wrap">
                <input
                  className="input flex-1"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(skillInput, skillTypeInput);
                      setSkillInput('');
                    }
                  }}
                  placeholder="Ex: Java, React, SQL..."
                  aria-label="Nome da competência"
                />
                <select
                  className="select"
                  style={{ width: 148, flexShrink: 0 }}
                  value={skillTypeInput}
                  onChange={(e) => setSkillTypeInput(e.target.value as SkillType)}
                  aria-label="Tipo da competência"
                >
                  <option value="REQUIRED">Obrigatória</option>
                  <option value="PREFERRED">Diferencial</option>
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  aria-label="Adicionar competência"
                  onClick={() => {
                    addSkill(skillInput, skillTypeInput);
                    setSkillInput('');
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="row-wrap" style={{ marginTop: 6 }}>
                {SUGGESTED_SKILLS.filter(
                  (s) => !skills.some((added) => added.skillName.toLowerCase() === s.toLowerCase())
                )
                  .slice(0, 8)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="chip chip-action"
                      onClick={() => addSkill(s, skillTypeInput)}
                    >
                      <Plus size={12} />
                      {s}
                    </button>
                  ))}
              </div>

              {skills.length > 0 && (
                <div className="row-wrap" style={{ marginTop: 8 }}>
                  {skills.map((skill) => (
                    <span
                      key={skill.skillName}
                      className={`chip ${
                        skill.skillType === 'REQUIRED' ? 'chip-skill' : 'chip-skill-soft'
                      }`}
                    >
                      {skill.skillName} ({skill.skillType === 'REQUIRED' ? 'Obrig.' : 'Dif.'})
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => removeSkill(skill.skillName)}
                        aria-label={`Remover ${skill.skillName}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="field">
              <span className="field-label">Benefícios oferecidos</span>
              <div className="row-wrap">
                <input
                  className="input flex-1"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBenefit(benefitInput);
                      setBenefitInput('');
                    }
                  }}
                  placeholder="Ex: Vale Refeição R$ 1.200/mês"
                  aria-label="Benefício"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  aria-label="Adicionar benefício"
                  onClick={() => {
                    addBenefit(benefitInput);
                    setBenefitInput('');
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="row-wrap" style={{ marginTop: 6 }}>
                {SUGGESTED_BENEFITS.filter(
                  (b) => !benefits.some((added) => added.toLowerCase() === b.toLowerCase())
                ).map((b) => (
                  <button
                    key={b}
                    type="button"
                    className="chip chip-action"
                    onClick={() => addBenefit(b)}
                  >
                    <Plus size={12} />
                    {b}
                  </button>
                ))}
              </div>

              {benefits.length > 0 && (
                <div className="row-wrap" style={{ marginTop: 8 }}>
                  {benefits.map((benefit) => (
                    <span key={benefit} className="chip">
                      {benefit}
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => removeBenefit(benefit)}
                        aria-label={`Remover ${benefit}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </fieldset>
        </form>

        <div className="drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button type="submit" form="job-form" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Salvando...' : editingJob ? 'Salvar alterações' : 'Publicar vaga'}
          </button>
        </div>
      </div>
    </div>
  );
}
