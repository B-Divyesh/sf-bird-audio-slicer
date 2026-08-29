# Adversarial first-read review 2 — FAIL

Reviewed 29 August 2026 against commit
`cbbc5e63e762ff6c148001e0c5c96de8f96babc6` and
<https://bird-audio-slicer.sociobot.in>.

## Verdict

**FAIL.** There are two blocking regressions, three unlisted claim-like
sentences, and four copy findings. The cold first screen is clear and every
registered claim test passes, but the required phone demo is clipped and loses
its banner while scrolling. Browser Back also leaves the viewport thousands of
pixels away from the heading it focuses.

## Findings

### Blocking

#### F-2-1 / F-1-2 reopened — the phone demo is not fully usable or persistently identified

- Exact location: live `/demo/` at 390 × 844 after “Try it with sample data.”
- Exact text affected: “Demo — sample data, nothing is saved”; “Format”;
  “Size”; “Planned fixed WAV clips”; “Download clip plan.”
- Evidence: `.planner-output` is 552 px wide from x=33 to x=585. Its inner
  result is 520 px wide from x=49 to x=569. The 390 px viewport clips the
  format, size, end/status columns, and result area because `main` hides the
  overflow. The table wrapper is itself 520 px wide, so it does not provide
  an accessible internal horizontal scrollport. After scrolling 1,200 px,
  the demo banner has `top: -154px`; the phone media query changes it from
  `position: sticky` to `position: relative`.
- Why this fails: the required first screen after the one-click action does
  contain realistic sample data, but a phone visitor cannot inspect the full
  result. Once they scroll, the required persistent demo warning and Reset /
  Start-for-real controls disappear. This is a weak demo and reopens F-1-2.
- Concrete fix: give every planner grid child `min-width: 0`, constrain
  `.planner-output` and `.table-wrap` to the available width, and leave the
  520 px table inside the scrollable wrapper. Keep the banner sticky on phone.
  Extend `@claim:browser-demo-one-click` at 390 px to assert that the result
  container stays within the viewport, the table wrapper has its own overflow,
  the download control is reachable, and the banner remains at y=0 after a
  long scroll.

#### F-2-2 / F-1-68 reopened — Back focuses content that remains off screen

- Exact location: live `/`; activate “Install the CLI,” then use browser Back.
- Evidence at 390 px: the start state was `scrollY=0`. The install link moved
  to `#install` and focused `H2#install-title`. Back removed the hash and
  focused `H1#hero-title`, but left `scrollY=2857`; the focused H1 was 2,757 px
  above the viewport. Desktop reproduced at `scrollY=2691` with the H1 2,524 px
  above the viewport. Forward returned focus to the install H2 but did not
  restore a stable section position.
- Why this fails: keyboard and screen-reader users are told that the hero is
  active while the visible page remains near the install section. The prior
  finding explicitly required back/forward scroll and focus restoration, so
  the current focus-only test is incomplete and F-1-68 is half-fixed.
- Concrete fix: manage scroll and focus as one history operation. On a no-hash
  Back state, scroll the hero into view before focusing it; on a hash state,
  scroll the target into view before focusing it. Add mobile and desktop tests
  that assert the active heading and its bounding box are both in the viewport
  after Back and Forward.

### Major

#### F-2-3 — the prebuilt-binary availability claim is unlisted

- Exact quotes: landing install section, “The repository does not offer
  prebuilt binaries.” README, “This repository does not provide prebuilt
  binaries.”
- Why this fails: `.factory/claims.json` has no claim for release availability.
  `@claim:package-scope` checks Rust metadata, the license, model files,
  dependencies, and CLI help; it does not inspect release assets. A visitor may
  rely on this sentence when choosing how to install.
- Concrete fix: remove the remote-state claim and say “Install from source with
  Rust 1.85 or newer.” If release availability must remain, add a claim entry
  and a deterministic release-manifest test.

### Minor

#### F-2-4 — two README readiness requirements are unlisted

- Exact quotes: “Development requires Node.js 20+, npm, and Rust 1.85+.” and
  “The crate is ready for the factory to publish, but this repository does not
  publish it automatically.”
