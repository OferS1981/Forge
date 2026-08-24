import { run } from '@forge/cli';

/**
 * The pump. Everything that decides anything is in `@forge/cli`, which is a pure function and is
 * tested as one. This reads the arguments, writes the answer and sets the exit code, and that is
 * the entire reason it exists.
 */
const result = run(process.argv.slice(2));
if (result.out.length > 0) process.stdout.write(`${result.out}\n`);
if (result.err.length > 0) process.stderr.write(`${result.err}\n`);
process.exitCode = result.code;
