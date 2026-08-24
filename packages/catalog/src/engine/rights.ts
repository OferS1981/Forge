import type { Model } from '../types';

/**
 * The Rights card: who owns this, can you sell it, are you indemnified and against what, what
 * has to be disclosed, and what your export entitlement is. Composed from the model's rights and
 * provenance blocks, in plain sentences, with the vendor's surprises kept loud.
 */

export interface RightsSummary {
  /** Who owns the output. */
  owner: string;
  /** Can you sell it. */
  sell: string;
  /** Are you indemnified, and against what. */
  indemnified: string;
  /** What has to be disclosed when you publish. */
  disclose: string;
  /** What your export entitlement is. */
  exportNote: string;
  /** True when any underlying block is unverified, so the card can wear the badge. */
  unverified: boolean;
}

const OWNER_WORDS: Record<Model['rights']['outputOwner'], string> = {
  user: 'You own the output.',
  vendor: 'The vendor owns the output.',
  'tier-dependent': 'Ownership depends on your tier.',
  unclear: 'Ownership is genuinely unclear from the public documents.',
};

export function rights(model: Model, tier?: string): RightsSummary {
  const r = model.rights;
  const p = model.provenance;

  const ownerParts = [OWNER_WORDS[r.outputOwner]];
  if (r.ownershipNote !== undefined) ownerParts.push(r.ownershipNote);
  if (tier !== undefined && r.outputOwner === 'tier-dependent')
    ownerParts.push(
      `You said you are on ${tier}: read the note above against that tier before selling.`,
    );

  const indemnified =
    r.indemnity === null
      ? 'No. There is no indemnity here; on several models you indemnify the vendor.'
      : `${r.indemnity.scope} Requires: ${r.indemnity.requires} Excludes: ${r.indemnity.excludes.join('; ')}.`;

  const discloseParts: string[] = [];
  if (p.invisible.length > 0)
    discloseParts.push(`In the file: ${p.invisible.join(', ')}${p.c2pa ? ', with C2PA' : ''}.`);
  else if (p.c2pa) discloseParts.push('C2PA credentials are attached.');
  if (p.removalProhibited) discloseParts.push('Removing the marks is contractually prohibited.');
  discloseParts.push(
    p.euArticle50Ready
      ? 'EU Article 50 is live: disclose synthetic media of real people; the machine-readable marking side is carried by the file.'
      : 'EU Article 50 is live and this vendor does not guarantee a persistent machine-readable mark, so if you publish into the EU, add your own disclosure: a caption or an end card is enough for creative work.',
  );

  return {
    owner: ownerParts.join(' '),
    sell: r.commercialUse,
    indemnified,
    disclose: discloseParts.join(' '),
    exportNote: r.exportEntitlement ?? 'No export gate is documented: what you make, you can take.',
    unverified: Boolean(r.unverified) || Boolean(p.unverified),
  };
}
