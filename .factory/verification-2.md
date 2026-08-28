# Independent verification 2 — PASS

Verified 28 August 2026 against candidate commit
`ef50e4487af00f618872fe1ddf7de44809b80fee` and production
<https://bird-audio-slicer.sociobot.in>.

## Verdict

**PASS.** The repaired candidate satisfies the researched brief's smallest
useful product: it locally inspects WAV/FLAC, creates fixed and silence-aware
resume-safe WAV queues with manifests and optional spectrograms, preserves the
source file, redacts location-bearing source names and paths by default, and
is available from a production deployment that exactly matches the candidate
site artifact. No P0, P1, P2, serious, or critical defects were found.

This is a fresh verification, not a confirmation of the prior handoff. In
particular, the three failures in `verification-1.md` do not reproduce:

- Default exported CLI and browser-preview manifests set `source.name` and
  `source.path` to `null`; a test filename containing `51.501N_-0.142W` was
  absent from the exported manifest.
- `--json` argument-validation failures emit precisely one JSON object on
  stdout, no stderr, and exit 2.
- The live host serves the declared security headers and immutable caching for
  hashed assets.

## Reproducible environment and quality gates

Clean checkout: `/tmp/nightjar-qa-ss8OaR`, cloned from the repository and
checked out directly at the candidate SHA with an initially empty worktree.
Node/npm, stable Rust, Chromium supplied for Playwright 1.58.2, and Lighthouse
13.4.1 were used.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 22 packages audited, 0 vulnerabilities |
| `npm test` | PASS; 3 Rust unit, 6 Rust CLI integration, 4 Node planner, and 2 Playwright tests passed |
| `npm run build` | PASS; generated `dist/site` and 1.4 MB `dist/bin/nightjar` |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `cargo package --allow-dirty` | PASS; 45 files, 249.8 KiB (70.8 KiB compressed), clean unpack/compile passed |
| Clean consumer | PASS; installed the packaged crate with `cargo install --path target/package/nightjar-slicer-0.1.0 --root /tmp/nightjar-consumer-5qX3Fv --locked` |

The clean consumer's installed `nightjar --version` returned `nightjar 0.1.0`;
`--json inspect short.flac` returned FLAC metadata; and invalid
`--chunk-seconds 9` returned the documented single JSON error and exit 2.
The package was not published.

## CLI acceptance exercise

A generated 25-second, stereo, 8 kHz WAV named
`SecretMarsh_51.501N_-0.142W.wav` was used for the end-to-end path.

- `--json inspect` reported WAV, 8 kHz, two channels, 200,000 frames, and
  25.0 seconds.
- Fixed 10-second slicing produced exactly three ready PCM WAV clips, three
  SVG spectrograms, `manifest.json`, `queue.csv`, and the private checkpoint:
  ranges were 0–10, 10–20, and 20–25 seconds.
- Its source SHA-256 before and after slicing was
  `fd0a1422d64d78d5d7e0aac5111189b698c7b10663a4428e6230ba24535875cb`.
  The exported manifest had `source.name: null` and `source.path: null` and
  did not contain the sensitive test filename.
- A repeat reused all three clips. Replacing clip 2 with `broken` caused the
  next run to reuse two and repair the damaged clip. An incompatible plan
  exited 4 with JSON; `--force` then safely regenerated the plan.
- Silence-aware slicing with a two-second search window completed with
  boundaries at 0, 8.25, 16.25, and 25 seconds, demonstrating moved quiet
  boundaries rather than fixed cuts.
- FLAC was independently exercised using
  `https://samples.ffmpeg.org/flac/short.flac` (20,547 bytes, 11,025 Hz, mono,
  0.641995 seconds). Inspect and slice succeeded; `--no-thumbnails` correctly
  emitted `spectrogram: null`.
- Corrupt audio and a missing input each returned one stdout JSON error, no
  stderr, and exit 3. Invalid chunk length 9 returned JSON/no stderr/exit 2.

For the recording-scale boundary, a valid sparse 4,000,000,000-byte PCM WAV
was sliced at the maximum 3,600-second setting with `--no-thumbnails`. It
completed successfully into 70 clips totaling 4,000,003,036 bytes (the
difference is WAV headers), with a resume-safe manifest. A separate 256 MiB
streaming WAV run measured a 3,440 KiB peak process RSS by 50 ms polling.
The 4 GB file is synthetic silence, so this supports the streaming/memory
path but is not a substitute for a real field-recording benchmark or pilots.

## Production, privacy, browser, and performance checks

The deployed homepage HTML SHA-256 was
`285ff9a4bf5f9ca369034d9b9d18d03ed393b6722d799a7c075e02e7b05c220d`,
identical to this candidate build. The live referenced homepage JS/CSS, service
worker, hero image, mark, `robots.txt`, `sitemap.xml`, `/privacy/`, and
`/terms/` also matched their corresponding `dist/site` bytes.

- Live `/`, `/privacy/`, `/terms/`, and `/sw.js` returned 200. The homepage
  and legal pages use `max-age=30`; hashed assets and the hero use
  `Cache-Control: public, max-age=31536000, immutable`.
- Every checked live response carried `Referrer-Policy: no-referrer`,
  `X-Content-Type-Options: nosniff`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and the
  declared same-origin CSP. HSTS was also present.
- Fresh live Chromium checks at 1440×900 and 390×844 found a title, `lang=en`,
  exactly one H1, and a main landmark. The first Tab focuses the skip link;
  its focused outline is a visible 3 px dawn-orange solid ring. No visible
  controls were below 44 px tall, and the 390 px page had no document
  horizontal overflow.
- Desktop keyboard use exercised empty-file recovery, out-of-range 9-second
  recovery, valid WAV planning, and manifest download. The downloaded browser
  manifest redacted the sensitive filename and path. There were no page
  errors, console errors/warnings, cookies, local/session storage entries, or
  third-party network requests on either viewport.
- `prefers-reduced-motion: reduce` changed the hero duration to 0.01 ms.
  Axe-core 4.13, tags `wcag2a,wcag2aa,wcag21aa`, reported zero violations on
  desktop and 390 px mobile. The service worker became active (`nightjar-shell-v2`),
  `registration.update()` produced no waiting worker, and an offline reload
  rendered the H1 successfully.
- Production asset sizes are 5,971 bytes initial home JS, 13,176 bytes CSS,
  no webfonts, and a 93,500-byte hero WebP: all within the specified budgets.
  Lighthouse mobile (with full-page screenshot disabled to avoid an unrelated
  headless Chromium screenshot crash) reported Performance 100, Accessibility
  100, FCP 0.9 s, LCP 1.4 s, CLS 0, and TBT 70 ms.

## Defects and residual limits

No defects found at P0/P1/P2/P3 severity.

The synthetic 4 GB run cannot establish throughput on a fragmented real
AudioMoth/field-recorder file, nor can repository QA establish the ten-pilot
user success measure. Those are release/field follow-ups, not candidate
defects. The product's default thumbnail-enabled workflow was verified on WAV;
the 4 GB scale run deliberately used `--no-thumbnails` to isolate the memory
ceiling path.
