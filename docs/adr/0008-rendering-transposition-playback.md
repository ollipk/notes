# 8. Rendering, transposition and playback

Status: Accepted

## Context

The tune page is what players use at a session, usually on a phone: they open a tune, move it to
a key that suits the group, make the notation big enough to read, and play it back slowly to
learn it. A link sent to the group must open the same tune in the same key. There is no backend,
the home page should stay fast, and component tests run in jsdom, which cannot draw sheet music.

## Decision

- **abcjs, behind an adapter in the ui layer.** Only `src/ui/abc/abcjsAdapter.ts` imports
  abcjs. Components use the small `AbcAdapter` interface in `src/ui/abc/types.ts` (render a
  score, create a player), and tests replace it with a fake. dependency-cruiser enforces both
  rules below.
- **Lazy loading.** The adapter is loaded with a dynamic import (`loadAbc()`) when a tune page
  opens, so abcjs (about 150 kB gzipped) is not part of the home page bundle. Nothing outside
  `src/ui/abc/` may import the adapter statically.
- **The URL is the single source of truth** for the variant and transposition:
  `/#/tune/<tune-id>?v=<variant-id>&st=<semitones>`, with `st` from −12 to 12. A shared link
  opens exactly the same variant, key and octave. Invalid `st` values fall back to 0; unknown
  tunes or variants show a not-found page. Controls replace the URL (no history entry per step).
- **Key logic in the domain.** `src/domain/key.ts` parses `K:`, spells transposed keys with the
  fewest accidentals (sharps on a six-accidental tie) and picks the **nearest offset** (−5 to +6)
  when a key is chosen from the list. Keys it cannot parse (e.g. `K:none`) hide the controls.
- **abcjs does the transposing.** The score is rendered with `visualTranspose`, which moves
  notes, key signature and chord symbols. Two abcjs details need handling:
  - Its synth plays the _written_ key unless `midiTranspose` is also set, because the sequencer
    subtracts `visualTranspose`. The adapter passes both, and a test checks the audio pitches
    against real abcjs.
  - It spells a transposed _modal_ key by its tonic alone, e.g. E dorian − 3 as D♭ dorian (7
    flats) instead of C♯ dorian (5 sharps). `scoreAbc()` therefore writes a modal `K:` as the
    major key with the same signature (`Edor` → `D`) before rendering; notes and signature are
    unchanged, abcjs never prints the tonic name, and its major-key spelling matches the domain.
    A test compares every mode and offset.
- **The page shows the metadata, not abcjs.** `scoreAbc()` removes `T:`, `C:`, `R:`, `O:`, `S:`,
  `Z:` and `N:` before rendering. abcjs would otherwise repeat the title and print "Source:",
  "Notes:" and "Transcription:" in English inside the SVG.
- **Fit to width, zoom per device.** abcjs lays the score out for the available width divided by
  the zoom scale (`responsive: 'resize'` and `wrap`), so zooming in gives fewer, larger bars per
  line. On wide screens the score's maximum width also grows with the zoom. The zoom level (5
  steps) is stored in `localStorage`, not in the URL: it depends on the device, not the tune.
- **Paper card.** The score is drawn black on a white card in light and dark mode, so the
  notation is always readable.
- **Playback** uses abcjs's `SynthController` (which drives `CreateSynth`) with the page's own
  translated controls: play/pause, restart and tempo from 50 % to 120 %. Audio starts only from
  the Play button, stops when the variant, transposition or page changes, and a failure shows a
  message without affecting the rest of the page.
- **The soundfont is loaded from abcjs's default remote location** (a GitHub Pages site run by
  the abcjs author). Revisit this in the offline/PWA step, for example by hosting and caching the
  samples ourselves.

## Consequences

- Components and their tests do not depend on abcjs; replacing the renderer means rewriting one
  adapter.
- The home page stays small; the first tune page opened needs one extra download.
- Links are stable and shareable. Adding a variant later does not change what a link shows,
  because the app writes `v` explicitly once a player changes anything.
- The `K:` rewrite and the audio option depend on abcjs internals; the adapter tests will catch
  a behaviour change on upgrade.
- Playback needs network access to the soundfont host, and does not yet work offline.
