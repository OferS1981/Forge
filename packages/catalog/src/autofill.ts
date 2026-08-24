import { has } from './compose/text';
import type { AutoFill, Brief, FieldId, Model } from './types';

/**
 * Simple mode fills the craft layer from what the user did say: the subject, the setting, the
 * purpose and the medium. Every choice comes with the sentence Simple mode shows, so the user
 * learns the craft layer one decision at a time on their own work.
 *
 * Rules are deliberately plain. They pick a sensible professional default, never a flourish, and
 * they follow three laws that came out of judging Forge's output against a person's:
 *
 * 1. **The subject outranks the channel.** A boxer alone at 6am is not "playful" because the clip
 *    is for social. The mood and the pacing read the scene first and the purpose second.
 * 2. **What the user said outranks what a rule would add.** A setting that names its own light gets
 *    no studio light dropped on top of it.
 * 3. **Craft belongs to its medium.** A lens, an aperture and a grade mean nothing on ink line art,
 *    so they are not offered there.
 */

function text(brief: Brief): string {
  return [brief.subject, brief.setting, brief.purpose, brief.action, brief.medium]
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
    .toLowerCase();
}

function scene(brief: Brief): string {
  // The scene only: what is in front of the camera, without the purpose muddying the read.
  return [brief.subject, brief.setting, brief.action]
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
    .toLowerCase();
}

const PORTRAIT =
  /\b(portrait|face|headshot|person|man|woman|boy|girl|boxer|founder|ceo|actor|model|people|couple|character|barista|courier|chef|dancer)\b/;
const LANDSCAPE =
  /\b(landscape|city|skyline|street|building|mountain|forest|coast|beach|valley|room|interior|architecture|estate)\b/;
const PRODUCT =
  /\b(product|bottle|packaging|pack|sneaker|shoe|watch|phone|can|jar|box|logo|device|gadget|machine|appliance|laptop|headphones|chair|lamp|e-?commerce|packshot)\b/;
/*
 * The classes a photographer reads before touching a light. A creature is shot from below with a
 * rim of light because scale and separation are what sell it; a built place wants width and
 * raking light; a machine wants a hero angle and light tracing its bodywork. These exist because
 * "softbox, calm" on a dragon was the day a bare two-word brief exposed the defaults as portrait
 * furniture. Same law as ever: the user's own words outrank all of it.
 */
const CREATURE =
  /\b(dragon|dinosaur|t-?rex|monster|creature|beast|wolf|wolves|lion|tiger|bear|eagle|hawk|owl|stag|elk|bull|gorilla|whale|shark|orca|octopus|serpent|snake|crocodile|griffin|phoenix|kraken|golem|giant)\b/;
const STRUCTURE =
  /\b(stadium|arena|cathedral|castle|castle|bridge|skyscraper|tower|temple|palace|station|airport|amphitheatre|colosseum|monument|lighthouse|dam|harbour|harbor|fortress|aqueduct|viaduct|observatory)\b/;
const VEHICLE =
  /\b(spaceship|starship|spacecraft|freighter|rocket|shuttle|car|supercar|hypercar|motorcycle|motorbike|train|locomotive|aircraft|plane|jet|helicopter|boat|yacht|sailboat|ship|submarine|tank|truck|bus|tram|mech|hovercraft)\b/;
const DOCUMENTARY = /\b(documentary|editorial|journal|news|report|reportage|candid)\b/;
const AD = /\b(ad|advert|campaign|commercial|trailer|hero|billboard|launch|promo)\b/;
const SOCIAL = /\b(instagram|tiktok|reel|story|stories|thumbnail|social|carousel|youtube)\b/;
const MOVING =
  /\b(walk|walks|walking|run|runs|running|follow|chase|ride|rides|riding|dance|dances)\b/;

/*
 * The scene's own emotional cues, strongest first. These are what stop the channel deciding the
 * mood of a scene that has already decided its own.
 */
const SOMBRE =
  /\b(night|midnight|rain|wet|fog|mist|dusk|winter|snow|empty|alone|abandoned|derelict|ruin|ruins|wasteland|silence|grief|funeral|basement|dark|shadowy|[0-6]\s?am)\b/;
const TENSE =
  /\b(storm|chase|chased|fight|fighting|escape|standoff|argument|war|riot|siren|sirens)\b/;
const TRIUMPHANT = /\b(victory|celebrat\w*|wins|winning|summit|trophy|finish line|champion)\b/;
const PLAYFUL =
  /\b(pupp\w*|kitten|child|children|kids|party|balloon\w*|picnic|ice cream|confetti)\b/;

