# Contributing

Thank you for helping. This project is non-profit and maintained by volunteers.

## Workflow

1. **Issue.** Open or pick an issue. For features, use the feature template and describe the
   behaviour as scenarios (Given/When/Then). One issue = one small PR.
2. **Branch.** Create a branch from `main`.
3. **Test first.** Turn the scenarios into tests, then write the code.
4. **Pull request.** Open a PR that links the issue and says how you tested it. Explain any new
   dependency.
5. **Review.** A maintainer reviews. Address comments with new commits.

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`,
`ci:`, `docs:`, `test:`, `refactor:`.

## Definition of done

```sh
npm run check
```

It runs format:check, lint, typecheck, test, depcheck and build in that order and must pass
locally and in CI. New user-visible text goes into `apps/web/src/locales/en.json` **and every other
locale** in the same PR.

## AI-assisted contributions

AI-assisted contributions are welcome. Agent instructions live in
[`.github/copilot-instructions.md`](.github/copilot-instructions.md). You review, understand and
own everything in your PR, whoever or whatever wrote it.

## Tune data rule

Tunes in `tunes/` are released under CC0 1.0, so we must be sure we are allowed to publish them.

- Only contribute transcriptions **you made yourself**, or material that is in the **public
  domain both in its country of origin and in your own country**.
- **Never** copy from published tune books, websites or other
  copyrighted editions, even if the tune itself is traditional. An edition's specific
  transcription can be protected.
- **Always record the source**: who played or taught it, a recording, or the public-domain
  publication it comes from.

See [`tunes/README.md`](tunes/README.md) for the file layout and format. `npm run check` validates
every tune file and lists all problems with file and line.

## Licenses

By contributing you agree that your code is licensed under [MIT](LICENSE) and your tune data
under [CC0 1.0](tunes/LICENSE).
