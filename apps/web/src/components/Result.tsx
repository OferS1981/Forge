'use client';

import { scoreLabel, type ForgeResult, type Model } from '@forge/catalog';
import { Output } from './Output';

/**
 * The forged output as the other workspaces show it: the same panel the Build workspace uses,
 * without the score meter where the workspace has already shown a before and after.
 */
export function Result({
  result,
  model,
  showScore = true,
}: {
  result: ForgeResult;
  model: Model;
  showScore?: boolean;
}): React.ReactNode {
  return (
    <Output
      result={result}
      model={model}
      mode="advanced"
      showScore={showScore}
      onOpenField={() => {
        // Only the Build workspace can open a field, because only it owns the brief.
      }}
    />
  );
}

export function scoreName(score: number): string {
  return scoreLabel(score).name;
}
