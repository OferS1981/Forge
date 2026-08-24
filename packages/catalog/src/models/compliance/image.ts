import type { Compliance } from '../../types';
import { CHECKED, src, unresearched, wildcard } from './shared';

/** Manual section 6.1. */
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
const OPENAI_CARD = src(
  'https://cdn.openai.com/11998be9-5319-4302-bfbf-1167e093f1fb/Native_Image_Generation_System_Card.pdf',
  'Image generation system card',
  'OpenAI',
);
const OPENAI_APPEAL =
  'https://openai.com/form/appeal/ for account actions. There is no per-request appeal for an API moderation block.';

export const openaiImage: Compliance = {
  policy: {
    policyUrl: 'https://openai.com/policies/usage-policies/',
    usagePolicyUrl: 'https://openai.com/policies/service-terms/',
    tripLines: [
      'Photorealism is the trigger on violence, not violence itself: the aim is to prevent "photorealistic, graphically violent imagery in certain contexts". An illustration or a painting is a materially different request in policy terms.',
      'Hate symbols are allowed "in a critical, educational, or otherwise neutral context, as long as they don\'t clearly praise or endorse extremist agendas".',
      'Real people carry "particularly robust safeguards around nudity and graphic violence".',
      'Editing uploaded photorealistic images of children is not allowed, and a dedicated photorealistic-child classifier runs on uploads.',
      'gpt-image-2, 1.5, 1 and 1-mini require API organisation verification.',
    ],
    artistNames: 'refused',
    publicFigures: 'allowed-with-safeguards',
    optOutRegistry: true,
    minors:
      'Minors who are public figures are blocked. Editing uploaded photorealistic images of children is not allowed.',
    politicalContent:
      'No image-specific published rule; the general usage policies bar deception and impersonation.',
    moderationSetting: {
      name: 'moderation',
      values: ['auto', 'low'],
      default: 'auto',
      note: '"low" is documented as less restrictive filtering. A product setting, not a bypass.',
    },
    regionalLimits: [],
    sources: [OPENAI_POLICY, OPENAI_CARD],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    ownershipNote:
      'Verbatim: "you (a) retain your ownership rights in Input and (b) own the Output", with the caveat that "output may not be unique and other users may receive similar output".',
    commercialUse: 'Yes, on every tier. Indemnity is what changes by tier, not ownership.',
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
    invisible: ['SynthID'],
    c2pa: true,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: true,
    sources: [OPENAI_CARD],
    verifiedOn: CHECKED,
  },
  refusal: {
    diagnostics:
      'No per-request codes. The moderation endpoint publishes category scores; the published image-relevant categories are self-harm, sexual, violence and violence/graphic.',
    appealPath: OPENAI_APPEAL,
    vendorGuidance:
      'Set moderation to "low" (documented). If refusal is deterministic, change the ambiguous word; if inconsistent, state the register and medium: their violence policy treats an illustration differently from a photograph.',
    sources: [OPENAI_POLICY],
    verifiedOn: CHECKED,
  },
};

/** Manual section 6.2. Shared across the Google image and video surfaces. */
const GOOGLE_PUP = src(
  'https://policies.google.com/terms/generative-ai/use-policy',
  'Generative AI prohibited use policy',
  'Google',
);
const GOOGLE_RAI = src(
  'https://cloud.google.com/vertex-ai/docs/generative-ai/image/responsible-ai-imagen',
  'Vertex responsible AI for Imagen',
  'Google',
);

