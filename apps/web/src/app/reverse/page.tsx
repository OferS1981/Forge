'use client';

import { useCallback, useRef, useState } from 'react';
import {
  briefFromStats,
  findModel,
  forge,
  measurementRows,
  modelById,
  type Brief,
  type ForgeResult,
  type ImageStats,
  type Model,
} from '@forge/catalog';
import { Button, DropZone, Table, TextArea, TextField, toast } from '@forge/ui';
import { Empty, ModelPicker, VISUAL, Workspace } from '../../components/Workspace';
import { Described } from '../../components/Described';
import { Result } from '../../components/Result';
import { IMAGE_TYPES, TEXT_TYPES, measureImage, readText } from '../../lib/measure';

interface Reference {
  name: string;
  url: string;
  stats: ImageStats;
  /** Kept so the assistant, if there is one, can be shown the picture rather than the URL. */
  file: File;
}

interface TextReference {
  name: string;
  body: string;
}

export default function ReversePage(): React.ReactNode {
  const [modelId, setModelId] = useState('midjourney');
  const [image, setImage] = useState<Reference | null>(null);
  const [texts, setTexts] = useState<TextReference[]>([]);
  const [subject, setSubject] = useState('');
  /** What the assistant described, if anybody took it. Merged under whatever was typed. */
  const [described, setDescribed] = useState<Brief>({});
  const [change, setChange] = useState('');
  const [status, setStatus] = useState('');
  const [seen, setSeen] = useState<{
    result: ForgeResult;
    model: Model;
    stats?: ImageStats;
  } | null>(null);
  const outputRef = useRef<HTMLElement>(null);

  const model = findModel(modelId) ?? modelById('midjourney');

  const take = useCallback((files: File[]) => {
    void (async () => {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          try {
            const { stats, url } = await measureImage(file);
            setImage({ name: file.name, url, stats, file });
            setStatus(
              `Measured ${file.name}: ${String(stats.width)} by ${String(stats.height)} px.`,
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'That file could not be read as an image.';
            toast(message, 'warn', 0);
          }
        } else {
          const body = await readText(file);
          setTexts((t) => [...t, { name: file.name, body }]);
          setStatus(`Read ${file.name}: ${String(body.trim().split(/\s+/).length)} words.`);
        }
      }
    })();
  }, []);

  const run = useCallback(() => {
    // What was described sits underneath, so anything typed by hand wins.
    const base: Brief = { ...described };
    if (subject.trim().length > 0) base.subject = subject.trim();
    else if (texts[0])
      base.subject = (texts[0].body.split('\n').find((l) => l.trim().length > 0) ?? '').slice(
        0,
        160,
      );
    if (change.trim().length > 0) base.ref = change.trim();
    const brief = briefFromStats(base, model, image?.stats);
    const result = forge(brief, model);
    const next: { result: ForgeResult; model: Model; stats?: ImageStats } = { result, model };
    if (image) next.stats = image.stats;
    setSeen(next);
    outputRef.current?.focus();
  }, [subject, change, texts, model, image, described]);

  const nothing = image === null && texts.length === 0;

  return (
    <Workspace
      title="Reverse"
      lede="Drop in a reference and Forge measures what a browser can honestly measure: geometry, exposure, contrast, colour and detail density. It cannot see what the picture is of, so it asks you for that and builds the prompt around the measurements."
      outputLabel="The reversed prompt"
      outputRef={outputRef}
      output={
        seen === null ? (
          <Empty title="Nothing in the fire">
            Add a reference and Forge will read what it can, then ask you for the rest.
          </Empty>
        ) : (
          <>
            {seen.stats !== undefined && (
              <section className="billet" aria-label="What Forge could measure">
                <div className="billet__head">
                  <h2 className="billet__title">What Forge could measure</h2>
                </div>
                <div className="billet__body">
                  <Table<{ name: string; value: string; why: string }>
                    caption="Measurements taken from the pixels"
                    columns={[
                      { key: 'name', header: 'Measure', cell: (r) => r.name },
                      { key: 'value', header: 'Reading', cell: (r) => r.value, mono: true },
                      { key: 'why', header: 'How', cell: (r) => r.why },
                    ]}
                    rows={measurementRows(seen.stats)}
                    rowKey={(r) => r.name}
                  />
                  <p className="billet__note">
                    Geometry, exposure and colour are measured from the pixels. What the picture is
                    of is not something this page can see, so Forge takes that from you and builds
                    the rest around the measurements.
                  </p>
                </div>
              </section>
            )}
            <Result result={seen.result} model={seen.model} />
          </>
        )
      }
    >
      <DropZone
        label="Drop in the reference, or choose a file"
        hint="Images, and .txt, .md, .json, .csv or .yaml"
        accept={`${IMAGE_TYPES},${TEXT_TYPES}`}
        multiple
        status={status}
        onFiles={take}
      />

      {image !== null && (
        <figure className="ref">
          {/* A local object URL for a file the user just chose. Next's image component optimises
              files it can fetch, and this one never leaves the browser. */}
          <img className="ref__img" src={image.url} alt="" />
          <figcaption className="ref__cap">
            {image.name}
            <span className="ref__meta fg-mono">
              {image.stats.width} by {image.stats.height} px, nearest {image.stats.ratio}
            </span>
            <span className="ref__swatches">
              {image.stats.top.slice(0, 6).map((c) => (
                <span key={c} style={{ background: c }} title={undefined} />
              ))}
            </span>
          </figcaption>
        </figure>
      )}

      <Described
        file={image?.file ?? null}
        model={model}
        onTake={(brief) => {
          setDescribed(brief);
          if (typeof brief.subject === 'string' && subject.trim().length === 0)
            setSubject(brief.subject);
          toast(
            'Taken into the brief. Change anything you disagree with, then reverse it.',
            'good',
          );
        }}
      />

      {texts.length > 0 && (
        <ul className="reftexts">
          {texts.map((t) => (
            <li key={t.name}>
              <span className="reftexts__name fg-mono">{t.name}</span>
              <span className="reftexts__count">{t.body.trim().split(/\s+/).length} words</span>
            </li>
          ))}
        </ul>
      )}

      {!nothing && (
        <>
          <ModelPicker
            label="Target model"
            value={model.id}
            onChange={setModelId}
            categories={VISUAL}
          />
          <TextArea
            label="What is it of?"
            hint="the one thing a browser cannot measure, so Forge has to ask"
            id="reverse-subject"
            rows={3}
            value={subject}
            placeholder="A retired boxer taping his hands in a basement gym"
            onChange={(e) => {
              setSubject(e.currentTarget.value);
            }}
          />
          <TextField
            label="What should change from the reference"
            hint="leave blank to reproduce it as closely as the measurements allow"
            id="reverse-change"
            value={change}
            placeholder="Same light, different subject: a woman in her sixties"
            onChange={(e) => {
              setChange(e.currentTarget.value);
            }}
          />
          <div className="strike-row">
            <Button variant="primary" size="lg" onClick={run}>
              Reverse the prompt
            </Button>
          </div>
        </>
      )}
    </Workspace>
  );
}
