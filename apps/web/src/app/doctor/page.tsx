'use client';

import { useCallback, useRef, useState } from 'react';
import {
  AXES,
  diagnose,
  findModel,
  forge,
  modelById,
  modelLabel,
  rebuild,
  scoreLabel,
  type Diagnosis,
  type ForgeResult,
  type Model,
} from '@forge/catalog';
import { Button, TextArea } from '@forge/ui';
import { Empty, ModelPicker, Workspace } from '../../components/Workspace';
import { Result } from '../../components/Result';
import { SecondOpinion } from '../../components/SecondOpinion';
import { useModelId } from '../../lib/store';

/** A finding names something missing, and the glossary explains what it does. */
const LINKS: { test: RegExp; term: string }[] = [
  { test: /lens|shot size|focal length/i, term: 'vocab-lens' },
  { test: /lighting/i, term: 'vocab-light' },
  { test: /colour direction|grade|hex/i, term: 'vocab-grade' },
  { test: /delimiter/i, term: 'field-format' },
  { test: /output format/i, term: 'field-format' },
  { test: /stated purpose/i, term: 'field-purpose' },
  { test: /excluded|negative/i, term: 'field-avoid' },
  { test: /dead weight|filler/i, term: 'vocab-banned' },
  { test: /comma|tag/i, term: 'vocab-medium' },
];

function termFor(finding: string): string | undefined {
  return LINKS.find((l) => l.test.test(finding))?.term;
}

function Axes({ axes }: { axes: Diagnosis['axes'] }): React.ReactNode {
  return (
    <ul className="axes">
      {AXES.map((a) => {
        const v = axes[a.id];
        return (
          <li className="axis" key={a.id}>
            <span className="axis__name">{a.name}</span>
            <span
              className="axis__bar"
              role="meter"
              aria-valuenow={v}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={a.name}
            >
              <span
                className="axis__fill"
                data-level={v < 40 ? 'low' : v < 70 ? 'mid' : 'high'}
                style={{ width: `${String(v)}%` }}
              />
            </span>
            <span className="axis__value fg-mono">{v}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function DoctorPage(): React.ReactNode {
  const [modelId, setModelId] = useModelId('midjourney');
  const [text, setText] = useState('');
  const [seen, setSeen] = useState<{
    diagnosis: Diagnosis;
    result: ForgeResult;
    model: Model;
    pasted: string;
  } | null>(null);
  const outputRef = useRef<HTMLElement>(null);

  const model = findModel(modelId) ?? modelById('midjourney');

  const run = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    const diagnosis = diagnose(trimmed, model);
    const result = forge(rebuild(trimmed, model), model);
    setSeen({ diagnosis, result, model, pasted: trimmed });
    outputRef.current?.focus();
  }, [text, model]);

  return (
    <Workspace
      title="Doctor"
      lede="Paste a prompt that under-performed. Forge scores it on eight axes, names what is doing no work, and re-smiths it in the grammar of the model you choose. Nothing is sent anywhere: the diagnosis is a lexicon, not a model call."
      outputLabel="The diagnosis"
      outputRef={outputRef}
      output={
        seen === null ? (
          <Empty title="No patient">
            Paste a prompt and Forge will tell you exactly which parts are doing no work, and what
            the same brief looks like written properly.
          </Empty>
        ) : (
          <>
            <div className="beforeafter">
              <div className="beforeafter__side">
                <p className="beforeafter__n">{seen.diagnosis.score}</p>
                <p className="beforeafter__t">Before</p>
              </div>
              <div className="beforeafter__body">
                <p className="beforeafter__names">
                  {scoreLabel(seen.diagnosis.score).name}
                  <span aria-hidden="true"> to </span>
                  <span className="beforeafter__after">{scoreLabel(seen.result.score).name}</span>
                </p>
                <p className="beforeafter__words">
                  {seen.diagnosis.words} words in, {seen.result.flat.trim().split(/\s+/).length}{' '}
                  words out
                </p>
                <div
                  className="score__bar"
                  role="meter"
                  aria-valuenow={seen.result.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Score after re-smithing"
                  aria-valuetext={`${String(seen.result.score)} out of 100, ${scoreLabel(seen.result.score).name}, up from ${String(seen.diagnosis.score)}`}
                >
                  <div className="score__fill" style={{ width: `${String(seen.result.score)}%` }} />
                </div>
              </div>
              <div className="beforeafter__side beforeafter__side--after">
                <p className="beforeafter__n">{seen.result.score}</p>
                <p className="beforeafter__t">After</p>
              </div>
            </div>

            <p className="doctor__lede">
              This is the same brief, re-smithed for {modelLabel(seen.model)}. Copy it and use it in
              place of what you pasted.
            </p>
            <Result result={seen.result} model={seen.model} showScore={false} />

            <section className="billet" aria-label="Diagnosis">
              <div className="billet__head">
                <h2 className="billet__title">Diagnosis</h2>
              </div>
              <div className="billet__body">
                <p className="billet__note">
                  How the prompt you pasted scored {seen.diagnosis.score}, axis by axis.
                </p>
                <Axes axes={seen.diagnosis.axes} />
                {/* Beside the diagnosis, never instead of it. The diagnosis is a lexicon. */}
                <SecondOpinion prompt={seen.pasted} model={seen.model} />
              </div>
            </section>

            {seen.diagnosis.findings.length > 0 && (
              <section className="billet" aria-label="What is not doing any work">
                <div className="billet__head">
                  <h2 className="billet__title">What is not doing any work</h2>
                </div>
                <div className="billet__body">
                  <ul className="notes notes--warn">
                    {seen.diagnosis.findings.map((f) => {
                      const term = termFor(f);
                      return (
                        <li key={f}>
                          {f}
                          {term !== undefined && (
                            <>
                              {' '}
                              <a className="finding__link" href={`/glossary#${term}`}>
                                What this means
                              </a>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            )}

            {seen.diagnosis.working.length > 0 && (
              <section className="billet" aria-label="What is already working">
                <div className="billet__head">
                  <h2 className="billet__title">What is already working</h2>
                </div>
                <div className="billet__body">
                  <ul className="notes">
                    {seen.diagnosis.working.slice(0, 5).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </>
        )
      }
    >
      <ModelPicker label="Target model" value={model.id} onChange={setModelId} />
      <TextArea
        label="The prompt"
        hint="paste it exactly as you sent it"
        id="doctor-in"
        rows={10}
        value={text}
        placeholder="a cool picture of a robot in a city, 8k, masterpiece, very detailed, trending on artstation"
        onChange={(e) => {
          setText(e.currentTarget.value);
        }}
      />
      <div className="strike-row">
        <Button variant="primary" size="lg" onClick={run} disabled={text.trim().length === 0}>
          Diagnose
        </Button>
        {seen !== null && (
          <p className="strike-row__note">
            Re-smithed for {modelLabel(seen.model)}. Change the model and diagnose again to see it
            in another grammar.
          </p>
        )}
      </div>
    </Workspace>
  );
}