export const googleImage: Compliance = {
  policy: {
    policyUrl: 'https://policies.google.com/terms/generative-ai/use-policy',
    tripLines: [
      'The RAI filter categories include Health, Politics, Religion and Belief, Vulgarity, and War and Conflict, none of which has an illegality threshold. That is where legitimate medical, editorial and historical prompts die.',
      'A celebrity detection filter runs on photorealistic celebrities; generation is allowlist-gated on some surfaces.',
      'personGeneration defaults to allow_adult. allow_all, which permits children, is not allowed in the EU, UK, Switzerland and MENA regardless of settings.',
      'Misrepresenting the provenance of generated content "by claiming it was created solely by a human" is prohibited.',
    ],
    artistNames: 'unpublished',
    publicFigures: 'blocked',
    optOutRegistry: false,
    minors:
      'personGeneration "allow_all" (children) is prohibited in the EU, UK, Switzerland and MENA regardless of settings. Gemini Apps require 18+ to generate and edit images, 13+ to generate only.',
    politicalContent:
      'The prohibited use policy bars false claims; there is no separate image rule. Certain core-harm categories "are always blocked and cannot be adjusted".',
    moderationSetting: {
      name: 'safetySetting / personGeneration',
      values: [
        'BLOCK_LOW_AND_ABOVE',
        'BLOCK_MEDIUM_AND_ABOVE',
        'BLOCK_ONLY_HIGH',
        'BLOCK_NONE',
        'dont_allow',
        'allow_adult',
        'allow_all',
      ],
      default: 'allow_adult',
      note: 'Documented product settings. allow_all is regionally prohibited; core child-safety categories have no setting at all.',
    },
    regionalLimits: [
      {
        regions: ['EU', 'UK', 'CH', 'MENA'],
        rule: 'personGeneration "allow_all" is prohibited outright, regardless of settings.',
      },
      {
        regions: ['EEA', 'CH', 'UK'],
        rule: 'Paid services only when serving users in these regions.',
      },
    ],
    sources: [GOOGLE_PUP, GOOGLE_RAI],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    ownershipNote: '"Google won\'t claim ownership over that content."',
    commercialUse:
      'Yes. Indemnity requires a paid service: the consumer Gemini app is not on the covered list.',
    indemnity: {
      scope:
        "Google Cloud's generative AI indemnity covers both generated output and training data, which is unusually broad. Imagen is on the covered list.",
      requires: 'A paid service, not free tier or credits.',
      excludes: [
        'Knowingly infringing use',
        'Circumventing safety filters',
        'Continuing after notice',
        'Trademark claims arising from use in trade or commerce',
      ],
    },
    sources: [GOOGLE_PUP],
    verifiedOn: CHECKED,
  },
  provenance: {
    invisible: ['SynthID on every output, always, non-optional'],
    c2pa: true,
    visible: 'optional',
    removalProhibited: false,
    euArticle50Ready: true,
    sources: [GOOGLE_RAI],
    verifiedOn: CHECKED,
  },
  refusal: {
    diagnostics:
      'The best in the industry: set includeRaiReason and Vertex returns a numeric code naming the category and whether the block was on the prompt or the output.',
    appealPath:
      'In-product feedback, escalating enforcement with an appeal link, and project allowlisting requests for celebrity or minor generation. Prompts and outputs are retained 55 days for enforcement.',
    vendorGuidance:
      'Read the RAI code. An input code means the fix is vocabulary; an output code means the depiction or the settings. Then rewrite for that one category, adjust personGeneration, or request allowlisting.',
    sources: [GOOGLE_RAI],
    verifiedOn: CHECKED,
  },
};

/** Manual section 6.3. */
const MJ_GUIDELINES = src(
  'https://docs.midjourney.com/hc/en-us/articles/32013696484109-Community-Guidelines',
  'Community Guidelines',
  'Midjourney',
);
const MJ_TOS = src(
  'https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service',
  'Terms of Service',
  'Midjourney',
);
const MJ_NO = src(
  'https://docs.midjourney.com/hc/en-us/articles/32173351982093-No',
  'The --no parameter',
  'Midjourney',
);

export const midjourneyCompliance: Compliance = {
  policy: {
    policyUrl: 'https://docs.midjourney.com/hc/en-us/articles/32013696484109-Community-Guidelines',
    usagePolicyUrl: 'https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service',
    tripLines: [
      "Midjourney's community guidelines require PG-13 content: no gore, which their page defines down to detached body parts and blood, no adult content, no imagery of real people that could harass, defame or harm, and nothing visually shocking.",
      'The adult-content list includes "people in showers, on toilets": the classic accidental trip on an entirely ordinary domestic scene.',
      'Each word after --no is read independently, so "--no modern clothing" parses as "no modern" plus "no clothing". Describe the clothing you do want instead.',
      'A prompt not being blocked does not mean it is permitted: moderators act on generated content after the fact.',
    ],
    artistNames: 'allowed',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors:
      'No published rule beyond the PG-13 baseline; child-safety enforcement is unconditional everywhere.',
    politicalContent:
      '"You may not use the Services to generate images for political campaigns, or to try to influence the outcome of an election."',
    regionalLimits: [],
    sources: [MJ_GUIDELINES, MJ_NO],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    ownershipNote:
      'You own the output "to the fullest extent possible under applicable law", but if your company earns $1m or more per year, you or your employees must be on Pro or Mega to own assets. Midjourney takes a broad perpetual sublicensable licence back over your inputs and assets.',
    commercialUse: 'Yes, subject to the $1m-revenue Pro/Mega requirement.',
    indemnity: null,
    sources: [MJ_TOS],
    verifiedOn: CHECKED,
  },
  provenance: {
    invisible: ['A proprietary hidden ID tag, not C2PA. Verify at midjourney.com/verify.'],
    c2pa: false,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: false,
    sources: [MJ_GUIDELINES],
    verifiedOn: CHECKED,
  },
  refusal: {
    diagnostics:
      'No codes. Some text and image inputs are blocked automatically before generation.',
    appealPath: null,
    vendorGuidance:
      'Warning from a moderator, then time-out, then blocked. No published appeals process. Rephrase: describe what you want instead of loading --no, and keep domestic scenes away from the listed adult-content trips.',
    sources: [MJ_GUIDELINES],
    verifiedOn: CHECKED,
  },
};

