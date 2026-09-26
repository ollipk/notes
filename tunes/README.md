# Tunes

This folder holds the tune data: folk tunes in [ABC notation](https://abcnotation.com/). Everything
here is dedicated to the public domain under [CC0 1.0](LICENSE), separately from the MIT-licensed
code.

`npm run check` validates every file here (`apps/web/tests/tune-data.test.ts`) and lists all problems at
once, with file and line.

## Layout

```
tunes/
  <tune-id>/
    <variant-id>.abc
```

- **One folder per tune.** The folder name is the tune ID, shared by all its variants.
- **One file per variant** (setting) of the tune, for example a different key, a regional version
  or an ornamented version. Variants are listed in alphabetical order of their ID.
- IDs are lowercase ASCII kebab-case: `^[a-z0-9]+(-[a-z0-9]+)*$`. Base the tune ID on the primary
  title without accents, e.g. `hargalaten` for _Hårgalåten_. If a tune has one variant, name the
  file after the tune (`drowsy-maggie/drowsy-maggie.abc`); otherwise describe the variant
  (`standard.abc`, `ornamented.abc`, `in-d.abc`).
- Every tune folder contains at least one `.abc` file, and nothing else.
- Two different tunes may not share a primary title. If they are the same tune, make them
  variants in one folder; if not, make the titles distinct.
- `README.md` and `LICENSE` in this folder are not tunes.

## File format

Exactly one tune per file. The header fields come first, **in this order**:

| Field | Required | Rule                                                                                                                                         |
| ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `X:`  | yes      | Must be `1`.                                                                                                                                 |
| `T:`  | yes, 1+  | The first `T:` is the primary title. Further `T:` lines are alternate titles (other names or languages).                                     |
| `C:`  | no       | Composer, e.g. `Trad.`                                                                                                                       |
| `R:`  | yes      | Tune type: one lowercase ID from the vocabulary below.                                                                                       |
| `O:`  | yes      | Origin: a two-letter uppercase [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country code, optionally `, <region>`. |
| `S:`  | yes      | Source of the transcription: who played or taught it, a recording, or the public-domain publication.                                         |
| `Z:`  | yes      | Transcriber: who wrote this file.                                                                                                            |
| `N:`  | no       | Notes. May repeat.                                                                                                                           |
| `M:`  | yes      | Meter, e.g. `3/4`.                                                                                                                           |
| `L:`  | yes      | Unit note length, e.g. `1/8`.                                                                                                                |
| `Q:`  | no       | Tempo, e.g. `1/4=120`.                                                                                                                       |
| `K:`  | yes      | Key, e.g. `G`, `Am`, `Edor`. Must be the **last** header field.                                                                              |

Only `T:` and `N:` may repeat, no other header fields are allowed, and there are no blank lines in
the header. Lines starting with `%` are comments.

The tune body follows `K:`. Chord symbols (`"G"`) and lyrics (`w:`) are allowed. Do not leave
blank lines inside the body: in ABC a blank line ends the tune. The body must also be valid ABC;
the check parses it with [abcjs](https://www.abcjs.net/) and reports its warnings.

### Tune types

`R:` takes one ID from the controlled vocabulary in
[`packages/domain/src/tuneType.ts`](../packages/domain/src/tuneType.ts):

`polska`, `waltz`, `schottische`, `mazurka`, `polka`, `hambo`, `march`, `minuet`, `quadrille`,
`halling`, `springar`, `pols`, `reel`, `jig`, `slip-jig`, `hornpipe`, `air`, `song`, `other`

Use `other` if none fits. To add a type, open a PR that extends the list and adds a
`tuneType.<id>` label to every file in `apps/web/src/locales/`.

### Example

`tunes/example-polska/in-d.abc`:

```abc
X: 1
T: Example Polska
T: Esimerkkipolska
C: Trad.
R: polska
O: SE, Dalarna
S: Learned from Anna Andersson, Rättvik, 2024
Z: Erik Eriksson
N: Played slowly, with a heavy first beat.
M: 3/4
L: 1/8
Q: 1/4=100
K: D
|:"D"d2 f2 a2|"A"g>f e2 c2|"D"d2 f2 a2|"A"g>e c2 A2|
"D"d2 f2 a2|"G"b>a g2 e2|"A"f>e d2 c2|"D"d4 z2:|
```

## Chord symbols

Chord symbols make a tune usable for accompanists: the app can show them with the notes, as a
chord chart, as guitar capo shapes, and play them as an accompaniment.

- Write them in double quotes before the note they fall on: `"G"G2 "D7"AB`. The root is `A`–`G`
  with an optional `#` or `b`, then the quality as usual (`m`, `7`, `m7`, `maj7`, `dim`, `aug`,
  `sus4`, `6`, `9`, …), then an optional slash bass: `"D/F#"`, `"Am7/G"`.
- Write them in the written key of the file. The app transposes and respells them.
- Put a chord at the start of every bar where it changes. A bar without one continues the previous
  chord.
- Text in quotes starting with `^`, `_`, `<`, `>` or `@` is an annotation, not a chord.
- To name parts in the chord chart, put `P:A`, `P:B`, … on their own line before each part.
  Without them, parts are inferred from repeats.
- **Keep harmonisations simple and conventional**: mostly the I, IV and V chords, with the relative
  minor where it is natural. Players add their own colour.
- **Never** copy a harmonisation from a published tune book, website or recording's liner notes.
  Write the chords yourself, or leave them out: a tune without chords is still welcome.

## Data contribution rule

- Only contribute transcriptions you made yourself, or material in the public domain both in its
  country of origin and in your own country.
- **Never** copy from published tune books, websites or other copyrighted editions.
- Always record the source in `S:`.

The files currently here are **samples** written by an AI model from general knowledge of
traditional melodies. They are marked with `N: SAMPLE` and should be replaced with verified human
transcriptions.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.
