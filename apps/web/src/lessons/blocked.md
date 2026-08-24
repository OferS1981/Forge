# Why your prompt got blocked, and which of seven layers did it

A refusal with no explanation is not a verdict on you. A generation request passes through up to
seven independent gates, they fire at different times, they see different things, and from the
outside a block at any one of them looks identical. People then do the worst possible thing, which
is to guess: add words, delete words, try a synonym, give up on a request that was completely
legitimate.

The fix is different for each layer, and applying the wrong fix is why people go in circles.

## The two that matter

Almost every block you will ever see comes from one of two places, and they fail differently.

1. **A classifier read your words.** The input gate is lexical and shallow: it looks at tokens,
   not meaning. This is where "a rubber duck on a white background" gets refused for the word
   "rubber". A classifier block is **instant, deterministic and identical every run**, and adding
   context does nothing at all, because this layer never had context to begin with.
2. **The model, or the output gate, read the whole thing.** These see context, and they misread
   it sometimes. This block is **inconsistent between runs**, usually on a longer or more clinical
   prompt, and it survives every threshold change. Changing individual words does nothing.

## The ninety-second diagnostic

1. **Is there a code?** Google is the only major platform that names what fired: a numeric code
   identifies the category and whether it tripped on the prompt or on the output. Paste the error
   into the Refusal Doctor and it reads the code for you.
2. **Run it three times.** Same refusal every time means a classifier: change the ambiguous word.
   Different results mean the model: state the register instead.
3. **Cut the prompt in half.** Run each half alone. Whichever half fails contains the trigger, and
   four runs usually isolate the exact word. Nobody does this, and it is the fastest diagnostic
   there is. The Refusal Doctor does the splitting for you.
4. **Check it is even a content block.** Regional walls and allowlist gates look identical to
   refusals, and no rewrite fixes a capability gate.

## The fix that works when words do not

The classifier is not scanning for the absence of a frightening word. It scores _the register the
content belongs to_: clinical, educational, journalistic, historical framing is documented as
scoring lower than the same words unframed. One clause naming what kind of work this is, that is
the whole technique, and it makes the prompt sharper at the same time. Forge's purpose field is
where it lives.

Try it: the brief below describes a surgical scene with the register named. Strike it, then delete
the purpose and watch the Compliance Pass ask for it back. And next time something is refused, take
the error to the [Refusal Doctor](/doctor#refusal) before you touch a single word.
