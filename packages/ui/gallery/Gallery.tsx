import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Button,
  ChipGroup,
  CoachMark,
  Combobox,
  CommandPalette,
  Dialog,
  Disclosure,
  DropZone,
  InfoDot,
  Segmented,
  Slider,
  Switch,
  Table,
  Tabs,
  TextArea,
  TextField,
  ThemeToggle,
  ToastRegion,
  Tooltip,
  isPaletteShortcut,
  toast,
  type ListOption,
} from '../src';

/**
 * Every control on one page, so axe and a keyboard can go through the lot. The data here is
 * invented on purpose: packages/ui must not know what a model is, and a gallery that used real
 * catalogue entries would hide that.
 */

const TOOLS: ListOption[] = [
  {
    value: 'alpha',
    label: 'Alpha',
    hint: 'Example maker, version 2',
    group: 'First group',
    colourToken: '--cat-image',
    recommended: true,
  },
  {
    value: 'bravo',
    label: 'Bravo',
    hint: 'Example maker, version 4',
    group: 'First group',
    colourToken: '--cat-image',
  },
  {
    value: 'charlie',
    label: 'Charlie',
    hint: 'Another maker',
    group: 'First group',
    colourToken: '--cat-image',
  },
  {
    value: 'delta',
    label: 'Delta',
    hint: 'Long clips',
    group: 'Second group',
    colourToken: '--cat-video',
  },
  {
    value: 'echo',
    label: 'Echo',
    hint: 'Native audio',
    group: 'Second group',
    colourToken: '--cat-video',
  },
  {
    value: 'foxtrot',
    label: 'Foxtrot',
    hint: 'Open weights',
    group: 'Second group',
    colourToken: '--cat-video',
  },
  {
    value: 'golf',
    label: 'Golf',
    hint: 'Speech',
    group: 'Third group',
    colourToken: '--cat-voice',
  },
  {
    value: 'hotel',
    label: 'Hotel',
    hint: 'Sound effects',
    group: 'Third group',
    colourToken: '--cat-sfx',
  },
  {
    value: 'india',
    label: 'India',
    hint: 'Music',
    group: 'Third group',
    colourToken: '--cat-music',
  },
  {
    value: 'juliet',
    label: 'Juliet',
    hint: 'Reasoning',
    group: 'Fourth group',
    colourToken: '--cat-text',
  },
  {
    value: 'kilo',
    label: 'Kilo',
    hint: 'Coding',
    group: 'Fourth group',
    colourToken: '--cat-code',
  },
  {
    value: 'lima',
    label: 'Lima',
    hint: 'App building',
    group: 'Fourth group',
    colourToken: '--cat-app',
  },
  {
    value: 'mike',
    label: 'Mike',
    hint: 'Research',
    group: 'Fourth group',
    colourToken: '--cat-research',
  },
];

const RATIOS: ListOption[] = [
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
];

const CHIPS = [
  { value: 'golden hour', label: 'golden hour' },
  { value: 'blue hour', label: 'blue hour' },
  { value: 'softbox key camera-left', label: 'softbox key camera-left' },
  { value: 'rim light separation', label: 'rim light separation' },
];

const COMMANDS = [
  { value: 'build', label: 'Go to Build', group: 'Workspaces', keywords: 'anvil forge prompt' },
  { value: 'doctor', label: 'Go to Doctor', group: 'Workspaces', keywords: 'diagnose fix' },
  { value: 'reverse', label: 'Go to Reverse', group: 'Workspaces', keywords: 'image drop' },
  { value: 'match', label: 'Go to Match', group: 'Workspaces', keywords: 'choose model' },
  { value: 'theme', label: 'Switch theme', group: 'Settings', keywords: 'dark light' },
];

interface Row {
  name: string;
  value: string;
  why: string;
}

const ROWS: Row[] = [
  { name: 'aspect', value: '4:5', why: 'The shape the frame is delivered in' },
  { name: 'steps', value: '28', why: 'Lower on distilled variants, around 8 to 12' },
  { name: 'guidance', value: '3.5', why: 'Three to four is the usable band' },
];

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  const id = title.toLowerCase().replace(/\W+/g, '-');
  return (
    <section className="gal-section" aria-labelledby={id}>
      <h2 className="gal-h2" id={id}>
        {title}
      </h2>
      <div className="gal-body">{children}</div>
    </section>
  );
}