- Why this fails: the Rust minimum is tested, but no claim entry runs the suite
  on Node 20. “Ready” is undefined and no claim test packages or installs the
  crate. Both sentences state conditions a maintainer could rely on.
- Concrete fix: add a tagged Node 20 CI/claim test and a tagged
  `cargo package` plus clean-install test, or remove the unproved versions of
  these sentences. Replace “ready” with the exact completed check.

#### F-2-5 — the empty-state sentence uses unexplained CLI jargon

- Exact quote: landing planner, “Your clip times and redacted manifest will
  appear here.”
- Why this fails: a cold visitor planning clips in a browser is not told what a
  manifest is or what “redacted” removes.
- Concrete rewrite: “Your clip times will appear here. The downloaded plan
  omits your recording name and path.”

#### F-2-6 — the copied-state button stops naming its action

- Exact quote: landing install button after activation, “Install command
  copied.”
- Why this fails: the button remains operable, but its new label is status text
  rather than a result-naming verb. The separate live region already reports
  success.
- Concrete fix: keep the button label “Copy install command” and report “The
  install command is on your clipboard” only in the status region.

#### F-2-7 — the README calls an implementation file “private” without explaining it

- Exact quote: README output list, “a private `.nightjar-state.json`
  checkpoint”.
- Why this fails: “private” could mean encrypted, ignored, or merely internal;
  “checkpoint” does not say why the file exists.
- Concrete rewrite: “a `.nightjar-state.json` file used to continue interrupted
  runs”.

#### F-2-8 — the designed 404 uses a metaphor as its H1

- Exact quote: live unknown route H1, “This recording path ends here”.
- Why this fails: the heading does not name the page when read out of context,
  and “path” doubles as brand lore and URL jargon. The following sentence is
  clearer than the heading.
- Concrete rewrite: H1 “Page not found”; supporting text “This address does
  not match a Nightjar page.”

## 1. Cold first screen

Fresh Chromium contexts used 390 × 844 and 1440 × 900 viewports. Service-worker
state, cookies, and application storage were fresh, and no scrolling occurred.

| Question | 390 px phone | 1440 px desktop |
| --- | --- | --- |
| What does it do? | It splits long bird recordings into WAV clips. | It splits long bird recordings into WAV clips with a local CLI. |
| For whom? | AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer. | The same audience is stated directly. |
| What should I click first? | “Try it with sample data”; the adjacent line says it loads a 20-second recording and shows its clip plan. | The sample action is primary; “Install the CLI” is clearly secondary. |

The exact first-screen copy succeeds: “Split long bird recordings into WAV
clips”; “For AudioMoth and field-recorder users preparing overnight audio for
BirdNET Analyzer”; “Try it with sample data”; and “Loads a 20-second field
recording and shows its clip plan.” All three facts are visible above 844 px.

## 2. Demo and sandbox

The landing action reaches `/demo/` in one click. The route immediately shows
“Dawn Marsh sample,” `2 clips from 00:00:20`, two ten-second rows, the demo
banner, Reset, and Start for real. Reset restored that baseline. Start for real
opened `/#planner`, removed the banner, and showed “No recording selected.”

A seeded `real:sentinel=keep-me` local-storage value survived entry, Reset, and
exit unchanged. Demo actions created no cookies, local/session application
data, or IndexedDB. Every live request was same-origin; the only sample request
was `/examples/nightjar-demo.wav`. Offline reload succeeded for both `/demo/`
and `/?demo=1` after one online visit.

The CLI was run from an empty directory with the clean-clone binary. `nightjar
demo` exited 0, left the working directory empty, created a unique
`/tmp/nightjar-demo-*` directory, and wrote two WAV clips, two SVGs,
`manifest.json`, `queue.csv`, and `.nightjar-state.json` there.

These sandbox checks pass. The responsive and persistent-banner failures are
reported in F-2-1.

## 3. Claims

Clean clone: `/tmp/nightjar-review2-clean-xJR4EX`.

