# Adversarial first-read review 3 — PASS

Reviewed 29 August 2026 against commit `6dc0861765c24b1eb0a5ab607666dc664507eb92` and <https://bird-audio-slicer.sociobot.in>.

## Verdict

**PASS.** Zero findings remain. The product is clear, tryable, and honest on a phone and desktop. There are no untested registered claims and no claim-like landing-page or README statement without a matching entry in `.factory/claims.json`.

## Cold first screen

Fresh browser contexts, with no scrolling or retained storage, were checked at 390 × 844 and 1440 × 900.

| Question | Phone | Desktop |
| --- | --- | --- |
| What does it do? | Splits long bird recordings into WAV clips. | Splits long bird recordings into WAV clips with a local CLI. |
| For whom? | AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer. | The same audience is explicit. |
| What first? | Click **Try it with sample data**; it loads a 20-second recording and shows its clip plan. | The same action is primary. |

Exact first-screen copy: “Split long bird recordings into WAV clips”; “For AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer.”; “Try it with sample data”; and “Loads a 20-second field recording and shows its clip plan.” On the phone these, plus all three plain facts, were above the fold with no horizontal overflow.

## Demo and sandbox

The landing action reached `/demo/` in one click. Its first product screen already showed “Dawn Marsh sample”, “2 clips from 00:00:20”, two planned WAV rows, recording facts, a scrollable clip table, and “Download clip plan.” The persistent banner stated “Demo — sample data, nothing is saved” and provided **Reset demo** and **Start for real**.

At 390 px, the populated output was 324 px wide inside the viewport. Its table had a 292 px client width, a 520 px scroll width, and `overflow-x: auto`. The banner stayed at y=0 after a 1,200 px scroll attempt. Reset restored the sample; Start for real opened `/#planner`, removed the banner, and showed “No recording selected.”

Pre-seeded `localStorage` (`real:sentinel=keep-me`) was unchanged after demo entry, reset, and exit. Demo activity wrote no cookies, local storage, session storage, or IndexedDB entries. All observed browser requests were same-origin. Both `/demo/` and `/?demo=1` reloaded offline after one online visit.

From an empty temporary working directory, `nightjar demo` left that directory empty and created a unique `/tmp/nightjar-demo-*` output directory with two WAV clips, two SVGs, `manifest.json`, `queue.csv`, and `.nightjar-state.json`.

## Claims and quality gates

Fresh clone: `/tmp/nightjar-review3-clean-ChXBxK`. `npm ci` reported zero vulnerabilities. Every command in `.factory/claims.json` passed individually:

| Claims | Result |
| --- | --- |
| `browser-demo-one-click`, `browser-private`, `offline-demo`, `site-structure` | PASS |
| `cli-demo`, `cli-core-outputs`, `resume-repair`, `silence-boundaries` | PASS |
| `fixed-three-minute`, `inspect-details`, `clip-length-limits`, `manifest-contract` | PASS |
| `cli-options`, `birdnet-selection`, `package-scope`, `build-artifacts` | PASS |

`npm test` passed (3 Rust unit, 9 Rust integration, 4 WAV-planner, 12 claim, and 5 Playwright tests). `npm run build` produced `dist/site` and one `dist/bin/nightjar` binary. `cargo fmt --check`, strict Clippy, and `cargo package --allow-dirty` passed.

The claims registry covers every public outcome/privacy/performance/availability statement in the landing page and README: browser read/privacy, demo isolation and offline use, WAV/FLAC output formats, resume and repair, silence boundaries, fixed clips, inspection, limits, manifests/redaction, options/exit codes, BirdNET selection, free/MIT/package scope, and build artifacts. No unlisted claim was found. The legal-page statements that the host *may* retain short-lived logs and that the site *may* change are disclosures and limitations, not product promises.

## Structure, accessibility, links, and identity

`/`, `/demo/`, `/?demo=1`, `/privacy/`, and `/terms/` returned 200. An unknown route returned a Nightjar-designed 404 with status 404, title “Page not found — Nightjar Slicer”, H1 “Page not found”, and a return link. All routes have the expected title pattern, one H1, one main, `lang=en`, a description, canonical, OG/Twitter data, favicon, and touch icon. `?demo=1` is the documented alternate demo entry and canonicalizes to `/demo/`.

At 390 and 1440 px, Back from `#install` restored root at `scrollY=0` with visible focused `#hero-title`; Forward restored visible focused `#install-title`. The route live region announced the heading. Axe 4.13 (`wcag2a`, `wcag2aa`, `wcag21aa`) reported zero violations on all routes at 390 px. No third-party requests, page errors, code-generated console errors, or dead links were found. Chromium reports the expected failed-resource network status for the intentionally 404 navigation; it is not an application error.