export function Gallery(): ReactNode {
  const [tool, setTool] = useState('alpha');
  const [ratio, setRatio] = useState('4:5');
  const [mode, setMode] = useState('simple');
  const [light, setLight] = useState<string[]>(['golden hour']);
  const [medium, setMedium] = useState('golden hour');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [stylize, setStylize] = useState(250);
  const [sound, setSound] = useState(true);
  const [tab, setTab] = useState('prompt');
  const [dialog, setDialog] = useState(false);
  const [palette, setPalette] = useState(false);
  const [coach, setCoach] = useState(false);
  const [files, setFiles] = useState('');
  const coachAnchor = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isPaletteShortcut(e)) {
        e.preventDefault();
        setPalette(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <>
      <a className="fg-skip" href="#gallery-main">
        Skip to the controls
      </a>
      <header className="gal-head">
        <h1 className="gal-h1">Forge components</h1>
        <p className="gal-lede">
          Every control the product draws itself, on one page. Operate all of it by keyboard, in
          either theme.
        </p>
        <ThemeToggle />
      </header>

      <main className="gal-main" id="gallery-main">
        <Section title="Buttons">
          <div className="gal-row">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                toast('Struck. The prompt is on the clipboard.', 'good');
              }}
            >
              Strike
            </Button>
            <Button
              onClick={() => {
                toast('Saved to your library.');
              }}
            >
              Save
            </Button>
            <Button variant="quiet">Reset</Button>
            <Button
              variant="danger"
              onClick={() => {
                setDialog(true);
              }}
            >
              Delete
            </Button>
            <Button disabled>Unavailable</Button>
            <Button busy busyLabel="Forging">
              Strike
            </Button>
            <Tooltip text="Shows the settings alongside the prompt.">
              <Button>Settings</Button>
            </Tooltip>
          </div>
        </Section>

        <Section title="Pickers">
          <Combobox
            label="Model"
            options={TOOLS}
            value={tool}
            onChange={setTool}
            searchHint="Filter 13 examples"
            adornment={
              <InfoDot
                term="the model"
                explanation={{
                  label: 'Model',
                  short: 'Which tool the prompt is written for.',
                  what: 'Every model reads a prompt in its own grammar.',
                  changes: 'The wording, the order of the clauses and the settings alongside it.',
                  when: 'Choose the model first, because everything else follows from it.',
                }}
              />
            }
          />
          <Combobox
            label="Aspect ratio"
            options={RATIOS}
            value={ratio}
            onChange={setRatio}
            compact
          />
          <Segmented
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'simple', label: 'Simple' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
        </Section>

        <Section title="Chips">
          <ChipGroup
            label="Lighting"
            chips={CHIPS}
            value={light}
            onChange={(v) => {
              setLight(v as string[]);
            }}
            max={2}
            hint="Pick one or two. Stacking more dilutes each."
          />
          <ChipGroup
            label="Medium"
            chips={CHIPS}
            value={medium}
            onChange={(v) => {
              setMedium(v as string);
            }}
            hideLabel={false}
          />
        </Section>

        <Section title="Text">
          <TextField
            label="Subject"
            hint="The one thing the frame is about"
            placeholder="A retired boxer taping his hands"
            value={subject}
            onChange={(e) => {
              setSubject(e.currentTarget.value);
            }}
          />
          <TextField
            label="Palette"
            error="Give a hex code, such as #0B3D2E, or a colour name."
            defaultValue="???"
          />
          <TextArea
            label="Notes"
            hint="Anything the model should know that the fields do not cover"
            value={notes}
            maxLength={200}
            showCount
            onChange={(e) => {
              setNotes(e.currentTarget.value);
            }}
          />
        </Section>

        <Section title="Values">
          <Slider
            label="Stylize"
            min={0}
            max={1000}
            step={10}
            value={stylize}
            onChange={setStylize}
            hint="Zero gives the prompt, a thousand gives the model's taste."
          />
          <Switch
            label="Generate audio"
            checked={sound}
            onChange={setSound}
            hint="Billed per second on some tools."
          />
        </Section>

        <Section title="Panels">
          <Tabs
            label="Output"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'prompt', label: 'Prompt' },
              { value: 'settings', label: 'Settings' },
              { value: 'traps', label: 'Traps' },
            ]}
          >
            {tab === 'prompt' && (
              <p className="fg-mono">Photograph of a retired boxer taping his hands.</p>
            )}
            {tab === 'settings' && (
              <Table
                caption="Settings for this model"
                columns={[
                  { key: 'name', header: 'Setting', cell: (r: Row) => r.name, mono: true },
                  { key: 'value', header: 'Value', cell: (r: Row) => r.value, mono: true },
                  { key: 'why', header: 'Why', cell: (r: Row) => r.why },
                ]}
                rows={ROWS}
                rowKey={(r: Row) => r.name}
              />
            )}
            {tab === 'traps' && (
              <Disclosure summary="Three traps on this model" defaultOpen>
                <p>
                  Adjective spam is a habit from older models. It costs tokens and steers nothing.
                </p>
              </Disclosure>
            )}
          </Tabs>
        </Section>

        <Section title="Files">
          <DropZone
            label="Drop an image, or choose a file"
            hint="PNG, JPEG or WebP"
            accept="image/*"
            status={files}
            onFiles={(list) => {
              setFiles(`Took ${String(list.length)} file.`);
            }}
          />
        </Section>

        <Section title="Layers">
          <div className="gal-row">
            <Button
              onClick={() => {
                setDialog(true);
              }}
            >
              Open a dialog
            </Button>
            <Button
              onClick={() => {
                setPalette(true);
              }}
            >
              Open the palette
            </Button>
            <Button
              ref={coachAnchor}
              onClick={() => {
                setCoach(true);
              }}
            >
              Show a coach mark
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                toast('This is a message. It goes away on its own.', 'warn');
              }}
            >
              Raise a message
            </Button>
          </div>
        </Section>
      </main>

      <Dialog
        open={dialog}
        onClose={() => {
          setDialog(false);
        }}
        title="Delete this prompt"
        description="It goes from your library and from any share link. That cannot be undone."
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setDialog(false);
              }}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDialog(false);
                toast('Deleted.', 'good');
              }}
            >
              Delete it
            </Button>
          </>
        }
      />

      <CommandPalette
        open={palette}
        onClose={() => {
          setPalette(false);
        }}
        commands={COMMANDS}
        onRun={(value) => {
          toast(`Ran ${value}.`);
        }}
      />

      <CoachMark
        open={coach}
        anchor={coachAnchor}
        title="This is the model rail"
        body="Choose a model here and the brief below changes to the fields that model actually reads."
        step={1}
        total={3}
        onNext={() => {
          setCoach(false);
        }}
        onSkip={() => {
          setCoach(false);
        }}
      />

      <ToastRegion />
    </>
  );
}
