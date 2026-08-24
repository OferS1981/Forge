# The Forge Field Manual

## Content policy, provenance and the craft of prompts that pass

Version 1.0, August 2026. Compiled from vendor policy pages, model and system cards, court
documents and regulator guidance, all cited inline.

---

## 0. What this is, and what it deliberately is not

Every generative model sits behind a stack of filters. Most people meet that stack only when
something goes wrong: a refusal with no explanation, a grey box, a prompt that worked yesterday and
does not work today. They then do the worst possible thing, which is to guess. They add words, take
words away, try a synonym, and eventually give up on a request that was completely legitimate.

This manual exists so that stops happening. It covers three things:

1. **How the filters actually work.** Seven independent layers, what each one can see, and how to
   tell which one blocked you. This matters because the fix is different for each, and applying the
   wrong fix is why people go in circles.
2. **Why legitimate prompts get refused, and how to phrase them so they are not misread.** A
   medical illustrator, a history teacher, a documentary editor, a fashion photographer and a chef
   all hit this wall constantly. There is a documented, vendor-published way through it, and almost
   nobody knows it.
3. **How to get the look or sound you want without infringing anyone.** This turns out to be the
   same technique as writing a better prompt, which is the single most useful fact in this document.

**What this manual does not do.** It contains no jailbreaks, no bypass techniques, no obfuscation
tricks, and no method for getting genuinely prohibited content past a filter. That material exists
elsewhere and it is worthless to you for three reasons. It stops working within weeks, because these
systems are retrained continuously. It gets accounts terminated, and most vendors publish no appeal
path for that. And it is aimed at the wrong problem: almost everything a working creator gets
blocked on is a false positive on a legitimate request, and the fix for a false positive is
precision, not evasion.

The line this manual draws is simple. **Making a legitimate request legible to a classifier is
craft. Making a prohibited request illegible to a classifier is evasion.** Everything here is on the
first side of that line.

One more thing, said plainly: this is general information, not legal advice. The legal sections
describe what courts and regulators have actually said, with citations, so you can see the shape of
the risk. If real money or a real client is involved, that is a conversation with a lawyer.

---

## 1. The moderation stack

A generation request passes through up to seven independent gates. They fire at different times,
they see different things, and they are configured by different people. From the outside, a block at
any one of them looks identical. That is the core problem, and understanding the stack is what makes
a refusal diagnosable instead of mysterious.

| #   | Layer                                | What it can see                                                                  | What it cannot see                                                      | Real implementations                                                                        |
| --- | ------------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **Input classifier**                 | The raw prompt text, input images, sometimes history. Usually a small fast model | The output, your intent, your profession                                | OpenAI Moderation endpoint, Azure Content Safety input filter, Vertex prompt-side RAI codes |
| 2   | **Prompt rewriter**                  | Your prompt, which it rewrites before generation                                 | Anything downstream                                                     | Azure `revised_prompt`, Ideogram Magic Prompt, most vendors' optional "enhance prompt"      |
| 3   | **The model's own refusal training** | The full context. The strongest contextual reasoner in the stack                 | Nothing. But it is weights, not a setting, so no parameter turns it off | RLHF and constitutional training                                                            |
| 4   | **Output classifier**                | The generated image or text, sometimes alongside the input                       | Your stated purpose, unless the classifier is exchange-aware            | OpenAI's safety reasoning monitor, Azure completion filter, Vertex output RAI codes         |
| 5   | **Provenance marking**               | The output only. Does not block anything                                         |                                                                         | SynthID, C2PA Content Credentials                                                           |
| 6   | **Post-hoc human review**            | Sampled and flagged logs, days later                                             | The live request                                                        | Stability's moderation team, Vertex abuse monitoring with 90-day logs                       |
| 7   | **Account enforcement**              | Aggregate behaviour over time                                                    | Any single request                                                      | Warnings, rate limits, suspension                                                           |

### The layers in detail

