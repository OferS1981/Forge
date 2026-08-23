import type { AutoFill, Brief, FieldId, Model } from './types';

/**
 * Simple mode fills the craft layer from what the user did say: the subject, the purpose and the
 * medium. Every choice comes with the sentence Simple mode shows, so the user learns the craft
 * layer one decision at a time on their own work.
 *
 * Rules are deliberately plain. They pick a sensible professional default, never a flourish.
 */

function text(brief: Brief): string {
  return [brief.subject, brief.setting, brief.purpose, brief.action, brief.medium]
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
    .toLowerCase();
}

const PORTRAIT =
  /\b(portrait|face|headshot|person|man|woman|boy|girl|boxer|founder|ceo|actor|model|people|couple|character)\b/;
const LANDSCAPE =
  /\b(landscape|city|skyline|street|building|mountain|forest|coast|beach|valley|room|interior|architecture|estate)\b/;
const PRODUCT =
  /\b(product|bottle|packaging|pack|sneaker|shoe|watch|phone|can|jar|box|logo|device|gadget)\b/;
const DOCUMENTARY = /\b(documentary|editorial|journal|news|report|reportage|candid)\b/;
const AD = /\b(ad|advert|campaign|commercial|trailer|hero|billboard|launch|promo)\b/;
const SOCIAL = /\b(instagram|tiktok|reel|story|stories|thumbnail|social|carousel|youtube)\b/;
const MOVING =
  /\b(walk|walks|walking|run|runs|running|follow|chase|ride|rides|riding|dance|dances)\b/;

type Rule = (brief: Brief, model: Model) => AutoFill | undefined;

function pick(value: string | string[], why: string): AutoFill {
  return { value, why };
}

export const AUTO_FILL: Partial<Record<FieldId, Rule>> = {
  shot: (b, m) => {
    const t = text(b);
    if (PRODUCT.test(t)) return pick(['close-up'], 'you are showing a product');
    if (PORTRAIT.test(t)) return pick(['medium close-up'], 'the subject is a person');
    if (LANDSCAPE.test(t)) return pick(['wide shot'], 'the subject is a place');
    if (m.category === 'video')
      return pick(['medium shot'], 'it holds a person and the action in one frame');
    return pick(['medium shot'], 'it is the safe default when the frame is not specified');
  },
  lens: (b) => {
    const t = text(b);
    if (PORTRAIT.test(t))
      return pick('85mm portrait', 'it flatters faces and separates them from the background');
    if (LANDSCAPE.test(t)) return pick('24mm wide', 'it takes in the whole place');
    if (PRODUCT.test(t)) return pick('50mm normal', 'it shows the product without distortion');
    return pick('35mm', 'it is the neutral documentary focal length');
  },
  aperture: (b) => {
    const t = text(b);
    if (PORTRAIT.test(t))
      return pick('f/2.8', 'a wide aperture puts the face in focus and softens the background');
    if (LANDSCAPE.test(t) || PRODUCT.test(t))
      return pick('f/8, sharp throughout', 'you want everything sharp');
    return pick('f/5.6', 'it keeps the subject sharp without flattening the background');
  },
  light: (b) => {
    const t = text(b);
    if (DOCUMENTARY.test(t))
      return pick(['overcast diffusion'], 'documentary work reads as available light');
    if (PRODUCT.test(t)) return pick(['high-key'], 'product work wants clean, even light');
    if (LANDSCAPE.test(t)) return pick(['golden hour'], 'it gives a place depth and warmth');
    return pick(['softbox key camera-left'], 'one soft key light is the portrait standard');
  },
  grade: (b) => {
    const t = text(b);
    if (DOCUMENTARY.test(t)) return pick('desaturated earth tones', 'you said documentary');
    if (t.includes('cinematic'))
      return pick('teal and orange', 'it is the cinematic default grade');
    if (PRODUCT.test(t))
      return pick('pastel palette', 'it keeps product colour true without competing');
    return pick('warm highlights, cool shadows', 'it adds depth without a strong look');
  },
  comp: (b) => {
    const t = text(b);
    if (PRODUCT.test(t))
      return pick('generous negative space', 'product shots need room around the object');
    if (PORTRAIT.test(t))
      return pick('rule of thirds', 'it places a face where the eye expects it');
    if (LANDSCAPE.test(t)) return pick('leading lines', 'it pulls the eye into the place');
    return pick(
      'rule of thirds',
      'it is the composition that works when nothing else is specified',
    );
  },
  mood: (b) => {
    const t = text(b);
    if (AD.test(t)) return pick(['triumphant'], 'campaign work wants lift');
    if (DOCUMENTARY.test(t)) return pick(['austere'], 'documentary work wants restraint');
    if (SOCIAL.test(t)) return pick(['playful'], 'social work wants energy');
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
    const t = text(b);
    if (AD.test(t)) return pick('urgent', 'campaign work wants pace');
    if (SOCIAL.test(t))
      return pick('escalating', 'social clips need to build inside a few seconds');
    return pick('deliberate', 'it gives the model time to show the action');
  },
};

/** The craft fields Simple mode fills, in display order. */
export const AUTO_FILL_FIELDS = Object.keys(AUTO_FILL) as FieldId[];
