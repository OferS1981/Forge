import type {
  AXIS_IDS,
  CATEGORY_IDS,
  CHIP_FIELD_IDS,
  FIELD_IDS,
  GRAMMAR_IDS,
  MODEL_IDS,
  STRENGTH_TAGS,
  VOCAB_BANKS,
} from './ids';

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type GrammarId = (typeof GRAMMAR_IDS)[number];
export type AxisId = (typeof AXIS_IDS)[number];
export type StrengthTag = (typeof STRENGTH_TAGS)[number];
export type VocabBank = (typeof VOCAB_BANKS)[number];
export type FieldId = (typeof FIELD_IDS)[number];
export type ChipFieldId = (typeof CHIP_FIELD_IDS)[number];
export type ModelId = (typeof MODEL_IDS)[number];

export type Mode = 'simple' | 'advanced';

/**
 * Glossary term ids. Fields and vocabulary banks get fixed ids so a typo fails `tsc`.
 * Settings rows derive their id from the row name; the term-coverage test checks those.
 */
export type TermId =
  `field.${FieldId}` | `vocab.${VocabBank}` | `setting.${string}` | `concept.${string}`;

/** What the user typed or picked. Chip fields hold a list, everything else one string. */
export type Brief = {
  [K in FieldId]?: K extends ChipFieldId ? string[] : string;
};
export type BriefValue = string | string[];

export interface Option {
  value: string;
  label: string;
  hint?: string;
  term?: TermId;
  tier: Mode;
}

export type FieldType = 'text' | 'area' | 'chips' | 'chip1' | 'select' | 'seg' | 'number';

export interface AutoFill {
  value: string | string[];
  why: string;
}

export interface Field {
  id: FieldId;
  label: string;
  hint?: string;
  type: FieldType;
  options?: Option[];
  max?: number;
  placeholder?: string;
  tier: Mode;
  term: TermId;
  autoFill?: (brief: Brief, model: Model) => AutoFill | undefined;
}

export interface Term {
  id: TermId;
  label: string;
  short: string;
  what: string;
  changes: string;
  when: string;
  range?: string;
  example?: { low: string; high: string };
  seeAlso?: TermId[];
  models?: ModelId[];
  /** True while the entry is a placeholder waiting for real copy. Phase 4 removes the flag. */
  stub?: true;
}

export interface SettingRow {
  name: string;
  value: string;
  why: string;
  term?: TermId;
  tier: Mode;
}

export interface Source {
  url: string;
  title: string;
  publisher: string;
}

/**
 * The vendor's published content rules, typed exactly as the policy manual's section 9.1 specifies.
 * Everything in these four blocks is the vendor's own position with the page it came from in
 * `sources`; nothing in them is Forge's judgement of anyone's brief. A block that no primary page
 * backs yet says so with `unverified` and empty strings rather than a confident guess.
 */
export interface PolicyBlock {
  /** The vendor's content or community policy page. Empty string when no page has been read. */
  policyUrl: string;
  usagePolicyUrl?: string;
  /** The rules people actually hit, in the vendor's words. */
  tripLines: string[];
  artistNames: 'refused' | 'stripped' | 'allowed' | 'unpublished';
  publicFigures: 'blocked' | 'allowed-with-safeguards' | 'stock-licensed-only' | 'unpublished';
  optOutRegistry: boolean;
  /** The actual rule on minors, including regional carve-outs. */
  minors: string;
  politicalContent: string;
  /** A supported, documented moderation level. A product setting, never a bypass. */
  moderationSetting?: { name: string; values: string[]; default: string; note: string };
  regionalLimits: { regions: string[]; rule: string }[];
  sources: Source[];
  verifiedOn: string;
  unverified?: true;
}

export interface RightsBlock {
  outputOwner: 'user' | 'vendor' | 'tier-dependent' | 'unclear';
  /** The Recraft and Leonardo free-tier traps live here. */
  ownershipNote?: string;
  commercialUse: string;
  /** Suno's download caps live here. */
  exportEntitlement?: string;
  indemnity: null | { scope: string; requires: string; excludes: string[] };
  sources: Source[];
  verifiedOn: string;
  unverified?: true;
}

