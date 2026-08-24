/**
 * The concept terms the policy manual creates, section 9.4: the vocabulary of moderation,
 * provenance and rights, in the same shape as the craft terms. What it is, what it changes,
 * when it matters, because a person who understands the word stops being afraid of it.
 */
export interface ConceptCopy {
  label: string;
  short: string;
  what: string;
  changes: string;
  when: string;
}

export const CONCEPT_COPY: Record<string, ConceptCopy> = {
  c2pa: {
    label: 'C2PA',
    short: 'A signed label inside the file saying where it came from.',
    what: 'Content Credentials: a cryptographically signed manifest embedded in an image, video or audio file recording what made it and what was done to it.',
    changes:
      'Whether a platform, a client or a court can verify provenance from the file itself rather than from your word.',
    when: 'When you publish or sell. Screenshots, edits and most social platforms strip it, so treat it as fragile and keep originals.',
  },
  synthid: {
    label: 'SynthID',
    short: "Google's invisible watermark, in every pixel or sample.",
    what: 'An imperceptible statistical watermark Google bakes into everything its models generate. It survives crops and compression better than metadata does.',
    changes:
      'Google outputs are detectably synthetic even after the visible sparkle is removed. It marks; it never blocks.',
    when: 'When someone claims a Google output is a photograph, or you need to prove yours is not.',
  },
  'right-of-publicity': {
    label: 'Right of publicity',
    short: "A person's legal control over their face, voice and identity.",
    what: 'The law that makes a recognisable face or voice actionable regardless of copyright: imitating a distinctive voice for a commercial lost in court as far back as Midler v. Ford, and evocation without name or face sufficed in White v. Samsung.',
    changes:
      'Why "sounds like [artist]" carries more exposure than any visual style prompt you can write.',
    when: 'Any real person, living and in some states long dead, in anything commercial. Consent is the only clean path.',
  },
  'trade-dress': {
    label: 'Trade dress',
    short: 'The protectable look-and-feel of a body of work.',
    what: "A trademark theory: a distinctive overall look that identifies its source. Andersen v. Stability let a trade-dress claim past dismissal on the theory that a tool let users capture artists' distinctive look and feel.",
    changes:
      'Naming an artist converts a copyright question, where style is generally free, into a trademark question, where it is not.',
    when: 'Every time a prompt names a living artist or a studio instead of describing attributes.',
  },
  indemnity: {
    label: 'Indemnity',
    short: 'The vendor pays your legal bill, within the exclusions.',
    what: 'A contractual promise to defend you against third-party claims over the output. OpenAI, Google, Adobe and Microsoft offer one on paid tiers; Midjourney, Stability and most others offer nothing, and often you indemnify them.',
    changes:
      'Who carries the risk when a client gets a letter. The exclusions are the substance: trademark is outside almost every indemnity.',
    when: 'When real money or a real client is involved. Free tiers are excluded everywhere.',
  },
  'safe-harbour': {
    label: 'Safe harbour',
    short: 'Protection you get by following the published procedure.',
    what: 'A legal shelter that applies when you meet stated conditions: platform takedown processes, the EU code of practice on marking, disclosure regimes. Following the procedure is what earns the protection.',
    changes:
      'Compliance stops being a mood and becomes a checklist: disclose, label, keep logs, answer takedowns.',
    when: 'When you publish at scale, or into the EU.',
  },
  'derivative-work': {
    label: 'Derivative work',
    short: 'A new work built recognisably on an existing one.',
    what: "Copyright covers not just copies but adaptations. Modifying an AI output makes your changes protectable; building on someone else's protected work without licence makes the result infringing.",
    changes:
      'Editing an output gives you a thin copyright in the edits. Recreating a recognisable composition gives its owner a claim.',
    when: 'Fan art, covers, "in the world of" work: the bright-line high-risk category.',
  },
  'substantial-similarity': {
    label: 'Substantial similarity',
    short: 'The copying test: would an ordinary observer recognise it.',
    what: "The standard courts use to decide whether one work copies another's protected expression. Style is not protected; a recognisable specific work or character is.",
    changes:
      'Why an attribute-described original is safe where a memorised composition is not, and why you check outputs, not just prompts.',
    when: 'Before selling anything that came out looking uncannily like something you know.',
  },
  'moral-rights': {
    label: 'Moral rights',
    short: "An author's rights of attribution and integrity, beyond ownership.",
    what: 'Rights that stay with a human author even after sale in much of the world: to be named, and to object to distortion. AI output has no author, so it carries none.',
    changes:
      'A pure prompt output has nobody who must be credited, and nobody who can object to your edits of it.',
    when: 'Commissioned work across borders: France and Germany enforce these where the US mostly does not.',
  },
  'article-50': {
    label: 'Article 50',
    short: "The EU's disclosure rule for synthetic media, live since August 2026.",
    what: 'The EU AI Act\'s transparency article: providers must mark outputs machine-readably, and deployers must disclose deepfakes and AI text on matters of public interest. Creative work discloses "in an appropriate manner that does not hamper the display or enjoyment".',
    changes:
      'A caption or an end card on synthetic people, not a watermark across the frame. Clearly fantastical content is exempt outright.',
    when: 'Publishing into the EU, from 2 August 2026; marking backfills to older systems by 2 December 2026.',
  },
  'false-endorsement': {
    label: 'False endorsement',
    short: 'Implying someone backs your work when they do not.',
    what: 'A Lanham Act theory: using a name in a way that could confuse consumers into thinking the named person endorses the product. It survived dismissal in Andersen because artist names were used as prompt vocabulary.',
    changes:
      'The name itself, not the image, is what creates this exposure. Attributes carry none of it.',
    when: 'Any commercial use where a prompt named a living person.',
  },
  parasitisme: {
    label: 'Parasitisme',
    short: "France's rule against free-riding on another's investment.",
    what: 'A French unfair-competition theory: commercially exploiting output that clearly imitates a recognisable style can be the unlawful appropriation of economic value someone else built, even where copyright says styles are free.',
    changes:
      'Even where style is unprotectable, recognisability plus commerce can still be actionable in France.',
    when: 'Selling style-imitative work into the French market.',
  },
  'severity-threshold': {
    label: 'Severity threshold',
    short: 'The dial that decides how alarming is too alarming.',
    what: 'A configurable filter level. Azure publishes the only full rubric: medical terms score Low, so they pass the default Medium threshold and fail the instant an administrator tightens it to Low.',
    changes:
      "Why a clinician's prompts suddenly fail after the IT team hardens a deployment: the prompt did not change, the threshold did.",
    when: 'Unexplained refusals on a corporate deployment: ask what the filter is set to before rewriting anything.',
  },
  'input-classifier': {
    label: 'Input classifier',
    short: 'The fast, shallow gate that reads your words, not your meaning.',
    what: 'A small model scoring the raw prompt before generation. It sees tokens, not context: this is where a rubber duck gets refused for the word "rubber".',
    changes:
      'Deterministic, instant, identical refusals. Adding context does nothing, because this layer never had any.',
    when: 'A short prompt refused the same way every run: bisect, find the word with a second meaning, replace it.',
  },
  'output-classifier': {
    label: 'Output classifier',
    short: 'The gate that judges the picture, not your prompt.',
    what: 'A model scoring the generated result, sometimes alongside your input. An innocent prompt can produce a blocked result because the model rendered something this layer disliked, and it never read your intent.',
    changes:
      'Inconsistent blocks on innocent prompts. The fix is the depiction: name the medium and register, or adjust the documented setting.',
    when: 'The prompt passes but the result comes back blocked, or the same prompt passes and fails across runs.',
  },
  'prompt-transformation': {
    label: 'Prompt transformation',
    short: 'A rewriter changes your prompt before the model ever sees it.',
    what: "On Azure image deployments an LLM rewrites every prompt and Microsoft states you cannot turn it off; Ideogram's Magic Prompt does the same unless disabled. The text being filtered is not the text you wrote.",
    changes:
      'The same prompt can pass and fail on consecutive runs, and your careful wording may never reach the model.',
    when: 'Erratic results on Azure or Ideogram: turn the rewriter off where the vendor allows it, and keep your engineered wording.',
  },
  'register-marker': {
    label: 'Register marker',
    short: 'One clause naming what kind of work this is.',
    what: '"A clinical reference figure", "an editorial photograph", "an educational illustration". The published severity rubric scores clinical, educational, journalistic and historical framing lower than the same content unframed.',
    changes:
      'The single highest-leverage edit for a legitimate prompt that keeps getting misread: it moves the score and sharpens the prompt at once.',
    when: 'Medical, historical, documentary, editorial or educational work, every time. The purpose field is where it lives here.',
  },
  'attribute-decomposition': {
    label: 'Attribute decomposition',
    short: 'Replacing a name with the qualities that made you type it.',
    what: "The manual's central technique: ask what is actually producing the feeling you want, medium, mark-making, palette, light, lens, composition, era, mood, or the nine audio equivalents, and write those instead of the person.",
    changes:
      'One dial you cannot turn becomes eight or nine you can, portable between models and outside both the copyright and trademark theories.',
    when: 'Whenever a name appears where a description belongs. The Compliance Pass offers the scaffold; this is what it is doing.',
  },
};
