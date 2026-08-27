# Independent verification 1 — FAIL

Verified 27 August 2026 against candidate commit
`6e0a3b70e65472613cbec3b907af5249d1454677` and
<https://bird-audio-slicer.sociobot.in>.

## Verdict

**FAIL.** The default CLI manifest leaks a potentially sensitive recording
location when that location is part of the input filename. This contradicts
the brief's requirement that sensitive-location metadata be removed by
default, as well as the README and privacy-page statement that recording
metadata is omitted by default.

The live deployment is fresh and is the candidate: SHA-256 matched for its
HTML, all four hashed JS/CSS assets, service worker, hero image, mark,
`robots.txt`, and `sitemap.xml` against a clean production build from this
commit.

## Environment and reproducible checks

Clean clone: `/tmp/nightjar-qa-E5iDqy`, checked out directly at the candidate
SHA. Node/npm and stable Rust were used.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 0 npm vulnerabilities reported |
| `npm test` | PASS; 7 Rust tests + 3 Node WAV-planner tests; production site build also passed |
| `npm run build` | PASS; emits `dist/site` and `dist/bin/nightjar` (1.4 MB) |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `cargo package --allow-dirty` | PASS; 41,886-byte crate, clean unpack/compile verification passed |
| Clean consumer | PASS; extracted the `.crate`, `cargo install --path ... --root ... --locked`, then ran `nightjar 0.1.0` and `nightjar --json inspect short.flac` |

## CLI end-to-end evidence

Using a generated 25-second, stereo 8 kHz WAV with a 10-second plan:

- `inspect` returned WAV, 8 kHz, two channels, 25 seconds.
- Fixed slicing produced three PCM WAV clips, three SVG spectrograms,
  `manifest.json`, `queue.csv`, and checkpoint. Input SHA-256 was identical
  before and after slicing.
- A second identical run reused all 3 clips. After replacing clip 2 with
  `broken`, the next run reused 2 and repaired the damaged clip. An
  incompatible plan returned documented exit 4; `--force` made the new plan.
- Silence mode completed with three chunks; FLAC inspection and slicing also
  completed using the independent `samples.ffmpeg.org/flac/short.flac`
  fixture (FLAC, 11,025 Hz, one channel, 0.642 seconds), producing a WAV,
  SVG, JSON, CSV, and checkpoint.
- Invalid `--chunk-seconds 9` returned exit 2; a corrupt WAV returned exit 3
  with machine-readable JSON. The browser planner showed recovery text for a
  malformed WAV header and then successfully planned/downloaded a valid WAV.

### P1 — default manifest leaks sensitive filename/location (release blocker)

Command input was named `SecretMarsh_51.501N_-0.142W.wav`. Default output
(`nightjar --json slice INPUT --output queue --chunk-seconds 10`) contained:

```json
"source": {
  "name": "SecretMarsh_51.501N_-0.142W.wav",
  "path": null,
  "file_bytes": 800044,
  "sample_rate_hz": 8000,
  "channels": 2,
  "duration_seconds": 25.0
}
```

The path is correctly redacted, but the filename itself carries the precise
location. It is also recording metadata, contrary to the published privacy
claim. `--include-source-path` correctly adds the full path only when asked.
Redact or replace `source.name` (and reconcile the documented manifest
contract) before release.

### P2 — `--json` does not produce JSON for argument-validation failures

`nightjar --json slice INPUT --output queue --chunk-seconds 9` exited 2 with a
helpful Clap diagnostic on stderr but emitted an empty stdout. The advertised
global option says it prints one machine-readable JSON object, and runtime
errors do so. Make parse/validation failures follow the same scripting
contract or narrow the documentation.

### P2 — live response policy and caching configuration is not applied

The repository's `site/public/_headers` requests immutable caching for hashed
assets and sets `Permissions-Policy`/`Referrer-Policy: no-referrer`. The live
site serves every checked asset, including
`/assets/home-D1aN0Kuc.js` and `/nightjar-tape.webp`, as
`Cache-Control: public, must-revalidate, max-age=30`; it has no
`Permissions-Policy` or CSP and instead sends
`Referrer-Policy: strict-origin-when-cross-origin`. Configure the deployment
to honour the intended static headers, particularly immutable asset caching
and the declared permissions policy.

## Browser, accessibility, performance, and privacy evidence

- Local production artifact exercised at desktop 1440 x 900 and mobile 390 x
  844. Both selected a valid local WAV, planned three ranges, and downloaded
  `nightjar-plan.json`; visually inspected mobile composition had no clipping
  or overlap. Empty and malformed-file errors were visible and recoverable.
- Keyboard smoke test reached the skip link first; it has a visible 3 px focus
  outline with 4 px offset. Interactive visible controls measured at least 44
  px high. There were no page errors or console errors.
- `prefers-reduced-motion: reduce` yielded `scroll-behavior: auto` and a
  `0.01ms` hero animation. A controlled service worker reloaded the shell
  offline and displayed the offline banner without errors.
- Browser network capture on page load made no third-party requests. No
  runtime telemetry, upload, cookie/local-storage use, remote font, or remote
  script was observed. The browser planner reads local data and creates the
  manifest download locally.
- Axe-core 4.13 at 390 px, tags `wcag2a,wcag2aa,wcag21aa`: **0 violations**,
  25 passing rules; only `aria-prohibited-attr` and `color-contrast` were
  headless-incomplete. Manual sRGB checks of all documented text/UI colors on
  both night backgrounds were 5.41:1 or higher (supporting text 8.23:1+).
- Build sizes: initial home JS 5,812 bytes (6,674 bytes total JS), CSS 13,176
  bytes, no webfonts, and 93,500-byte hero WebP. All are inside the stated
  budgets.
- Live URL returned 200 for `/`, `/privacy/`, `/terms/`, and `/sw.js`; its
  homepage and all checked static assets exactly matched the candidate build.

## Remaining coverage limit

No 4 GB reference recording was available in this disposable verification
environment, so the 4 GB wall-clock/RSS ceiling has not been independently
measured. The CLI's normal and recovery behavior was verified on WAV and FLAC,
but release approval also needs that representative 4 GB benchmark after the
privacy defect is corrected.
