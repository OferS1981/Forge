/**
 * The Refusal Doctor's engine: manual section 2 as pure functions. Parse what the vendor gave
 * you, ask the one question that separates a classifier from the model, and bisect, which works
 * with no model access at all, which means it is free and it works offline. None of this touches
 * the network and none of it rewrites anything: it names the layer and hands you the fix for
 * that layer.
 */

export interface RaiCode {
  code: string;
  category: string;
  side: 'input' | 'output';
}

/** Vertex RAI codes, from the manual's section 2 table. Google is the only major platform that names what fired. */
export const RAI_CODES: readonly RaiCode[] = [
  { code: '58061214', category: 'Child', side: 'input' },
  { code: '17301594', category: 'Child', side: 'output' },
  { code: '29310472', category: 'Celebrity', side: 'input' },
  { code: '15236754', category: 'Celebrity', side: 'output' },
  { code: '62263041', category: 'Dangerous content', side: 'input' },
  { code: '57734940', category: 'Hate', side: 'input' },
  { code: '22137204', category: 'Hate', side: 'output' },
  { code: '39322892', category: 'People or face', side: 'output' },
  { code: '92201652', category: 'Personal information', side: 'input' },
  { code: '89371032', category: 'Prohibited content', side: 'input' },
  { code: '49114662', category: 'Prohibited content', side: 'output' },
  { code: '72817394', category: 'Prohibited content', side: 'output' },
  { code: '90789179', category: 'Sexual', side: 'input' },
  { code: '63429089', category: 'Sexual', side: 'output' },
  { code: '43188360', category: 'Sexual', side: 'output' },
  { code: '78610348', category: 'Toxic', side: 'input' },
  { code: '61493863', category: 'Violence', side: 'input' },
  { code: '56562880', category: 'Violence', side: 'output' },
  { code: '32635315', category: 'Vulgar', side: 'input' },
  { code: '64151117', category: 'Celebrity or child', side: 'input' },
  { code: '35561574', category: 'Third-party content', side: 'input' },
  { code: '35561575', category: 'Third-party content', side: 'input' },
];

export type RefusalLayer =
  'capability-gate' | 'input-classifier' | 'output-classifier' | 'model' | 'unknown';

export interface RefusalRead {
  /** RAI codes found in the pasted error, if any. */
  codes: RaiCode[];
  /** True when the error is a capability or regional gate, not a content judgement. */
  capabilityGate: boolean;
  /** What the error text itself already tells us. */
  layer: RefusalLayer;
}

const GATE_WORDS =
  /allowlist-only|allowlist|not available in your (?:region|country)|requires? (?:organisation|organization) verification|quota|rate limit/i;

/** Step 1 of the diagnostic: read the error text. */
export function parseRefusal(errorText: string): RefusalRead {
  const codes: RaiCode[] = [];
  for (const entry of RAI_CODES) {
    if (errorText.includes(entry.code)) codes.push(entry);
  }
  const capabilityGate = GATE_WORDS.test(errorText);
  let layer: RefusalLayer = 'unknown';
  if (capabilityGate) layer = 'capability-gate';
  else if (codes.some((c) => c.side === 'input')) layer = 'input-classifier';
  else if (codes.some((c) => c.side === 'output')) layer = 'output-classifier';
  return { codes, capabilityGate, layer };
}

export interface RefusalDiagnosis {
  layer: RefusalLayer;
  name: string;
  /** What this layer can see, so the fix makes sense. */
  sees: string;
  fix: string;
}

/**
 * Step 2: the one question that picks the fix. Deterministic means classifier; inconsistent
 * means the model or the output stage. That single test works on every platform, for free.
 */
export function diagnoseRefusal(
  read: RefusalRead,
  deterministic: boolean | null,
): RefusalDiagnosis {
  if (read.layer === 'capability-gate') {
    return {
      layer: 'capability-gate',
      name: 'A capability gate, not a content judgement',
      sees: 'Your account, region and settings. Not your prompt.',
      fix: 'No rewrite fixes this. Check the regional rules and the supported settings, request allowlisting where a path exists, or use a different model.',
    };
  }
  if (read.layer === 'input-classifier' || deterministic === true) {
    return {
      layer: 'input-classifier',
      name: 'The input classifier: lexical and shallow',
      sees: 'Tokens, not meaning. It never had your context, so adding context does nothing.',
      fix: 'Change the word. Bisect to find the one token with a second meaning, then replace it with a more precise synonym, which improves the prompt as well as unblocking it.',
    };
  }
  if (read.layer === 'output-classifier') {
    return {
      layer: 'output-classifier',
      name: 'The output classifier: it saw the picture, not your prompt',
      sees: 'The generated result, sometimes alongside the input. Not your stated purpose.',
      fix: "Change the depiction or the settings: name the medium (illustration and painting are policy-different from photograph), state the register, and check the vendor's supported moderation setting.",
    };
  }
  if (deterministic === false) {
    return {
      layer: 'model',
      name: 'The model itself, or the output stage',
      sees: 'Everything, it is the strongest contextual reasoner in the stack, and no setting turns it off.',
      fix: 'State the register, the purpose and the audience in one clause; remove emotive intensifiers. If every rephrase fails at loose thresholds, change model: there is no setting for layer 3.',
    };
  }
  return {
    layer: 'unknown',
    name: 'Not enough signal yet',
    sees: 'Run the prompt three times: identical refusals mean a classifier, inconsistent ones mean the model.',
    fix: 'Answer whether it fails every time, or paste more of the error text, and this becomes one of the four named layers.',
  };
}

/**
 * Step 3: bisect. Split the prompt at the sentence boundary nearest the middle. Whichever half
 * fails alone contains the trigger; four runs usually isolate the exact word.
 */
export function splitHalves(prompt: string): [string, string] {
  const text = prompt.trim();
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) {
    const words = text.split(/\s+/);
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  let best = 1;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 1; i < sentences.length; i += 1) {
    const left = sentences.slice(0, i).join(' ').length;
    const delta = Math.abs(left - text.length / 2);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  return [sentences.slice(0, best).join(' '), sentences.slice(best).join(' ')];
}
