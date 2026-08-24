'use client';

import { BuildBench } from '../components/BuildBench';

/**
 * The bench lives in components/BuildBench so the page file stays a thin mount. A dynamic import
 * was tried here and measured: Next preloads a prerendered dynamic chunk anyway, so it bought
 * nothing on this route. The real split that stuck is the command palette's, in Shell. The
 * catalogue itself stays synchronous because the engine is synchronous by design; the budget that
 * guards the phone experience is scripts/perf-budget.mjs, enforced in verify.
 */
export default function BuildPage(): React.ReactNode {
  return <BuildBench />;
}
