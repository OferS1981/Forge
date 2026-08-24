import type { Compliance, ModelId } from '../../types';
import { AUDIO_COMPLIANCE } from './audio';
import { IMAGE_COMPLIANCE } from './image';
import { VIDEO_COMPLIANCE } from './video';
import { WORK_COMPLIANCE } from './work';

/**
 * The four vendor-fact blocks for every model. Typed as a complete record, so a model added
 * without its compliance sheet is a type error here rather than a runtime hole.
 */
export const COMPLIANCE: Record<ModelId, Compliance> = {
  ...IMAGE_COMPLIANCE,
  ...VIDEO_COMPLIANCE,
  ...AUDIO_COMPLIANCE,
  ...WORK_COMPLIANCE,
};