| Claim ID | Exact registered command | Result |
| --- | --- | --- |
| browser-demo-one-click | `npm run test:browser -- --grep @claim:browser-demo-one-click` | PASS; sample, Reset, exit, and no application persistence |
| browser-private | `npm run test:browser -- --grep @claim:browser-private` | PASS; 256 KiB limit, stores, requests, and redaction |
| offline-demo | `npm run test:browser -- --grep @claim:offline-demo` | PASS; both demo URLs reload offline |
| site-structure | `npm run test:browser -- --grep @claim:site-structure` | PASS; metadata, focus assertions, axe, and local 404 |
| cli-demo | `cargo build --quiet && node --test --test-name-pattern='@claim:cli-demo' site/tests/claims.test.mjs` | PASS |
| cli-core-outputs | `cargo build --quiet && node --test --test-name-pattern='@claim:cli-core-outputs' site/tests/claims.test.mjs` | PASS |
| resume-repair | `cargo build --quiet && node --test --test-name-pattern='@claim:resume-repair' site/tests/claims.test.mjs` | PASS |
| silence-boundaries | `cargo build --quiet && node --test --test-name-pattern='@claim:silence-boundaries' site/tests/claims.test.mjs` | PASS |
| fixed-three-minute | `cargo build --quiet && node --test --test-name-pattern='@claim:fixed-three-minute' site/tests/claims.test.mjs` | PASS |
| inspect-details | `cargo build --quiet && node --test --test-name-pattern='@claim:inspect-details' site/tests/claims.test.mjs` | PASS |
| clip-length-limits | `cargo build --quiet && node --test --test-name-pattern='@claim:clip-length-limits' site/tests/claims.test.mjs` | PASS |
| manifest-contract | `cargo build --quiet && node --test --test-name-pattern='@claim:manifest-contract' site/tests/claims.test.mjs` | PASS |
| cli-options | `cargo build --quiet && node --test --test-name-pattern='@claim:cli-options' site/tests/claims.test.mjs` | PASS |
| birdnet-selection | `cargo build --quiet && node --test --test-name-pattern='@claim:birdnet-selection' site/tests/claims.test.mjs` | PASS |
| package-scope | `cargo build --quiet && node --test --test-name-pattern='@claim:package-scope' site/tests/claims.test.mjs` | PASS |
| build-artifacts | `cargo build --quiet && node --test --test-name-pattern='@claim:build-artifacts' site/tests/claims.test.mjs` | PASS |

All 16 commands passed independently. F-2-3 and F-2-4 identify the remaining
claim-like sentences with no matching registry entry. The passing demo claim
does not waive F-2-1 because its test never checks the populated phone layout
or banner persistence.

## 4. Structure, links, accessibility, and identity

- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200. A random missing path
  returns the designed Nightjar 404 with status 404.
- Titles are respectively “Nightjar Slicer — split long bird recordings,”
  “Demo — Nightjar Slicer,” “Privacy — Nightjar Slicer,” “Terms — Nightjar
  Slicer,” and “Page not found — Nightjar Slicer.”
- Every checked route has `lang=en`, one H1, one main landmark, a description,
  canonical URL, Open Graph image/title, Twitter card, SVG favicon, and
  apple-touch icon. The social image is 1200 × 630 and the touch icon is 180 px.
- Header and footer link sets are consistent in the DOM. All discovered
  internal routes, assets, `robots.txt`, `sitemap.xml`, and the external GitHub
  project link returned 200.
- Direct `/#planner` and `/#install` links load, scroll, and focus their H2.
  The Back defect is F-2-2.
- The live verification script passed all routes and both offline demo URLs.
  Playwright Axe found zero WCAG 2 A/AA/2.1 AA violations at 390 and 1440 px
  on all five route types. The factory URL verifier found zero console errors,
  one H1, one main, `lang=en`, labeled buttons, and complete image alt text.
- Response headers include CSP, HSTS, `no-referrer`, `nosniff`, and disabled
  camera/microphone/geolocation. All observed page requests were same-origin.
- The production home HTML and hashed JavaScript exactly match the clean build.
  Initial home JavaScript is 8.44 KiB and CSS is 15.54 KiB before gzip.
