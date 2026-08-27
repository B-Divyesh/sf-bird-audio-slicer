# Nightjar Slicer v0.1.0 handoff

Work order: `bird-audio-slicer-build-1`<br>
Completed: 27 August 2026<br>
Deployment target: static site in `dist/site`; release CLI in `dist/bin/nightjar`

## What was built

- A Rust single-binary CLI named `nightjar` with concise `inspect` and `slice`
  commands, useful `--help`, stable exit codes, and global `--json` output.
- Streaming WAV/FLAC decoding into interoperable 16-bit PCM WAV clips. The
  source is opened read-only and never modified.
- Fixed-length slicing and silence-aware slicing that chooses the lowest-RMS
  500 ms window near each desired boundary.
- Atomic `.part` clip publication and `.nightjar-state.json` checkpoints.
  Reruns verify output byte lengths and thumbnails, reuse valid clips, and
  regenerate missing or damaged clips.
- Privacy-safe `nightjar-manifest/v1` JSON and CSV queue exports. Source paths
  and recording metadata are removed by default; paths appear only with
  `--include-source-path`.
- A real frequency/time SVG spectrogram for every clip, produced from bounded
  256-sample analysis windows while audio streams through the writer.
- A responsive static documentation site with a local WAV/RF64 header planner,
  downloadable redacted preview manifest, empty/loading/error/offline states,
  keyboard-visible focus, privacy and terms pages, and an offline service
  worker shell.
- A product-specific surreal editorial visual system and an original generated
  wetland/tape hero. The deployed WebP is 93,500 bytes; its source, prompt, and
  factory-image metadata are retained under `.factory/assets` and documented
  in `.factory/design.md`.
- README usage contract, MIT license, changelog, deterministic Cargo/npm lock
  files, and release/package scripts.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo clippy --all-targets --all-features -- -D warnings
cargo package --allow-dirty
```

`npm run build:site` is the exact static deployment command and writes an
`index.html` at `dist/site/index.html`. `npm run build` additionally compiles
and stages `dist/bin/nightjar`.

Verification completed in the work-order container:

- `npm test`: 7 Rust tests and 3 browser-planner unit tests passed. Coverage
  includes documented inspect/slice calls, JSON errors, privacy redaction,
  fixed and moved silence boundaries, SVG output, complete resume, deliberate
  clip corruption, and selective repair.
- `cargo clippy --all-targets --all-features -- -D warnings`: clean.
- `npm run build`: clean release build; staged binary size 1,379,552 bytes.
- `cargo package --allow-dirty`: package creation and clean unpacked compile
  verification passed. Publishing was intentionally not performed.
- A small upstream Xiph FLAC fixture was inspected and sliced end to end into a
  WAV clip, spectrogram, state, JSON manifest, and CSV queue.
- `/opt/fleet/lib/verify-url.sh` passed `/`, `/privacy/`, and `/terms/`: HTTP
  200, no page/console errors, one h1, valid title/language/main landmark, no
  missing alt text, and no unnamed buttons.
- Playwright mobile (390 × 844) exercised local file planning, manifest
  download, service-worker control, a full offline reload, and the visible
  offline state without console errors.
- Axe-core WCAG 2 A/AA and 2.1 AA audit at 390 px: **0 violations**.
- Lighthouse mobile: **100 performance / 100 accessibility / 100 best
  practices / 100 SEO**. FCP 0.9 s, LCP 1.7 s, total blocking time 40 ms, CLS 0.
  INP is not reported without real-user interaction; scripted planner feedback
  was immediate.
- Initial production assets: 6.7 KB JavaScript, 13.2 KB CSS, no fonts, and a
  93.5 KB high-priority hero—within the 200/50/120/300 KB budgets.

## Operational notes

- Silence mode intentionally makes one streaming energy pass before extraction;
  its boundary plan is cached, so resume does not repeat that scan.
- Working memory is bounded by decoder packets, one WAV writer, 256 samples,
  and up to 72 × 32 spectrogram cells. It does not scale with recording length.
- Existing output state must match input fingerprint and settings. Nightjar
  explains the mismatch and requires a different directory or explicit
  `--force`; there are no interactive prompts.
- The website performs no uploads, analytics, storage, remote font loading, or
  third-party runtime requests.

## Known gaps and next steps

- The disposable build environment did not contain the brief's 4 GB reference
  recordings, so a full 4 GB wall-clock/RSS benchmark remains a release-lab
  check. The streaming implementation is structurally independent of source
  size and is designed to remain far below the 1 GB ceiling.
- The success target of ten pilot users submitting a selected chunk requires
  post-deployment field recruitment and cannot be measured in-repository.
- Release binaries are ready to build but are not published; the factory owns
  registry and release credentials. Run `cargo package` or attach the staged
  per-platform binary during the release workflow.
