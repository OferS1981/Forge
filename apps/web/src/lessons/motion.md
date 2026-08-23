# How to write motion for a video model, instead of describing a photograph

This is the single most common failure in video prompting, and it produces a very recognisable
result: a beautiful still image that drifts slightly for five seconds.

## What goes wrong

People write video prompts the way they write image prompts, because that is the habit. So they
describe a **tableau**: what is in the frame, what it looks like, how it is lit. All of that is
about a single instant.

A video model given a single instant has to invent the rest of the time. It fills it with slow
zooms, gentle parallax and hair moving in a breeze that is not in your prompt, because that is what
the average of its training data does when nothing is asked for.

## What to write instead

Describe **change over time**. Something starts, something happens, it ends somewhere.

```
He finishes taping, flexes the fist, then looks up at the camera.
```

Three beats in twelve words. Compare with `a boxer with taped hands looking determined`, which is a
photograph.

## Budget the whole clip

The longer the clip, the more of the timeline your prompt has to cover.

> A thirty-second prompt that describes only the opening image gives you five seconds of intent and
> twenty-five of hallucination.

If a model offers thirty seconds, it is asking you for thirty seconds of direction.

## One camera move

Name one. A push, or an orbit, or a tilt.

Stacking `slow dolly in, arc around subject, tilt up` produces mush on every model tested, because
the three moves cannot happen at once and the model tries anyway. If the shot genuinely needs two
moves, it needs two shots.

Then add what moves **inside** the frame: steam, rain, fabric, a crowd behind the subject. That is
what separates a living shot from a photograph with a moving camera.
