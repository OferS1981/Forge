# Why lighting is the highest-yield thing in an image prompt

If you can only add one clause to a prompt, add the light. Nothing else moves the result as far for
as few words.

## Why it carries so much

Light decides four things at once:

- **Mood.** The same face in `softbox key camera-left` and in `hard directional sun` are two
  different photographs about two different people.
- **Shape.** Where the shadows fall is what makes a face look sculpted or flat.
- **Contrast.** Which is most of what people mean when they say an image looks cheap.
- **Colour.** `golden hour` is warm before you have said a single colour word.

A model given no lighting instruction does not produce unlit images. It produces the average
lighting of its training data, which is flat, frontal and slightly overcast. That look is the
default, and it is why so many prompts come back feeling like stock photography.

## How to say it

Name a real setup, the way a gaffer would:

```
softbox key camera-left, rim light separation
```

That is two clauses and it fully determines the light. Compare it with `beautiful lighting`, which
determines nothing at all.

## How much to say

One or two lighting descriptions. Not five.

> Stacking more dilutes each of them. The model has to reconcile `golden hour` with `neon spill`
> with `high-key`, and what it gives back is the average.

If two lights genuinely both belong, say which is the key and which is the accent. `Softbox key
camera-left with a cool rim light behind` is coherent. `Softbox, neon, golden hour, volumetric` is
a wish list.