- The moonlit cut-paper wetland, offset editorial grid, field-note typography,
  flat rules, and restrained night palette remain distinct and match
  `.factory/design.md`; the site is not a generic SaaS template.
- No AI feature is warranted. The brief keeps identification in BirdNET
  Analyzer. The tested `select` command, CSV/JSON exports, and exact analyzer
  folder step cover the implied handoff; no additional obvious leverage is
  missing.

## 5. Landing-page copy audit

Counts are whitespace-delimited; hyphenated forms count as one. This includes
headings, labels, actions, state text, and errors. Raw commands and data-table
values are not prose sentences.

| Exact copy | Words | Flag |
| --- | ---: | --- |
| Skip to main content | 4 | — |
| Offline — the saved demo and guide remain available. | 9 | — |
| Demo — sample data, nothing is saved | 7 | — |
| Reset demo | 2 | — |
| Start for real | 3 | — |
| Nightjar / Slicer | 3 | — |
| Demo | 1 | — |
| Privacy | 1 | — |
| Terms | 1 | — |
| Split long bird recordings into WAV clips | 7 | — |
| For AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer. | 10 | — |
| Try it with sample data | 5 | — |
| Loads a 20-second field recording and shows its clip plan. | 10 | — |
| Install the CLI | 3 | — |
| Runs locally | 2 | — |
| Keeps the original recording | 4 | — |
| Free and MIT licensed | 4 | — |
| The CLI writes WAV clips before identification. | 7 | — |
| Browser clip planner | 3 | — |
| Plan fixed WAV clips in your browser | 7 | — |
| The planner reads at most 256 KiB from your WAV. | 10 | — |
| It does not upload or store your file. | 8 | — |
| WAV recording | 2 | — |
| Choose a PCM or float WAV file. | 7 | — |
| Clip length | 2 | — |
| Enter 10 to 3,600 seconds. | 6 | — |
| Plan WAV clips | 3 | — |
| No recording selected | 3 | — |
| Your clip times and redacted manifest will appear here. | 9 | F-2-5: jargon |
| Reading WAV details… | 3 | — |
| Clip plan ready | 3 | — |
| Showing 8 of [N] planned clips. | 6 | — |
| Showing all [N] planned clips. | 5 | — |
| Download clip plan | 3 | — |
| How it works | 3 | — |
| Prepare clips for BirdNET Analyzer | 5 | — |
| Nightjar creates local files. | 4 | — |
| Identification remains in BirdNET Analyzer. | 5 | — |
| Inspect the recording | 3 | — |
| Print its duration, channels, sample rate, and file size. | 9 | — |
| Split it into clips | 4 | — |
| Use fixed times or move boundaries to a quiet half-second nearby. | 11 | — |
| Continue an interrupted batch | 4 | — |
| Nightjar reuses complete clips and repairs missing or incomplete clips. | 10 | — |
| Select clips for analysis | 4 | — |
| Copy chosen clips into one folder, then choose that folder in BirdNET Analyzer. | 13 | — |
| Install from source | 3 | — |
| Install and run Nightjar | 4 | — |
| Installation requires Rust 1.85 or newer. | 6 | — |
| The repository does not offer prebuilt binaries. | 7 | F-2-3: unlisted claim |
| Copy install command | 3 | — |
| Install command copied | 3 | F-2-6: non-action button state |
| The install command is on your clipboard. | 7 | — |
| Clipboard access was blocked. | 4 | — |
| Select the install command and copy it. | 7 | — |
| Recorded demo session | 3 | — |
| Run the bundled sample | 4 | — |
| `nightjar demo` uses the same 20-second recording as the browser demo. | 11 | — |
| What Nightjar does not do | 5 | — |
| Identification stays in your analyzer | 5 | — |
| Nightjar does not include a bird-identification model. | 7 | — |
| It writes clips, manifests, and spectrograms for your review. | 9 | — |
| Split long bird recordings into clips locally. | 7 | — |
| Project on GitHub (external) | 4 | — |
| Built by Param Factory · v0.1.0 · build polish-1 | 8 | — |

Demo-only copy:

