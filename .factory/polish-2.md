# Polish round 2

Date: 29 August 2026

Reviewed candidate: `cbbc5e63e762ff6c148001e0c5c96de8f96babc6`

Repair commits: `5936d489178fc0560e48722b825d00fda13fb5b6`, `297eb9b6d8b0318010139d80e52457e9d656e7e0`

Live site: <https://bird-audio-slicer.sociobot.in>

## Evidence keys

- `B-demo`: Playwright `@claim:browser-demo-one-click`, including 390 px bounds, table scrollport, sticky banner, reset, exit, and storage isolation.
- `B-private`: Playwright `@claim:browser-private`.
- `B-offline`: Playwright `@claim:offline-demo`.
- `B-structure`: Playwright `@claim:site-structure`, including literal 404 and Back/Forward focus plus full heading visibility at 390 and 1440 px.
- `C-*`: the corresponding tagged CLI claim in `site/tests/claims.test.mjs`.
- `R-interrupt`: Rust integration test `stopped_batch_continues_from_completed_checkpoint`.
- `Scale`: the retained, independently rechecked 4 GB evidence in `.factory/verification-2.md` and `.factory/polish-1.md`.
- `Claims`: all 16 commands in `.factory/claims.json` passed separately in clean clone `/tmp/nightjar-polish2-clean-mKjTQ6`.
- `Full`: `npm test`, `npm run build`, fmt, strict Clippy, `cargo package --allow-dirty`, and `npm audit`.
- `Live`: `npm run verify:live -- https://bird-audio-slicer.sociobot.in .factory/evidence/polish-2-live`.
- Screenshots: `.factory/evidence/polish-2-live/home-mobile.png`, `demo-mobile.png`, and `404-mobile.png`.
- Lighthouse: `.factory/evidence/polish-2-live/lighthouse.json`.

## Review 2 finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-1 / F-1-2 reopened | Added zero minimum widths to planner grid children, bounded the result and scroll wrapper, retained the 520 px table inside its own horizontal scrollport, and kept the demo banner sticky on phones. The demo claim now checks result bounds, overflow ownership, download reachability, banner position after a 1,200 px scroll, reset, exit, and preservation of a real-data sentinel. | `B-demo`; Live `/demo/` and `/?demo=1`; `demo-mobile.png`; live report says `outputWithinViewport`, `tableScrollport`, `stickyBanner`, `resetAndExit`, and `realStoragePreserved` are true. |
| F-2-2 / F-1-68 reopened | In-page links now use `pushState`; route restoration disables smooth scrolling for the operation, moves the target into view, focuses it, and announces it. Back restores the root to scroll 0. | `B-structure` passed repeatedly and in the clean clone; live report passes Back/Forward focus and bounds at 390 and 1440 px. |
| F-2-3 | Removed the remote-state prebuilt-binary statements from the landing page and README. Kept the tested source-install requirement. | Source search finds no “prebuilt”; `@claim:package-scope`; Live `/#install`. |
| F-2-4 | Removed the untested Node-version and crate-readiness sentences. The exact verification commands remain. | Source search finds neither sentence; `Claims`; `cargo package --allow-dirty` passed. |
| F-2-5 | Replaced the jargon with “Your clip times will appear here. The downloaded plan omits your recording name and path.” | `.factory/copy-audit.md`; Live `/#planner`. |
| F-2-6 | The button always says “Copy install command”; clipboard success remains in the separate status region. | `B-structure`; live `/#install` action-label check. |
| F-2-7 | Rewrote the README item as “a `.nightjar-state.json` file used to continue interrupted runs.” | README source inspection; `@claim:resume-repair`. |
| F-2-8 | Replaced the metaphorical 404 H1 with “Page not found” and the prescribed supporting sentence. | `B-structure`; Live unknown route returns 404; `404-mobile.png`. |

## Cumulative review 1 finding map