/*
 * A setting that names its own light. When any of these appear, no light is filled in: the words
 * the user wrote are the lighting brief, and a softbox dropped into a sunlit cafe contradicts them.
 */
const LIGHT_IN_SETTING =
  /\b(sun|sunlit|sunrise|sunset|sunshine|golden hour|dawn|dusk|morning|midday|noon|night|midnight|moonlit|moonlight|neon|candle\w*|firelight|lamplight|streetlight|spotlight|spotlit|floodlit|overcast|dappled|backlit|\d{1,2}\s?(a|p)m|window)\b/;

/**
 * The media a camera vocabulary belongs to. A photograph or a cinematic still has a lens; an ink
 * drawing does not, and "24mm, f/8, golden hour" on line art reads as noise to the model and to
 * the person learning from the why-line.
 */
function cameraMedium(brief: Brief): boolean {
  const medium = typeof brief.medium === 'string' ? brief.medium.toLowerCase() : '';
  if (medium.length === 0) return true;
  return /photo|cinematic|film|render/.test(medium);
}

type Rule = (brief: Brief, model: Model) => AutoFill | undefined;

function pick(value: string | string[], why: string): AutoFill {
  return { value, why };
}

export const AUTO_FILL: Partial<Record<FieldId, Rule>> = {
  shot: (b, m) => {
    const t = text(b);
    if (PRODUCT.test(t)) return pick(['close-up'], 'you are showing a product');
    if (PORTRAIT.test(t)) return pick(['medium close-up'], 'the subject is a person');
    if (CREATURE.test(t)) return pick(['low angle'], 'seen from below, the creature towers');
    if (VEHICLE.test(t)) return pick(['low angle'], 'a hero angle gives a machine presence');
    if (STRUCTURE.test(t)) return pick(['wide shot'], 'a built place needs room in the frame');
    if (LANDSCAPE.test(t)) return pick(['wide shot'], 'the subject is a place');
    if (m.category === 'video')
      return pick(['medium shot'], 'it holds a person and the action in one frame');
    return pick(['medium shot'], 'it is the safe default when the frame is not specified');
  },
  lens: (b) => {
    if (!cameraMedium(b)) return undefined;
    const t = text(b);
    if (PORTRAIT.test(t))
      return pick('85mm portrait', 'it flatters faces and separates them from the background');
    if (CREATURE.test(t)) return pick('24mm wide', 'up close and wide, the creature looms');
    if (STRUCTURE.test(t)) return pick('24mm wide', 'it takes in the whole structure');
    if (LANDSCAPE.test(t)) return pick('24mm wide', 'it takes in the whole place');
    if (PRODUCT.test(t)) return pick('50mm normal', 'it shows the product without distortion');
    return pick('35mm', 'it is the neutral documentary focal length');
  },
  aperture: (b) => {
    if (!cameraMedium(b)) return undefined;
    const t = text(b);
    if (PORTRAIT.test(t))
      return pick('f/2.8', 'a wide aperture puts the face in focus and softens the background');
    if (LANDSCAPE.test(t) || PRODUCT.test(t))
      return pick('f/8, sharp throughout', 'you want everything sharp');
    return pick('f/5.6', 'it keeps the subject sharp without flattening the background');
  },
  light: (b) => {
    if (!cameraMedium(b)) return undefined;
    // The user's own words are the lighting brief. Nothing is dropped on top of them.
    if (LIGHT_IN_SETTING.test(scene(b))) return undefined;
    const t = text(b);
    if (DOCUMENTARY.test(t))
      return pick(['overcast diffusion'], 'documentary work reads as available light');
    if (PRODUCT.test(t)) return pick(['high-key'], 'product work wants clean, even light');
    if (CREATURE.test(t))
      return pick(['rim light separation'], 'a rim of light reads as scale and keeps the menace');
    if (VEHICLE.test(t))
      return pick(['rim light separation'], 'a rim of light traces the bodywork');
    if (STRUCTURE.test(t))
      return pick(['golden hour'], 'low raking light gives a structure its depth and shadow');
    if (LANDSCAPE.test(t)) return pick(['golden hour'], 'it gives a place depth and warmth');
    return pick(['softbox key camera-left'], 'one soft key light is the portrait standard');
  },
  grade: (b) => {
    if (!cameraMedium(b)) return undefined;
    const t = text(b);
    // A product shot wants its colour true, so no grade is put on it at all.
    if (PRODUCT.test(t)) return undefined;
    if (DOCUMENTARY.test(t)) return pick('desaturated earth tones', 'you said documentary');
    if (t.includes('cinematic'))
      return pick('teal and orange', 'it is the cinematic default grade');
    return pick('warm highlights, cool shadows', 'it adds depth without a strong look');
  },
  comp: (b) => {
    const t = text(b);
    if (PRODUCT.test(t)) {
      /*
       * A hero or banner purpose already carries its own negative-space guidance in the
       * intended-use sentence, and a person does not say it twice.
       */
      if (/hero|banner|thumbnail|cover|header|landing/.test(t)) return undefined;
      return pick('generous negative space', 'product shots need room around the object');
    }
    if (PORTRAIT.test(t))
      return pick('rule of thirds', 'it places a face where the eye expects it');
    if (CREATURE.test(t))
      return pick('depth layering', 'foreground, creature, background: layers read as scale');
    if (STRUCTURE.test(t)) return pick('leading lines', 'architecture is made of them');
    if (LANDSCAPE.test(t)) return pick('leading lines', 'it pulls the eye into the place');
    return pick(
      'rule of thirds',
      'it is the composition that works when nothing else is specified',
    );
  },
  mood: (b, m) => {
    // A sound describes its own mood, and a product's object is its mood. Neither gets one invented.
    if (m.category === 'sfx') return undefined;
    // A reference is a register: "in the register of Kinfolk still lifes" already says the mood,
    // and a channel default stamped on top of it can contradict it.
    if (has(b.ref)) return undefined;
    const s = scene(b);
    if (SOMBRE.test(s)) return pick(['austere'], 'the scene you described is a quiet one');
    if (TENSE.test(s)) return pick(['tense'], 'the scene you described has conflict in it');
    if (TRIUMPHANT.test(s)) return pick(['triumphant'], 'the scene you described is a victory');
    if (PLAYFUL.test(s)) return pick(['playful'], 'the scene you described is a light one');
    const t = text(b);
    if (PRODUCT.test(t)) return undefined;
    if (AD.test(t)) return pick(['triumphant'], 'campaign work wants lift');
    if (DOCUMENTARY.test(t)) return pick(['austere'], 'documentary work wants restraint');
    if (SOCIAL.test(t)) return pick(['playful'], 'social work wants energy');
    if (CREATURE.test(t))
      return pick(['menacing'], 'a creature reads as presence; say playful if yours is friendly');
    return pick(['calm'], 'it is the mood that does not fight the subject');
  },
  camMove: (b) => {
    const t = text(b);
    if (MOVING.test(t))
      return pick('handheld follow', 'the subject moves and the camera should go with it');
    if (PRODUCT.test(t))
      return pick('arc around subject', 'it shows the product from more than one side');
    return pick('slow dolly in', 'one slow move reads as intent on every model');
  },
  pacing: (b) => {
    const s = scene(b);
    // A quiet scene is paced like one, whatever channel it is for.
    if (SOMBRE.test(s)) return pick('deliberate', 'the scene you described is a quiet one');
    if (TENSE.test(s)) return pick('urgent', 'the scene you described has conflict in it');
    const t = text(b);
    if (AD.test(t)) return pick('urgent', 'campaign work wants pace');
    if (SOCIAL.test(t))
      return pick('escalating', 'social clips need to build inside a few seconds');
    return pick('deliberate', 'it gives the model time to show the action');
  },
  aspect: (b, m) => {
    /*
     * The purpose names the crop more often than people think: a story is 9:16, a carousel is 4:5,
     * a hero image is 16:9. Only ever an aspect this model actually offers, and only when the
     * purpose says so: with no signal the model's own default stands.
     */
    const p = typeof b.purpose === 'string' ? b.purpose.toLowerCase() : '';
    if (p.length === 0 || m.aspects === undefined) return undefined;
    const offered = new Set(m.aspects.map((a) => a.value));
    const wanted: [RegExp, string, string][] = [
      [
        /\b(story|stories|reel|reels|tiktok|short|shorts|vertical)\b/,
        '9:16',
        'that format is vertical',
      ],
      [/\b(carousel|instagram post|feed post)\b/, '4:5', 'that format is a tall feed crop'],
      [
        /\b(hero|banner|thumbnail|youtube|widescreen|landing|header|cover)\b/,
        '16:9',
        'that placement is a wide one',
      ],
      [/\b(editorial|print|magazine)\b/, '3:2', 'that is the print frame'],
      [/\bposter\b/, '2:3', 'that is the poster frame'],
    ];
    for (const [test, value, why] of wanted) {
      if (test.test(p) && offered.has(value)) return pick(value, why);
    }
    return undefined;
  },
};

/** The craft fields Simple mode fills, in display order. */
export const AUTO_FILL_FIELDS = Object.keys(AUTO_FILL) as FieldId[];
