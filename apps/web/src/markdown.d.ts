/** Lesson files are imported as strings. See next.config.ts for the loader. */
declare module '*.md' {
  const content: string;
  export default content;
}
