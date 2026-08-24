import type { Compliance } from '../../types';
import { CHECKED, src, unresearched, wildcard } from './shared';

/**
 * Text, code, app and research models. The policy manual's research pass centred on generative
 * media, so most of these sheets are honestly thin: what it did establish for OpenAI, Anthropic
 * and Google carries over, and the rest wears the badge rather than a guess.
 */

const OPENAI_POLICY = src(
  'https://openai.com/policies/usage-policies/',
  'Usage policies',
  'OpenAI',
);
const OPENAI_TERMS = src(
  'https://openai.com/policies/service-terms/',
  'Service terms, containing the Copyright Shield',
  'OpenAI',
);

const openaiText: Compliance = {
  policy: {
    policyUrl: 'https://openai.com/policies/usage-policies/',
    tripLines: [
      'The moderation endpoint publishes its categories; for text, all of them apply: harassment, hate, illicit, self-harm, sexual, violence, and their sub-categories.',
      'A non-English prompt can trip the filter where its English translation passes, an acknowledged classifier gap, with Japanese disproportionately affected in the documented incident.',
    ],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors:
      'The usage policies bar sexual content involving minors absolutely; no text-specific rule beyond that is published.',
    politicalContent:
      'The usage policies bar deceptive political use; no blanket ban on political writing.',
    regionalLimits: [],
    sources: [OPENAI_POLICY],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    ownershipNote: '"You own the Output", with the caveat that output may not be unique.',
    commercialUse: 'Yes, on every tier. Indemnity is what changes by tier.',
    indemnity: {
      scope: 'Copyright Shield covers API, Enterprise, Edu, Healthcare and Business.',
      requires: 'A covered surface. Free and Plus get nothing.',
      excludes: [
        'You knew or should have known the output was likely infringing',
        'You disabled safety features',
        'Modified or combined output',
        'Trademark claims arising from use in trade or commerce',
      ],
    },
    sources: [OPENAI_TERMS],
    verifiedOn: CHECKED,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: false,
    sources: [OPENAI_POLICY],
    verifiedOn: CHECKED,
  },
  refusal: {
    diagnostics: 'The moderation endpoint returns per-category scores you can read directly.',
    appealPath:
      'https://openai.com/form/appeal/ for account actions. There is no per-request appeal for a moderation block.',
    vendorGuidance:
      'Deterministic refusal on a short prompt is the input classifier: change the ambiguous word. Inconsistent refusal on a longer prompt is the model: state the register, purpose and audience, and cut emotive intensifiers.',
    sources: [OPENAI_POLICY],
    verifiedOn: CHECKED,
  },
};

const ANTHROPIC_SAFEGUARDS = src(
  'https://www.anthropic.com/news/improving-fable-5-s-biology-safeguards',
  "Improving Fable 5's biology safeguards",
  'Anthropic',
);

const anthropic: Compliance = {
  policy: {
    policyUrl: 'https://www.anthropic.com/news/improving-fable-5-s-biology-safeguards',
    tripLines: [
      'The output classifier "monitors outputs in the context of their inputs", so a prompt that states its purpose gives it something to reason with. Context works here in a way it cannot at a keyword layer.',
      'Anthropic\'s own admission of over-refusal is the cleanest on record: early "very broad classifiers" "triggered on a wide range of requests, even ones that were almost certainly benign", including "cancer" flagged as a biosecurity risk, and the fix cut biology-related fallbacks by about 85%. "We made the wrong tradeoff and we apologize for not getting the balance right."',
    ],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors:
      'Child-safety protections are unconditional; no further text-specific rule was part of the research pass.',
    politicalContent: 'Not part of the research pass.',
    regionalLimits: [],
    sources: [ANTHROPIC_SAFEGUARDS],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'unclear',
    ownershipNote:
      "Anthropic's commercial terms were not part of the research pass behind this catalogue. The live lyrics litigation against Anthropic is output-side, which is the frontier that points at users: check the current terms before selling.",
    commercialUse: 'Check the current commercial terms; not established here.',
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    appealPath: 'Support, for account actions.',
    vendorGuidance:
      'If every rephrase fails, you are at the model layer and only register helps: say what kind of document this is and who it is for. The clinical, educational and editorial registers are exactly what the improved classifiers were tuned to pass.',
    sources: [ANTHROPIC_SAFEGUARDS],
    verifiedOn: CHECKED,
  },
};

const GOOGLE_PUP = src(
  'https://policies.google.com/terms/generative-ai/use-policy',
  'Generative AI prohibited use policy',
  'Google',
);
const GEMINI_SAFETY = src(
  'https://ai.google.dev/gemini-api/docs/safety-settings',
  'Gemini safety settings',
  'Google',
);