Every prior finding remains fixed. The exact per-ID repair map from round 1 is reproduced below and was rechecked against the final source, clean-clone claim run, full suite, and deployed site.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Replaced the first screen with the prescribed job, audience, sample action, next-result note, install link, and three facts. All fit at 390 × 844. | `mobile first screen is complete…`; `home-mobile.png`; Live `/` |
| F-1-2 | Added `/demo/`, `?demo=1`, banner, reset/exit controls, ephemeral browser state, bundled sample, `nightjar demo`, and `.factory/demo.md`. | B-demo, C-cli-demo, `demo-mobile.png`; Live `/demo/` and `/?demo=1` |
| F-1-3 | Added the Nightjar 404 and valid Azure `responseOverrides` rewrite. | B-structure, `404-mobile.png`; Live unknown route returns 404 with Nightjar title |
| F-1-4 | Added `.factory/claims.json` with one tagged observable test per claim. | 16/16 clean-clone claim commands passed |
| F-1-5 | Cached `/demo/`, `/?demo=1`, their exact assets, and the sample; added offline reload and cache-removal coverage. | B-offline; Live both demo URLs offline |
| F-1-6 | Replaced vague core wording with exact WAV/FLAC outputs and tested each format. | C-cli-core-outputs |
| F-1-7 | Removed “Streaming memory”; recorded a measured 4 GB ceiling result. | Scale |
| F-1-8 | Reworded as “Continue an interrupted batch” and tested resume behavior. | C-resume-repair, R-interrupt |
| F-1-9 | Replaced “No upload” with exact planner privacy wording. | B-private |
| F-1-10 | Now says the CLI writes WAV clips before identification. | C-cli-core-outputs; Live `/` |
| F-1-11 | Removed the unsupported 4 GB/235-clip promotional strip. | `copy-audit.md`; Live `/` |
| F-1-12 | Deleted the BirdNET capability claim. | `copy-audit.md`; Live `/` |
| F-1-13 | Named the local files Nightjar creates. | C-cli-core-outputs |
| F-1-14 | Registered and tested all inspect fields for WAV and FLAC. | C-inspect-details |
| F-1-15 | Tested a controlled quiet half-second and exact 8.25-second boundary. | C-silence-boundaries |
| F-1-16 | Tested reuse plus repair of missing and incomplete clips. | C-resume-repair |
| F-1-17 | Added a real process interruption after a checkpoint and verified resumed reuse. | R-interrupt |
| F-1-18 | Instrumented `Blob.slice` and enforced the 256 KiB maximum. | B-private |
| F-1-19 | Recorded the full planner request log and browser stores. | B-private |
| F-1-20 | Tested bundled FLAC and controlled silence-aware slicing. | C-cli-core-outputs, C-silence-boundaries |
| F-1-21 | Asserted no cookies, local/session storage, or IndexedDB writes. | B-private |
| F-1-22 | Tested 9, 10, 3,600, and 3,601-second inputs. | C-clip-length-limits |
| F-1-23 | Replaced “privacy-safe” with exact redacted fields. | C-manifest-contract, B-private |
| F-1-24 | States Rust 1.85+ precisely and tests package metadata plus the production build. | C-package-scope, C-build-artifacts |
| F-1-25 | Replaced the slogan with exact model and local-processing scope. | C-package-scope |
| F-1-26 | Replaced “evidence” with clips, manifests, and spectrograms. | C-cli-core-outputs |
| F-1-27 | States that identification remains in the analyzer; scans commands and package for identification models. | C-package-scope |
| F-1-28 | Split and narrowed the compressed scope claims; retained only tested model, metadata, network, telemetry, and billing facts. | C-package-scope, C-manifest-contract |
| F-1-29 | Rewrote the README opening into two short output statements. | C-cli-core-outputs; `copy-audit.md` terminology |
| F-1-30 | Split scope/privacy statements and mapped them to source, package, and browser tests. | C-package-scope, C-manifest-contract, B-private |
| F-1-31 | Export structure omits all undeclared embedded metadata and redacts source name/path. | C-manifest-contract |
| F-1-32 | Added PCM, float WAV, FLAC, and independent output-WAV decode coverage. | C-cli-core-outputs |
| F-1-33 | Narrowed copy to “Print recording details” and tests every displayed field. | C-inspect-details |
| F-1-34 | Added a 370-second fixture proving two 180-second clips plus remainder. | C-fixed-three-minute |
| F-1-35 | Tests the exact quiet half-second inside the configured search window. | C-silence-boundaries |
| F-1-36 | Asserts JSON, CSV, checkpoint, WAV, and SVG output inventory. | C-cli-core-outputs |
| F-1-37 | Tests both incomplete and missing clip repair. | C-resume-repair |
| F-1-38 | Tests `--no-thumbnails`, `--force`, and `--include-source-path`. | C-cli-options |
| F-1-39 | Validates the documented `jq` command against a generated manifest. | C-manifest-contract |
| F-1-40 | Tests observable JSON behavior and exit codes 0, 2, 3, and 4. | C-cli-options |
| F-1-41 | Hashes the source before and after slicing. | C-manifest-contract |
| F-1-42 | Tests exact clip names, including `clip_0002_01-00-00.wav`. | C-manifest-contract; Rust `names_are_stable_and_sorted` |
| F-1-43 | Added a checked-in JSON Schema and validates generated output with Ajv 2020. | C-manifest-contract |
| F-1-44 | Tests default null name/path and explicit opt-in values. | C-manifest-contract, C-cli-options |
| F-1-45 | Parses CSV header/row count and compares one row per manifest clip. | C-manifest-contract |
| F-1-46 | Added checkpoint-loss recovery that validates and reuses existing WAVs without changing their hashes. | C-resume-repair |
| F-1-47 | Removed the vague streaming claim; measured the actual 4 GB path. | Scale |
| F-1-48 | Removed the unbounded scaling sentence; retained exact measured evidence here. | Scale |
| F-1-49 | Implemented the sample demo and tested byte range, requests, and stores. | B-demo, B-private |
| F-1-50 | Removed compressed account/cloud/payment copy; tests the remaining network, telemetry, and billing dependency statement. | C-package-scope |
| F-1-51 | Added the standard “MIT License” heading and repository/package check. | C-package-scope |
| F-1-52 | Reworded to the testable absence of network client and telemetry dependencies. | C-package-scope |
| F-1-53 | Snapshot test confirms slicing changes only the chosen output directory beside the unchanged source. | C-manifest-contract |
| F-1-54 | Canonicalized the source-integrity wording. | C-manifest-contract |
| F-1-55 | Manifest source schema permits only declared non-embedded fields and redacts name/path. | C-manifest-contract |
| F-1-56 | Tests explicit source-name/path opt-in. | C-cli-options |
| F-1-57 | Implemented sample loading and instrumented the selected-file header limit. | B-demo, B-private |
| F-1-58 | Tests requests, cookies, local/session storage, and IndexedDB. | B-private |
| F-1-59 | Demo downloads a manifest made from the bundled Dawn Marsh sample. | B-demo, B-private |
| F-1-60 | Added a self-hosted 404 and asserted zero third-party requests on every route. | B-structure; Live route sweep |
| F-1-61 | Privacy now names browser site settings and service-worker cache; test unregisters workers and deletes caches. | B-offline |
| F-1-62 | Terms now says Nightjar writes local WAV clips and queue metadata. | C-cli-core-outputs |
| F-1-63 | Split observable scope from advice and removed universal compatibility wording. | C-package-scope; Live `/terms/` |
| F-1-64 | Uses the canonical source-integrity statement. | C-manifest-contract |
| F-1-65 | Replaced the unverifiable pre-launch pilot count with a clean-user demo/selection measure; reran the 4 GB ceiling. | Scale, C-cli-demo, C-birdnet-selection |
| F-1-66 | Added canonical, OG, Twitter, 1200×630 art, and 180 px touch icon to every route. | B-structure; Live route sweep |
| F-1-67 | Unified header/footer navigation, one-liner, factory credit, version, build ID, and project link. | B-structure; Live all routes |
| F-1-68 | Added heading focus and polite announcements for routes, sections, back, and forward navigation. | B-structure |
| F-1-69 | Renamed the external destination “Project on GitHub” and added accessible external text. | B-structure |
| F-1-70 | Removed the unavailable-binary promise and states that source installation requires Rust 1.85+. | C-package-scope; Live `#install` |
| F-1-71 | Added `nightjar select`, `selection.csv`, and the exact BirdNET Analyzer folder step. | C-birdnet-selection; Rust `selected_clips_are_copied_for_birdnet_analyzer` |
| F-1-72 | Deleted “Field utility / 01”. | `copy-audit.md`; Live `/` |
| F-1-73 | H1 is “Split long bird recordings into WAV clips”. | mobile first-screen test; `home-mobile.png` |
| F-1-74 | Replaced “quiet, resumable queue” with concrete clip and manifest copy. | `copy-audit.md`; C-cli-core-outputs |
| F-1-75 | Removed “Streaming memory” and kept measured evidence out of marketing copy. | Scale; Live `/` |
| F-1-76 | Uses “Continue an interrupted batch”. | C-resume-repair, R-interrupt |
| F-1-77 | Deleted “Plate 01”. | `copy-audit.md`; `home-mobile.png` |
| F-1-78 | Uses “Prepare clips for BirdNET Analyzer”. | `copy-audit.md`; Live `/` |
| F-1-79 | Uses “Prepare clips for BirdNET Analyzer”. | `copy-audit.md` |
| F-1-80 | Uses “Browser clip planner”. | `copy-audit.md` |
| F-1-81 | Uses “Plan fixed WAV clips in your browser”. | `copy-audit.md` |
| F-1-82 | Uses “Install and run Nightjar”. | `copy-audit.md` |
| F-1-83 | Uses “What Nightjar does not do”. | `copy-audit.md` |
| F-1-84 | Uses “It writes clips, manifests, and spectrograms for your review.” | C-cli-core-outputs |
| F-1-85 | Footer says “Split long bird recordings into clips locally.” | Live all routes |
| F-1-86 | The first action is “Try it with sample data”. | B-demo; `home-mobile.png` |
| F-1-87 | Button says “Copy install command”. | browser suite; Live `/` |
| F-1-88 | Button says “Download clip plan”; “sample” is reserved for demo data. | B-private |
| F-1-89 | README opening is two short, concrete sentences. | `copy-audit.md` terminology; C-cli-core-outputs |
| F-1-90 | README names AudioMoth/field-recorder users and BirdNET Analyzer directly. | README inspection; C-inspect-details |
| F-1-91 | Each CLI flag has its own sentence. | C-cli-options |
| F-1-92 | Exit codes are a four-row table with next actions. | C-cli-options |
| F-1-93 | README describes checkpoint loss through observable reuse/repair behavior. | C-resume-repair |
| F-1-94 | Removed decoder-buffer jargon and the unbounded scaling claim. | `copy-audit.md`; Scale |
| F-1-95 | Generic read failure now says to export PCM WAV and try again. | `rejects invalid input and unsafe clip lengths` |
| F-1-96 | Small-file error says to choose another complete file. | `rejects invalid input and unsafe clip lengths` |
| F-1-97 | Unsupported-file error names PCM/float WAV as the next action. | `rejects invalid input and unsafe clip lengths` |
| F-1-98 | Missing-format error uses the standard actionable re-export guidance. | WAV parser tests; `copy-audit.md` |
| F-1-99 | Missing-audio error uses the same actionable guidance. | WAV parser tests; `copy-audit.md` |
| F-1-100 | Encoding error names browser formats and the exact CLI inspect command. | WAV parser tests; `copy-audit.md` |
| F-1-101 | Invalid/no-audio errors tell users to re-export or choose another recording. | WAV parser tests; `copy-audit.md` |
| F-1-102 | Standardized on clip, demo/planner, BirdNET Analyzer, and continue an interrupted batch. | `.factory/copy-audit.md` terminology table |

## Final verification

- Clean clone `/tmp/nightjar-polish2-clean-mKjTQ6`: 16/16 registered claim commands passed separately.
- Full suite: 3 Rust unit, 9 Rust integration, 4 planner unit, 12 CLI claim, and 5 Playwright tests passed.
- Build: `dist/site` and `dist/bin/nightjar`; initial JavaScript 8.81 KiB and CSS 15.73 KiB before gzip.
- Quality: fmt, strict Clippy, crate package/install verification, and npm audit passed.
- Live: all product routes return 200; unknown route returns the Nightjar 404 with status 404; zero Axe violations, third-party requests, or console errors.
- Live demo: bounded 390 px result, horizontal table scrollport, sticky banner, isolated reset/exit, and offline reload for both demo URLs passed.
- Live history: Back/Forward focus and complete heading visibility passed at 390 × 844 and 1440 × 900.
- Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.4 s, CLS 0, TBT 30 ms.
- Deployed home SHA-256 matches `dist/site/index.html`: `2c6daba2b0ac79b96e646cac41484cca7db5288b34bf56e915d10f00141268af`.
- Known gaps: none.
