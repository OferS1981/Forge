import type {
  Compliance,
  PolicyBlock,
  ProvenanceBlock,
  RefusalBlock,
  RightsBlock,
  Source,
} from '../../types';

/**
 * The vendor-fact blocks specified by the policy manual's section 9. One file per category,
 * mirroring the manual's vendor sheets, composed onto each model spec in models/index.
 *
 * The rules of this folder, in order of importance:
 *
 * 1. Everything here is the vendor's position, not Forge's. Where the manual quotes, we quote.
 * 2. A fact without a fetched primary page behind it is marked `unverified: true` and its sources
 *    stay empty. The manual's own section 10 lists what was cited and what was not, and this
 *    folder follows that list rather than rounding up.
 * 3. Nothing in this data, and nothing built on it, helps anyone evade a content filter. These
 *    blocks exist to warn before submission, to make a legitimate request legible, and to tell
 *    people what they own. That line is the manual's section 0 and it is a product requirement.
 */
export const CHECKED = '2026-08-24';

export const src = (url: string, title: string, publisher: string): Source => ({
  url,
  title,
  publisher,
});

/**
 * A wildcard stands in for whatever model the person points it at, so its blocks say exactly
 * that instead of pretending a vendor position exists. Not `unverified`: "it depends on the
 * model you actually use" is the verified truth of a wildcard.
 */
export function wildcard(kind: string): Compliance {
  const depends = `A wildcard stands in for whatever ${kind} model you point it at. Read that vendor's sheet: pick the real model in the rail and these blocks fill in.`;
  const policy: PolicyBlock = {
    policyUrl: '',
    tripLines: [],
    artistNames: 'unpublished',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: depends,
    politicalContent: depends,
    regionalLimits: [],
    sources: [],
    verifiedOn: CHECKED,
  };
  const rights: RightsBlock = {
    outputOwner: 'unclear',
    ownershipNote: depends,
    commercialUse: depends,
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
  };
  const provenance: ProvenanceBlock = {
    invisible: [],
    c2pa: false,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
  };
  const refusal: RefusalBlock = {
    appealPath: null,
    vendorGuidance: depends,
    sources: [],
    verifiedOn: CHECKED,
  };
  return { policy, rights, provenance, refusal };
}

/**
 * A vendor whose sheet was not part of the manual's research pass. The block says so plainly and
 * wears the badge, instead of a confident guess that would age into a lie.
 */
export function unresearched(vendor: string): Compliance {
  const honest = `${vendor}'s policy pages were not part of the research pass behind this catalogue. Nothing here is a guess: check the vendor's own terms before you rely on anything.`;
  return {
    policy: {
      policyUrl: '',
      tripLines: [],
      artistNames: 'unpublished',
      publicFigures: 'unpublished',
      optOutRegistry: false,
      minors: honest,
      politicalContent: honest,
      regionalLimits: [],
      sources: [],
      verifiedOn: CHECKED,
      unverified: true,
    },
    rights: {
      outputOwner: 'unclear',
      ownershipNote: honest,
      commercialUse: honest,
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
      vendorGuidance: honest,
      sources: [],
      verifiedOn: CHECKED,
      unverified: true,
    },
  };
}
