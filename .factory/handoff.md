# Nightjar Slicer adversarial review 2 handoff — FAIL

Work order: `bird-audio-slicer-review-2`

Reviewed base: `cbbc5e63e762ff6c148001e0c5c96de8f96babc6`

Production: <https://bird-audio-slicer.sociobot.in>

## What was done

- Performed cold first reads at 390 × 844 and 1440 × 900.
- Audited every landing-page and README sentence, heading, label, and action.
- Entered and reset the browser demo, exited to real mode, checked a seeded
  real-storage sentinel, recorded requests, and verified offline reloads.
- Ran `nightjar demo` from an empty temporary working directory.
- Ran all 16 `.factory/claims.json` commands independently from a clean clone.
- Re-ran the full test/build/lint gates.
- Checked live metadata, 404 behavior, headers, links, focus/history,
  responsive layout, Axe results, console errors, and asset identity.
- Rechecked all 102 findings from review 1 plus both earlier verification
  reports against the live site and current code.
- Wrote `.factory/review-2.md`. Product code was not modified.

## Result

FAIL. Eight findings remain. Two are blocking:

- `F-2-1 / F-1-2`: the populated phone demo is 552 px wide inside a 390 px
  viewport, clips result content, and changes its required sticky banner to a
  non-persistent relative banner.
- `F-2-2 / F-1-68`: browser Back focuses the hero H1 but leaves it more than
  2,500 px above the viewport.

The remaining findings cover three unlisted readiness/availability sentences
and four plain-copy defects. See `.factory/review-2.md` for exact quotes,
evidence, and fixes.

## Verification

Clean clone: `/tmp/nightjar-review2-clean-xJR4EX`.

```sh
npm ci
# Every command listed in .factory/claims.json, separately
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run verify:live -- https://bird-audio-slicer.sociobot.in /tmp/nightjar-review2-live
```

Results:

- 16/16 registered claim commands passed.
- Full suite passed: 3 Rust unit, 9 Rust integration, 4 planner, 12 claim, and
  5 Playwright tests.
- Build produced `dist/site` and `dist/bin/nightjar`.
- Formatting and strict Clippy passed.
- Live route verification, offline reloads, same-origin request checks, and
  link crawl passed.
- Playwright Axe found zero violations at mobile and desktop widths.
- Production home HTML and hashed JavaScript matched the clean build.

## What remains

Fix all eight findings in `.factory/review-2.md`, add the missing phone-demo
and Back/Forward visibility assertions, then rerun the entire review. The
current passing suite does not exercise those two blocking states.