The original moonlit cut-paper wetland, field-note typography, offset editorial grid, and night palette match `.factory/design.md` and remain distinct from a generic SaaS template. No AI step is implied by the brief: identification belongs in BirdNET Analyzer, while Nightjar’s tested `select` command provides the implied export handoff.

## Copy audit

Counts are whitespace-delimited; code-block examples and dynamic table values are excluded. Every heading, button, label, status, empty/error state, and prose sentence was checked. No entry exceeds 22 words; none uses a banned marketing adjective, unexplained jargon, a mood heading, a useless slogan, inconsistent terminology, or a non-result-naming button. The full landing inventory and terminology table are retained in `.factory/copy-audit.md`; this review independently reconfirmed every entry against the live DOM.

### Landing-page sentence inventory

| Text | Words |
| --- | ---: |
| Split long bird recordings into WAV clips | 7 |
| For AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer. | 10 |
| Loads a 20-second field recording and shows its clip plan. | 10 |
| The CLI writes WAV clips before identification. | 7 |
| The planner reads at most 256 KiB from your WAV. | 10 |
| It does not upload or store your file. | 8 |
| Choose a PCM or float WAV file. | 7 |
| Enter 10 to 3,600 seconds. | 6 |
| Your clip times will appear here. | 6 |
| The downloaded plan omits your recording name and path. | 9 |
| Print its duration, channels, sample rate, and file size. | 9 |
| Use fixed times or move boundaries to a quiet half-second nearby. | 11 |
| Nightjar reuses complete clips and repairs missing or incomplete clips. | 10 |
| Copy chosen clips into one folder, then choose that folder in BirdNET Analyzer. | 13 |
| Install from source with Rust 1.85 or newer. | 8 |
| `nightjar demo` uses the same 20-second recording as the browser demo. | 11 |
| Nightjar does not include a bird-identification model. | 7 |
| It writes clips, manifests, and spectrograms for your review. | 9 |
| Split long bird recordings into clips locally. | 7 |
| This isolated sample shows two planned WAV clips. | 8 |
| Reset it any time or start with your recording. | 9 |
| The bundled sample could not be loaded. | 7 |
| Reload the page and try again. | 6 |
| Choose a complete PCM or float WAV recording, then try again. | 11 |
| This file is too small to be a complete WAV recording. | 11 |
| Choose another file. | 3 |
| This is not a supported WAV file. | 7 |
| Choose a PCM or float WAV recording. | 7 |
| Nightjar could not read this WAV. | 6 |
| Export it as a standard PCM WAV and try again. | 10 |
| Encoding [number] is not supported here. | 6 |
| Choose a PCM or float WAV, or run `nightjar inspect FILE` in the CLI. | 13 |
| This WAV has invalid audio details. | 6 |
| Re-export it as PCM WAV or choose another recording. | 9 |
| This WAV contains no playable audio. | 6 |
| Enter a clip length from 10 to 3,600 seconds. | 9 |

All remaining landing text is labels or result-naming actions, counted in `.factory/copy-audit.md`: Skip to main content (4); Offline — the saved demo and guide remain available. (9); Demo — sample data, nothing is saved (7); Reset demo (2); Start for real (3); Nightjar / Slicer (3); Demo/Privacy/Terms (1 each); Try it with sample data (5); Install the CLI (3); Runs locally (2); Keeps the original recording (4); Free and MIT licensed (4); Browser clip planner (3); Plan fixed WAV clips in your browser (7); WAV recording (2); Clip length (2); Plan WAV clips (3); No recording selected (3); Reading WAV details… (3); Clip plan ready (3); Showing 8 of [N] planned clips. (6); Showing all [N] planned clips. (5); Download clip plan (3); How it works (3); Prepare clips for BirdNET Analyzer (5); Nightjar creates local files. (4); Identification remains in BirdNET Analyzer. (5); Inspect the recording (3); Split it into clips (4); Continue an interrupted batch (4); Select clips for analysis (4); Install from source (3); Install and run Nightjar (4); Copy install command (3); The install command is on your clipboard. (7); Clipboard access was blocked. (4); Select the install command and copy it. (7); Recorded demo session (3); Run the bundled sample (4); What Nightjar does not do (5); Identification stays in your analyzer (5); Project on GitHub (external) (4); Built by Param Factory · v0.1.0 · build polish-2 (8); Explore a 20-second bird recording (5).

### README sentence inventory

