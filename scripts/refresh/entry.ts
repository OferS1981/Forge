/*
 * The exports the refresh script needs.
 *
 * By path rather than by package name: this script runs from the repository root, which is not a
 * workspace package and so cannot resolve `@forge/catalog`. Kept apart so it pulls in nothing else.
 */
export {
  CATEGORIES,
  pullRequestBody,
  reportAsMarkdown,
  reportFor,
} from '../../packages/catalog/src/index';
