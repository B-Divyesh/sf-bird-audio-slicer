# Nightjar Slicer v0.1.0 repair handoff

Work order: `bird-audio-slicer-repair-1`
Base: `351088a3b0dad8dbdb8a0faa97fa7d3dc7dca966`
Artifact class: Rust CLI plus static Vite documentation site

## Release blockers repaired

1. **Sensitive filename leak (P1):** default `manifest.json` now emits
   `source.name: null` and `source.path: null`. A filename is treated as
   location-bearing metadata. `--include-source-path` is the explicit opt-in
   for both fields. The browser's downloadable preview manifest now follows
   the same rule.
2. **`--json` validation contract (P2):** Clap parse and validation failures
   now emit exactly one JSON error object on stdout and retain exit code 2;
   help/version output remains normal CLI text.
3. **Static response policy (P2):**
   `site/public/staticwebapp.config.json` is the Azure Static Web Apps-native
   deployment configuration. It sets immutable one-year caching for hashed
   `/assets/*` and the versioned hero asset, `Referrer-Policy: no-referrer`,
   the requested camera/microphone/geolocation `Permissions-Policy`,
   `nosniff`, and a same-origin CSP. Vite copies it to
   `dist/site/staticwebapp.config.json`; the previous `_headers` file alone
   was not consumed by this host.

README and the privacy page document the revised manifest contract. The CLI's
private checkpoint retains its input fingerprint only locally for resume
validation; it is not an exported manifest.

## Regression coverage

- Rust integration coverage uses the verifier's exact
  `SecretMarsh_51.501N_-0.142W.wav` name: default output contains no copy of
  it, while explicit source-path opt-in does. It also asserts an invalid
  `nightjar --json slice ... --chunk-seconds 9` invocation returns one stdout
  JSON object, no stderr, and exit 2.
- Browser unit coverage asserts the locally generated preview manifest omits
  that same filename.
- Pinned Playwright 1.58.2 browser coverage runs at 1440×900 and 390×844.
  It checks keyboard skip-link focus and Enter activation, real local WAV
  planning/download redaction, reduced motion, service-worker offline shell,
  page errors, and axe WCAG 2 A/AA + 2.1 AA (zero violations).

## Verification evidence

Executed from a fresh npm dependency install:

```sh
npm ci
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --allow-dirty
```

All commands passed on 28 August 2026.

- `npm test`: 9 Rust tests (3 unit + 6 CLI integration), 4 Node planner
  tests, and 2 Playwright tests passed. The browser audit had zero axe
  violations.
- `npm run build`: writes `dist/site` and `dist/bin/nightjar`. Production
  initial assets are 5.97 KB JS and 13.18 KB CSS (pre-gzip); the 93.5 KB hero
  remains below its budget. `dist/site/staticwebapp.config.json` was checked
  for the immutable cache and Permissions-Policy entries.
- `cargo package --allow-dirty`: packaged 45 files, 249.8 KiB (70.8 KiB
  compressed), and completed Cargo's clean unpack/compile verification.
- Clean consumer check: installed that unpacked package with
  `cargo install --path target/package/nightjar-slicer-0.1.0 --root …
  --locked`; `nightjar --version` returned `nightjar 0.1.0`, and its
  invalid `--json` validation call returned the documented JSON object and
  exit 2.
- No analytics, storage, remote fonts, or third-party runtime requests were
  added. The browser preview remains local-only.

## Deploy and release

Static deployment target: Azure Static Web App `sf-bird-audio-slicer`
(`gray-field-05f51650f.7.azurestaticapps.net`, custom host
`https://bird-audio-slicer.sociobot.in`). The deployable directory is
`dist/site`; the release CLI is `dist/bin/nightjar`.

Deployed to production on 28 August 2026 from repair commit
`bde671063183c4626575424e955f6d303c5a1fcf` using
`@azure/static-web-apps-cli@2.0.10` and the configured Static Web App
deployment token. Azure reported the production environment Ready at
`2026-08-28T00:48:18.354105Z`.

Live verification of `https://bird-audio-slicer.sociobot.in/` confirmed:

- Homepage SHA-256 exactly matches `dist/site/index.html`.
- `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(),
  microphone=(), geolocation=()`, `X-Content-Type-Options: nosniff`, and the
  configured same-origin CSP are present.
- The hashed home JS is served with
  `Cache-Control: public, max-age=31536000, immutable` (the HTML remains
  short-lived at 30 seconds as intended for updates).
- Live Chromium at 390×844 found the expected title and one H1, skip link as
  the first Tab target, no console errors, no third-party requests, and zero
  axe WCAG 2 A/AA + 2.1 AA violations.

Do not publish the crate from this worker. The ready-to-publish verification
command is `cargo package`; registry credentials remain factory-owned.

## Known limits

- The disposable environment has no representative 4 GB recording, so the
  requested long-run wall-clock/RSS benchmark remains a release-lab check.
  The implementation remains streaming and structurally independent of input
  duration.
- The pilot-user success measure requires post-deployment field use and cannot
  be established in the repository.
