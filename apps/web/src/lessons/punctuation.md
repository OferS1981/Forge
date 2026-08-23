# How to direct a voice with punctuation

Speech models do not read stage directions. They read the text, and the text includes its
punctuation, which is the real prosody control on every modern engine.

## The marks that do work

- **A full stop** ends the thought and resets the pitch. Short sentences read as certain.
- **A comma** is a breath, not a pause. Two commas in a row make a list, not a hesitation.
- **An ellipsis** hesitates, and carries weight. It is the closest thing to a dramatic pause you
  have.
- **A dash** clips, and the delivery lands harder on what follows.
- **CAPITALS** carry stress. Used on one word, it lands. Used on a sentence, it shouts.

Compare:

```
There is a moment right before the bell when the noise drops away.
There is a moment... right before the bell... when the noise drops away.
```

The words are identical. The performances are not.

## Write for the ear

The most useful habit is to read the script aloud before you send it. Anything you would not
naturally say is a line the model will also struggle with. Contractions help. Long subordinate
clauses do not.

## The length trap

Very short inputs are unstable on most engines.

> Under about 250 characters, output gets inconsistent. Give it a full paragraph even if you only
> need one line, then trim the recording afterwards.

## Where tags fit

Some engines take bracketed direction inside the text, like `[whispers]` or `[sighs]`. Those are a
convention of specific products, not a standard. Paste them into an engine that does not document
them and they are read aloud as literal words, which is exactly as bad as it sounds. Forge only
emits them for the engines that document them.
