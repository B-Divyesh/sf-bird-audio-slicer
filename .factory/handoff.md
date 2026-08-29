# Nightjar Slicer polish round 2 handoff

Work order: `bird-audio-slicer-polish-2`

Reviewed candidate: `cbbc5e63e762ff6c148001e0c5c96de8f96babc6`

Repair commits: `5936d489178fc0560e48722b825d00fda13fb5b6`, `297eb9b6d8b0318010139d80e52457e9d656e7e0`

Production: <https://bird-audio-slicer.sociobot.in>

## What changed

- Made the populated demo fit 390 px. The result stays inside the viewport and the 520 px clip table scrolls inside its own labeled scrollport.
- Kept the demo banner, Reset demo, and Start for real controls sticky on phones.
- Expanded the demo claim to verify mobile geometry, download reachability, reset, exit, no application persistence, and preservation of real-data storage.
- Rebuilt same-page navigation with `pushState`. Back and Forward now restore scroll, focus the visible heading, and announce it at phone and desktop widths.
- Preserved instant history restoration even though ordinary links retain the designed smooth-scroll treatment.
- Replaced all review-2 copy failures: the empty state explains omitted data, the copy button keeps its action label, the checkpoint description explains its purpose, and the 404 H1 is “Page not found.”
- Removed untestable prebuilt-release, Node-version, and crate-readiness claims.
- Updated the footer build ID, catalog description, claim sandbox descriptions, and copy audit.
- Kept the moonlit editorial field-station identity and original artwork unchanged.

Every review-2 and review-1 finding is mapped in `.factory/polish-2.md`.

## Verification

Clean clone: `/tmp/nightjar-polish2-clean-mKjTQ6`.

- All 16 `.factory/claims.json` commands passed separately.
- `npm test` passed: 3 Rust unit, 9 Rust integration, 4 planner unit, 12 CLI claim, and 5 Playwright tests.
- `npm run build` passed and produced `dist/site` plus `dist/bin/nightjar`.
- `cargo fmt --check` passed.
- `cargo clippy --all-targets --all-features -- -D warnings` passed.
- `cargo package --allow-dirty` packaged and verified 57 files.
- `npm audit` reported zero vulnerabilities.
- Initial production assets: 8.81 KiB JavaScript and 15.73 KiB CSS before gzip.
- Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.4 s, CLS 0, TBT 30 ms.

## Live evidence

Deployment ID: `cb97e0f6-2134-448e-8e61-447796706bc6`.

- `/`, `/demo/`, `/?demo=1`, `/privacy/`, and `/terms/` return 200 with their route titles and metadata.
- An unknown URL returns status 404 with the Nightjar page and H1 “Page not found.”
- Fresh live contexts found zero Axe violations, third-party requests, or console errors.
- The live 390 px demo passed bounded-result, internal-scrollport, sticky-banner, reset, exit, and real-storage-preservation checks.
- Back and Forward passed focus and complete-heading-visibility checks at 390 × 844 and 1440 × 900.
- Both demo URLs reloaded offline after one online visit.
- The deployed home matches the built file at SHA-256 `2c6daba2b0ac79b96e646cac41484cca7db5288b34bf56e915d10f00141268af`.
- Reports and screenshots are in `.factory/evidence/polish-2-live/`.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --allow-dirty
npm run verify:live -- https://bird-audio-slicer.sociobot.in .factory/evidence/polish-2-live
```

## Known gaps and next steps

None.
