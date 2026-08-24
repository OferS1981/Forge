/*
 * The exports the snapshot script needs. By path rather than by package name: the script runs from
 * the repository root, which is not a workspace package.
 */
export { serialiseSnapshot, takeSnapshot } from '../../packages/changelog/src/index';
