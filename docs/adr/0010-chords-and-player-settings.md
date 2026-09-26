# 10. Chords and player settings

Status: Accepted

Builds on [ADR 8](0008-rendering-transposition-playback.md) (rendering and playback) and
[ADR 9](0009-jam-first-ux.md) (the jam-first tune page).

## Context

Accompanists (guitar, accordion, piano, bass) read chords, not melody, and at a jam players switch
instruments often. ABC chord symbols (`"G"`, `"Am7"`, `"D/F#"`) were already allowed in tune
files, and abcjs drew and transposed them, but a player could not hide them, see only the chords,
hear an accompaniment, or play with a capo.

Guiding rule: switching between melody use and accompaniment use takes at most two taps from the
tune page, and the choice stays on the device, so it never has to be set again for each tune.

## Decision

- **Device settings, not URL state.** One module, `src/ui/settings.ts`, holds every per-device
  viewing preference: the display mode (`notes`, `notesAndChords`, `chordChart`), the playback
  mode (`melody`, `melodyAndAccompaniment`, `accompanimentOnly`), capo shapes, and the zoom level.
  - They are stored in `localStorage` as one versioned JSON object (`notes.settings`, version 1),
    with try/catch. Missing, corrupt or unknown-version data gives the defaults, and each invalid
    field falls back on its own. The old `notes.zoom` key is migrated once and removed.
  - Components read and change them only through `usePlayerSettings()` (a React context mounted
    in `App`).
  - They are never written to the URL. A shared link carries the tune, variant and transposition
    (ADR 8), which belong to the tune; how a player likes to read belongs to the player's device.
- **View control.** A View button in the bottom bar, next to play, shows the display mode's icon
  and opens a sheet with two segmented controls (display, playback) and a capo switch. Changes
  apply at once. View → Notes is two taps.
  - A tune without chord symbols disables the chord options with a hint. It shows its notes and
    plays its melody, but the stored choice is kept for the next tune with chords. In chord chart
    mode it shows "no chords yet" above the score.
- **Chords in the domain, from neutral events.** `src/domain/` parses and transposes chord
  symbols (`chord.ts`), finds them in ABC text (`chordSymbols.ts`), builds the chart
  (`chordChart.ts`) and suggests a capo (`capo.ts`), all without abcjs types.
  - The adapter turns abcjs's parsed tune into `ChordEvent`s (bar, chord, part, repeat start and
    end, ending), and `buildChordChart` groups them: parts from `P:` fields in the body, otherwise
    inferred from repeats as A, B, C; bars without a chord carry the previous one, drawn muted; a
    chordless pickup at the start of the tune or of a `P:` part is dropped.
- **Spelling by the target key.** A transposed chord note takes the letter of the target key's
  scale when it is in the scale. Other notes are naturals where possible, then sharps in sharp
  keys (and C) and flats in flat keys. `spellPitchClass` in `key.ts` does this. A symbol that
  cannot be parsed is shown as written.
- **Capo shapes.** Guitarists prefer a few open shapes. `capoSuggestion(soundingKey)` gives no
  capo when the key is C, G, D, A or E (Am, Em or Dm in minor). Otherwise it gives the lowest capo
  up to 7 with G, C or D shapes (Am, Em or Dm in minor): B♭ is capo 3 with G shapes, F capo 3 with
  D shapes, E♭ capo 1 with D shapes. A and E shapes are not used with a capo, because players
  rarely choose them that way (B♭ as capo 1 with A shapes). Dorian, phrygian and locrian keys use
  minor shapes; mixolydian and lydian use major ones.
  - With capo shapes on, a banner ("Capo 3 · play G shapes") is shown above the chords. The chart
    shows the shapes, transposed down by the capo. In notes-and-chords mode the score keeps the
    sounding chords and only the banner is added. There is no banner in "notes" mode, or when no
    capo is needed.
- **Hiding chords in the score.** abcjs 6.7 has no option to leave chord symbols out of the
  drawing. Hiding the drawn `abcjs-chord` text with CSS would leave its space above every staff.
  So in "notes" mode the ABC goes through `withoutChordSymbols()` first, which removes chord
  symbols and keeps annotations (`"^text"`, `_`, `<`, `>`, `@`), comments and fields.
- **Playback modes with abcjs synth options.** The player parses the full ABC itself
  (`parseOnly` with the same `visualTranspose`) instead of reusing the drawn score, so the
  accompaniment plays even when the score hides the chords, and in chord chart mode, where no score
  is drawn. The options are passed to `SynthController.setTune` next to `midiTranspose`:
  - melody: `chordsOff: true` (no chord track);
  - melody and accompaniment: neither option; abcjs adds its chord track (bass and chord);
  - accompaniment only: `voicesOff: true`, which gives the melody notes volume 0. The chord track
    still plays.
  - `midiTranspose` moves the chord track too, so the accompaniment follows the displayed key.
- **Printing follows the display mode.** The chart uses the score's paper card and print rules,
  8 bars a row on paper, and keeps each part on one page where it fits. The capo banner prints.

## Consequences

- Accompanists set the chord chart once, and every tune opens that way on that device.
- Settings do not travel with a link. That is deliberate: a guitarist and a fiddler can share the
  same link and each see their own view.
- abcjs's accompaniment is a simple "oom-pah" pattern on a piano sound. It is useful for practice,
  not a full backing track. With `voicesOff` abcjs still loads the soundfont notes of the silent
  melody.
- The chart relies on abcjs's parser for bars and repeats, so it covers what abcjs understands.
  Part labels are inferred for the common AABB forms; unusual forms may need `P:` fields.
- A tune's first bar without chords is always treated as a pickup, even if it is a full bar.
