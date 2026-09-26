# 9. Jam-first UX: search, score-first tune page, focus mode and print

Status: Accepted

Refines the tune page layout of [ADR 8](0008-rendering-transposition-playback.md); its rendering,
transposition and playback decisions still hold. [ADR 10](0010-chords-and-player-settings.md) adds
the View control and chord views.

## Context

The app's real use is an open jam: a crowded, dim, noisy bar, a phone in one hand, often an
instrument in the other. A player must find and open a tune in seconds and read it without
scrolling or fiddling. The first tune page put the title, metadata and every control above the
score, so on a phone the notation started below the fold.

Guiding rule: **fewest taps, largest targets, the score first, everything else secondary.**

## Decision

- **Search first.** The home page opens with a large search field that takes focus on load. The
  query lives in the URL (`/#/?q=…`, updated with `replace`), so going back from a tune shows the
  same results. Enter opens the first result. Result rows are at least 56 px tall and the whole
  row is the link.
  - Mobile browsers usually show the on-screen keyboard only after a tap, whatever the page
    does. The field is focused anyway, so desktop and hardware keyboards can type at once.
  - The field keeps its own text and writes the URL after it. Reading the text back from the URL
    dropped letters typed faster than the router updated.
- **Search normalisation and ranking** (`searchTunes` in `src/domain/search.ts`).
  - Case and diacritics are ignored: NFD with combining marks removed, so "sakkijarvi" finds
    "Säkkijärvi". A small fold table covers letters that NFD does not decompose: ø→o, æ→ae, œ→oe,
    ł→l, đ→d, ß→ss.
  - Searched fields: every title of every variant, the region, and the tune type label in the
    current language. The UI passes the labels in, so the domain stays i18n-free.
  - Every word of the query must match somewhere.
  - Ranking: the primary title starts with the query, then any title does, then a word in a title
    starts with a query word, then any other match. Ties are alphabetical, in catalog order.
- **Score-first tune page.**
  - A one-line header: a back button and the truncated title. Then the score, at full width.
    Then alternate titles, metadata, source, transcriber and notes.
  - A **bottom bar** fixed within thumb reach holds transpose (− / key / +), play/pause and
    More. It clears the iPhone home indicator with `env(safe-area-inset-bottom)`, which needs
    `viewport-fit=cover` in `index.html`. The page is padded by the bar's height so nothing
    hides behind it.
  - **More** opens a bottom sheet with the variant, the key list, reset, zoom, tempo, restart,
    Print and Full screen. It is not a native `<dialog>`, because jsdom has no `showModal()`.
  - Back goes back in history when the home page was shown earlier in this visit, restoring the
    query. From a shared link it opens the home page.
- **48 px minimum** for every touch target, with a translated `aria-label` on icon-only buttons.
- **Focus mode.** Only the score on its white paper, filling the screen.
  - It uses the Fullscreen API where available (Android Chrome, desktop). Elsewhere (iPhone
    Safari) a CSS fallback covers the viewport and looks the same.
  - A small semi-transparent 48 px button in the corner, or Escape, exits.
  - Leaving browser full screen with the system gesture also leaves focus mode, because the page
    listens to `fullscreenchange`.
  - Focus mode is not kept in the URL: it is a moment's choice, not part of a shared link.
- **Screen wake lock.** While a tune page is open, the page requests `navigator.wakeLock` and
  requests it again when the page becomes visible (browsers drop it when hidden). It releases the
  lock on leaving the page, and fails silently where the API is unsupported or refused.
- **Print with a stylesheet, not a separate page.**
  - Print calls `window.print()`. The `@media print` rules in `src/app/index.css` and Tailwind
    `print:` utilities leave only the title, alternate titles, one line with type, origin and the
    displayed key (with the offset when transposed), the score, and a footer. The footer has the
    source, transcriber and the tune's address, so a reader of the paper can find it again.
  - Output is black on white regardless of dark mode.
  - The printout uses the displayed key and variant, because it prints the current URL state.
  - On `beforeprint` the score is laid out again for a 700 px page (about the printable width of
    A4 and Letter at 12 mm margins, at scale 1), and scaled to the exact page width. On
    `afterprint` it is restored. A phone therefore prints the same page as a desktop.
  - To keep staff lines whole, abcjs draws **one SVG per staff line** (`oneSvgPerLine`, always on,
    so screen and print share one render path). Each line gets `break-inside: avoid`. abcjs's
    `inline-block` container is made a block in print, because browsers never split an
    inline-block across pages.

## Consequences

- On a phone the score is visible as soon as the tune opens, and transposing and playing need
  only the bottom bar.
- Less frequent settings cost one extra tap (More). That is deliberate.
- Search is linear over the in-memory catalog, which is instant at the current size. Revisit it
  together with eager loading (ADR 7).
- abcjs gives each line's SVG an English `aria-label`. The score container has its own
  translated `role="img"` label, so assistive technology does not read the per-line labels.
- Focus mode, wake lock and the keyboard behaviour on phones depend on browser support. Each
  degrades to a working page.
