'use client';

import {
  modelLabel,
  scoreLabel,
  settingTerm,
  type FieldId,
  type ForgeResult,
  type Mode,
  type Model,
  type SettingRow,
} from '@forge/catalog';
import { Button, Disclosure, Table, toast } from '@forge/ui';

export interface OutputProps {
  result: ForgeResult;
  model: Model;
  mode: Mode;
  /** Off where the workspace has already shown a score, such as the Doctor's before and after. */
  showScore?: boolean | undefined;
  /** Opens one field from the auto-filled line, which is how Simple mode teaches the craft layer. */
  onOpenField: (field: FieldId) => void;
}

/** A settings row links to the explanation of the real parameter, per section 9. */
function SettingName({ row }: { row: SettingRow }): React.ReactNode {
  const id = (row.term ?? settingTerm(row.name)).replace(/\./g, '-');
  return (
    <a className="setting__link fg-mono" href={`/glossary#${id}`}>
      {row.name}
    </a>
  );
}

async function copy(text: string, what: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} copied.`, 'good');
  } catch {
    toast(`Could not reach the clipboard. Select the text and copy it by hand.`, 'warn', 0);
  }
}

function labelled(result: ForgeResult): string {
  return result.blocks.map((b) => `${b.label.toUpperCase()}\n${b.body}`).join('\n\n');
}

function everything(result: ForgeResult, model: Model, label: string): string {
  const lines = [
    `FORGE: ${model.name}${model.sub === undefined ? '' : ` ${model.sub}`} (${model.version})`,
    `Score ${String(result.score)}, ${label}`,
    '',
    labelled(result),
  ];
  if (result.negative !== null && result.negative.length > 0)
    lines.push('', `${model.negative.label ?? 'NEGATIVE'}\n${result.negative}`);
  if (result.settings.length > 0)
    lines.push(
      '',
      'SETTINGS',
      ...result.settings.map(
        (r) => `${r.name}: ${r.value}${r.why.length > 0 ? `   // ${r.why}` : ''}`,
      ),
    );
  return lines.join('\n');
}

function ScoreMeter({ score }: { score: number }): React.ReactNode {
  const label = scoreLabel(score);
  return (
    <div className="score">
      <div className="score__n" aria-hidden="true">
        {score}
      </div>
      <div className="score__body">
        <h2 className="score__name">{label.name}</h2>
        <p className="score__meaning">{label.meaning}</p>
        <div
          className="score__bar"
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Prompt score"
          aria-valuetext={`${String(score)} out of 100, ${label.name}. ${label.meaning}`}
        >
          <div className="score__fill" style={{ width: `${String(score)}%` }} />
        </div>
      </div>
    </div>
  );
}

function Billet({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <section className="billet" aria-label={title}>
      <div className="billet__head">
        <h2 className="billet__title">{title}</h2>
        {actions}
      </div>
      <div className="billet__body">{children}</div>
    </section>
  );
}

export function Output({
  result,
  model,
  mode,
  showScore = true,
  onOpenField,
}: OutputProps): React.ReactNode {
  const advanced = mode === 'advanced';
  const label = scoreLabel(result.score);
  const settings = advanced ? result.settings : result.settings.filter((r) => r.tier === 'simple');

  return (
    <div className="output">
      {showScore && <ScoreMeter score={result.score} />}

      <div data-tour="prompt">
        <Billet
          title="The prompt"
          actions={
            <div className="billet__actions">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  void copy(result.flat, 'The prompt');
                }}
              >
                Copy the prompt
              </Button>
            </div>
          }
        >
          {/*
           * The pasteable version comes first, and is what the primary button copies. The named
           * sections go underneath, as the explanation of how it was built. Showing only the
           * sections led people to think the sections were the prompt, which they are not.
           */}
          <p className="prompt__what">Paste this into {modelLabel(model)}.</p>
          <pre className="prompt__flat fg-mono">{result.flat}</pre>

          <Disclosure summary="How it is put together">
            <p className="billet__note">
              The same prompt, in the sections {modelLabel(model)} reads it in. Useful for changing
              one part without rewriting the rest.
            </p>
            {result.blocks.map((b) => (
              <div className="block" key={b.label}>
                <h3 className="block__label">{b.label}</h3>
                <p className={result.mono === true ? 'block__body fg-mono' : 'block__body'}>
                  {b.body}
                </p>
              </div>
            ))}
            <div className="billet__actions">
              <Button
                size="sm"
                variant="quiet"
                onClick={() => {
                  void copy(labelled(result), 'The prompt with labels');
                }}
              >
                Copy with the labels
              </Button>
            </div>
          </Disclosure>
        </Billet>
      </div>

      {result.autoFilled.length > 0 && (
        <Billet title="What Forge chose for you">
          <p className="autofilled__lede">
            You said what only you know. Forge chose the rest. Open any of them to change it, and
            the prompt is rebuilt around your choice.
          </p>
          <ul className="autofilled">
            {result.autoFilled.map((a) => (
              <li key={a.field}>
                <button
                  type="button"
                  className="autofilled__open"
                  onClick={() => {
                    onOpenField(a.field);
                  }}
                >
                  {a.value}
                </button>
                <span className="autofilled__why">, because {a.why}.</span>
              </li>
            ))}
          </ul>
        </Billet>
      )}

      {result.negative !== null && result.negative.length > 0 ? (
        <Billet
          title={model.negative.label ?? 'Negative prompt'}
          actions={
            <Button
              size="sm"
              onClick={() => {
                void copy(result.negative ?? '', 'The negative prompt');
              }}
            >
              Copy
            </Button>
          }
        >
          <p className="block__body fg-mono">{result.negative}</p>
          <p className="billet__note">{model.negative.note}</p>
        </Billet>
      ) : (
        model.negative.mode === 'none' && (
          <Billet title="No negative prompt">
            <p className="billet__note">{model.negative.note}</p>
          </Billet>
        )
      )}

      {settings.length > 0 && (
        <div data-tour="settings">
          <Billet
            title="Settings to match it"
            actions={
              <Button
                size="sm"
                onClick={() => {
                  void copy(
                    settings.map((r) => `${r.name}: ${r.value}`).join('\n'),
                    'The settings',
                  );
                }}
              >
                Copy
              </Button>
            }
          >
            <Table<SettingRow>
              caption={`Settings for ${model.name}`}
              columns={[
                { key: 'name', header: 'Setting', cell: (r) => <SettingName row={r} /> },
                { key: 'value', header: 'Value', cell: (r) => r.value, mono: true },
                { key: 'why', header: 'Why', cell: (r) => r.why },
              ]}
              rows={settings}
              rowKey={(r) => r.name}
            />
            {!advanced && result.settings.length > settings.length && (
              <p className="billet__note">
                These are the rows that change the result most. Advanced mode shows all{' '}
                {result.settings.length} with their real parameter names.
              </p>
            )}
          </Billet>
        </div>
      )}

      {result.notes.length > 0 && (
        <Billet title="Why it is written this way">
          <ul className="notes">
            {result.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Billet>
      )}

      {result.warnings.length > 0 && (
        <Billet title="Watch out">
          <ul className="notes notes--warn">
            {result.warnings.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Billet>
      )}

      {advanced && result.variations.length > 0 && (
        <Billet title="Three other directions">
          {result.variations.map((v) => (
            <div className="block" key={v.name}>
              <h3 className="block__label">{v.name}</h3>
              <p className="block__body">{v.text}</p>
            </div>
          ))}
        </Billet>
      )}

      {advanced && (
        <Disclosure summary="How the score was worked out">
          <Table<{ axis: string; value: number }>
            caption="The eight axes behind the score"
            columns={[
              { key: 'axis', header: 'Axis', cell: (r) => r.axis },
              { key: 'value', header: 'Out of 100', cell: (r) => String(r.value), mono: true },
            ]}
            rows={Object.entries(result.axes).map(([axis, value]) => ({ axis, value }))}
            rowKey={(r) => r.axis}
          />
        </Disclosure>
      )}

      <div className="output__foot">
        <Button
          onClick={() => {
            void copy(everything(result, model, label.name), 'The whole record');
          }}
        >
          Copy the whole record
        </Button>
        <p className="output__footnote">
          The record is the prompt, the settings and the score together, for your own notes. It is
          not the thing to paste.
        </p>
      </div>
    </div>
  );
}
