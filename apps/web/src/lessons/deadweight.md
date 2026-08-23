# Why `masterpiece, 8k` stopped working

If you learned to prompt in 2022, you learned to end every prompt with a tail of quality words:
`masterpiece, best quality, 8k, ultra detailed, trending on artstation`. It genuinely helped then.
It does not now, and on some models it actively hurts.

## Why it ever worked

Early image models were trained on scraped images with their captions attached, including the tags
from art sites. Those sites' highest-rated images carried words like `masterpiece` in their
metadata, so the words correlated with images people had voted good. Saying `masterpiece` nudged
the model towards that corner of its training data.

It was a trick that exploited how the captions were built, not an instruction the model understood.

## Why it stopped

Modern models are trained on rewritten, descriptive captions rather than scraped tags, and read the
prompt through a language model rather than a bag of keywords. So:

- The correlation is gone. `8k` no longer sits next to good images, because the captions no longer
  contain it.
- The tokens still cost you. Every word is read, weighted and taken into account, so filler
  displaces attention from the words that describe your actual picture.
- On models with a strong house aesthetic, style words add noise. Asking for `award-winning,
stunning` pushes towards a generic idea of impressive, which is the opposite of specific.

## What Forge does about it

Forge keeps a list of these words and strips them from anything you type, then tells you which ones
it took out. That is not a judgement about your prompt. It is one less thing competing with the
words that are doing the work.

> The replacement for `masterpiece, 8k` is not a better quality word. It is a lens, a light and a
> grade.