| Exact copy | Words | Flag |
| --- | ---: | --- |
| Demo clip plan ready | 4 | — |
| Explore a 20-second bird recording | 5 | — |
| This isolated sample shows two planned WAV clips. | 8 | — |
| Reset it any time or start with your recording. | 9 | — |
| 2 clips from 00:00:20 | 4 | — |
| Dawn Marsh sample | 3 | — |
| The bundled sample could not be loaded. | 7 | — |
| Reload the page and try again. | 6 | — |

Error copy:

| Exact copy | Words | Flag |
| --- | ---: | --- |
| Choose a complete PCM or float WAV recording, then try again. | 11 | — |
| This file is too small to be a complete WAV recording. | 11 | — |
| Choose another file. | 3 | — |
| This is not a supported WAV file. | 7 | — |
| Choose a PCM or float WAV recording. | 7 | — |
| Nightjar could not read this WAV. | 6 | — |
| Export it as a standard PCM WAV and try again. | 10 | — |
| Encoding [number] is not supported here. | 6 | — |
| Choose a PCM or float WAV, or run `nightjar inspect FILE` in the CLI. | 13 | — |
| This WAV has invalid audio details. | 6 | — |
| Re-export it as PCM WAV or choose another recording. | 9 | — |
| This WAV contains no playable audio. | 6 | — |
| Enter a clip length from 10 to 3,600 seconds. | 9 | — |

No landing sentence exceeds 22 words or contains a banned marketing word.

## 6. README copy audit

Code blocks are executable examples and are excluded. Headings, list entries,
and prose in table cells are included so the complete reader-facing copy is
accounted for.

| Exact copy | Words | Flag |
| --- | ---: | --- |
| Nightjar Slicer | 2 | — |
| Nightjar Slicer splits long WAV and FLAC bird recordings into WAV clips. | 12 | — |
| It also writes a JSON manifest, CSV queue, and SVG spectrograms. | 11 | — |
| It is for AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer. | 13 | — |
| Nightjar does not identify birds or include a bird-identification model. | 10 | — |
| Try the sample | 3 | — |
| The sample command needs no input file. | 7 | — |
| It writes two clips from the bundled 20-second recording into a new temporary directory. | 14 | — |
| The browser demo is at `https://bird-audio-slicer.sociobot.in/demo/`. | 6 | — |
| It shows the same recording and saves nothing to your browser data. | 12 | — |
| Install | 1 | — |
| Installation from source requires Rust 1.85 or newer. | 8 | — |
| This repository does not provide prebuilt binaries. | 7 | F-2-3: unlisted claim |
| Inspect and split | 3 | — |
| Print recording details: | 3 | — |
| Create fixed three-minute clips: | 4 | — |
| Move each boundary to the quietest nearby half-second: | 8 | — |
| Nightjar accepts PCM WAV, float WAV, and FLAC input. | 9 | — |
| It writes decodable 16-bit PCM WAV clips. | 7 | — |
| Clip lengths can range from 10 to 3,600 seconds. | 9 | — |
| Each output directory contains these files: | 6 | — |
| `manifest.json` using schema `nightjar-manifest/v1` | 4 | — |
| `queue.csv` with one time range per clip | 7 | — |
| numbered WAV clips with relative start timestamps | 7 | — |
| SVG spectrograms | 2 | — |
| a private `.nightjar-state.json` checkpoint | 4 | F-2-7: unexplained jargon |
| Run the same command again to continue an interrupted batch. | 10 | — |
| Nightjar reuses complete clips and repairs missing or incomplete clips. | 10 | — |
| Use `--no-thumbnails` to omit SVG spectrograms. | 6 | — |
| Use `--force` to replace an incompatible clip plan. | 8 | — |
| Use `--include-source-path` only when you want the manifest to include the source name and path. | 15 | — |
| Send selected clips to BirdNET Analyzer | 6 | — |
| Choose clip numbers from `queue.csv`, then copy those clips into a separate folder: | 13 | — |
| Nightjar writes the selected WAV files and `selection.csv` into that folder. | 11 | — |
| In BirdNET Analyzer, choose `birdnet-selection` as the input folder. | 9 | — |
| Scripts and exit codes | 4 | — |
| The `--json` option prints one JSON object to standard output. | 10 | — |
| Code | 1 | — |
| Meaning | 1 | — |
| Next action | 2 | — |
| The command completed. | 3 | — |
| Use the output files. | 4 | — |
| The command arguments are invalid. | 5 | — |
| Correct the named argument. | 4 | — |
| The recording cannot be read. | 5 | — |
| Check its path and format. | 5 | — |
| The output cannot be created safely. | 6 | — |
| Choose another directory or use `--force` when instructed. | 8 | — |
| This command lists ready clip names: | 6 | — |
| Privacy | 1 | — |
| Nightjar does not change the source recording. | 7 | — |
| Manifests omit the source name, path, and embedded recording metadata by default. | 12 | — |
| The CLI has no network client or telemetry dependency. | 9 | — |
| The browser planner reads at most 256 KiB from your selected WAV. | 12 | — |
| It does not upload or retain that file. | 8 | — |
| The demo works offline after its first visit. | 8 | — |
| See Privacy and Terms. | 4 | — |
| Develop and verify | 3 | — |
| Development requires Node.js 20+, npm, and Rust 1.85+. | 8 | F-2-4: Node minimum unlisted |
| `npm run build` creates the static site in `dist/site` and the CLI in `dist/bin`. | 14 | — |
| The crate is ready for the factory to publish, but this repository does not publish it automatically. | 17 | F-2-4: vague and unlisted |
| Nightjar Slicer uses the MIT License. | 6 | — |

