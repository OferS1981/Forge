import { AssistantUnavailable, type PromptAssistant } from './types';

/**
 * The default, everywhere. `available` is false and every method rejects with a typed refusal, so
 * a screen that offers the assistant can render the honest state rather than an error, and the
 * whole test suite runs against this.
 */
export function createNullAssistant(
  reason = 'Forge has no assistant configured, so this is not available.',
): PromptAssistant {
  const refuse = (): Promise<never> => Promise.reject(new AssistantUnavailable(reason));
  return {
    available: false,
    describeImage: refuse,
    critique: refuse,
    freeform: refuse,
  };
}