export interface ProvenanceBlock {
  /** Invisible marks in the file: SynthID, a proprietary tag. */
  invisible: string[];
  c2pa: boolean;
  visible: 'always' | 'optional' | 'tier-dependent' | 'none';
  removalProhibited: boolean;
  /** Higgsfield explicitly does not warrant that its marks persist. */
  euArticle50Ready: boolean;
  sources: Source[];
  verifiedOn: string;
  unverified?: true;
}

export interface RefusalBlock {
  /** What the vendor gives you to diagnose with: Vertex RAI codes, error strings. */
  diagnostics?: string;
  /** Be honest when there is none: null, not a soothing sentence. */
  appealPath: string | null;
  vendorGuidance: string;
  sources: Source[];
  verifiedOn: string;
  unverified?: true;
}

/** The four vendor-fact blocks, kept per vendor in models/compliance and composed onto each model. */
export interface Compliance {
  policy: PolicyBlock;
  rights: RightsBlock;
  provenance: ProvenanceBlock;
  refusal: RefusalBlock;
}

export interface Category {
  id: CategoryId;
  name: string;
  /** Name of the colour token in packages/ui. No hexes live here. */
  colour: `--cat-${CategoryId}`;
  /** The pick a newcomer should start with. */
  defaultModel: ModelId;
}

export type NegativeMode = 'flag' | 'field' | 'prose' | 'none';

export interface Negative {
  mode: NegativeMode;
  label?: string;
  note: string;
}

export type BriefPredicate = (brief: Brief) => boolean;

export interface Model {
  id: ModelId;
  name: string;
  sub?: string;
  version: string;
  /** Wildcards have no maker. */
  maker?: string;
  category: CategoryId;
  wildcard?: true;

  blurb: string;
  /**
   * Two to four short capability tags. The spec sketches four; four prototype entries carry two
   * and nine carry three, and inventing the missing ones would be new unsourced copy.
   */
  tags: [string, string] | [string, string, string] | [string, string, string, string];

  grammar: GrammarId;
  /** Productive prompt length in words. [0, 0] means length is not the lever. */
  length: [number, number];
  core: FieldId[];
  craft: FieldId[];
  tech: FieldId[];

  aspects?: Option[];
  durations?: Option[];

  negative: Negative;

  best: string;
  worst: string;
  notes: string[];
  warnings: string[];

  settings: (brief: Brief, mode: Mode) => SettingRow[];

  // Composer flags. These replace model-id branches so composers stay model-agnostic.
  /** Appended to the flat prompt after the negative flag. Midjourney's `--ar ... --v`. */
  promptSuffix?: (brief: Brief) => string;
  /** Emit `[pan]` `[zoom]` `[static]` tokens in the video prompt. */
  inlineCameraTokens?: true;
  /** Whether bracketed audio tags go into the script. */
  audioTags?: 'always' | 'creative-only' | 'never';
  /** Add an under-100-character acting instruction line. */
  actingInstruction?: true;
  /** Music: the flat prompt is the Style line alone, and the exclude block names the field. */
  flatStyleOnly?: true;
  /** Chat models: which delimiter system the prompt is written in. */
  delimiters?: 'xml' | 'markdown';
  /**
   * How the prose composer writes each clause. `terse` is the default and produces the token lists
   * most image models were trained on. `narrative` writes full sentences and keeps the descriptive
   * half of a vocabulary entry, for the models whose own documentation asks for descriptive
   * paragraphs rather than keyword lists. Set it only where a source says so.
   */
  prose?: 'narrative';
  /**
   * A documented section order that differs from the shared one. `action-in-environment` is
   * Runway's own template, "[camera] shot of [subject] [action] in [environment], then supporting
   * description". `performance-timeline` is Seedance's documented structure, "subject, performance
   * across the full duration, ambience, camera, then audio". `shot-scene-action` is LTX's official
   * prompting guide: establish the shot, set the scene, describe the action, define the character,
   * identify the camera movement, describe the audio, all as one flowing paragraph. Set only where
   * the model's own notes record the vendor saying so.
   */
  videoOrder?: 'action-in-environment' | 'performance-timeline' | 'shot-scene-action';
  /**
   * The vendor documents that SFX and ambience belong on their own labelled line rather than woven
   * into the prose. Veo's own note calls it the documented syntax.
   */
  audioLabels?: true;
  /**
   * The vendor documents that this is not a cinematic-paragraph model: describe only the motion,
   * in a handful of words, and let the still carry the look. The composer keeps the subject and
   * setting in a start-frame block so nothing the user typed is lost, and puts only the motion in
   * the pasteable prompt. Midjourney Video's own note is the source.
   */
  motionOnly?: true;
  /**
   * The vendor's own published order for the style tokens. Google's formula for Lyria, Stability's
   * for Stable Audio, ElevenLabs' five dimensions for its music model. Suno's documented order is
   * the default one, so it carries no flag. Set only where a note records the vendor saying so.
   */
  musicOrder?: readonly ('genre' | 'mood' | 'inst' | 'bpm' | 'key' | 'vocal' | 'prod')[];
  /**
   * The vendor documents section metatags in the lyrics field, [Verse] [Chorus] and parameterised
   * [Chorus: huge], so a written arrangement is translated into that syntax. Suno's note is the
   * source.
   */
  structureTags?: true;
  /** Warn when the spoken script is shorter than this many characters. */
  lengthWarningBelow?: number;
  /** Match: how this model does on vertical video. */
  vertical?: 'weak' | 'strong';