/** Manual section 6.4. */
const ADOBE_GUIDELINES = src(
  'https://www.adobe.com/legal/licenses-terms/adobe-gen-ai-user-guidelines.html',
  'Generative AI user guidelines',
  'Adobe',
);
const ADOBE_FIREFLY = src(
  'https://helpx.adobe.com/legal/product-descriptions/adobe-firefly.html',
  'Firefly product description, which defines the indemnity',
  'Adobe',
);

const adobe: Compliance = {
  policy: {
    policyUrl: 'https://www.adobe.com/legal/licenses-terms/adobe-gen-ai-user-guidelines.html',
    tripLines: [
      'The catch-all is "engage in regulated activities without complying with applicable requirements", which silently covers drugs, weapons, alcohol and gambling without listing them.',
      'In practice the false-positive surface is bodies and retouching: swimsuit shoots, classical sculpture flagged as nudity, routine retouching of fully clothed people, and the words "chest" and "teen".',
      'Prompts are machine-translated from over 100 languages, and Adobe warns translations "may be inaccurate or unexpected", a documented source of spurious blocks.',
      'Reference images containing copyrighted material are prohibited, and music cannot be generated based on "specific artists, bands, or songs".',
    ],
    artistNames: 'unpublished',
    publicFigures: 'stock-licensed-only',
    optOutRegistry: false,
    minors: 'Users report the word "teen" being unusable at all; no published rule text.',
    politicalContent: 'No specific published rule; the general deception prohibitions apply.',
    regionalLimits: [],
    sources: [ADOBE_GUIDELINES],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    ownershipNote:
      'Yours as "Customer Content", with no IP warranty: "output may not be unique or independently protectable", and on copyrightability Adobe says only that it depends on your jurisdiction.',
    commercialUse: 'Yes. The indemnity, not the licence, is what varies by plan.',
    indemnity: {
      scope:
        'Claims that Firefly output "directly infringes the third party\'s patent, copyright, trademark, publicity, or privacy rights", broader than most because it includes trademark and publicity. Reported cap is $10,000 per infringement claim on standard terms.',
      requires: 'An eligible paid plan and a contracting event.',
      excludes: [
        'Modified or combined output',
        'Any capability powered by a non-Adobe model, even in the same interface',
        'Beta and trial features',
      ],
    },
    sources: [ADOBE_FIREFLY],
    verifiedOn: CHECKED,
  },
  provenance: {
    invisible: [],
    c2pa: true,
    visible: 'none',
    removalProhibited: true,
    euArticle50Ready: true,
    sources: [ADOBE_FIREFLY],
    verifiedOn: CHECKED,
  },
  refusal: {
    diagnostics:
      '"We can\'t process this prompt", with the reason that the prompt "may not be aligned with Adobe generative AI user guidelines". No published trigger list.',
    appealPath: null,
    vendorGuidance:
      'Official guidance is only to reword and try again. If you prompt in another language, test the English version: the machine translation itself can be the trigger.',
    sources: [ADOBE_GUIDELINES],
    verifiedOn: CHECKED,
  },
};

/** Manual section 3.9 and the 6.5 table row. */
const IDEOGRAM_TROUBLESHOOTING = src(
  'https://docs.ideogram.ai/using-ideogram/getting-started/prompting-guide/8-troubleshooting.md',
  'Ideogram troubleshooting',
  'Ideogram',
);

const ideogramCompliance: Compliance = {
  policy: {
    policyUrl:
      'https://docs.ideogram.ai/using-ideogram/getting-started/prompting-guide/8-troubleshooting.md',
    tripLines: [
      'NSFW prompts return a grey screen reading "Image blocked by safety filter".',
      'In Ideogram\'s own words: "False positive rates for safety is higher for non-json like prompts." Prompt form, not just content, changes classifier behaviour, a structured prompt is measurably less likely to be falsely blocked.',
      'Magic Prompt rewrites your prompt before generation; their docs recommend turning it off once your prompt is engineered.',
    ],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Not published.',
    moderationSetting: {
      name: 'magic_prompt',
      values: ['ON', 'AUTO', 'OFF'],
      default: 'AUTO',
      note: 'Not a moderation level, but it changes what text the filter actually sees: OFF means the text filtered is the text you wrote.',
    },
    regionalLimits: [],
    sources: [IDEOGRAM_TROUBLESHOOTING],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    commercialUse: 'You own the output. No indemnity.',
    indemnity: null,
    sources: [IDEOGRAM_TROUBLESHOOTING],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'none',
    removalProhibited: true,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    diagnostics: 'A grey screen with "Image blocked by safety filter". No codes.',
    appealPath: null,
    vendorGuidance:
      'Their own admission points at the fix: structure the prompt (the JSON grammar here does that), and turn Magic Prompt off so the filter reads your engineered text rather than a rewrite.',
    sources: [IDEOGRAM_TROUBLESHOOTING],
    verifiedOn: CHECKED,
  },
};