const googleText: Compliance = {
  policy: {
    policyUrl: 'https://policies.google.com/terms/generative-ai/use-policy',
    tripLines: [
      'Gemini text filters block on the probability that content is unsafe rather than its severity, a more false-positive-prone signal than a severity rubric.',
      'Certain core-harm categories "are always blocked and cannot be adjusted"; do not spend time looking for a setting that does not exist.',
    ],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Core child-safety categories are always blocked and have no setting.',
    politicalContent:
      'The prohibited use policy bars false claims; no blanket ban on political writing.',
    moderationSetting: {
      name: 'HarmBlockThreshold (per category)',
      values: [
        'OFF',
        'BLOCK_NONE',
        'BLOCK_ONLY_HIGH',
        'BLOCK_MEDIUM_AND_ABOVE',
        'BLOCK_LOW_AND_ABOVE',
      ],
      default: 'OFF',
      note: 'Default OFF on Gemini 2.5 and 3 on the ai.google.dev surface, a large change from earlier defaults. Vertex may differ; verify per surface.',
    },
    regionalLimits: [
      {
        regions: ['EEA', 'CH', 'UK'],
        rule: 'Paid services only when serving users in these regions.',
      },
    ],
    sources: [GOOGLE_PUP, GEMINI_SAFETY],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    ownershipNote: '"Google won\'t claim ownership over that content."',
    commercialUse:
      'Yes. The Cloud indemnity requires a paid covered service; the consumer app is not on the list.',
    indemnity: {
      scope:
        "Google Cloud's generative AI indemnity covers generated output and training data on covered paid services.",
      requires: 'A paid service, not free tier or credits.',
      excludes: [
        'Knowingly infringing use',
        'Circumventing safety filters',
        'Continuing after notice',
        'Trademark claims',
      ],
    },
    sources: [GOOGLE_PUP],
    verifiedOn: CHECKED,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: false,
    sources: [GOOGLE_PUP],
    verifiedOn: CHECKED,
  },
  refusal: {
    diagnostics:
      'Per-category safety ratings come back with the response; blocked prompts name the category.',
    appealPath: 'In-product feedback with an escalating enforcement path.',
    vendorGuidance:
      'Check the per-category threshold first, it is a documented setting, then rephrase for the named category. Remember the signal is probability, not severity: precision helps more than softening.',
    sources: [GEMINI_SAFETY],
    verifiedOn: CHECKED,
  },
};

/** Microsoft's Customer Copyright Commitment, from the manual's indemnity table (row uncited, so badged). */
const github: Compliance = {
  ...unresearched('GitHub'),
  rights: {
    outputOwner: 'user',
    commercialUse: 'Yes; your code is yours.',
    indemnity: {
      scope: 'Microsoft Customer Copyright Commitment on covered products.',
      requires: 'A covered product with its guardrails left on.',
      excludes: [
        'Output the customer knowingly used and was likely to infringe',
        'Trademark, outright',
      ],
    },
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

/** Deep research is a mode of several labs' products, so its sheet is whichever lab you run it in. */
const deepResearch: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors:
      "Deep research runs inside OpenAI, Google or Anthropic products; that lab's rules apply.",
    politicalContent: "Whichever lab you run it in: that lab's policy applies.",
    regionalLimits: [],
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  rights: {
    outputOwner: 'unclear',
    ownershipNote:
      "The report is governed by the terms of the lab whose product ran it. Check that lab's sheet.",
    commercialUse: 'Per the lab whose product ran it.',
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    appealPath: null,
    vendorGuidance:
      'Diagnose against the lab actually running the research; their refusal behaviour is what you are seeing.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

export const WORK_COMPLIANCE = {
  claude: anthropic,
  gpt: openaiText,
  gemini: googleText,
  grok: unresearched('xAI'),
  deepseek: unresearched('DeepSeek'),
  'generic-text': wildcard('text'),
  claudecode: anthropic,
  cursor: unresearched('Cursor'),
  copilot: github,
  codex: openaiText,
  devin: unresearched('Cognition'),
  'generic-code': wildcard('coding'),
  v0: unresearched('Vercel'),
  lovable: unresearched('Lovable'),
  bolt: unresearched('StackBlitz'),
  base44: unresearched('Wix'),
  'generic-app': wildcard('app-builder'),
  perplexity: unresearched('Perplexity'),
  notebooklm: googleText,
  deepresearch: deepResearch,
  'generic-research': wildcard('research'),
} as const;