  /** The vendor's published content rules. See PolicyBlock. */
  policy: PolicyBlock;
  /** Who owns the output and what you may do with it. See RightsBlock. */
  rights: RightsBlock;
  /** What marks are in the file. See ProvenanceBlock. */
  provenance: ProvenanceBlock;
  /** What happens when you are refused. See RefusalBlock. */
  refusal: RefusalBlock;

  pairsWith: { model: ModelId; why: string }[];
  betterFor: { when: BriefPredicate; model: ModelId; why: string }[];
  strengthTags: { tag: StrengthTag; weight: 1 | 2 | 3 }[];

  sources: Source[];
  verifiedOn: string;
  /**
   * Present until a real verification pass clears it: someone fetched the pages in `sources` and
   * reconciled every prompting claim in this file against them, on `verifiedOn`. Reading one page,
   * or porting faithfully from the prototype, does not clear it. The app shows the badge honestly,
   * so a cleared flag is a promise, not a mood.
   */
  unverified?: true;
}

/**
 * What a model file writes: everything about prompting the model. The four vendor-fact blocks are
 * kept beside their sources in models/compliance, one file per category mirroring the policy
 * manual's vendor sheets, and composed onto the spec in models/index. A model missing its blocks
 * is a type error there, not a runtime surprise.
 */
export type ModelSpec = Omit<Model, 'policy' | 'rights' | 'provenance' | 'refusal'>;

export interface Block {
  label: string;
  body: string;
  term?: TermId;
}

export interface Variation {
  name: string;
  text: string;
}

export interface AutoFilled {
  field: FieldId;
  value: string;
  why: string;
}

export type Axes = Record<AxisId, number>;

export interface ForgeResult {
  blocks: Block[];
  flat: string;
  negative: string | null;
  settings: SettingRow[];
  notes: string[];
  warnings: string[];
  variations: Variation[];
  stripped: string[];
  autoFilled: AutoFilled[];
  score: number;
  axes: Axes;
  /** The composer wrote code or JSON: show it in a monospace block. */
  mono?: true;
}

export interface Score {
  total: number;
  axes: Axes;
  filled: number;
}

export interface ScoreLabel {
  min: number;
  name: string;
  meaning: string;
}

export interface Diagnosis {
  axes: Axes;
  score: number;
  findings: string[];
  working: string[];
  words: number;
  stripped: string[];
  cleaned: string;
}

export interface MatchEntry {
  model: Model;
  score: number;
}

export interface MatchGroup {
  category: CategoryId;
  job: string;
  models: MatchEntry[];
}

export interface MatchResult {
  groups: MatchGroup[];
  multi: boolean;
}

export interface Recommendation {
  kind: 'better' | 'pairs';
  model: Model;
  why: string;
}

export interface Lost {
  field: FieldId;
  reason: string;
}

export interface TranslateResult {
  from: ForgeResult;
  to: ForgeResult;
  brief: Brief;
  lost: Lost[];
}

export interface Explanation extends Omit<Term, 'stub'> {
  /** True while the glossary entry is still a placeholder. */
  stub: boolean;
}

export interface ImageStats {
  width: number;
  height: number;
  ratio: string;
  mean: number;
  sd: number;
  sat: number;
  dens: number;
  top: string[];
  key: string;
  contrast: string;
  satWord: string;
  temp: string;
  detail: string;
}
