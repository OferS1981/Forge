import {
  FIELDS,
  type Brief as BriefData,
  type Field,
  type FieldId,
  type Mode,
  type Model,
} from '@forge/catalog';
import {
  ChipGroup,
  Combobox,
  Disclosure,
  InfoDot,
  Segmented,
  TextArea,
  TextField,
} from '@forge/ui';
import { explanationFor } from './explain';

export interface BriefProps {
  model: Model;
  brief: BriefData;
  mode: Mode;
  onChange: (field: FieldId, value: string | string[]) => void;
  /** Opens the glossary at one term, which is what the i key on a chip does. */
  onExplain: (term: string) => void;
}

/**
 * The brief is generated, never hand-written. It reads the field registry and the chosen model's
 * own core, craft and tech lists, so adding a model or a field changes this form without anyone
 * editing it. Nothing here names a model or a field.
 */

function optionsOf(field: Field): { value: string; label: string }[] {
  return (field.options ?? []).map((o) => ({ value: o.value, label: o.label }));
}

function modelOptions(model: Model, id: FieldId): { value: string; label: string }[] {
  if (id === 'aspect')
    return (model.aspects ?? []).map((o) => ({ value: o.value, label: o.label }));
  if (id === 'duration')
    return (model.durations ?? []).map((o) => ({ value: o.value, label: o.label }));
  return [];
}

function Control({
  field,
  model,
  brief,
  onChange,
  onExplain,
}: {
  field: Field;
  model: Model;
  brief: BriefData;
  onChange: (field: FieldId, value: string | string[]) => void;
  onExplain: (term: string) => void;
}): React.ReactNode {
  const raw = brief[field.id];
  const single = typeof raw === 'string' ? raw : '';
  const many = Array.isArray(raw) ? raw : [];

  /*
   * Explaining is never the same gesture as choosing. The dot is its own button beside the label,
   * so pressing a chip still only presses the chip. The chip groups also answer the i key, which
   * opens the same words without costing a tab stop.
   */
  const explanation = explanationFor(field.term, model);
  const dot =
    explanation === undefined ? undefined : (
      <InfoDot term={field.label.toLowerCase()} explanation={explanation} />
    );
  const optionTerm = field.options?.[0]?.term;
  const explainOptions = (): void => {
    onExplain(optionTerm ?? field.term);
  };

  switch (field.type) {
    case 'area':
      return (
        <TextArea
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          value={single}
          adornment={dot}
          rows={4}
          onChange={(e) => {
            onChange(field.id, e.currentTarget.value);
          }}
        />
      );
    case 'text':
      return (
        <TextField
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          value={single}
          adornment={dot}
          onChange={(e) => {
            onChange(field.id, e.currentTarget.value);
          }}
        />
      );
    case 'chips':
      return (
        <ChipGroup
          label={field.label}
          hint={field.hint}
          chips={optionsOf(field)}
          value={many}
          max={field.max}
          adornment={dot}
          onExplain={explainOptions}
          onChange={(v) => {
            onChange(field.id, v);
          }}
        />
      );
    case 'chip1':
      return (
        <ChipGroup
          label={field.label}
          hint={field.hint}
          chips={optionsOf(field)}
          value={single}
          adornment={dot}
          onExplain={explainOptions}
          onChange={(v) => {
            onChange(field.id, v);
          }}
        />
      );
    case 'seg':
      return (
        <Segmented
          label={field.label}
          options={optionsOf(field)}
          value={single.length > 0 ? single : (optionsOf(field)[0]?.value ?? '')}
          onChange={(v) => {
            onChange(field.id, v);
          }}
        />
      );
    case 'select': {
      const options = modelOptions(model, field.id);
      if (options.length === 0) return null;
      return (
        <Combobox
          label={field.label}
          options={options}
          value={single}
          adornment={dot}
          compact
          placeholder={`Choose ${field.label.toLowerCase()}`}
          onChange={(v) => {
            onChange(field.id, v);
          }}
        />
      );
    }
    case 'number':
      return (
        <TextField
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          value={single}
          adornment={dot}
          inputMode="numeric"
          onChange={(e) => {
            onChange(field.id, e.currentTarget.value);
          }}
        />
      );
  }
}

export function Brief({ model, brief, mode, onChange, onExplain }: BriefProps): React.ReactNode {
  /*
   * Every field is wrapped and given a stable id. That is what lets the auto-filled line in Simple
   * mode open one field: the wrapper is the same shape whatever control the field asks for, so
   * scrolling to it and focusing what is inside works for a text box and a chip group alike.
   */
  const render = (ids: FieldId[]): React.ReactNode[] =>
    ids
      .map((id) => FIELDS[id])
      .map((f) => (
        <div className="brief__field" id={`field-${f.id}`} key={f.id}>
          <Control
            field={f}
            model={model}
            brief={brief}
            onChange={onChange}
            onExplain={onExplain}
          />
        </div>
      ));

  const simpleTech = model.tech.filter((id) => FIELDS[id].tier === 'simple');
  const advancedTech = model.tech.filter((id) => FIELDS[id].tier === 'advanced');
  const craft = model.craft.filter((id) => FIELDS[id].tier !== 'pro');
  const exclusions = [...model.craft, ...model.tech].filter((id) => FIELDS[id].tier === 'pro');

  /*
   * Simple asks only what nobody else can answer: Forge picks the settings, the frame and the
   * craft itself and reports every choice. Advanced is the middle tier, where you choose what you
   * want. Pro adds the last layer: what you do not want, in its own section.
   */
  if (mode === 'simple') {
    return (
      <div className="brief">
        {render(model.core)}
        <p className="brief__note">
          These are the questions only you can answer. Forge chooses the settings, the frame, the
          lens, the light and the grade itself, and tells you what it chose after the strike.
          Advanced mode hands all of that back to you.
        </p>
      </div>
    );
  }

  return (
    <div className="brief">
      {render(model.core)}
      {render(simpleTech)}
      {craft.length > 0 && (
        <Disclosure summary="The craft layer" defaultOpen>
          {render(craft)}
        </Disclosure>
      )}
      {advancedTech.length > 0 && (
        <Disclosure summary="Model settings">{render(advancedTech)}</Disclosure>
      )}
      {mode === 'pro' && exclusions.length > 0 && (
        <Disclosure summary="What you do not want" defaultOpen>
          {render(exclusions)}
        </Disclosure>
      )}
    </div>
  );
}
