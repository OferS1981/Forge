import type { Compliance } from '../../types';
import { CHECKED, src, unresearched, wildcard } from './shared';
import { googleImage, midjourneyCompliance } from './image';

/** Manual section 6.6. */

/** Veo carries the Google sheet, with the video-specific lines from the 6.6 table on top. */
const veoCompliance: Compliance = {
  ...googleImage,
  policy: {
    ...googleImage.policy,
    tripLines: [
      ...googleImage.policy.tripLines,
      'personGeneration is mode-dependent: several Veo modes do not offer allow_all regardless of allowlist status.',
      'Ads built on generated video require synthetic-content disclosure.',
    ],
    verifiedOn: CHECKED,
  },
  refusal: {
    ...googleImage.refusal,
    appealPath:
      'The best documented in the field: a support code path, a likeness complaint form, and project allowlisting.',
    verifiedOn: CHECKED,
  },
};

const KLING_ROW = src(
  'https://app.klingai.com/global/dev/document-api/apiReference/model/videoGeneration',
  'Video generation API',
  'Kuaishou',
);

const klingCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: ['No "political campaigning or advocacy or lobbying".'],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Prohibited outright: no political campaigning, advocacy or lobbying.',
    regionalLimits: [],
    sources: [KLING_ROW],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    commercialUse:
      'Yes, but you must label output as Kling AI-generated when distributing it, and watermark removal is a paid benefit.',
    indemnity: null,
    sources: [KLING_ROW],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'tier-dependent',
    removalProhibited: true,
    euArticle50Ready: false,
    sources: [KLING_ROW],
    verifiedOn: CHECKED,
  },
  refusal: {
    appealPath: 'support@kling.ai for account actions.',
    vendorGuidance:
      'No published trigger list; rephrase and keep the required label on anything you distribute.',
    sources: [KLING_ROW],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const seedanceCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [
      'Photorealistic faces are blocked at the model layer, not by a setting. The legitimate routes are the digital avatar with liveness verification, or enterprise portrait authorisation.',
    ],
    artistNames: 'unpublished',
    publicFigures: 'blocked',
    optOutRegistry: false,
    minors: 'Not published; the face block applies to everyone.',
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
    vendorGuidance:
      'A refused face is a model-layer block: no rewrite fixes it. Use the documented avatar route or a model that permits people.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const runwayCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: ['A general deception clause; no published trigger list.'],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent:
      'A general deception clause covers it; no specific political rule is published.',
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
    appealPath:
      'suspension@runwayml.com, for account actions only. In their words, they are "unable to allowlist specific accounts or subject matters, regardless of the intent".',
    vendorGuidance:
      'Be honest with yourself: there is no exception path here and no allowlisting. If a legitimate request keeps failing, the fix is phrasing or a different model, not an appeal.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const hailuoCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: ['Content may be removed "for any or no reason".'],
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
    ownershipNote:
      'A US copyright suit over Hailuo is active; output-side exposure is live, not theoretical.',
    commercialUse: 'You own the output. No indemnity.',
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'always',
    removalProhibited: true,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    appealPath: null,
    vendorGuidance:
      'None published. Removal can happen for any or no reason; keep local copies of what matters.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const lumaCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'None specific.',
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
    invisible: ['May embed'],
    c2pa: true,
    visible: 'optional',
    removalProhibited: true,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    appealPath: 'DMCA only; no appeals process is published.',
    vendorGuidance:
      'The terms are explicit that you "will not remove, alter, obscure, or circumvent" the provenance marks.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

const higgsfieldCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [
      'Moderation is per hosted model: a refusal on one model is not a Higgsfield-wide policy judgement. Try the same request on a sibling model before rewriting.',
    ],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'None specific.',
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
    appealPath: 'NCII removal within 48 hours; DMCA counter-notice.',
    vendorGuidance:
      'Higgsfield does not warrant that its marks persist, so do not rely on it alone for EU Article 50 disclosure: add your own caption or end card when you publish into the EU.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

/** MJ Video carries the Midjourney sheet unchanged: same guidelines, same terms, same absence of appeals. */
const mjvideoCompliance: Compliance = midjourneyCompliance;

export const VIDEO_COMPLIANCE = {
  veo: veoCompliance,
  kling: klingCompliance,
  seedance: seedanceCompliance,
  runway: runwayCompliance,
  hailuo: hailuoCompliance,
  luma: lumaCompliance,
  ltx: unresearched('Lightricks'),
  higgsfield: higgsfieldCompliance,
  wan: unresearched('Alibaba'),
  mjvideo: mjvideoCompliance,
  'generic-video': wildcard('video'),
} as const;
