'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  FIELDS,
  filledFields,
  findModel,
  modelById,
  modelLabel,
  type FieldId,
} from '@forge/catalog';
import { Button, ChipGroup, Dialog, TextField, toast } from '@forge/ui';
import { Empty, Workspace } from '../../components/Workspace';
import { useBriefs, useModelId, useRecipes, type Recipe } from '../../lib/store';

function summarise(recipe: Recipe): string {
  const values = recipe.locked
    .map((id) => recipe.brief[id])
    .map((v) => (Array.isArray(v) ? v.join(', ') : (v ?? '')))
    .filter((v) => v.length > 0);
  return values.join(' · ');
}

/**
 * A creator who has found their look wants to reuse it forty times with a different subject. A
 * recipe fixes the fields that make the look and leaves the rest to fill in each time.
 */
export default function RecipesPage(): React.ReactNode {
  const [modelId, setModelId] = useModelId('midjourney');
  const { briefFor, setField } = useBriefs();
  const { recipes, save, remove } = useRecipes();
  const [name, setName] = useState('');
  const [locked, setLocked] = useState<string[]>([]);
  const [confirming, setConfirming] = useState<Recipe | null>(null);
  const router = useRouter();

  const model = findModel(modelId) ?? modelById('midjourney');
  const brief = briefFor(model.id);
  const available = filledFields(brief);

  const apply = (recipe: Recipe): void => {
    setModelId(recipe.model);
    for (const id of recipe.locked) {
      const value = recipe.brief[id];
      if (value !== undefined) setField(recipe.model, id, value);
    }
    toast(`Loaded ${recipe.name}. The locked fields are filled in, the rest are yours.`, 'good');
    router.push('/');
  };

  return (
    <Workspace
      title="Recipes"
      lede="Save a brief as a template with the fields that make the look locked, and the rest left open. Then reuse it as often as you like with a different subject. Recipes live in this browser until Forge has accounts."
      outputLabel="Saved recipes"
      output={
        recipes.length === 0 ? (
          <Empty title="No recipes yet">
            Write a brief in the Build workspace, choose which fields make the look, and save it
            here. The next time you use it, only the open fields are asked for.
          </Empty>
        ) : (
          <ul className="recipes">
            {recipes.map((r) => {
              const recipeModel = findModel(r.model);
              return (
                <li className="recipe" key={r.id}>
                  <div className="recipe__head">
                    <h2 className="recipe__name">{r.name}</h2>
                    <span className="recipe__model fg-mono">
                      {recipeModel === undefined ? r.model : modelLabel(recipeModel)}
                    </span>
                  </div>
                  <p className="recipe__locked">
                    {r.locked.length} field{r.locked.length === 1 ? '' : 's'} locked:{' '}
                    {r.locked.map((id) => FIELDS[id].label).join(', ')}
                  </p>
                  {summarise(r).length > 0 && <p className="recipe__values">{summarise(r)}</p>}
                  <div className="recipe__actions">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        apply(r);
                      }}
                    >
                      Use this recipe
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setConfirming(r);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      }
    >
      <p className="ws-note">
        Saving the brief you wrote for <strong>{modelLabel(model)}</strong> in the Build workspace.
      </p>

      {available.length === 0 ? (
        <p className="ws-note">
          That brief is empty. Fill one in on the Build workspace and come back, and the fields you
          filled will be offered here.
        </p>
      ) : (
        <>
          <TextField
            label="Name this recipe"
            hint="what the look is, in a few words"
            id="recipe-name"
            value={name}
            placeholder="Basement documentary"
            onChange={(e) => {
              setName(e.currentTarget.value);
            }}
          />
          <ChipGroup
            label="Fields to lock"
            hint="the ones that make the look. Everything else is asked for again each time."
            chips={available.map((id) => ({ value: id, label: FIELDS[id].label }))}
            value={locked}
            onChange={(v) => {
              setLocked(Array.isArray(v) ? v : [v]);
            }}
          />
          <div className="strike-row">
            <Button
              variant="primary"
              size="lg"
              disabled={name.trim().length === 0 || locked.length === 0}
              onClick={() => {
                save({
                  name: name.trim(),
                  model: model.id,
                  brief,
                  locked: locked as FieldId[],
                });
                toast(`Saved ${name.trim()}.`, 'good');
                setName('');
                setLocked([]);
              }}
            >
              Save the recipe
            </Button>
          </div>
        </>
      )}

      <Dialog
        open={confirming !== null}
        onClose={() => {
          setConfirming(null);
        }}
        title="Delete this recipe"
        description={
          confirming === null
            ? ''
            : `${confirming.name} goes from this browser. The brief in the Build workspace is not touched.`
        }
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setConfirming(null);
              }}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirming) {
                  remove(confirming.id);
                  toast(`Deleted ${confirming.name}.`);
                }
                setConfirming(null);
              }}
            >
              Delete it
            </Button>
          </>
        }
      />
    </Workspace>
  );
}
