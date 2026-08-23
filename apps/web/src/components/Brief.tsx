'use client';

import {
  FIELDS,
  type Brief as BriefData,
  type Field,
  type FieldId,
  type Mode,
  type Model,
} from '@forge/catalog';
import { ChipGroup, Combobox, Disclosure, Segmented, TextArea, TextField } from '@forge/ui';

export interface BriefProps {
  model: Model;
  brief: BriefData;
  mode: Mode;
  onChange: (field: FieldId, value: string | string[]) => void;
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
}: {
  field: Field;
  model: Model;
  brief: BriefData;
  onChange: (field: FieldId, value: string | string[]) => void;
}): React.ReactNode {
  const raw = brief[field.id];
  const single = typeof raw === 'string' ? raw : '';
  const many = Array.isArray(raw) ? raw : [];

  switch (field.type) {
    case 'area':
      return (
        <TextArea
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          value={single}
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
          inputMode="numeric"
          onChange={(e) => {
            onChange(field.id, e.currentTarget.value);
          }}
        />
      );
  }
}

export function Brief({ model, brief, mode, onChange }: BriefProps): React.ReactNode {
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
          <Control field={f} model={model} brief={brief} onChange={onChange} />
        </div>
      ));

  const simpleTech = model.tech.filter((id) => FIELDS[id].tier === 'simple');
  const advancedTech = model.tech.filter((id) => FIELDS[id].tier !== 'simple');

  if (mode === 'simple') {
    return (
      <div className="brief">
        {render(model.core)}
        {render(simpleTech)}
        <p className="brief__note">
          Simple mode asks for what only you know. Forge chooses the craft layer itself and tells
          you what it chose after the strike. Switch to Advanced to choose it yourself.
        </p>
      </div>
    );
  }

  return (
    <div className="brief">
      {render(model.core)}
      {render(simpleTech)}
      {model.craft.length > 0 && (
        <Disclosure summary="The craft layer" defaultOpen>
          {render(model.craft)}
        </Disclosure>
      )}
      {advancedTech.length > 0 && (
        <Disclosure summary="Model settings">{render(advancedTech)}</Disclosure>
      )}
    </div>
  );
}