No README sentence exceeds 22 words or contains a banned marketing word.

## 7. Earlier-finding verification

Every finding in `.factory/review-1.md` was checked against the live site and
current code. “PASS” below means the earlier defect does not reproduce;
“REOPENED” is blocking under this review's history rule.

| Earlier ID | Result | Current evidence |
| --- | --- | --- |
| F-1-1 | PASS | Both cold first screens state job, audience, first action, next result, and facts. |
| F-1-2 | **REOPENED as F-2-1** | Demo/CLI exist and isolate data, but the phone demo clips results and its banner is not persistent. |
| F-1-3 | PASS | Unknown route returns the Nightjar 404, status 404, with same-origin assets. |
| F-1-4 | PASS | `claims.json` exists; all 16 commands pass independently. |
| F-1-5 | PASS | Both demo URLs reload offline; cache removal is tested. |
| F-1-6 | PASS | WAV/FLAC core outputs pass `cli-core-outputs`. |
| F-1-7 | PASS | “Streaming memory” is absent from public copy. |
| F-1-8 | PASS | Resume wording is concrete and `resume-repair` passes. |
| F-1-9 | PASS | Planner privacy wording maps to `browser-private`. |
| F-1-10 | PASS | Caption names WAV clips; core output test passes. |
| F-1-11 | PASS | Unsupported 4 GB promotional strip is absent. |
| F-1-12 | PASS | BirdNET capability claim is absent. |
| F-1-13 | PASS | Copy names local files; output inventory is tested. |
| F-1-14 | PASS | WAV/FLAC inspect fields pass `inspect-details`. |
| F-1-15 | PASS | Quiet-half-second behavior passes `silence-boundaries`. |
| F-1-16 | PASS | Reuse and repair pass `resume-repair`. |
| F-1-17 | PASS | Interrupted-process regression passes in Rust integration tests. |
| F-1-18 | PASS | Browser test instruments and caps `Blob.slice` at 256 KiB. |
| F-1-19 | PASS | Full planner requests and stores are asserted. |
| F-1-20 | PASS | FLAC and silence mode both pass registered tests. |
| F-1-21 | PASS | Cookies, local/session storage, and IndexedDB remain empty. |
| F-1-22 | PASS | 9/10/3,600/3,601 boundaries are tested. |
| F-1-23 | PASS | Exported names/paths are null and tested; F-2-5 is only a wording issue. |
| F-1-24 | PASS | Rust 1.85 is stated and checked in package metadata. |
| F-1-25 | PASS | Slogan is gone; model/network scope is tested. |
| F-1-26 | PASS | “Evidence” is replaced by named outputs. |
| F-1-27 | PASS | Identification remains external; package has no identify command/model. |
| F-1-28 | PASS | Scope claims are split and mapped to package/manifest tests. |
| F-1-29 | PASS | README opening is two short concrete sentences. |
| F-1-30 | PASS | Source, model, and browser privacy claims are split and tested. |
| F-1-31 | PASS | Manifest schema permits no embedded metadata and redacts name/path. |
| F-1-32 | PASS | PCM WAV, float WAV, FLAC, and decoded outputs pass. |
| F-1-33 | PASS | Copy says “Print recording details”; all fields are asserted. |
| F-1-34 | PASS | 180/180/remainder behavior passes. |
| F-1-35 | PASS | Controlled quiet-window test passes. |
| F-1-36 | PASS | JSON, CSV, checkpoint, WAV, and SVG inventory passes. |
| F-1-37 | PASS | Missing and incomplete outputs are repaired in the test. |
| F-1-38 | PASS | All three switches pass `cli-options`. |
| F-1-39 | PASS | Documented `jq` result is checked by the manifest test. |
| F-1-40 | PASS | JSON and exit codes 0/2/3/4 are asserted. |
| F-1-41 | PASS | Source hash remains unchanged. |
| F-1-42 | PASS | Timestamped names, including hour crossing, are tested. |
| F-1-43 | PASS | Generated manifest validates against the checked-in schema. |
| F-1-44 | PASS | Default nulls and explicit path opt-in are tested. |
| F-1-45 | PASS | CSV headers and one row per clip are tested. |
| F-1-46 | PASS | Missing-checkpoint recovery preserves valid clip hashes. |
| F-1-47 | PASS | Vague streaming claim is absent. |
| F-1-48 | PASS | Decoder-buffer scaling claim is absent. |
| F-1-49 | PASS | Sample demo exists; request/store/read limits pass. |
| F-1-50 | PASS | Remaining network/telemetry/billing scope is registered. |
| F-1-51 | PASS | MIT license is present and tested. |
| F-1-52 | PASS | Dependency scan confirms no network client or telemetry dependency. |
| F-1-53 | PASS | Manifest contract test confines writes to the output directory. |
| F-1-54 | PASS | Source integrity wording is canonical and hash-tested. |
| F-1-55 | PASS | Embedded metadata is excluded by schema; name/path are null. |
| F-1-56 | PASS | Source path/name appear only with explicit opt-in. |
| F-1-57 | PASS | Bundled sample loads and byte-read limit is instrumented. |
| F-1-58 | PASS | Requests and browser stores are checked. |
| F-1-59 | PASS | Demo download is generated from the bundled sample. |
| F-1-60 | PASS | Every route, including 404, made only same-origin requests. |
| F-1-61 | PASS | Offline test unregisters workers and deletes Cache Storage. |
| F-1-62 | PASS | Terms uses exact WAV/queue wording mapped to core outputs. |
| F-1-63 | PASS | Universal compatibility wording is absent. |
| F-1-64 | PASS | Terms uses the hash-tested source-integrity wording. |
| F-1-65 | PASS | Current brief uses reproducible demo/selection success; prior 4 GB evidence is recorded. |
| F-1-66 | PASS | Every route has canonical, OG/Twitter, social image, and touch icon metadata. |
| F-1-67 | PASS | Header/footer DOM, one-liner, factory credit, build ID, and links are consistent. |
| F-1-68 | **REOPENED as F-2-2** | Hash focus works, but Back focuses an H1 thousands of pixels off screen. |
| F-1-69 | PASS | External link is named “Project on GitHub (external).” |
| F-1-70 | PASS | Unavailable-binary promise is gone and source requirement is explicit; F-2-3 covers the new claim-registration gap. |
| F-1-71 | PASS | `select`, `selection.csv`, and the BirdNET folder step pass. |
| F-1-72 | PASS | Decorative serial label is absent. |
| F-1-73 | PASS | Literal job H1 is live. |
| F-1-74 | PASS | “Quiet, resumable queue” is absent. |
| F-1-75 | PASS | “Streaming memory” is absent. |
| F-1-76 | PASS | “Continue an interrupted batch” is used. |
| F-1-77 | PASS | “Plate 01” is absent. |
| F-1-78 | PASS | Section is “Prepare clips for BirdNET Analyzer.” |
| F-1-79 | PASS | Mood slogan is absent. |
| F-1-80 | PASS | Label is “Browser clip planner.” |
| F-1-81 | PASS | Heading names the browser result. |
| F-1-82 | PASS | Install section uses a literal heading. |
| F-1-83 | PASS | Scope label is “What Nightjar does not do.” |
| F-1-84 | PASS | “Evidence” is replaced by clips/manifests/spectrograms. |
| F-1-85 | PASS | Footer one-liner is literal. |
| F-1-86 | PASS | First action is “Try it with sample data.” |
| F-1-87 | PASS | Default button says “Copy install command”; F-2-6 covers its changed state. |
| F-1-88 | PASS | Download action says “Download clip plan.” |
| F-1-89 | PASS | README opening is split and concrete. |
| F-1-90 | PASS | README names its users and BirdNET Analyzer. |
| F-1-91 | PASS | Each switch has its own sentence. |
| F-1-92 | PASS | Exit codes use a table with next actions. |
| F-1-93 | PASS | Observable reuse/repair wording replaces implementation jargon. |
| F-1-94 | PASS | Decoder-buffer wording is absent. |
| F-1-95 | PASS | Generic read error gives the PCM export action. |
| F-1-96 | PASS | Small-file error says to choose another file. |
| F-1-97 | PASS | Unsupported-file error names PCM or float WAV. |
| F-1-98 | PASS | Missing-format error gives standard PCM export guidance. |
| F-1-99 | PASS | Missing-audio error gives the same recovery. |
| F-1-100 | PASS | Encoding error names formats and the exact inspect command. |
| F-1-101 | PASS | Invalid/no-audio errors provide a re-export or replacement action. |
| F-1-102 | PASS | Clip, demo/planner, BirdNET Analyzer, and interrupted-batch terms are consistent. |

