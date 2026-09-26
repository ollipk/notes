# 2. ABC notation as the tune format

Status: Accepted (file layout and validation refined by [ADR 7](0007-tune-file-format.md))

## Context

Tunes must be stored as plain, reviewable text that humans can write and that software can render
and transpose. The folk community already shares many tunes in a text format.

## Decision

Store tunes in [ABC notation](https://abcnotation.com/), one tune per `.abc` file in `tunes/`.
Rendering will use a library (abcjs) added with the rendering feature.

## Consequences

- Tunes are diff-friendly and can be reviewed in pull requests.
- ABC is widely known among folk musicians and supported by many tools.
- ABC has dialects and loose parsing; the domain model must tolerate variation.
