# Why negative prompts work on some models and not others

`--no watermark` is not a universal instruction. Whether it does anything at all depends entirely
on how the model you are talking to was built, and getting this wrong wastes generations.

## Four different behaviours

Forge sorts every model into one of four kinds, and writes the exclusion the way that kind expects.

1. **A real negative field.** The model takes a separate list of what to avoid and steers away from
   it during generation. This is the strong version, and it is the family's defining advantage.
2. **A flag in the prompt.** The exclusion rides along in the prompt text under a parameter, and
   works, but it is the same mechanism as a strong negative weight rather than a separate pass.
3. **Prose only.** No field exists, so the exclusion has to be phrased inside the prompt. This is
   the weakest version, because the model reads the thing you named whether or not you said "no".
4. **None at all.** Some models have no negative mechanism, and the vendor's own guidance is to
   describe the desired state positively instead.

## The rule that follows from that

On models in the third and fourth groups, **write what you want, not what you do not want**.

> `a desolate landscape with no buildings` puts buildings in the model's head. `an empty moor,
heather to the horizon` does not.

This is not a style preference. Several vendors document measurable degradation from negation, and
it is why Forge rewrites exclusions positively for the models that need it.

## The other trap

Boilerplate negatives, the long `worst quality, jpeg artifacts, bad anatomy` lists, help exactly
one family of models and actively hurt others. Forge only emits them where they help, which is why
you will see a full negative block on some models and none at all on others. That is not an
oversight. It is the point.