`.factory/polish-1.md` contains the repair map for those 102 findings and no
additional open findings. Its F-1-2 and F-1-68 claims are contradicted by the
fresh live measurements above. The previous handoff says “Known gaps: None”;
that statement is superseded by this review.

The three defects from `.factory/verification-1.md` were also rechecked:

| Earlier verification defect | Result |
| --- | --- |
| Default manifest leaks a location-bearing name | Fixed; clean tests and browser download return null name/path. |
| `--json` validation does not emit JSON | Fixed; integration and `cli-options` tests pass. |
| Live policy/cache headers are missing | Fixed; live CSP, referrer, nosniff, permissions, HSTS, and immutable asset policy are present. |

`.factory/verification-2.md` reported no defects. Its format, privacy, route,
and package assertions were rerun through the registered claim commands and
live checks; none regressed apart from the newly exposed responsive demo and
history-navigation behavior.

## 8. Quality-gate evidence

From the clean clone:

- all 16 registered claim commands: PASS;
- `npm test`: PASS — 3 Rust unit, 9 Rust integration, 4 WAV/planner, 12 claim,
  and 5 Playwright tests;
- `npm run build`: PASS — `dist/site` and one `dist/bin/nightjar` binary;
- `cargo fmt --check`: PASS;
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS;
- live route verifier: PASS, including offline demo reloads;
- live Axe at both viewports: zero violations;
- dead-link crawl: zero dead links.

The existing suite passes because its mobile-width assertion covers only `/`,
not the populated `/demo/`, and its Back test checks focus without checking
whether the focused heading is visible.

## What would make this perfect

1. Make the populated planner result fit the 390 px layout and keep the demo
   banner sticky; add the missing phone assertions to the demo claim.
2. Restore scroll and focus together on Back/Forward and assert the focused
   heading is visible at both widths.
3. Remove or register and test every release/toolchain-readiness claim.
4. Replace the three jargon/action/metaphor copy failures with the proposed
   literal wording.
5. Rerun every claim, the full quality gates, the link/route crawl, offline
   checks, and this entire first-read review from fresh contexts.

There is still work left, so this round cannot pass.