| Text | Words |
| --- | ---: |
| Nightjar Slicer splits long WAV and FLAC bird recordings into WAV clips. | 12 |
| It also writes a JSON manifest, CSV queue, and SVG spectrograms. | 11 |
| It is for AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer. | 13 |
| Nightjar does not identify birds or include a bird-identification model. | 10 |
| The sample command needs no input file. | 7 |
| It writes two clips from the bundled 20-second recording into a new temporary directory. | 14 |
| The browser demo is at `https://bird-audio-slicer.sociobot.in/demo/`. | 6 |
| It shows the same recording and saves nothing to your browser data. | 12 |
| Installation from source requires Rust 1.85 or newer. | 8 |
| Nightjar accepts PCM WAV, float WAV, and FLAC input. | 9 |
| It writes decodable 16-bit PCM WAV clips. | 7 |
| Clip lengths can range from 10 to 3,600 seconds. | 9 |
| Each output directory contains these files: | 6 |
| Run the same command again to continue an interrupted batch. | 10 |
| Nightjar reuses complete clips and repairs missing or incomplete clips. | 10 |
| Use `--no-thumbnails` to omit SVG spectrograms. | 6 |
| Use `--force` to replace an incompatible clip plan. | 8 |
| Use `--include-source-path` only when you want the manifest to include the source name and path. | 15 |
| Choose clip numbers from `queue.csv`, then copy those clips into a separate folder: | 13 |
| Nightjar writes the selected WAV files and `selection.csv` into that folder. | 11 |
| In BirdNET Analyzer, choose `birdnet-selection` as the input folder. | 9 |
| The `--json` option prints one JSON object to standard output. | 10 |
| The command completed. | 3 |
| Use the output files. | 4 |
| The command arguments are invalid. | 5 |
| Correct the named argument. | 4 |
| The recording cannot be read. | 5 |
| Check its path and format. | 5 |
| The output cannot be created safely. | 6 |
| Choose another directory or use `--force` when instructed. | 8 |
| This command lists ready clip names: | 6 |
| Nightjar does not change the source recording. | 7 |
| Manifests omit the source name, path, and embedded recording metadata by default. | 12 |
| The CLI has no network client or telemetry dependency. | 9 |
| The browser planner reads at most 256 KiB from your selected WAV. | 12 |
| It does not upload or retain that file. | 8 |
| The demo works offline after its first visit. | 8 |
| `npm run build` creates the static site in `dist/site` and the CLI in `dist/bin`. | 14 |
| Nightjar Slicer uses the MIT License. | 6 |

README headings/list labels are also clear and within the limit: Nightjar Slicer (2); Try the sample (3); Install (1); Inspect and split (3); Print recording details: (3); Create fixed three-minute clips: (4); Move each boundary to the quietest nearby half-second: (8); `manifest.json` using schema `nightjar-manifest/v1` (4); `queue.csv` with one time range per clip (7); numbered WAV clips with relative start timestamps (7); SVG spectrograms (2); a `.nightjar-state.json` file used to continue interrupted runs (8); Send selected clips to BirdNET Analyzer (6); Scripts and exit codes (4); Privacy (1); Develop and verify (3).

## Earlier findings and handoff verification

I read every earlier review, polish record, verification report, and handoff. Every prior finding was checked in current source and on the live site where relevant.

| Earlier IDs | Result | Confirmation |
| --- | --- | --- |
| F-1-1 | PASS | Literal job, audience, sample path, and facts fit the phone first screen. |
| F-1-2; F-2-1 | PASS | The demo is populated, isolated, scrollable at 390 px, sticky, resettable, exitable, and offline-capable. |
| F-1-3 through F-1-6 | PASS | Product 404, claim registry, offline demo, and core outputs pass. |
| F-1-7 through F-1-17 | PASS | Unsupported scale copy is absent; core, resume, silence, inspect, and interruption checks pass. |
| F-1-18 through F-1-23 | PASS | Browser byte limit, no storage/third-party requests, limits, and redaction pass. |
| F-1-24 through F-1-46 | PASS | Package/privacy scope and every documented CLI format, output, manifest, resume, option, and exit behavior pass. |
| F-1-47 through F-1-71 | PASS | Demo/CLI sandbox, source integrity, 404, offline cache, metadata, navigation, install, and BirdNET selection stay fixed. |
| F-1-72 through F-1-102 | PASS | Literal headings, consistent terms, action labels, README, and recovery/error wording remain fixed. |
| F-2-2 | PASS | Back and Forward restore visible focused headings at 390 and 1440 px. |
| F-2-3 through F-2-8 | PASS | Unlisted release/readiness copy remains removed; empty state, button, checkpoint, and 404 copy remain repaired. |

The defects recorded by `verification-1.md` also remain fixed: default manifests redact source name/path, JSON validation emits machine-readable output, and live security/cache headers are present. `verification-2.md`, `polish-1.md`, `polish-2.md`, and the prior handoff have no regression after this complete rerun.

## What would make this perfect

Nothing actionable remains. Keep the registry synchronized with future copy changes and repeat the clean-clone/live checks before release.
