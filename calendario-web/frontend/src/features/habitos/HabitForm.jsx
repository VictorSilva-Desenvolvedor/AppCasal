import { useState } from 'react';
import { Field, Button, Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { HABIT_EMOJIS } from '../../constants/habitEmojis.js';
import { EVENT_COLORS } from '../calendar/calendarUtils.js';
import { HABIT_TYPE_LABELS, HABIT_TYPE_DESCRIPTIONS } from './habitUtils.js';

const HABIT_TYPE_HINT = Object.entries(HABIT_TYPE_LABELS)
  .map(([value, label]) => `${label}: ${HABIT_TYPE_DESCRIPTIONS[value]}`)
  .join(' ');

const SECTIONS = ['basico', 'meta', 'frequencia', 'duracao', 'avancado'];
const SECTION_LABELS = {
  basico: 'Básico',
  meta: 'Meta',
  frequencia: 'Frequência',
  duracao: 'Duração',
  avancado: 'Avançado',
};
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CATEGORY_LABELS = {
  saude: 'Saúde',
  conexao_emocional: 'Conexão emocional',
  financas: 'Finanças',
  crescimento: 'Crescimento',
  outro: 'Outro',
};
const DIFFICULTY_LABELS = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
const QUANTITATIVE_TYPES = ['casal', 'individual', 'espelhado'];

export function HabitForm({ habit, users, currentUserId, onSaved, onCancel }) {
  const { showToast } = useToast();
  const isEditing = Boolean(habit);
  const [section, setSection] = useState('basico');

  const [name, setName] = useState(habit?.name ?? '');
  const [type, setType] = useState(habit?.type ?? 'casal');
  const [owner, setOwner] = useState(habit?.owner?._id ?? habit?.owner ?? currentUserId ?? '');
  const [startingUserId, setStartingUserId] = useState(
    habit?.currentTurnUserId?._id ?? habit?.currentTurnUserId ?? currentUserId ?? ''
  );
  const [subtaskInputs, setSubtaskInputs] = useState(
    habit?.subtasks?.length
      ? habit.subtasks.map((s) => ({ _id: s._id, label: s.label, active: s.active }))
      : [{ label: '', active: true }]
  );
  const [emoji, setEmoji] = useState(habit?.emoji ?? HABIT_EMOJIS[0]);
  const [color, setColor] = useState(habit?.color ?? EVENT_COLORS[0]);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? '');
  const [category, setCategory] = useState(habit?.category ?? 'outro');
  const [difficulty, setDifficulty] = useState(habit?.difficulty ?? 'medio');

  const [goalType, setGoalType] = useState(habit?.goalType ?? 'binario');
  const [targetValue, setTargetValue] = useState(habit?.targetValue ?? 1);
  const [unit, setUnit] = useState(habit?.unit ?? '');

  const [frequencyKind, setFrequencyKind] = useState(habit?.frequency?.kind ?? 'diario');
  const [daysOfWeek, setDaysOfWeek] = useState(habit?.frequency?.daysOfWeek ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState(habit?.frequency?.timesPerWeek ?? 3);

  const [durationType, setDurationType] = useState(habit?.durationType ?? 'para_sempre');
  const [challengeDays, setChallengeDays] = useState(habit?.challengeDays ?? 21);

  const [maxMissesPerWeek, setMaxMissesPerWeek] = useState(habit?.maxMissesPerWeek ?? 0);
  const [freezesPerMonth, setFreezesPerMonth] = useState(habit?.freezesPerMonth ?? 2);

  const [saving, setSaving] = useState(false);

  const canHaveQuantitative = QUANTITATIVE_TYPES.includes(type);

  function toggleWeekday(day) {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function updateSubtaskInput(index, patch) {
    setSubtaskInputs((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSubtaskInput() {
    setSubtaskInputs((prev) => [...prev, { label: '', active: true }]);
  }

  function removeSubtaskInput(index) {
    setSubtaskInputs((prev) => {
      const target = prev[index];
      if (target._id) {
        // já existe no backend (tem histórico de check-ins) — arquiva em vez de remover.
        return prev.map((s, i) => (i === index ? { ...s, active: false } : s));
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      showToast('Dê um nome para o hábito', 'error');
      return;
    }
    if (type === 'colaborativo' && subtaskInputs.every((s) => !s.label.trim())) {
      showToast('Adicione ao menos uma subtarefa', 'error');
      return;
    }

    setSaving(true);
    try {
      const basePayload = {
        name: name.trim(),
        emoji,
        color,
        reminderTime: reminderTime || null,
        category,
        difficulty,
        maxMissesPerWeek: Number(maxMissesPerWeek),
        freezesPerMonth: Number(freezesPerMonth),
        owner: type === 'individual' ? owner : undefined,
        startingUserId: type === 'alternado' ? startingUserId : undefined,
        goalType,
        targetValue: goalType === 'quantitativo' ? Number(targetValue) : undefined,
        unit: goalType === 'quantitativo' ? unit : undefined,
        frequency: { kind: frequencyKind, daysOfWeek, timesPerWeek: Number(timesPerWeek) },
        durationType,
        challengeDays: durationType === 'desafio' ? Number(challengeDays) : undefined,
      };

      let saved;
      if (isEditing) {
        if (type === 'colaborativo') {
          basePayload.subtasks = subtaskInputs.filter((s) => s.label.trim() || s._id);
        }
        saved = await api.updateHabit(habit._id, basePayload);
      } else {
        const payload = {
          ...basePayload,
          type,
          subtasks: type === 'colaborativo' ? subtaskInputs.filter((s) => s.label.trim()) : undefined,
        };
        saved = await api.createHabit(payload);
      }

      showToast(isEditing ? 'Hábito atualizado' : 'Hábito criado', 'success');
      onSaved(saved);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <div className="habit-type-toggle habit-form-sections">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className={`habit-type-toggle-btn${section === s ? ' is-active' : ''}`}
            onClick={() => setSection(s)}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {section === 'basico' && (
        <>
          <Field label="Nome" htmlFor="habit-name">
            <input
              id="habit-name"
              type="text"
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Beber água"
              autoFocus
            />
          </Field>

          <Field label="Tipo" hint={HABIT_TYPE_HINT}>
            <div className="habit-type-toggle">
              {Object.entries(HABIT_TYPE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`habit-type-toggle-btn${type === value ? ' is-active' : ''}`}
                  disabled={isEditing}
                  onClick={() => setType(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {isEditing && (
              <p className="habit-form-hint">
                Não é possível trocar o tipo depois que o hábito já tem check-ins registrados.
              </p>
            )}
          </Field>

          {type === 'individual' && (
            <Field label="De quem é esse hábito" htmlFor="habit-owner">
              <select id="habit-owner" value={owner} onChange={(event) => setOwner(event.target.value)}>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {type === 'alternado' && (
            <Field label={isEditing ? 'De quem é a vez agora' : 'Quem começa'} htmlFor="habit-starting-user">
              <select
                id="habit-starting-user"
                value={startingUserId}
                onChange={(event) => setStartingUserId(event.target.value)}
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {type === 'colaborativo' && (
            <Field label="Subtarefas">
              <div className="habit-subtask-editor">
                {subtaskInputs.map(
                  (s, index) =>
                    s.active !== false && (
                      <div key={s._id ?? index} className="habit-subtask-editor-row">
                        <input
                          type="text"
                          maxLength={80}
                          value={s.label}
                          placeholder="Ex: Revisar extrato do cartão"
                          disabled={Boolean(s._id)}
                          onChange={(event) => updateSubtaskInput(index, { label: event.target.value })}
                        />
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => removeSubtaskInput(index)}
                          aria-label="Remover subtarefa"
                        >
                          <Icon name="x" />
                        </button>
                      </div>
                    )
                )}
                <Button type="button" variant="secondary" onClick={addSubtaskInput}>
                  + Adicionar subtarefa
                </Button>
              </div>
            </Field>
          )}

          <Field label="Emoji">
            <div className="habit-emoji-picker">
              {HABIT_EMOJIS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`habit-emoji-option${emoji === option ? ' is-active' : ''}`}
                  onClick={() => setEmoji(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Cor">
            <div className="habit-color-picker">
              {EVENT_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`habit-color-option${color === option ? ' is-active' : ''}`}
                  style={{ background: option }}
                  onClick={() => setColor(option)}
                  aria-label={`Cor ${option}`}
                />
              ))}
            </div>
          </Field>

          <Field label="Categoria" htmlFor="habit-category">
            <select id="habit-category" value={category} onChange={(event) => setCategory(event.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dificuldade">
            <div className="habit-type-toggle">
              {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`habit-type-toggle-btn${difficulty === value ? ' is-active' : ''}`}
                  onClick={() => setDifficulty(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      {section === 'meta' &&
        (canHaveQuantitative ? (
          <>
            <Field
              label="Tipo de meta"
              hint='"Sim/não" conta como feito ou não. "Quantidade" acumula um valor (ex: copos de água) até bater a meta diária.'
            >
              <div className="habit-type-toggle">
                <button
                  type="button"
                  className={`habit-type-toggle-btn${goalType === 'binario' ? ' is-active' : ''}`}
                  onClick={() => setGoalType('binario')}
                >
                  Sim/não
                </button>
                <button
                  type="button"
                  className={`habit-type-toggle-btn${goalType === 'quantitativo' ? ' is-active' : ''}`}
                  onClick={() => setGoalType('quantitativo')}
                >
                  Quantidade
                </button>
              </div>
            </Field>
            {goalType === 'quantitativo' && (
              <>
                <Field label="Meta diária" htmlFor="habit-target-value">
                  <input
                    id="habit-target-value"
                    type="number"
                    min="1"
                    step="0.01"
                    value={targetValue}
                    onChange={(event) => setTargetValue(event.target.value)}
                  />
                </Field>
                <Field label="Unidade" htmlFor="habit-unit">
                  <input
                    id="habit-unit"
                    type="text"
                    maxLength={20}
                    value={unit}
                    placeholder="Ex: copos"
                    onChange={(event) => setUnit(event.target.value)}
                  />
                </Field>
              </>
            )}
          </>
        ) : (
          <p className="habit-form-hint">
            Metas quantitativas não estão disponíveis para o tipo "{HABIT_TYPE_LABELS[type]}".
          </p>
        ))}

      {section === 'frequencia' && (
        <>
          <Field label="Frequência" htmlFor="habit-frequency-kind">
            <select
              id="habit-frequency-kind"
              value={frequencyKind}
              onChange={(event) => setFrequencyKind(event.target.value)}
            >
              <option value="diario">Diário</option>
              <option value="dias_semana">Dias específicos da semana</option>
              <option value="vezes_por_semana">X vezes por semana</option>
              <option value="quinzenal">Quinzenal</option>
            </select>
          </Field>

          {frequencyKind === 'dias_semana' && (
            <Field label="Quais dias">
              <div className="habit-weekday-picker">
                {WEEKDAY_LABELS.map((label, day) => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      checked={daysOfWeek.includes(day)}
                      onChange={() => toggleWeekday(day)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
          )}

          {frequencyKind === 'vezes_por_semana' && (
            <Field label="Quantas vezes por semana" htmlFor="habit-times-per-week">
              <input
                id="habit-times-per-week"
                type="number"
                min="1"
                max="7"
                value={timesPerWeek}
                onChange={(event) => setTimesPerWeek(event.target.value)}
              />
            </Field>
          )}
        </>
      )}

      {section === 'duracao' && (
        <>
          <Field label="Duração">
            <div className="habit-type-toggle">
              <button
                type="button"
                className={`habit-type-toggle-btn${durationType === 'para_sempre' ? ' is-active' : ''}`}
                onClick={() => setDurationType('para_sempre')}
              >
                Para sempre
              </button>
              <button
                type="button"
                className={`habit-type-toggle-btn${durationType === 'desafio' ? ' is-active' : ''}`}
                onClick={() => setDurationType('desafio')}
              >
                Desafio com prazo
              </button>
            </div>
          </Field>
          {durationType === 'desafio' && (
            <Field label="Duração do desafio (dias)" htmlFor="habit-challenge-days">
              <input
                id="habit-challenge-days"
                type="number"
                min="1"
                value={challengeDays}
                onChange={(event) => setChallengeDays(event.target.value)}
              />
            </Field>
          )}
        </>
      )}

      {section === 'avancado' && (
        <>
          <Field label="Horário de lembrete (opcional)" htmlFor="habit-reminder">
            <input
              id="habit-reminder"
              type="time"
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
            />
          </Field>
          <Field label="Tolerância (falhas por semana sem quebrar a streak)" htmlFor="habit-max-misses">
            <input
              id="habit-max-misses"
              type="number"
              min="0"
              max="7"
              value={maxMissesPerWeek}
              onChange={(event) => setMaxMissesPerWeek(event.target.value)}
            />
          </Field>
          <Field
            label="Congeladores de streak por mês"
            htmlFor="habit-freezes"
            hint="Permite pular um dia sem quebrar a sequência (streak), até esse limite por mês."
          >
            <input
              id="habit-freezes"
              type="number"
              min="0"
              max="30"
              value={freezesPerMonth}
              onChange={(event) => setFreezesPerMonth(event.target.value)}
            />
          </Field>
        </>
      )}

      <div className="habit-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Salvar' : 'Criar hábito'}
        </Button>
      </div>
    </form>
  );
}