/** Manual 6.5 row plus the section 10 uncertainty on safety_tolerance. */
const fluxCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: ['No published ban on artist names.'],
    artistNames: 'allowed',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Not published.',
    moderationSetting: {
      name: 'safety_tolerance',
      values: ['0 (strictest)', 'to 5 or 6 (most permissive)'],
      default: '2',
      note: 'Documented as 0–5 on one surface and 1–6 on another, both with default 2, and one page is internally inconsistent. Verify per endpoint before relying on the range.',
    },
    regionalLimits: [],
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  rights: {
    outputOwner: 'user',
    commercialUse: 'You own the output. No indemnity.',
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: true,
    visible: 'none',
    removalProhibited: true,
    euArticle50Ready: true,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    appealPath:
      'An EU rightsholder complaints mechanism exists; no general appeals process is published.',
    vendorGuidance: 'Adjust safety_tolerance within the documented range, then rephrase.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

/** Manual 6.5 rows. Thin, and marked as such where the manual's own table carried no citation. */
const stability: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Not published.',
    regionalLimits: [],
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  rights: {
    outputOwner: 'user',
    commercialUse: 'You own the output. No indemnity.',
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
      'Moderation is post-hoc as well as inline: a human team reviews sampled and flagged logs, so "it went through" is not "it was allowed".',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const leonardoCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Not published.',
    regionalLimits: [],
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  rights: {
    outputOwner: 'unclear',
    ownershipNote:
      "Leonardo's free-tier ownership position is genuinely contradictory between public documents: a tracker says Leonardo owns it, the FAQ says the user does. Check your own account terms before selling anything made on it.",
    commercialUse: 'Unclear on the free tier for the same reason. Verify before selling.',
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
    vendorGuidance: 'Not published.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const recraftCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Not published.',
    regionalLimits: [],
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  rights: {
    outputOwner: 'tier-dependent',
    ownershipNote:
      'The free tier is the trap: Recraft owns the output and you get no commercial rights. Paid tiers, you own it. If you made it on free, you cannot sell it.',
    commercialUse: 'Paid tiers only. The free tier grants no commercial use at all.',
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: ['May embed watermarks'],
    c2pa: false,
    visible: 'none',
    removalProhibited: true,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    appealPath: null,
    vendorGuidance: 'Not published.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const seedreamCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [
      "China's labelling measures apply, including the prohibition on removing identification labels.",
    ],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Not published.',
    regionalLimits: [{ regions: ['CN'], rule: 'Synthetic-content labelling is required by law.' }],
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  rights: {
    outputOwner: 'unclear',
    commercialUse: 'Ownership is unclear from the public documents. Verify before selling.',
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'tier-dependent',
    removalProhibited: true,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    appealPath: null,
    vendorGuidance: 'Not published.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const qwenCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: ['The docs warn against celebrity likeness.'],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Not published.',
    moderationSetting: {
      name: 'watermark',
      values: ['true', 'false'],
      default: 'false',
      note: "A labelling parameter, not a moderation level. China's labelling law applies.",
    },
    regionalLimits: [{ regions: ['CN'], rule: 'Synthetic-content labelling is required by law.' }],
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  rights: {
    outputOwner: 'unclear',
    commercialUse: 'Ownership is unclear from the public documents. Verify before selling.',
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'optional',
    removalProhibited: true,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    diagnostics:
      'Returns an IPInfringementSuspect error code when it suspects the prompt or output infringes.',
    appealPath: null,
    vendorGuidance:
      'The error code names the problem: remove the name or the reference and describe attributes instead.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

export const IMAGE_COMPLIANCE = {
  midjourney: midjourneyCompliance,
  gptimage: openaiImage,
  nanobanana: googleImage,
  flux: fluxCompliance,
  sdxl: stability,
  ideogram: ideogramCompliance,
  firefly: adobe,
  recraft: recraftCompliance,
  seedream: seedreamCompliance,
  qwenimage: qwenCompliance,
  leonardo: leonardoCompliance,
  'generic-image': wildcard('image'),
} as const;

export { stability, unresearched };