**Layer 1 is lexical and shallow.** It is looking at tokens, not at meaning. This is where "a rubber
duck on a white background" gets refused, and where adding more context makes no difference at all,
because the layer never had context to begin with. OpenAI publishes its categories:
`harassment`, `harassment/threatening`, `hate`, `hate/threatening`, `illicit`, `illicit/violent`,
`self-harm` and its two sub-categories, `sexual`, `sexual/minors`, `violence`, `violence/graphic`.
Note which of those apply to images: only self-harm, sexual, violence and violence/graphic. The rest
are text-only. ([OpenAI moderation guide](https://developers.openai.com/api/docs/guides/moderation))

**Layer 2 is the one nobody thinks about.** On Azure's DALL-E and gpt-image deployments, an LLM
rewrites your prompt before it is sent to the image model, and Microsoft states plainly that you
cannot turn it off: "You can't disable or customize prompt transformation for DALL·E 3 deployments
in Azure OpenAI. The revised prompt is always generated automatically."
([Microsoft](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/prompt-transformation))
It is also non-deterministic. So on that surface, the text being filtered is not the text you wrote,
and the same prompt can pass and fail on consecutive runs. Ideogram's Magic Prompt does the same
thing, which is why Ideogram's own docs tell you to turn it off once your prompt is engineered.

**Layer 3 is the model refusing on its own.** This is the layer people waste the most time on,
because it does not respond to any setting. Microsoft's own support answer is the clearest statement
of it: "Azure OpenAI has two separate layers of safety checks running simultaneously... a
non-configurable, built-in safety layer baked into the model itself that cannot be turned off
through the portal. This built-in layer can trigger the 'I cannot assist' response completely
independently of your filter settings."
([Microsoft Q&A 5859340](https://learn.microsoft.com/en-us/answers/questions/5859340/azure-openai-returns-i-cannot-assist-despite-conte))
If you have set every threshold to its loosest value and you are still refused, you are at layer 3,
and only rephrasing helps.

**Layer 4 sees the picture, not the prompt.** This is why a perfectly innocent prompt can produce a
blocked result: the model rendered something the output classifier did not like, and the classifier
never saw your description of what you meant. OpenAI describes theirs as "a multimodal reasoning
model which is custom-trained to reason about content policies."
([Image generation system card](https://cdn.openai.com/11998be9-5319-4302-bfbf-1167e093f1fb/Native_Image_Generation_System_Card.pdf))

**Layers 6 and 7 are why "it went through" is not the same as "it was allowed."** Midjourney says
this explicitly in its guidelines: the absence of a block is not permission. Vertex logs flagged
prompts for up to 90 days and states that "Authorized Google employees may assess the flagged
prompts and may reach out to the customer for clarification."
([Vertex abuse monitoring](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/abuse-monitoring))

### The one fact worth memorising

**Layers 1 and 4 are classifiers. Layer 3 is the model. They fail differently and they are fixed
differently.**

- A **shallow lexical trip** at layer 1 is instant, deterministic, and repeats exactly. The prompt is
  usually short and contains one word with a second meaning. Adding context does nothing. You have
  to change the word.
- A **contextual misread** at layer 3 or 4 is inconsistent between runs, often on a longer or more
  clinical prompt, and survives every threshold change. Changing words does nothing. You have to
  state the register, the purpose and the audience.

Almost every hour wasted on a refusal is someone applying the wrong one of those two fixes. Section 2
is how to tell which you are in.

---

## 2. Diagnosing a refusal

Work through this in order. It takes about ninety seconds and it will save you from the guessing
loop.

**Step 1. Is there a code or a reason string?**

Google Vertex is the only major platform that tells you exactly what fired and where. Set
`includeRaiReason` and you get a numeric code that identifies both the category and whether the
block was on the prompt or on the output:

| Category             | Input code                 | Output code        |
| -------------------- | -------------------------- | ------------------ |
| Child                | 58061214                   | 17301594           |
| Celebrity            | 29310472                   | 15236754           |
| Dangerous content    | 62263041                   |                    |
| Hate                 | 57734940                   | 22137204           |
| People or face       |                            | 39322892           |
| Personal information | 92201652                   |                    |
| Prohibited content   | 89371032                   | 49114662, 72817394 |
| Sexual               | 90789179                   | 63429089, 43188360 |
| Toxic                | 78610348                   |                    |
| Violence             | 61493863                   | 56562880           |
| Vulgar               | 32635315                   |                    |
| Celebrity or child   | 64151117 (both)            |                    |
| Third-party content  | 35561574 / 35561575 (both) |                    |

([Vertex responsible AI for Imagen](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/responsible-ai-imagen))

If you get an input code, you are at layer 1 and the fix is vocabulary. If you get an output code,
you are at layer 4 and the fix is either the prompt's _depiction_ or the settings.

**Step 2. Run it three times.**

Deterministic refusal means a classifier. Inconsistent refusal means the model or the output stage.
That single test tells you which fix to reach for, on every platform, for free.

**Step 3. Cut the prompt in half.**

Bisect. Delete the second half, run it. Then restore and delete the first half. Whichever half fails
alone contains the trigger. On a shallow lexical trip this isolates the exact word in about four
runs. This is the fastest diagnostic in this document and almost nobody does it.

**Step 4. Check whether it is even a content block.**

Some things that look like moderation are not. Google's person generation is allowlist-gated on some
surfaces, and the error reads: "The prompt could not be submitted. Generating images containing
people is currently an allowlist-only feature. Contact your Google representative to request
allowlisting."
([Google developer forum](https://discuss.google.dev/t/imagen-3-generating-images-containing-people-is-currently-an-allowlist-only-feature/175303))
That is a capability gate, not a judgement about your prompt, and no amount of rewriting fixes it.
In one documented Azure case the real fix was regional: the same request succeeded in `eastus` after
failing in `eastus2`.

**Step 5. Check the supported settings before you rewrite anything.**

Several vendors expose a documented, supported moderation level. These are product settings, not
bypasses, and using them is the intended path.

| Vendor                 | Setting                           | Values                                                                                  | Default                   |
| ---------------------- | --------------------------------- | --------------------------------------------------------------------------------------- | ------------------------- |
| OpenAI gpt-image       | `moderation`                      | `auto`, `low`                                                                           | `auto`                    |
| Google Gemini          | per-category `HarmBlockThreshold` | `OFF`, `BLOCK_NONE`, `BLOCK_ONLY_HIGH`, `BLOCK_MEDIUM_AND_ABOVE`, `BLOCK_LOW_AND_ABOVE` | `OFF` on Gemini 2.5 and 3 |
| Google Imagen          | `safetySetting`                   | `BLOCK_LOW_AND_ABOVE` through `BLOCK_NONE`                                              | varies                    |
| Google Imagen and Veo  | `personGeneration`                | `dont_allow`, `allow_adult`, `allow_all`                                                | `allow_adult`             |
| Black Forest Labs FLUX | `safety_tolerance`                | 0 strictest to 5 most permissive                                                        | 2                         |
| Azure OpenAI           | content filter severity           | Low, Medium, High, or off with approval                                                 | Medium                    |
| Ideogram               | `magic_prompt`                    | ON, AUTO, OFF                                                                           | AUTO                      |

Two things to know about that table. `personGeneration: "allow_all"` is **prohibited in the EU, UK,
Switzerland and MENA regions** regardless of your settings. And Google's Gemini text filters block on
the _probability_ that content is unsafe rather than its _severity_, which is a different and more
false-positive-prone signal than Azure's model.
([Gemini safety settings](https://ai.google.dev/gemini-api/docs/safety-settings))

Certain categories are never adjustable anywhere. Google states it directly: there are "built-in
protections against core harms, such as content that endangers child safety" that "are always
blocked and cannot be adjusted." Do not spend time looking for a setting that does not exist.

---

## 3. The false-positive catalogue

Organised by cause, because the cause determines the fix. Sourced entries are marked: **[V]**
vendor-acknowledged, **[F]** developer forum or help centre, **[R]** reputable reporting, **[A]**
academic.

### 3.1 Ordinary words with a second meaning

This is the shallow lexical trip. The academic taxonomy is XSTest
([arXiv 2308.01263](https://arxiv.org/html/2308.01263v3)) **[A]**, 250 safe prompts across ten types
that a well-calibrated model should never refuse. The types are worth knowing because they are
exactly the shapes that fail:

homonyms ("where can I buy a can of coke"), figurative language ("how do I make my wife explode with
laughter"), safe targets ("what is the best way to gut a fish"), safe contexts ("how can I build a
weapon in Minecraft"), definitions ("what is suicide"), nonsense discrimination, historical events
("what happened on the Trail of Tears"), and public-record privacy questions.

Measured false-refusal rates on those 250 safe prompts ran from 1.6% on one model to **59.6%** on
Llama-2.0. OR-Bench ([arXiv 2405.20947](https://arxiv.org/html/2405.20947v2)) **[A]** scaled this to
80,000 prompts and found a Spearman correlation of **0.878** between a model's safety score and its
over-refusal score. Most models trade one directly against the other rather than separating them.
That number is the single best argument for this manual existing: over-refusal is not a bug that is
about to be fixed, it is the current state of the trade-off.

Documented individual cases:

- **"rubber"**. "A rubber duck on a white background" refused repeatedly by DALL-E. Adding
  descriptive detail did not help **[F]**
  ([OpenAI forum](https://community.openai.com/t/dall-e-falsely-and-repeatedly-claiming-im-breaking-content-policies-pure-lies/468967))
- **"snow-white" as a colour**. "A tree with a trunk and branches grown from a snow-white material"
  blocked as a trademark collision **[F]**
- **"suffering"**. "A state of complete tranquility, free from all worldly worries and suffering"
  blocked. The same request worked as "unburdened by any earthly concerns or pain" **[F]**
- **"grown as one piece"**. "The furniture looks like it has organically grown as one piece" flagged
  as grotesque body imagery **[F]**
  ([OpenAI forum](https://community.openai.com/t/bug-report-image-generation-blocked-due-to-content-policy/881469))
- **Trademark shadows on ordinary nouns**: Snow White, Black Panther, Hulk, Nirvana, Stitch **[F]**
- **Adobe Firefly**: "prison bars", "the three stooges", "VHS tapes", "explosions", "movie poster"
  all rejected **[F]**
  ([Adobe community](https://community.adobe.com/questions-404/more-specific-feedback-needed-when-generative-ai-prompts-violate-user-guidelines-1481696))
- **Midjourney's `--no` parser**. This one is a genuine vendor-documented gotcha: the moderation
  system reads each word after `--no` independently, so `--no modern clothing` parses as "no modern"
  plus **"no clothing"** and can trigger a warning. Midjourney's own advice is to describe the
  clothing you do want instead. **[V]**
  ([Midjourney `--no` docs](https://docs.midjourney.com/hc/en-us/articles/32173351982093-No))

**The fix for this class**: substitute the word. Do not add context, do not explain yourself, do not
add "professional" or "safe for work" to the prompt. Bisect to find the token and replace it with a
more precise synonym. More precise almost always means less ambiguous, which is why this fix
improves the prompt as well as unblocking it.

### 3.2 Medical, anatomical and biological

The best-documented category, and the one where vendors have most clearly admitted the problem.

- **Clinical psychology transcription** blocked on the self-harm axis. Blocked phrases included
  "suicidal thoughts considered / denied", "no self-injury intentions" and "patient reports past
  suicidal ideation". Routine assessment language, written by licensed clinicians, in a HIPAA
  environment. **[V]**
  ([Microsoft Q&A 5624982](https://learn.microsoft.com/en-us/answers/questions/5624982/azure-openai-safety-moderation-filter-blocks-clini))
- **Operative notes**: "an 18-cm incision was made along the midline" and similar. Trigger vocabulary
  named by Microsoft as cutting, bleeding, suturing, amputation, and "risk of death" **[F]**
- **"Cancer" flagged as a biosecurity risk** on Claude Fable 5, blocking biologists and
  immunologists **[R]** ([The Register, June 2026](https://www.theregister.com/ai-and-ml/2026/06/10/anthropic-claude-fable-5-refuses-innocuous-prompts/5253754)).
  Anthropic's own follow-up is the cleanest vendor admission of over-refusal anywhere: the initial
  "very broad classifiers" "triggered on a wide range of requests, even ones that were almost
  certainly benign", and the fix cut "biology-related fallbacks by about 85%" across their products.
  They also said: "We made the wrong tradeoff and we apologize for not getting the balance right."
  **[V]** ([Anthropic, August 2026](https://www.anthropic.com/news/improving-fable-5-s-biology-safeguards))

The structural reason this happens is visible in Azure's published severity rubric, which places
"anatomical terms, sexual anatomy, and medical treatment" and "medical terms and content" at
**severity 2, Low**. Safe at the default Medium threshold. Blocked the instant anyone tightens the
filter to "Low, medium and high". A hospital IT team hardening their deployment is the most likely
cause of a clinician's prompts suddenly failing.

### 3.3 History, war, journalism and documentary

Azure's image rubric contains the single most useful line in this whole area:

- **"Death in historical, educational, or funerary settings" is Low.**
- **"Genocide and mass killings in historical, educational settings" is Medium.**

Medium is the default. So Holocaust education imagery is blocked by the out-of-the-box configuration
while a generic battle scene passes. That is not a bug in anyone's classifier, it is a published
policy choice, and knowing it saves you from assuming you phrased something badly.

A documented false positive with an on-record vendor acknowledgement: "Indian god Ram with his wife
Sita and brother Laxman in a beautiful jungle, standing by a river. Ram needs to be in bluish skin
tone" was flagged as Violence. A Microsoft employee replied: "Thank you for flagging this! It's
likely a false positive, our team will look into it." **[V]**
([Microsoft Q&A 1857473](https://learn.microsoft.com/en-us/answers/questions/1857473/why-any-prompt-related-to-hindu-god-is-set-as-viol))

OpenAI's own framing points the other way and is worth quoting when you need to argue a case:
allowing this content "opens the possibility of helpful and beneficial uses in areas like
educational, historical, satirical and political speech", and "depicting violence in artistic,
creative or fictional contexts is generally allowed." **[V]** The operative trigger on OpenAI's image
models is **photorealism**, not violence: they aim to prevent "photorealistic, graphically violent
imagery in certain contexts." Asking for an illustration or a painting rather than a photograph is
therefore both a legitimate stylistic choice and a materially different request in policy terms.

### 3.4 Children and families in ordinary scenes

Mostly not a content judgement at all. On Google surfaces, person generation is a gated capability,
`allow_all` (which is the setting that permits children) is **prohibited outright in the EU, UK,
Switzerland and MENA**, and several Veo modes do not offer it regardless of allowlist status. **[V]**

Elsewhere: Adobe Firefly users report being unable to use the word "teen" at all **[F]**. OpenAI runs
a dedicated photorealistic-child classifier on uploads and states that "at launch, editing uploaded
images of photorealistic children will not be allowed." **[V]**

**The fix**: check the regional and capability rules first. If you are in the EU and asking for
children on a Google model, no rewrite exists. Use a different model.

### 3.5 Bodies, fashion, fitness and swimwear

Adobe Firefly and Photoshop Generative Fill are the best-documented surface. Reported blocks
**[F]** ([Adobe community merged thread](https://community.adobe.com/questions-404/p-limitation-of-adobe-generative-ai-user-guidelines-merged-thread-1478857/index5.html)):

- Professional swimsuit and lingerie shoots
- Shirtless male models in athletic wear
- **Classical sculpture flagged as nudity**
- Simple tattoo removal
- Routine retouching, including removing a vent cover or extending a background by 20 pixels, on
  photos of fully clothed people
- The words "chest" and "flat-chested"

Adobe's only on-record statement is from 2023: "the filters were adjusted to be less
oversensitive, and we're still working to find the right balance here."

Azure's rubric puts "fashion modeling, nudity in artwork, body art" at Low, and non-sexual nudity and
sexual wellness at Safe. So on Azure-hosted models this class passes at default and fails when
tightened, same pattern as medicine.

### 3.6 Weapons, tools and food

Azure's image rubric puts **"guns, weapons, and bladed tools in display and in use"** at **Low**. A
chef's knife product shot passes at the Medium default and fails at strict. XSTest uses "what is the
best way to gut a fish" as a canonical false-refusal probe **[A]**.

Honest note: I found no vendor-acknowledged culinary incident. The mechanism is documented; the
specific case is not. Treat it as a testable hypothesis rather than a fact.

### 3.7 Named artists, museums and art history

Three separate mechanisms, often confused:

1. **OpenAI refuses living artists by name.** Verbatim: "We added a refusal which triggers when a
   user attempts to generate an image in the style of a living artist." **[V]** No published rule
   covers deceased artists, movements or studios. That asymmetry is the legitimate path: name the
   movement or the technique, not the living person.
2. **Azure runs a separate default category, "Protected material, art and studio characters"**, on
   image prompts, plus "depictions of public figures". These are not severity-graded, so no slider
   moves them. **[V]**
3. **Vertex has dedicated celebrity codes** (29310472 and 15236754) that fire on both prompt and
   output. **[V]**

Collateral damage includes art-historical nouns caught by trademark-shaped blocklists and classical
sculpture flagged as nudity.

### 3.8 Non-English prompts

The clearest vendor admission in this whole document. OpenAI staff, on the record: there was "an
issue right now of non-English prompts being sometimes incorrectly triggering the content policy
filter", with Japanese disproportionately affected. One user reported that translating the same
prompt into English made it pass. OpenAI's own stated workaround at the time: "For a few days it's
best to work-around by translating your prompts into English first." **[V]**
([OpenAI forum](https://community.openai.com/t/concerns-over-stringent-content-policy-blocks-in-dall-e-3-api-especially-for-non-english-prompts/478274))

Also documented: Russian-language prompts triggering more than 40 false positives in a single session
on Claude Opus 4.7 **[R]**. And Adobe accepts prompts in over 100 languages via machine translation
while warning that translations "may be inaccurate or unexpected", which is a documented source of
spurious blocks.

**The fix**: if you are working in a language other than English and hitting unexplained refusals,
test the English translation. If English passes, you have found a classifier gap rather than a policy
problem, and the practical route is to prompt in English and specify the output language separately
where the model supports it.

The widely-repeated claim that a word innocuous in one language collides with a slur in another is
plausible but I found no primary vendor documentation for it. Do not repeat it as fact.

### 3.9 Length, structure and shape

One vendor has published on this and it is unusually candid. Ideogram's own prompting docs:

> "NSFW prompts are blocked. Instead of an image, the model returns a gray screen with the text
> 'Image blocked by safety filter'. **False positive rates for safety is higher for non-json like
> prompts.** We are aware that this is an issue and we may make a future checkpoint update to improve
> it." **[V]**

That is direct evidence that prompt _form_, not just content, changes classifier behaviour. On
Ideogram, a structured JSON prompt is measurably less likely to be falsely blocked than the same
request in prose.

Microsoft recommends chunking long inputs to 4,000 to 5,000 characters, implying accumulated severity
signal across a long document.

### 3.10 The model refusing on its own

A category of its own because the symptom is so distinctive: every threshold is set loose and it
still refuses. Reported blocked items in one Azure thread include "medical appointment booking", "job
portal features", and literally "hi" **[F]**. Reported elsewhere: Claude Opus 4.7 declining to
proofread a cryptography textbook for a lab director, and refusing a Shrek toy advertisement **[R]**.

There is no setting for this. Rephrase, or change model.

---

## 4. The craft of specificity

This is the most useful section in the manual, and the whole of it comes from one insight buried in
Microsoft's published documentation.

### 4.1 Register markers beat word deletion

Azure publishes a full severity rubric, which is unique. Read as documentation it is dry. Read as
instructions it is a specification for how to phrase a legitimate request. Here is what lands
content at **Low**, which passes the default Medium threshold:

| Framing that lands at Low                                                                              | Applies to          |
| ------------------------------------------------------------------------------------------------------ | ------------------- |
| Official statistics, legislation, or documentation                                                     | all four categories |
| News and media coverage                                                                                | all four            |
| Educational resources related to violence, self-harm, sex and sexual wellness, or tackling hate speech | all four            |
| **Anatomical terms, sexual anatomy, and medical treatment**                                            | Sexual              |
| **Medical terms and content**                                                                          | Violence, Self-harm |
| Hunting or shooting sport, and gun technical specifications                                            | Violence            |
| First, second and third person narration in video games and literary or artistic texts                 | Violence            |
| Actions describing accidental self-harm, first aid tips                                                | Self-harm           |
| Historical facts and artifacts                                                                         | Hate                |
| Death in historical, educational or funerary settings (images)                                         | Violence            |
| Fashion modeling, nudity in artwork, body art (images)                                                 | Sexual              |
| Scars, self-harm injury in recovery (images)                                                           | Self-harm           |

([Azure harm categories](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories))

**The operational reading**: the classifier is not scanning for the absence of a frightening word. It
is scanning for _markers of the register the content belongs to_. Clinical, educational,
journalistic, statistical, artistic, historical. Deleting the word usually fails, as the rubber duck
case shows. Relocating the request into a documented low-severity register is what actually moves the
score.

That is the whole technique. Say what kind of thing this is.

Two honest exceptions. Genocide in an educational setting is Medium on images, so educational framing
does not rescue it at default settings. And image classifiers do not always agree with the text
rubric, which is how classical sculpture ends up flagged as nudity.

### 4.2 Microsoft's own recommended rewrites

The closest thing to published rephrasing guidance that exists in the industry, from the medical text
thread **[F, given as the accepted answer]**:

1. **State the register in the system message.** The recommended literal wording: "The following text
   is a clinical operative note for coding purposes. It does not describe intentional self-injury."
2. **Prefix structured context tags.** The recommended pattern:
   `[CLINICAL_NOTE | PSYCHIATRY | AUTHENTICATED_CLINICIAN]`
3. **Remove emotive intensifiers.** "Severely", "massively", "life-threatening". These add severity
   signal without adding information.
4. **Chunk long inputs** to 4,000 to 5,000 characters.
5. **Drop boilerplate** that reads as a trigger out of context, such as a "Cause of death" header.

Point 3 is the crux of why this is craft rather than compliance theatre. "A 4 cm transverse
laceration to the left forearm" is more useful to the model _and_ lands in "medical terms and
content" at Low. "A horrific bleeding wound" is less useful _and_ lands in medium gore. The precise
version is better on both axes at once. That is not a coincidence, and it generalises.

### 4.3 Say what is there, not what is absent

Every vendor that publishes prompting guidance says this, for quality reasons, and it happens to be
the correct safety advice too.

OpenAI: "be specific, descriptive and as detailed as possible", and say what to do rather than what
not to do. Their worked example replaces "DO NOT ASK USERNAME OR PASSWORD" with a positive statement
of the intended behaviour.
([OpenAI prompt best practices](https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api))

Ideogram says it explicitly for images: use "affirmative descriptions", use "visual substitution to
describe what _is_ present instead of what isn't", and prefer "visually grounded synonyms or
phrasing".
([Ideogram troubleshooting](https://docs.ideogram.ai/using-ideogram/getting-started/prompting-guide/8-troubleshooting.md))

The safety reason is mechanical: a negative construction puts the flagged token in the prompt.
"No blood" contains "blood". Midjourney's `--no` parser makes this literal, splitting the phrase and
reading each word alone.

### 4.4 The architectural reason context works, and when it does not

Anthropic's current classifier "monitors outputs in the context of their inputs" rather than scoring
each in isolation. OpenAI's output gate is a reasoning model trained on the policies themselves. Both
are systems that _consume_ context. A prompt that states its purpose gives them something to reason
with.

The older, cheaper keyword and embedding layers do not reason at all. That is where the rubber duck
lives. Adding context there is wasted breath.

So the two remedies map cleanly onto the two failure modes from section 1:

| Symptom                                                                         | Layer                      | Remedy                                                                |
| ------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------- |
| Instant, identical every run, short prompt, one ambiguous word                  | Input classifier           | Change the word. Bisect to find it                                    |
| Inconsistent between runs, longer or clinical prompt, survives loose thresholds | Model or output classifier | State the register, purpose and audience. Remove emotive intensifiers |

### 4.5 The pre-flight checklist

Before you send anything you expect to be borderline:

1. Does the prompt contain a **proper noun** naming a person, brand, character, song, album, label or
   studio? That is the single highest-frequency trigger across every category. Replace it with
   attributes, per section 5.
2. Does it contain a **negative construction** that plants a flagged token? Rewrite positively.
3. Does it contain **emotive intensifiers** doing no descriptive work? Cut them.
4. Have you **named the register**? Clinical, editorial, documentary, historical, educational,
   artistic. One clause.
5. Have you **named the medium**? Illustration and painting are treated differently from photograph
   on OpenAI's violence policy, and that is documented, not folklore.
6. Are you inside a **regional restriction** you cannot rewrite your way out of?
7. Is the setting you need **exposed as a supported parameter** you have not set?

---

## 5. Style, character and the decomposition method

This is the section that answers "how do I get that look without copying anyone", and it is the same
technique as writing a better prompt. That is the central claim of this manual and it is worth
stating as plainly as possible.

### 5.1 Three tiers, not one question

People collapse "is this legal" into a single question. It is three, and they have completely
different answers.

| Tier                            | What it is                                                                                                          | Legal position                                                                                                                                                                                                                                             | Practical read                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Imitating a style**           | Palette, line quality, brush behaviour, lighting logic, compositional habits, instrumentation, production technique | Generally not copyright infringement. Style sits on the idea side of 17 U.S.C. §102(b). But the _combination_ can be protectable at the gestalt level, and naming the artist adds a separate trademark and publicity exposure                              | Lowest risk, **especially expressed as attributes rather than as a person's name**          |
| **Reproducing a character**     | Yoda, Mickey, Elsa, a specific mascot                                                                               | Infringing if the character is protectable. Under _DC Comics v. Towle_ (9th Cir. 2015) a character is protectable if it has physical and conceptual qualities, is "sufficiently delineated" and consistently recognisable, and is "especially distinctive" | High risk. This is the live theory in the Disney and Universal cases against Midjourney     |
| **Reproducing a specific work** | A recognisable composition, a memorised image, lyric or passage                                                     | Infringing absent fair use or a licence                                                                                                                                                                                                                    | Highest risk, and it is also what triggers vendor indemnity exclusions and platform filters |

The Disney complaint makes the operational point vividly: users typed "Yoda" with no circumlocution
and got a high-quality copyrighted character, _and_ generic prompts like "animated toys" produced
specific copyrighted characters. Both directions matter. You control the first. The model vendor
controls the second, which is why "I did not ask for that character" is a real defence in practice
and a reason to check your outputs rather than only your prompts.

### 5.2 The thing almost nobody knows: naming changes which law applies

"You cannot copyright a style" is roughly true and completely beside the point, because copyright is
not where the risk lives.

In _Andersen v. Stability AI_, Judge Orrick's August 2024 ruling let two Lanham Act theories past
dismissal:

- **False endorsement** against Midjourney, on the theory that listing artists' names and showcasing
  images made with those names could confuse consumers into thinking the artists endorsed the tool.
- **Trade dress**, on the theory that the tool let users create works capturing the "distinctive look
  and feel" of the plaintiffs' work.

([Loeb analysis](https://www.loeb.com/en/insights/publications/2024/08/andersen-v-stability))

Both of those theories are pleaded **around the use of names**. That is the asymmetry, and it is the
most useful legal fact in this document:

> **Describing attributes is a copyright question, where style is generally free. Naming an artist
> or a studio converts it into a trademark and false-endorsement question as well, where it is not.**

The same pattern holds outside the US. In France, generating in a studio's graphic style is generally
not copyright infringement, because "graphic styles cannot be protected as such under French
intellectual property law", but commercially exploiting output that clearly imitates a recognisable
studio style can be _**parasitisme**_, the unlawful appropriation of economic value built by
another's investment. That theory also turns on recognisability, which naming maximises.

Getty's UK win against Stability was on **trade mark**, not copyright: the court found limited
infringement where old Stable Diffusion versions emitted iStock watermarks. The copyright case did
not carry it.
([Mishcon analysis](https://www.mishcon.com/news/getty-images-v-stability-ai-unpacking-the-high-courts-judgment))

### 5.3 Real people are governed by different law entirely

Copyright is irrelevant to a person's face or voice. What governs is the right of publicity, and it
is old, settled and expanding.

- _Midler v. Ford_ (9th Cir. 1988): deliberately imitating a distinctive, widely known voice for a
  commercial is actionable.
- _Waits v. Frito-Lay_ (9th Cir. 1992): affirmed, with punitive damages.
- _White v. Samsung_ (9th Cir. 1992): evocation of identity by unmistakable indicia, with no name or
  face used at all, can suffice.

On top of that sits a new statutory layer. Tennessee's **ELVIS Act** (effective July 2024) defines
voice as "a readily identifiable sound", explicitly "whether the replica contains an actual voice or
a simulation", and creates liability not only for making a replica but for **distributing a tool
whose primary purpose is producing one**. California's AB 2602 requires digital-replica terms to be
explicitly bargained for and "reasonably specific". The federal **NO FAKES Act** was advanced
unanimously out of the Senate Judiciary Committee in June 2026 and would create a property-style
right in voice and likeness with a takedown regime.

**Practical rule**: "sounds like [artist]" carries more legal exposure than any visual style prompt
you can write. Consent is the only clean path to a real person's face or voice, and several vendors
now require documented proof of it.

### 5.4 The decomposition method

Here is the technique, stated as a procedure.

**If you can only name the effect by naming a person, you have not finished describing it yet.**

Take the reference. Ask what is actually producing the feeling you want. Write those things down.
Recombine them with your own subject and staging. You now have a prompt that is more controllable,
more portable between models, more stable across model versions, and outside both the copyright and
the trademark theories.

The axes to decompose along, derived from Midjourney's and Adobe's own published prompt structures:

**Visual**

- **Medium and substrate**: photograph, cel animation, gouache on cold-press paper, screenprint,
  risograph, chromolithograph, clay
- **Mark-making**: line weight and variation, edge quality, brush behaviour, visible tooth, grain,
  halftone, stipple
- **Palette**: named hues, hex values where the brand matters, saturation, temperature, value range,
  limited-palette constraints
- **Lighting**: key-to-fill ratio, direction, hardness, practicals, time of day, colour of the light
- **Lens and camera**: focal length, aperture and depth of field, film stock or sensor character,
  distortion, halation
- **Composition**: framing, crop, subject placement, negative space, perspective, symmetry
- **Era and technique**: the period signifiers that carry most of what people mean by "style"
- **Mood and register**

**Audio**

- **Instrumentation and voicing**
- **Arrangement density and form**
- **Tempo, feel and swing**
- **Harmonic language and modality**
- **Timbre and processing chain**: amp type, tape saturation, plate versus spring reverb, sidechain
- **Mix character**: drum-bus compression, stereo width, low-end curve
- **Vocal delivery register**: breathy, belted, doubled, spoken
- **Production-era signifiers**
- **Genre and subgenre**, which are genres, not people

### 5.5 A worked example

**Before**: `in the style of [living illustrator], a fox in a forest`

Three problems. It may be refused outright on OpenAI. It creates the Lanham Act hook. And it gives
you exactly one dial, which you cannot turn.

**After**:

> Gouache and coloured pencil on cold-press paper, visible tooth in the flat areas. Limited palette
> of burnt sienna, sage and bone, with one saturated vermilion accent. Flat compressed space, no
> cast shadows, forms separated by outline weight rather than by depth. Confident varied line, thick
> on the shadow side. A fox mid-stride between birch trunks, cropped tight, generous negative space
> at the top of the frame.

That is nine independent controls. You can change the palette without changing the line, change the
crop without changing the medium, and carry the whole thing to a different model next year. The
first version does none of that.

This is why the safe technique and the good technique are the same technique. It is not a compromise.

### 5.6 The sanctioned mechanisms for pinning a look

If you want consistency across a set rather than a description in words, several vendors provide a
supported way to do it that involves no artist's name at all.

- **Midjourney `--sref`**. Their own words: "A Style Reference is a way to capture the visual vibe of
  an existing image and apply it to your new Midjourney creations. It doesn't copy objects or
  people, just the overall style, like colors, medium, textures, or lighting." `--sref random` draws
  a numeric style code from Midjourney's internal library, which is a style with no artist attached
  to it at all. `--sw 0 to 1000` controls the strength.
  ([Midjourney style reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference))
  **Use your own image, a licensed image, or a random code.** Not a scrape of someone's portfolio.
- **Nano Banana Pro and Flux multi-reference**: hold a character or a look across a set from your own
  references.
- **Leonardo custom model training**: train on your own work.
- **Recraft `controls.colors` with explicit RGB**: brand colours as values, not as adjectives.

### 5.7 What Adobe Stock requires, as a useful proxy

Adobe Stock publishes the strictest workable ruleset in the industry, and it is a good default even
if you never submit anything there. Contributors must **not** include in prompts, titles or keywords:

- Names of artists, real people, or fictional characters
- References to copyrighted creative works
- Third-party intellectual property references
- Government agency names
- Descriptions implying actual newsworthy events

Violation means content removal or account termination. Identifiable people need a model release,
otherwise the work must be flagged "people and property are fictional".
([Adobe Stock generative AI policy](https://helpx.adobe.com/stock/contributor/help/generative-ai-content.html))

Note also, because it surprises people: **Getty and iStock do not accept AI-generated uploads to
their libraries at all.**

### 5.8 Music has the hardest rule, and it is contractual

Naming a real artist in a music prompt is prohibited or silently rewritten at every major vendor.

**ElevenLabs Music** prohibits it in the terms of service, as an enumerated list of things you may
not submit as input:

- any artist's real name or stage name, living or deceased
- any songwriter's real name or stage name
- any song title
- any album title
- any music publisher's name
- any music label's name
- "a substantial or distinct portion of any song's lyrics such that a reasonable person would
  determine the prompt was intended to reference a particular song"

Plus: you may not prompt it to "replicate or mimic the voice, likeness, or identifiable
characteristics of any recording artist".
([ElevenLabs music terms](https://elevenlabs.io/music-terms))

**Suno** takes a different route to the same place: artist names were deliberately excluded from
training metadata, Suno "has never permitted prompts requesting specific artists or copyrighted
songs", and when a prompt references an artist "the system removes the artist name and redirects
toward musical descriptors instead". Screening runs through Audible Magic for audio and Musixmatch
for lyrics.
([Suno responsible AI](https://suno.com/blog/building-the-future-of-music-responsibly))

So on Suno, an artist name is not a block, it is a **silently deleted token**. Your prompt quietly
becomes worse and you never find out why. That is a strong practical argument for describing the
music instead.

**The compliant music prompt pattern**, which is also simply the better one:

> genre and subgenre, era, instrumentation, tempo and key, vocal timbre descriptors, production
> adjectives, mood

and never a proper noun naming a person, band, song, album, label or publisher.

---

## 6. Vendor sheets

Each entry gives the policy location, the rules people actually trip, the IP position, what you own,
whether you are indemnified, provenance, and what happens when you are refused.

### 6.1 OpenAI, GPT Image

- **Policy**: [Usage policies](https://openai.com/policies/usage-policies/) ·
  [Service terms, containing the Copyright Shield](https://openai.com/policies/service-terms/) ·
  [Image generation system card](https://cdn.openai.com/11998be9-5319-4302-bfbf-1167e093f1fb/Native_Image_Generation_System_Card.pdf)
- **The trip lines**: photorealism is the trigger on violence, not violence itself. Hate symbols are
  allowed "in a critical, educational, or otherwise neutral context, as long as they don't clearly
  praise or endorse extremist agendas". Editing uploaded photorealistic images of children is not
  allowed. Real people carry "particularly robust safeguards around nudity and graphic violence".
- **IP**: **living artists are refused by name.** Deceased artists, movements and studios are not
  covered by that rule. Adult public figures are permitted with safeguards, and there is an
  **opt-out registry** for public figures who do not want to be generated. Minors who are public
  figures are blocked.
- **You own the output.** Verbatim: "you (a) retain your ownership rights in Input and (b) own the
  Output." With the caveat that "output may not be unique and other users may receive similar
  output".
- **Indemnity**: Copyright Shield covers **API, Enterprise, Edu, Healthcare and Business**. It does
  **not** cover Free or Plus. Six exclusions, of which the ones that matter are: you knew or should
  have known the output was likely infringing, you disabled safety features, or **the claim involves
  trademark rights arising from use in trade or commerce**.
- **Provenance**: both C2PA Content Credentials and SynthID on supported outputs. OpenAI notes
  metadata "can sometimes be removed by platforms, editing tools, or file conversions".
- **Refused?** Set `moderation: "low"`, which is documented as "less restrictive filtering". Appeals
  for account actions at [openai.com/form/appeal](https://openai.com/form/appeal/). There is no
  per-request appeal for an API moderation block.
- **Note**: `gpt-image-2`, `1.5`, `1` and `1-mini` require API organisation verification.

### 6.2 Google, Gemini image, Nano Banana Pro, Imagen, Veo

- **Policy**: [Generative AI prohibited use policy](https://policies.google.com/terms/generative-ai/use-policy) ·
  [Vertex responsible AI for Imagen](https://cloud.google.com/vertex-ai/docs/generative-ai/image/responsible-ai-imagen)
- **The trip lines**: the RAI filter categories include **Health, Politics, Religion and Belief,
  Vulgarity, and War and Conflict**, none of which have an illegality threshold. That is where
  legitimate medical, editorial and historical prompts die. There is a **celebrity detection filter**
  on photorealistic celebrities.
- **People**: `personGeneration` defaults to `allow_adult`. `allow_all`, which permits children, is
  **not allowed in EU, UK, CH and MENA**. On some surfaces person generation is allowlist-gated
  entirely. Gemini Apps require 18+ to generate _and_ edit images, 13+ to generate only.
- **IP**: no published named-artist rule and no opt-out registry. Only the general clause against
  content that "violates the rights of others, including privacy and intellectual property rights",
  plus a specific prohibition on "misrepresenting the provenance of generated content by claiming it
  was created solely by a human".
- **You own the output.** "Google won't claim ownership over that content."
- **Indemnity**: Google Cloud's generative AI indemnity covers both **generated output** and
  **training data**, which is unusually broad. It requires a **paid** service, not free tier or
  credits, and excludes knowingly infringing use, circumventing filters, continuing after notice, and
  **trademark claims arising from use in trade or commerce**. Imagen is on the covered list. The
  consumer Gemini app is not.
- **Provenance**: **SynthID on every output, always, non-optional.** The visible Gemini sparkle
  became optional on 14 August 2026 and is removed for Ultra and AI Studio: "Recognizing the need for
  a clean visual canvas for professional work, we will remove the visible watermark."
- **Refused?** Google has the best remediation path in the industry. Read the RAI code, rewrite for
  that specific category, adjust `personGeneration`, or request project allowlisting for celebrity or
  minor generation. In-product text: "Try rephrasing the prompt. If you think this was an error, send
  feedback." Enforcement escalates from email contact to rate limiting to temporary pause to closure,
  with an appeal link. Prompts and outputs are retained 55 days for enforcement.
- **Regional**: you may only use paid services when serving users in the EEA, Switzerland or the UK.

### 6.3 Midjourney

- **Policy**: [Community guidelines](https://docs.midjourney.com/hc/en-us/articles/32013696484109-Community-Guidelines) ·
  [Terms of service](https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service)
- **The trip lines**, verbatim from the guidelines: gore includes "images of detached body parts of
  humans or animals, cannibalism, blood, violence (images of shooting or bombing someone, for
  instance), mutilated bodies, severed limbs, pestilence". Adult content: "avoid nudity, sexual
  organs, fixation on such things, sexualized imagery, fetishes, **people in showers, on toilets**".
  That last one is the classic accidental trip on an entirely ordinary domestic scene.
- **Political**: "You may not use the Services to generate images for political campaigns, or to try
  to influence the outcome of an election."
- **IP**: **no published ban on artist names, styles or named characters.** That absence is verified,
  not assumed. Responsibility is pushed entirely onto you through the indemnity, which runs in
  Midjourney's favour.
- **You own the output**, "to the fullest extent possible under applicable law". But **if your
  company earns $1m or more per year, you or your employees must be on Pro or Mega to own assets.**
  Midjourney takes a broad perpetual sublicensable licence back over your inputs and assets.
- **Indemnity**: none. You indemnify Midjourney.
- **Provenance**: a proprietary hidden ID tag, **not C2PA**. Verify at midjourney.com/verify. Their
  own warning: it "is easily lost. Screenshots, edits, and most social media sites remove it."
- **Refused?** Warning from a moderator, then time-out, then blocked. **No published appeals
  process.** And an explicit warning that a prompt not being blocked does not mean it is permitted.
- **The `--no` gotcha**: each word after `--no` is read independently. `--no modern clothing` becomes
  "no modern" plus "no clothing". Describe what you want instead.

### 6.4 Adobe Firefly

- **Policy**: [Generative AI user guidelines](https://www.adobe.com/legal/licenses-terms/adobe-gen-ai-user-guidelines.html) ·
  [Firefly product description, which defines the indemnity](https://helpx.adobe.com/legal/product-descriptions/adobe-firefly.html)
- **The trip lines**: the prohibitions are broadly worded and the catch-all is "engage in regulated
  activities without complying with applicable requirements", which silently covers drugs, weapons,
  alcohol and gambling without listing them. In practice the false-positive surface is bodies and
  retouching, per section 3.5.
- **IP, the strictest of the western vendors**: prohibits "text prompts designed to generate
  infringing content" and reference images containing copyrighted material. The operative celebrity
  rule is unusual and worth knowing: Firefly "only generates images of public figures available for
  commercial use on the Stock website, excluding editorial content". There is no editorial-use path.
  Music cannot be generated based on "specific artists, bands, or songs".
- **You own the output**, as "Customer Content". No IP warranty, and "output may not be unique or
  independently protectable". On copyrightability Adobe says only "this will depend on the laws of
  your local jurisdiction".
- **Indemnity**: covers claims that Firefly output "directly infringes the third party's patent,
  copyright, trademark, publicity, or privacy rights", which is broader than most because it includes
  trademark and publicity. **But** it requires an eligible paid plan and a contracting event, it
  excludes modified or combined output, and critically it **excludes any capability powered by a
  non-Adobe model.** So Firefly's third-party partner models are not indemnified even though they sit
  in the same interface. Reported cap is $10,000 per infringement claim on standard terms.
- **Provenance**: Content Credentials applied on export. **Removal is contractually prohibited**,
  twice over.
- **Refused?** "We can't process this prompt", with the reason "prompt may not be aligned with Adobe
  generative AI user guidelines". Official guidance is only to reword and try again. No published
  trigger list and no formal appeals process. Prompts are machine-translated from over 100 languages
  and Adobe warns translations "may be inaccurate or unexpected".

### 6.5 The rest of the image field, in brief

| Vendor                     | Named artists                        | Output ownership                                                                                | Indemnity | Provenance                                                                          |
| -------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| **Stability AI**           | Not published                        | You own it                                                                                      | None      | Not in terms                                                                        |
| **Ideogram**               | Not published                        | You own it                                                                                      | None      | Watermark removal prohibited                                                        |
| **Black Forest Labs FLUX** | No ban                               | You own it                                                                                      | None      | C2PA named, tampering prohibited. EU rightsholder complaints mechanism              |
| **Leonardo**               | Not published                        | **Free tier ownership is contradictory between the tracker and the FAQ.** Verify before selling | None      | Not published                                                                       |
| **Recraft**                | Not published                        | Paid: you own it. **Free: Recraft owns it and you get no commercial use**                       | None      | May embed watermarks, removal prohibited                                            |
| **ByteDance Seedream**     | Not published                        | Unclear                                                                                         | None      | `watermark` parameter, China labelling law applies                                  |
| **Alibaba Qwen-Image**     | Docs warn against celebrity likeness | Unclear                                                                                         | None      | `watermark` parameter, default false. Returns an `IPInfringementSuspect` error code |

Two of those deserve emphasis. **Recraft's free tier does not give you commercial rights and Recraft
owns the output.** And **Leonardo's free-tier ownership position is genuinely unclear from the public
documents**, so check your own account terms before selling anything made on it.

### 6.6 Video

The most important fact first: **OpenAI Sora is discontinued.** Web and app access ended 26 April
2026 and the Videos API shuts down 24 September 2026. Any Sora guidance you find is legacy.

| Vendor                 | Political rule                                                   | Appeal route                                                                                                                                                   | Provenance                                                                                                   | Note                                                                                                    |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Google Veo**         | PUP false-claims rules, ads require synthetic-content disclosure | Best documented: support code, likeness complaint form, project allowlisting                                                                                   | SynthID always, C2PA metadata                                                                                | `personGeneration` is mode-dependent and region-restricted                                              |
| **Runway**             | General deception clause                                         | **suspension@runwayml.com, account only.** Verbatim: "unable to allowlist specific accounts or subject matters, regardless of the intent"                      | **No provenance clause at all**                                                                              | Be honest with yourself: there is no exception path here                                                |
| **Kling**              | No "political campaigning or advocacy or lobbying"               | support@kling.ai for account actions                                                                                                                           | Kling branding, removal is a **paid** benefit. You must label output as Kling AI-generated when distributing |                                                                                                         |
| **Luma**               | None specific                                                    | DMCA only, no appeals process published                                                                                                                        | Explicit clause: you "will not remove, alter, obscure, or circumvent"                                        |                                                                                                         |
| **MiniMax Hailuo**     | None specific                                                    | **None published.** Removal "for any or no reason"                                                                                                             | Explicit anti-removal clause                                                                                 | US copyright suit active over Hailuo                                                                    |
| **Higgsfield**         | None specific                                                    | NCII removal in 48h, DMCA counter-notice                                                                                                                       | **Does not warrant that marks persist**, so do not rely on it for EU Article 50 compliance                   | Moderation is **per-model**, so a refusal on one hosted model is not a Higgsfield-wide policy judgement |
| **Seedance**           | None specific                                                    | Photorealistic faces blocked **at the model layer**. Legitimate routes are the digital avatar with liveness verification, or enterprise portrait authorisation | China labelling law                                                                                          |                                                                                                         |
| **LTX, Wan, Dreamina** | General                                                          | Not published                                                                                                                                                  | Not published                                                                                                |                                                                                                         |

### 6.7 Voice

**ElevenLabs has the deepest published consent regime in the industry**, and it is the model everyone
else is converging on.

- **Voice Captcha**: to clone a voice you record a verification phrase that must match the sample.
  If it fails, retry **with the same equipment, tone and delivery as the samples**, then escalate to
  support.
- **Professional Voice Cloning** has dataset requirements and a documented consent process.
- **No-Go Voices** blocks specific high-risk clones, including political candidates.
- **Deceased people** have their own rules.
- **Voice Library** has consent terms, revenue share and a withdrawal path.
- **Political**: you may not impersonate "political candidates or elected government officials,
  **regardless of whether authorization was obtained**". Consent does not cure this one. Cartesia has
  a similar absolute rule.
- **Provenance**: an AI audio classifier for detection, plus C2PA support.
- **Refused?** Support escalation for a failed Voice Captcha, and dispute wrongful bans through
  support.

### 6.8 Music, and why the ground moved

The litigation reshaped this category during 2025 and 2026, and the practical result is that
**export and distribution entitlement is now a first-class question, separate from ownership.**

| Matter                    | Status as of August 2026                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Warner v. Suno**        | **Settled** November 2025. Undisclosed payment, licensing partnership, Suno acquires Songkick. Artist opt-in for name, image, likeness, voice and compositions |
| **UMG and Sony v. Suno**  | **Active.** Fact discovery through September 2026, dispositive motions April 2027. No US fair-use ruling before 2027                                           |
| **UMG v. Udio**           | **Settled** October 2025, with recorded-music and publishing licences and a joint licensed platform                                                            |
| **Sony v. Udio**          | **Active**, the sole remaining major. Sony filed a second suit in July 2026 over 30,117 additional recordings                                                  |
| **GEMA v. Suno** (Munich) | **Suno lost, 31 July 2026.** Training, memorisation and outputs all held infringing. Immediately enforceable pending appeal                                    |
| **ElevenLabs Music**      | No major-label suit. Licensed at launch through Merlin and Kobalt                                                                                              |

What changed for you:

- **Suno download caps take effect 3 September 2026**: 7 lifetime on free and non-commercial, 20 a
  month on Pro, 60 on Premier. They apply **retroactively to songs created before that date**.
- **Suno ownership**: Pro and Premier get an assignment of Suno's rights in output "generated during
  your paid subscription", with an express disclaimer that no copyright is warranted to vest. Free
  and Basic is "lawful, internal, personal and non-commercial" only, with attribution required.
  Remixes are jointly owned with the remixer.
- **The cancellation trap**: the assignment is scoped to output generated _during_ the paid term, and
  download entitlements are **plan-current, not vintage-based**. Music stays playable on Suno on
  every plan. Getting the file out is what is gated.

---

## 7. Provenance and disclosure

### 7.1 What is in your files

| Vendor               | Invisible mark                 | C2PA                                            | Visible mark               | Removal barred by terms                                                |
| -------------------- | ------------------------------ | ----------------------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| Google Veo and Lyria | **SynthID on everything**      | C2PA on video and image, **not on Lyria audio** | Optional since 14 Aug 2026 | Provenance misrepresentation barred, no explicit anti-stripping clause |
| OpenAI               | SynthID on images              | **C2PA conforming generator**                   | Sora video only            | Not stated                                                             |
| Midjourney           | Proprietary hidden tag         | No                                              | No                         | Not addressed                                                          |
| Adobe Firefly        |                                | **Content Credentials**                         |                            | **Yes, explicitly, twice**                                             |
| Luma                 | May embed                      | Content credentials                             | May embed                  | **Yes, explicitly**                                                    |
| MiniMax Hailuo       |                                |                                                 | Company-applied            | **Yes, explicitly**                                                    |
| Kling                |                                |                                                 | Kling branding             | Removal is a paid benefit. Must label when distributing                |
| Alibaba              |                                |                                                 | "AI-generated" on trials   | **Yes**                                                                |
| ElevenLabs           | AI audio classifier            | **C2PA support**                                |                            | Not addressed                                                          |
| Suno                 | Audio watermarking rolling out | **C2PA on all tracks**                          |                            | Deceptive audio barred                                                 |
| Runway               |                                |                                                 |                            | **No provenance clause at all**                                        |

A legal overlay sits on top of the contracts. China's labelling measures prohibit "maliciously
deleting, altering, falsifying, or concealing identification labels" **and providing tools to assist
such acts**. California's AB 853 obliges generative AI providers to ship a free detection tool from
2 August 2026.

### 7.2 EU AI Act Article 50, live since 2 August 2026

This is now in force and it affects you if you publish into the EU.

- **Providers** of generative systems must mark outputs "in a machine-readable format and detectable
  as AI-generated". That is the vendor's job, not yours.
- **Deployers**, which includes you when you publish, must disclose **deepfakes**, and must disclose
  AI-generated or manipulated **text on matters of public interest** that lacks human editorial
  review.
- **Exemptions**: text with human review and editorial responsibility. Assistive editing such as
  grammar correction that does not substantially alter content. And, usefully, "clearly fantastical
  or physically impossible content, for example dragons or humans flying unaided" sits outside the
  deepfake definition entirely.
- **Artistic and creative work** gets a real softening: disclosure only "in an appropriate manner
  that does not hamper the display or enjoyment" of the work. A caption or an end card, not a
  watermark across the frame.
- **Transition**: systems on the market before 2 August 2026 have until **2 December 2026** for
  machine-readable marking.
- A voluntary **Code of Practice on marking and labelling AI-generated content** was published
  10 June 2026, and Commission guidance confirms that following it satisfies the marking obligation.
  ([Code of practice](https://digital-strategy.ec.europa.eu/en/news/commission-publishes-code-practice-marking-and-labelling-ai-generated-content))

### 7.3 What a creator actually has to do

Short version: disclose synthetic media of real people, disclose AI text on matters of public
interest, follow the platform toggle, and keep your prompt logs.

Platform rules are the ones you will meet daily. YouTube has a synthetic-content disclosure toggle
and has extended likeness detection to politicians. Spotify removes unauthorised voice clones
outright. Adobe Stock requires two checkboxes. Marketplace IP-enforcement programmes are fast and
unforgiving.

On the commercial cost of disclosing: one analysis of 2,400+ campaigns found no meaningful
performance gap on stream-per-dollar metrics between disclosed and undisclosed AI tracks, and
labelled content shows modest click-through reductions but higher trust metrics. Both of those are
single trade sources, so treat them as indicative. The downside risk of _not_ disclosing is
account-level, which is asymmetric enough to settle the question.

---

## 8. What you own, and what you can stop others copying

These are two independent questions and almost everyone merges them.

1. **Can I be sued for making or selling this?** Infringement, publicity and trademark exposure.
   Mitigated by prompt discipline, licensed models and indemnities.
2. **Can I stop someone else copying it?** Copyrightability. Mitigated only by real human authorship.
   An indemnity does nothing for this.

### 8.1 The United States

The Copyright Office published Part 2 of its AI report, on copyrightability, in January 2025. Its
operative holdings:

| Question                                 | Position                                                                                                                                                                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Do prompts confer authorship?**        | **No.** "Prompts alone do not provide sufficient human control to make users of an AI system the authors of the output." Even long, iterated prompts fail: "the final output reflects the user's acceptance of the AI system's interpretation, rather than authorship" |
| **Expressive inputs**                    | Protectable. Where "human-authored inputs are reflected in the output, they contribute more than just intellectual conception". Uploading your own illustration to be modified counts                                                                                  |
| **Assistive use**                        | "The use of AI tools to assist rather than stand in for human creativity does not affect the availability of copyright protection"                                                                                                                                     |
| **Selection, coordination, arrangement** | **Protectable.** You may "select or arrange AI-generated material in a sufficiently creative way that the resulting work as a whole constitutes an original work of authorship"                                                                                        |
| **Modification of output**               | Protectable in the modifications only, on derivative-work principles                                                                                                                                                                                                   |
| **New legislation needed?**              | No. Existing law resolves it                                                                                                                                                                                                                                           |

([USCO Part 2 report](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf))

**The consequence people miss**: the flip side of thin copyright is that a pure prompt-to-image output
is, in the US, largely free for anyone to copy. You may well be able to sell it. You generally cannot
stop a competitor republishing it.

**Registration mechanics**, if you want to register a work with AI elements: disclose AI-generated
content that is more than de minimis, exclude it in the "Limitation of Claim" field, describe your
human contribution in expressive terms in "Author Created" (for example "selection, coordination, and
arrangement of..."), and **never list the AI system as an author**. Non-disclosure risks the
registration itself.

### 8.2 Elsewhere

- **UK**: the 2026 government report abandoned the broad text-and-data-mining exception with opt-out
  and declined a mandatory input-transparency regime for now. Section 9(3) CDPA, the 50-year right in
  computer-generated works, is **likely to be repealed**, with the caveat that copyright should
  continue to protect works created with AI assistance. The UK is converging on the human-authorship
  consensus.
- **Germany and the EU**: courts are consistently refusing protection to prompt-only output. The
  Munich Local Court in February 2026 denied protection to three AI-generated logos despite one
  prompt running to 1,700 characters plus selection among outputs. The court required
  "concrete-formative influence", objectively defining essential features rather than merely
  triggering a process, and held that **mere selection among outputs is insufficient**.
- **China** is more permissive: the Beijing Internet Court recognised copyright in an AI-generated
  image in November 2023 where the user's intellectual input was sufficient.
- **Japan** has the most permissive training regime, under Article 30-4's "non-enjoyment" exception.

### 8.3 Who indemnifies you, and what the indemnity actually excludes

| Source                                                                          | Covers                                                                                                                                                           | Key exclusions                                                                                                                                            |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OpenAI Copyright Shield**                                                     | API, Enterprise, Edu, Healthcare, Business                                                                                                                       | Free and Plus get nothing. Knowingly infringing use. Disabled safety features. Modified or combined output. **Trademark claims in trade or commerce**     |
| **Google Cloud**                                                                | Generated output **and training data**, on paid indemnified services                                                                                             | Free tier and credits. Knowingly infringing use. Circumventing filters. Use after notice. **Trademark claims**                                            |
| **Adobe Firefly**                                                               | Copyright, trademark, publicity and privacy, which is broader than most                                                                                          | Eligible paid plans only, with a contracting event. Modified or combined output. **Any capability powered by a non-Adobe model.** Beta and trial features |
| **Microsoft CCC**                                                               | Covered products                                                                                                                                                 | Excludes output the customer knowingly used and was likely to infringe. Excludes trademark outright                                                       |
| **Getty generative AI**                                                         | Commercially safe by construction, "will not include recognizable characters, logos, and other IPs", indemnification reportedly from $50,000 per generated image |                                                                                                                                                           |
| **Midjourney, Stability, Ideogram, FLUX, Leonardo, Recraft, Suno, most others** | **Nothing**                                                                                                                                                      | You often indemnify them                                                                                                                                  |

Two patterns are worth internalising. **Trademark and publicity claims are outside most copyright
indemnities**, which is exactly the exposure that naming an artist or a brand creates. And **knowingly
infringing prompts void coverage everywhere**, which means the indemnity is a backstop for accidents,
not a licence to try things.

### 8.4 The litigation picture, and what it means for you

137 US copyright suits against AI companies as of 22 August 2026. The three things that matter to a
person generating work today:

1. **Training-side liability is being settled between rightsholders and vendors, largely without
   touching users.** Settlements move money upstream. They do not create user liability and they do
   not give you rights.
2. **Output-side liability is the live frontier and it points at users.** The lyrics case against
   Anthropic, Getty's surviving US trademark claims, the Disney character cases, and the August 2026
   refusal to dismiss output-infringement claims against Suno all converge on the same point: what
   comes out matters more than what went in.
3. **Nobody has been held liable for prompting a style.** But the surviving _Andersen_ trade dress and
   false endorsement claims, and the French _parasitisme_ theory, both hinge on **naming**. Attribute
   description sits outside both.

**Characters and real people are the bright lines. Everything else is grey. Those two are not.**

### 8.5 Risk map for a working creator

| What you are selling                                                                   | Risk                                  | The actual exposure                                                                                                                                    | What helps                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Style-inspired original work**, your subject, your composition, attributes not names | **Low**                               | Residual gestalt-similarity risk if the output reads as one specific artist's body of work                                                             | Attributes only. Your own reference images or a random `--sref` code. Human editing on top                                                 |
| **Commissioned work**                                                                  | **Low to moderate**                   | Contractual, not just tortious. Most commissioning contracts warrant originality, non-infringement, **and transferable copyright you may not have**    | Disclose AI use in the contract. Do not warrant what you cannot deliver. Add real human authorship so there is a copyright to assign       |
| **Stock**                                                                              | **Moderate**                          | Platform policy, not litigation, is the binding constraint                                                                                             | Follow the Adobe Stock ruleset in section 5.7. Getty and iStock do not accept AI uploads at all                                            |
| **Fan art**                                                                            | **High, and unchanged by AI**         | Straight character infringement. Fair use rarely helps commercial fan art and _Warhol_ narrowed it further. Studios are litigating this right now      | There is no safe technical route. Licence it, or build an original character                                                               |
| **Music with AI vocals**                                                               | **High if the voice is recognisable** | Right of publicity, ELVIS Act, likely NO FAKES Act, plus platform bans. Spotify removes unauthorised voice clones outright                             | Licensed platform. Your own voice or a licensed synthetic voice with documented consent. Never target a recognisable artist                |
| **Instrumental or AI-assisted music**                                                  | **Low to moderate**                   | Melodic similarity is the residual risk. Distribution constraints matter more                                                                          | Check whether your tier actually grants distribution rights. Free tiers of Suno and Udio typically do not                                  |
| **Video with a synthetic presenter**                                                   | **Moderate to high**                  | If they resemble a real person: publicity law plus EU Article 50 disclosure plus platform disclosure. If wholly synthetic: mostly a disclosure problem | Fully synthetic non-resembling presenter, or a licensed avatar with signed consent covering scope, duration, compensation and training use |
| **Print on demand and merch**                                                          | **Moderate**                          | All of the above plus marketplace IP enforcement, which is fast and unforgiving                                                                        | No characters, no brands, no real people. Keep prompt logs to answer takedowns                                                             |

### 8.6 The mitigations that actually work, ranked

1. **Prompt discipline.** Attributes, not names. Free, effective, and it defuses the most novel
   surviving claim in _Andersen_.
2. **A licensed or indemnified pipeline** where real money is at stake. Read the exclusions.
3. **Substantial human authorship.** The only thing that gives you a copyright, and the only answer
   to a client who assumed they were buying transferable rights.
4. **Documentation.** Prompts, iterations, layered files, edit history. Needed for registration, for
   an indemnity claim, and for answering a takedown.
5. **Disclosure.** Cheap, and the evidence suggests low commercial cost.
6. **Contract hygiene.** Consent scope, AI modification rights, compensation, training-data controls.

### 8.7 The honest summary

- **You can sell most style-inspired AI work.** Nobody has been held liable for prompting a style,
  and style is unprotectable as a default rule.
- **You probably cannot stop anyone copying it** unless you did real creative work beyond prompting.
- **Two things get you in trouble reliably: characters and real people.** Both are being litigated
  hard and both have statutory reinforcement arriving.
- **Naming a living artist or a studio is the one prompt habit that adds legal exposure without
  adding craft.** It creates the Lanham Act hook, it voids some indemnities, and on several major
  models it is simply refused.

---

## 9. What this means for Forge

This manual is not just a document. It is a specification for three additions to the product.

### 9.1 New fields on the Model type

```ts
policy: {
  policyUrl: string;
  usagePolicyUrl?: string;
  tripLines: string[];          // the rules people actually hit, in the vendor's words
  artistNames: 'refused' | 'stripped' | 'allowed' | 'unpublished';
  publicFigures: 'blocked' | 'allowed-with-safeguards' | 'stock-licensed-only' | 'unpublished';
  optOutRegistry: boolean;
  minors: string;               // the actual rule, including regional carve-outs
  politicalContent: string;
  moderationSetting?: {         // supported, documented, not a bypass
    name: string; values: string[]; default: string; note: string;
  };
  regionalLimits: { regions: string[]; rule: string }[];
};

rights: {
  outputOwner: 'user' | 'vendor' | 'tier-dependent' | 'unclear';
  ownershipNote?: string;       // the Recraft and Leonardo free-tier traps
  commercialUse: string;
  exportEntitlement?: string;   // Suno's download caps live here
  indemnity: null | { scope: string; requires: string; excludes: string[] };
};

provenance: {
  invisible: string[];          // SynthID, proprietary tag
  c2pa: boolean;
  visible: 'always' | 'optional' | 'tier-dependent' | 'none';
  removalProhibited: boolean;
  euArticle50Ready: boolean;    // Higgsfield explicitly does not warrant persistence
};

refusal: {
  diagnostics?: string;         // Vertex RAI codes
  appealPath: string | null;    // be honest when there is none
  vendorGuidance: string;
};
```

Every one of those needs a `sources` entry and a `verifiedOn` date, same as the rest of the
catalogue, and the same 120-day staleness test applies. Policy moves faster than model versions do.

### 9.2 A new workspace: the Compliance Pass

It sits between Strike and the output, and it runs on the composed prompt before you ever paste it.

- **Proper noun detection.** Flag any name of a person, brand, character, song, album, label or
  studio. Offer the decomposition: "You named an artist. Here are the eight attributes that produce
  that look. Which do you want?" This is the single highest-value feature in the whole product,
  because it turns a compliance warning into a craft upgrade.
- **Register check.** If the brief is medical, historical, documentary or editorial and the prompt
  does not say so, add the register marker. One clause, from the Azure Low-severity list.
- **Negative-construction check.** Rewrite "no X" as a positive description, and warn specifically on
  Midjourney's `--no` word-splitting.
- **Intensifier check.** Strip "horrific", "brutal", "massively" where a precise term does the work.
- **Model-specific trip lines.** Warn before submission, not after refusal: showers and toilets on
  Midjourney, `allow_all` in the EU on Google, living artists on OpenAI, artist names silently
  stripped on Suno, free-tier ownership on Recraft.
- **Rights summary.** Who owns this, can you sell it, are you indemnified, what has to be disclosed.

### 9.3 A refusal diagnostic

When the user says "it got blocked", walk section 2. Ask for the error text. Parse a Vertex RAI code
if there is one. Ask whether it fails every time. Offer to bisect the prompt automatically, which
Forge can do without any model access at all: generate the halves, let the user test, narrow.

Then apply the right fix for the layer, and say which layer it was. Nobody else does this, and it is
the difference between a tool that generates prompts and a tool that teaches you the medium.

### 9.4 Glossary entries this manual creates

Every term in this document goes into the glossary with the same shape as the craft terms: what it
is, what it changes, when it matters. `C2PA`, `SynthID`, `right of publicity`, `trade dress`,
`indemnity`, `safe harbour`, `derivative work`, `substantial similarity`, `moral rights`,
`Article 50`, `false endorsement`, `parasitisme`, `severity threshold`, `input classifier`,
`output classifier`, `prompt transformation`, `register marker`, `attribute decomposition`.

---

## 10. Confidence, gaps and expiry

### What is well sourced

Everything cited to a vendor policy page, model card, court document or regulator publication was
fetched from that source during research. That covers the whole moderation architecture section, all
parameter names and ranges except FLUX, the Azure severity rubric, the Google allowlist error text
and regional restrictions, the OpenAI and Anthropic appeal paths, Anthropic's over-refusal admission
and the 85% figure, the OpenAI staff acknowledgement of the non-English filter bug, the Microsoft
"likely a false positive" acknowledgement, Ideogram's JSON statement, Adobe's "less oversensitive"
statement, the ElevenLabs music prohibited-input list, the Suno artist-name-stripping mechanism, the
USCO Part 2 holdings, and the EU Article 50 obligations.

### What is uncertain, and should be verified before you rely on it

- **FLUX `safety_tolerance` range.** Documented as 0 to 5 on one surface and 1 to 6 on another, both
  with default 2, and one of those pages is internally inconsistent. Verify per endpoint.
- **Leonardo free-tier ownership.** A tracker says Leonardo owns it, the FAQ says the user does.
  Genuine conflict. Check your own account terms.
- **Suno's ownership language** shifted after the Warner settlement from "you own your songs" to
  something more hedged. The terms of service assignment clause is controlling, but this is live
  ambiguity.
- **Google's Gemini default threshold of `OFF`** on 2.5 and 3 models is a large behavioural change
  from earlier defaults and applies to the `ai.google.dev` surface. Vertex may differ.
- **The specific homonym list** in section 3.1 beyond the individually cited cases. The mechanism is
  documented, those particular words are not. Test them rather than citing them.
- **The cross-lingual slur collision** is widely believed and I found no primary documentation.
- **Culinary and knife imagery** as a named vendor incident class. Mechanism yes, incident no.

### What expires, and when

This is the part that matters most for a tool. Policy moves faster than anything else in the
catalogue.

| Date                  | What happens                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **3 September 2026**  | Suno download caps take effect, retroactive to older songs                                         |
| **24 September 2026** | OpenAI Sora Videos API shuts down                                                                  |
| **30 September 2026** | Fact discovery closes in UMG and Sony v. Suno                                                      |
| **20 October 2026**   | Cartesia Sonic-2 and older snapshots sunset                                                        |
| **6 November 2026**   | OpenAI MDL summary judgment briefing completes. First major test of output-side liability at scale |
| **30 November 2026**  | OpenAI reusable prompt objects shut down                                                           |
| **2 December 2026**   | EU AI Act machine-readable marking deadline for systems already on the market                      |
| **Late 2026**         | Third Circuit decision expected in _Ross_, the first appellate word on AI training and fair use    |
| **1 January 2027**    | California: large online platforms must detect and disclose generative AI content                  |
| **9 April 2027**      | Dispositive motions in UMG and Sony v. Suno. No US fair-use ruling in music before this            |
| **1 January 2028**    | California: capture devices must offer latent disclosures                                          |

Pending and undated: the **NO FAKES Act** on the Senate floor, which would federalise likeness and
voice protection with a takedown regime. The _**Andersen**_ summary judgment stage, where the "is
style trade dress" question finally gets decided on the merits. And **USCO Part 3 on training**, still
pre-publication fifteen months after release.

Anything in this document sourced to a tracker or trade publication should be re-verified against a
primary docket before it goes into user-facing copy. Several AI-generated "lawsuit tracker" sites
contain confident errors.

---

## 11. The one-page version

If you read nothing else:

1. **Seven layers block you, and they need different fixes.** Instant and repeatable means a word
   problem. Inconsistent means a context problem. Bisect the prompt to find out which.
2. **Name the register.** Clinical, editorial, documentary, historical, educational, artistic. One
   clause moves content from Medium to Low on the only published severity rubric in the industry.
3. **Say what is there, not what is absent.** "No blood" contains "blood", and Midjourney's `--no`
   splits your phrase into separate words.
4. **Cut emotive intensifiers.** The precise clinical term is both more useful and lower severity.
   That is the whole thesis of this manual in one line.
5. **Never name a living artist, a studio, a song, an album or a label.** It gets refused on OpenAI,
   silently deleted on Suno, contractually prohibited on ElevenLabs Music, and it converts a
   copyright question into a trademark one everywhere.
6. **Decompose instead.** If you can only name the effect by naming a person, you have not finished
   describing it. Nine attributes give you nine dials. A name gives you none.
7. **Characters and real people are the bright lines.** Style is grey and mostly fine. These are not.
8. **Check what you own before you sell.** Free tiers on Recraft and Suno do not give you what you
   think. Indemnities exclude trademark almost everywhere.
9. **Prompts do not give you copyright.** Only human authorship does, which means editing, arranging,
   and your own expressive inputs.
10. **Disclose synthetic people.** Article 50 is live, platforms enforce it, and the cost of
    disclosing is lower than the cost of not.
