# What a lens actually changes

Most people reach for adjectives when a number would do more. A focal length is not decoration: it
decides the geometry of the picture before anything else in the prompt gets a say.

## The one thing to understand

A lens changes **perspective**, not just how much fits in the frame. Two photographs of the same
face, one at 24mm and one at 135mm, are not crops of each other. They are different shapes.

- A **wide** lens, 14mm to 35mm, pushes the background away and stretches whatever is nearest the
  camera. Noses get bigger. Rooms get deeper. It reads as immediate and slightly unstable.
- A **normal** lens, around 50mm, is closest to how a person remembers a scene. It is the one that
  disappears.
- A **long** lens, 85mm and up, compresses. The background stacks up behind the subject like a
  painted flat, and faces flatten in a way most people find flattering.

That is why 85mm is the portrait lens and 24mm is the landscape lens. It was never about how much
fits in.

## What it does in a prompt

Naming a lens is one of the cheapest ways to stop getting the model's default look, because it
carries a whole set of decisions with it. `85mm` implies a portrait, a subject separated from its
background, and a certain distance between camera and person, all in five characters.

> One focal length and one aperture do more work than any five adjectives you could add.

Pair it with an aperture and you have described a photograph rather than a picture of a thing.

## What not to do

Do not stack lenses. `wide angle, telephoto, macro` is not a richer prompt, it is a contradiction,
and the model resolves it by picking one at random or averaging into mush.

Do not use `cinematic` as a substitute. On 2026 models it is close to a null token. Name the shot
and the lens instead, which is what a cinematographer would have said in the first place.
