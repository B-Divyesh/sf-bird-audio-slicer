# Adversarial first-read review 1 — FAIL

Reviewed 28 August 2026 against commit
“4a5759ac12af86b35640bddef1ed5281f6fb8695” and
<https://bird-audio-slicer.sociobot.in>.

## Verdict

**FAIL.** There are 102 findings. F-1-1 through F-1-4 are blocking.
The first phone screen does not state the audience or show a primary action in
the hero, there is no sample-data demo for either the site or CLI,
“.factory/claims.json” is absent, and an unknown route displays Azure's generic
404 with third-party scripts.

The clean-clone quality gates pass, the distinct visual direction is present,
and the tested planner behavior is private. Those passes do not offset missing
product-contract artifacts or untested public claims.

## 1. Cold first screen, before scrolling

Fresh Chromium contexts used 390 × 844 and 1440 × 900 viewports, with service
workers blocked for the cold load. No scrolling occurred before these notes.

### My first-read answers

| Question | 390 px phone | 1440 px desktop |
| --- | --- | --- |
| What does it do? | I infer that it turns long WAV/FLAC recordings into smaller items for a bird analyzer, but “quiet, resumable queue” does not say whether those items are files, timestamps, or jobs. | I infer that it installs a CLI which splits recordings into clips and can plan clips in a browser. |
| For whom? | Not stated. “The bird analyzer you already use” implies a person who already has an analyzer, but does not name birders, AudioMoth users, or field recordists. | Not stated explicitly; the same inference is required. |
| What should I click first? | Unclear. The hero contains no action above the fold. Only the header link “Try the planner” is visible, and it does not say that the next screen requires my own WAV. | Unclear. “Install Nightjar” and “Plan clips in your browser” compete, and neither offers sample data. |

### Blocking first-read finding

**F-1-1 — BLOCKING — the first screen fails all three required answers without
inference.** Exact copy: H1 “Carry the whole night. Open only a window.”;
supporting sentence “Nightjar Slicer turns multi-gigabyte WAV and FLAC
recordings into a quiet, resumable queue for the bird analyzer you already
use.”; actions “Install Nightjar” and “Plan clips in your browser.” On mobile,
the hero actions start below the 844 px viewport. The metaphorical H1 does not
name the job, the sentence does not name the user, and the actions do not
identify a first, sample-backed path. Fix the first screen to:

- H1: “Split long bird recordings into WAV clips”
- Sentence: “For AudioMoth and field-recorder users preparing overnight audio
  for BirdNET Analyzer.”
- Primary action: “Try it with sample data”
- Adjacent explanation: “Loads a 20-second field recording and shows its clip
  plan.”
- Secondary action: “Install the CLI”
- Facts: “Runs locally”, “Keeps the original recording”, “Free and MIT
  licensed”

## 2. Demo and sandbox

**F-1-2 — BLOCKING — there is no one-click demo.** The first screen has no
“Try it with sample data” action. “Try the planner” scrolls to an empty form
whose first state is “No recording selected.” “/demo” returns 404.
“/?demo=1” returns the normal empty landing page: no sample result, no
“Demo — sample data, nothing is saved” banner, no “Reset demo,” and no “Start
for real.” The CLI run from a new temporary directory,
“nightjar demo,” exits 2 with “unrecognized subcommand 'demo'”; “examples/” is
absent. “.factory/demo.md” is also absent. Add one bundled realistic WAV in
“examples/”, a “nightjar demo” command that operates in a temporary directory,
and a landing-page terminal recording of that real command. Make “/demo” load
the same sample into the planner with the required banner and controls.

Sandbox evidence:

- The live planner flow used a synthetic 25-second WAV named
  “SecretMarsh_51.501N_-0.142W.wav”. It immediately showed three realistic
  rows only after that reviewer-supplied file was selected.
- The downloaded manifest redacted “source.name” and “source.path”.
- Cookies, localStorage, sessionStorage, and IndexedDB stayed empty. The only
  cache was the same-origin service-worker shell.
- Every recorded request was same-origin. No audio request left the browser.
- The normal “/” page reloaded offline after its first visit. The attempted
  demo URL “/?demo=1” failed its offline reload because that URL had not been
  cached.
- There is no demo namespace to inspect or reset, so isolation from real
  storage cannot be confirmed in demo mode.

**F-1-3 — BLOCKING — unknown routes use Azure's generic hosted 404.** The live
URL “/definitely-missing-review-route” returns 404 with title “Azure Static Web
Apps - 404: Not found,” Microsoft branding, Bootstrap and jQuery from external
CDNs, no Nightjar navigation, and no way back to the product. The repository
has no “404.html”; “staticwebapp.config.json” has no 404 response override.
Create a Nightjar-styled, self-hosted 404 with a “Return to Nightjar Slicer”
link, add the valid response override, and include it in metadata, privacy,
accessibility, and link checks.

## 3. Claims

**F-1-4 — BLOCKING — the required claim registry does not exist.**
“.factory/claims.json” is absent. Therefore there are no listed claim commands
to run, no “@claim:” mappings, and no way to obtain the required state of zero
untested claims. Create the file, give every public claim one observable
sandbox test, and make the demo the common clean entry point.

The following are independent unlisted-claim findings. Each exact sentence or
UI claim needs its own entry and tagged observable test; where the claim is
duplicated, use one canonical sentence everywhere and list every location in
its “where” field.

| ID | Exact quote and location | Why it is unverified or misleading | Concrete fix |
| --- | --- | --- | --- |
| F-1-5 | Landing offline banner: “the planner and saved guide still work locally.” | No claim entry. The normal root works offline, but the attempted demo URL does not. | Add “offline-reload” coverage for the canonical demo URL or remove the sentence. |
| F-1-6 | Landing hero: “turns multi-gigabyte WAV and FLAC recordings into a quiet, resumable queue…” | This is the core outcome and has no claim entry. | Test WAV and FLAC outputs and resume behavior from the bundled demo fixture. |
| F-1-7 | Landing fact: “Streaming memory” | This implies bounded memory without a defined bound. | Replace with a measured limit and add a peak-RSS claim test. |
| F-1-8 | Landing fact: “Resume checkpoints” | Presence is not the promised recovery outcome. | Test interruption, rerun, reuse, and repair. |
| F-1-9 | Landing fact: “No upload” | Privacy claim is absent from the registry. | Record browser and CLI network activity in a claim test. |
| F-1-10 | Landing figure: “One continuous recording becomes inspectable pieces before identification.” | The transformation is unlisted and “pieces” is undefined. | Say “The CLI writes WAV clips before identification” and test the files. |
| F-1-11 | Landing strip: “4 GB / 11:42:18” becomes “235 × 03:00 WAV clips + queue manifest.” | Quantitative claim has no exact 4 GB/duration/count assertion. | Add a fixture with those values and assert 235 clips plus a manifest. |
| F-1-12 | Landing workflow: “BirdNET can identify sound.” | This is an unbounded third-party capability claim. | Delete it; say only that Nightjar prepares files for BirdNET Analyzer. |
| F-1-13 | Landing workflow: “Nightjar handles the awkward scale and file preparation that comes first.” | “Handles” is not an observable result. | Name the files it writes and test them. |
| F-1-14 | Landing step: “See duration, channels, sample rate, and size without loading the recording into a GUI.” | No mapped test proves all four fields. | Add an inspect-output claim test for WAV and FLAC. |
| F-1-15 | Landing step: “nudge each boundary to the quietest nearby half-second.” | No mapped test proves the chosen window is the quietest. | Assert the boundary against a controlled energy fixture. |
| F-1-16 | Landing step: “Completed clips are verified and reused.” | No mapped claim test. | Corrupt one clip, rerun, and assert reuse/repair counts. |
| F-1-17 | Landing step: “A stopped batch continues without repeating extraction.” | Existing tests do not simulate a stopped batch and are not mapped. | Interrupt after a checkpoint and assert only unfinished clips are decoded. |
| F-1-18 | Landing planner: “The browser reads a small header slice only.” | No mapped test asserts the read byte range. | Instrument Blob.slice and assert at most 256 KiB is read. |
| F-1-19 | Landing planner: “Nothing leaves this device.” | Privacy claim lacks a request-log claim test. | Add a same-origin request-log test for the full demo flow. |
| F-1-20 | Landing planner: “FLAC and silence-aware planning are available in the CLI.” | No mapped claim test covers both. | Test a bundled FLAC and a controlled silence fixture. |
| F-1-21 | Landing field help: “Your file stays in this browser.” | No mapped persistence/network test. | Assert no upload, cookie, local/session storage, IndexedDB, or OPFS write. |
| F-1-22 | Landing field help: “Between 10 seconds and one hour.” | The accepted numeric boundary is unlisted. | Test 9, 10, 3,600, and 3,601 seconds. |
| F-1-23 | Landing empty state: “a privacy-safe manifest.” | “Privacy-safe” is undefined and untested. | Replace it with the exact omitted fields and test each field. |
| F-1-24 | Landing install: “Build with stable Rust today.” | No mapped clean-toolchain build test. | Add a claim entry for the minimum supported Rust version. |
| F-1-25 | Landing install heading: “No model, no cloud.” | Both are privacy/scope claims without mappings. | Test network absence; state “Does not bundle a bird-identification model.” |
| F-1-26 | Landing scope: “Nightjar prepares evidence.” | “Evidence” is vague and untested. | Replace with “Nightjar writes clips, manifests, and spectrograms.” |
| F-1-27 | Landing scope: “It does not decide what sang.” | Identification-scope claim is unlisted. | Add a package/content test or retain it only in clearly non-functional scope copy. |
| F-1-28 | Landing scope: “No BirdNET weights, accuracy claims, public reports, accounts, or location metadata are bundled.” | Five claims are compressed into one untested sentence. | Split them and map package scans, output checks, and network/storage tests. |
| F-1-29 | README opening: “Nightjar Slicer is a local, resume-safe CLI for turning long overnight WAV or FLAC field recordings into manageable WAV clips, timestamped queue manifests, and compact spectrogram thumbnails.” | Core output claim is unlisted. | Map WAV/FLAC, resume, manifest, and thumbnail outcomes to tests. |
| F-1-30 | README: “Nightjar does not identify birds, upload audio, alter the source recording, or bundle any BirdNET model.” | Four scope/privacy claims have no entries. | Split and test package contents, source hash, and network log. |
| F-1-31 | README: “Exported manifests omit source filenames, paths, and recording metadata by default.” | Existing tests cover name/path but not embedded recording metadata and are not mapped. | Add a metadata-bearing fixture and assert every omitted field. |
| F-1-32 | README: “Version 0.1.0 supports PCM/float WAV and FLAC input; clips are interoperable 16-bit PCM WAV.” | Format and interoperability claims are unlisted. | Add fixtures for each input encoding and independently decode each output. |
| F-1-33 | README: “Inspect a file without decoding the whole recording.” | Existing test checks output, not decoder activity. | Instrument reads/decoding or narrow the sentence to “Print recording details.” |
| F-1-34 | README: “Create fixed three-minute clips.” | No exact three-minute mapped test. | Assert durations and final remainder. |
| F-1-35 | README: “Move each boundary to the quietest 500 ms window within 12 seconds…” | Quantitative silence claim is unlisted. | Assert energy and ±12-second bounds. |
| F-1-36 | README: “Nightjar writes manifest.json, queue.csv, numbered WAV clips, SVG spectrograms, and a private .nightjar-state.json checkpoint.” | Output inventory is not mapped. | Assert every file and privacy boundary. |
| F-1-37 | README: “Re-running the same command resumes verified clips and repairs missing or incomplete outputs.” | Existing coverage is not registered and does not cover missing output. | Register it and add the missing-output case. |
| F-1-38 | README sentence beginning “Use --no-thumbnails…” | Three switch behaviors are unlisted. | Give each switch its own claim entry and test. |
| F-1-39 | README: “The exported manifest is ready to inspect or script.” | “Ready” is vague. | State and test the JSON schema and one documented jq command. |
| F-1-40 | README exit-code sentence | Four exit-code promises are unlisted. | Parameterize all documented error classes and assert stdout/stderr. |
| F-1-41 | README: “Source audio is never modified.” | Source-integrity claim lacks a mapped hash test. | Hash the demo source before and after each mode. |
| F-1-42 | README: “Clip names include their one-based order and relative start timestamp.” | Naming contract is unlisted. | Assert exact names across an hour boundary. |
| F-1-43 | README: “manifest.json uses schema nightjar-manifest/v1.” | Schema claim is unlisted. | Validate output against a checked-in JSON Schema. |
| F-1-44 | README sentence beginning “Its source.name and source.path are null…” | Redaction and opt-in behavior are unlisted. | Map both default and explicit opt-in tests. |
| F-1-45 | README: “queue.csv contains relative time ranges and clip/thumbnail paths…” | CSV contract is unlisted. | Parse the CSV and assert headers and one row per clip. |
| F-1-46 | README resume-state sentence | Recovery and non-damage claims are unlisted. | Delete/move state, rerun, and hash existing clips. |
| F-1-47 | README: “Processing is streaming.” | No observable bound is stated or tested. | Replace with a measured memory ceiling and test it. |
| F-1-48 | README: “Working memory depends on decoder buffers and a bounded spectrogram window, not input duration.” | This is a scaling claim without a comparative memory test. | Compare peak RSS for small and large fixtures with a stated ceiling. |
| F-1-49 | README browser-demo sentence | It calls the empty planner a demo and makes read/upload/storage claims without mappings. | Implement the demo, then test bytes read, requests, and stores. |
| F-1-50 | README: “There is no telemetry, account, cloud upload, or payment.” | Four product claims are unlisted. | Split and test the build/request/storage surface. |
| F-1-51 | README: “Nightjar Slicer is MIT licensed.” | The statement is not registered. | Add a repository/package license check or remove it from claims scope documentation. |
| F-1-52 | Privacy: “The CLI makes no network requests and includes no telemetry.” | Privacy route claim is unlisted. | Trace system calls or run in a network-denied sandbox and scan dependencies. |
| F-1-53 | Privacy: “It reads the recording you name and writes only to the output directory you choose.” | Filesystem-boundary claim is unlisted. | Snapshot a temp directory before/after and assert changed paths. |
| F-1-54 | Privacy: “Source recordings are never modified.” | Duplicate unlisted integrity claim. | Canonicalize it and list both locations in one tested claim. |
| F-1-55 | Privacy manifest-redaction sentence | The route adds embedded metadata to the claim, beyond existing tests. | Test a metadata-bearing WAV/FLAC. |
| F-1-56 | Privacy: “If you pass --include-source-path, that local path and filename are included…” | Opt-in claim is unlisted. | Register the existing opt-in test. |
| F-1-57 | Privacy: “The demo reads a small WAV header slice in your browser.” | There is no demo, and byte count is untested. | Implement sample demo and assert maximum bytes read. |
| F-1-58 | Privacy: “It does not upload audio, retain the file, use cookies, or place data in local storage.” | Four privacy claims lack mappings. | Assert requests and all browser stores through reset/exit. |
| F-1-59 | Privacy: “A downloaded sample manifest is created on your device.” | It is generated from the visitor's file, not sample data. | Use the bundled sample in demo mode and test the download contents. |
| F-1-60 | Privacy: “No third-party scripts, fonts, analytics, advertising, or tracking pixels are present.” | The product pages pass, but the live 404 loads Microsoft/Ajax CDN assets. | Include 404 in the request-log test and self-host it. |
| F-1-61 | Privacy: “Clear the site's browser cache to remove the offline documentation copy.” | Removal behavior is unlisted and browser cache is not the same as Cache Storage. | Name the actual service-worker cache and test unregister/delete steps. |
| F-1-62 | Terms: “Nightjar divides audio and creates local queue metadata.” | Functional claim is unlisted. | Map it to the core output claim. |
| F-1-63 | Terms sentence beginning “It does not identify species…” | Scope and compatibility claims are compressed and unlisted. | Split observable scope claims; remove the untestable universal compatibility wording. |
| F-1-64 | Terms: “the tool is designed never to alter its input” | “Designed” weakens the stronger claim elsewhere and remains unlisted. | Use the canonical source-integrity wording and hash test. |

No claims listed means no listed test command could be executed. Separately, the
repository's full test suite passed in the clean clone; see Verification below.

## 4. Other product and structure findings

**F-1-65 — MAJOR — the brief's success measure remains unverified.** The
current handoff says an actual AudioMoth/field-recorder 4 GB run and ten-user
pilot remain future work. This is not a code regression, but it is still a
known gap against the brief. Run a representative 4 GB recording under the
1 GB ceiling and record ten pilot submissions, or revise the success measure
before claiming completion.

**F-1-66 — MAJOR — route metadata is incomplete.** On “/”, “/privacy/”, and
“/terms/”, canonical links, Open Graph metadata, Twitter metadata, a
1200 × 630 product image, and an apple-touch icon are absent. The title,
description, favicon, language, one-H1, and main-landmark checks pass. Add
route-specific canonical/OG/Twitter values and the required original image and
touch icon.

**F-1-67 — MAJOR — headers and footers do not use one consistent skeleton.**
The landing header has “Workflow / Try the planner / Source”; legal headers
have only “Home” plus the other legal page. Legal footers omit the product
one-liner, “Built by Param Factory,” version/build ID, and GitHub link. The
landing footer omits “Built by Param Factory” and version/build ID. Use one
shared header/footer component and include Demo, Privacy, Terms, provenance,
and build ID on every route.

**F-1-68 — MAJOR — route and section navigation does not move or announce
focus.** After activating “Try the planner,” “#planner” is set but the H2 is
not focused; after loading “/privacy/”, focus is BODY and no aria-live region
exists. Add focusable route/section headings, focus them after navigation, and
announce route titles. Re-test forward/back scroll and focus restoration.

**F-1-69 — MINOR — external links are not identified as external.** Exact
labels are “Source” and “GitHub”; both point to github.com without saying so.
Rename them “Source on GitHub” and “Project on GitHub,” or add accessible
external-link text.

**F-1-70 — MAJOR — installability stops at a Rust toolchain.** The landing
says “Release binaries can be dropped anywhere on your path,” but GitHub has
zero releases and zero tags. The main install action only reveals
“cargo install --git …”. Publish versioned binaries for supported platforms
with checksums and link them beside the Cargo command, or state plainly that
Rust 1.85+ is required to install from source.

**F-1-71 — MAJOR — the brief's analyzer handoff is not completed.** The CLI
writes every clip and a generic CSV, but neither the UI nor README provides a
tested way to select clips and hand those selected clips to BirdNET Analyzer.
Add a non-AI “select clips” command/export profile and document the exact
BirdNET Analyzer import step. An AI identification feature is not warranted:
the brief explicitly keeps identification outside Nightjar, and no provider
keys or model calls are present.

The visual identity itself passes: the generated moonlit cut-paper wetland,
offset editorial layout, field-note typography, restrained palette, and
non-looping motion are product-specific rather than a generic SaaS template.
Asset provenance is documented in “.factory/design.md”.

## 5. Copy findings

Every flagged row in the audits below maps to one finding here.

| ID | Exact quote/location | Why it fails first-read copy | Proposed rewrite |
| --- | --- | --- | --- |
| F-1-72 | Landing eyebrow: “Field utility / 01” | Decorative serial lore; it names no section. | Delete it. |
| F-1-73 | Landing H1: “Carry the whole night. Open only a window.” | Metaphor; neither sentence names the job. | “Split long bird recordings into WAV clips.” |
| F-1-74 | Hero: “quiet, resumable queue” | “Quiet” is mood copy and “queue” is undefined. | “resume-safe WAV clips and a CSV manifest.” |
| F-1-75 | Fact: “Streaming memory” | Noun fragment and unexplained technical claim. | “Uses under [tested amount] of memory.” |
| F-1-76 | Fact: “Resume checkpoints” | Implementation term, not a user result. | “Continue an interrupted batch.” |
| F-1-77 | “Plate 01” | Decorative label carries no useful information. | Delete it. |
| F-1-78 | Section eyebrow: “The handoff before the model” | Metaphor plus unexplained “model.” | “Prepare clips for BirdNET Analyzer.” |
| F-1-79 | H2: “Make the recording manageable, not mysterious.” | Mood slogan; does not name the section. | “How Nightjar prepares your recording.” |
| F-1-80 | Section eyebrow: “Local planning desk” | Brand-lore metaphor. | “Browser clip planner.” |
| F-1-81 | H2: “Try your WAV header here.” | “Header” is jargon and the heading does not state the result. | “Plan fixed WAV clips in your browser.” |
| F-1-82 | Terminal label: “Field terminal” | Decorative mood label. | “Install and run Nightjar.” |
| F-1-83 | Section label: “A useful boundary” | Makes no sense out of context. | “What Nightjar does not do.” |
| F-1-84 | “Nightjar prepares evidence.” | “Evidence” is vague and overstates ordinary audio clips. | “Nightjar prepares clips for review.” |
| F-1-85 | Footer: “Local preprocessing for long nights in the field.” | “Preprocessing” is jargon and “long nights” is mood copy. | “Split long bird recordings into clips locally.” |
| F-1-86 | Button/link: “Try the planner” | It does not name the result or disclose that the visitor needs a WAV. | “Plan clips from your WAV”; after demo exists, use “Try it with sample data.” |
| F-1-87 | Button: “Copy” | Does not name what will be copied. | “Copy install command.” |
| F-1-88 | Button: “Download sample manifest” | The file is generated from the visitor's recording, not sample data. | “Download clip plan”; reserve “sample” for demo data. |
| F-1-89 | README opening sentence, 27 words | Over 22 words and contains “resume-safe CLI,” “queue manifests,” and “spectrogram thumbnails.” | “Nightjar Slicer splits long WAV and FLAC bird recordings into WAV clips. It also writes a CSV manifest and spectrogram images.” |
| F-1-90 | README audience sentence, 27 words | Over 22 words and delays the audience and result. | “It is for AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer. You do not need to open the full recording in a GUI.” |
| F-1-91 | README sentence beginning “Use --no-thumbnails…”, 22 words | Three separate instructions in one sentence. | Give each flag its own bullet and result. |
| F-1-92 | README exit-code sentence, 26 words | Over 22 words and packs four outcomes into one sentence. | Use a four-row table: code, meaning, next action. |
| F-1-93 | README: “Resume state is local implementation data; moving or deleting it starts a new verification pass…” | “Implementation data” and “verification pass” do not tell users what they will observe. | “If the checkpoint is missing, Nightjar checks every existing clip again. It does not delete valid clips.” |
| F-1-94 | README: “decoder buffers and a bounded spectrogram window” | Undefined implementation jargon. | “Memory use does not grow with recording length. See the tested memory limit.” |
| F-1-95 | Error: “Nightjar could not read this WAV header.” | Gives no reason or next action. | “Nightjar could not find standard WAV details. Export the file as PCM WAV and try again.” |
| F-1-96 | Error: “This file is too small to contain a WAV header.” | Gives no next action. | Add “Choose a complete WAV recording.” |
| F-1-97 | Error: “This does not look like a RIFF or RF64 WAV recording.” | Uses container jargon and gives no next action. | “This is not a supported WAV file. Choose a PCM or float WAV recording.” |
| F-1-98 | Error: “The WAV format block was not found in the first part of this file.” | Internal format detail without recovery. | “Nightjar could not read this WAV. Export it as a standard PCM WAV and try again.” |
| F-1-99 | Error: “The WAV audio data block was not found in the first part of this file.” | Internal format detail without recovery. | Use the same actionable standard-WAV guidance. |
| F-1-100 | Error: “WAV encoding [number] is not supported by this planner. The CLI may still support it.” | “May” leaves the user guessing. | Name supported browser encodings and give the exact CLI command to try. |
| F-1-101 | Errors “The WAV header has invalid channel or sample-rate values” and “reports no playable audio.” | Neither gives a next action. | Tell the user to re-export as PCM/float WAV or choose another recording. |
| F-1-102 | Site and README terminology | The same concepts change names: “window / pieces / cuts / clips / chunks”; “planner / demo”; “bird analyzer / BirdNET / BirdNET Analyzer / model”; “resumable / resume-safe / resume checkpoints.” | Standardize on “clip,” “demo” only for bundled sample data, “BirdNET Analyzer,” and “continue an interrupted batch.” |

## 6. Complete landing-page copy audit

Counts use whitespace-delimited words; hyphenated forms count as one. The audit
includes visible, state-dependent, and error copy. Commands and table values
are not prose sentences.

| # | Exact copy | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Skip to main content | 4 | — |
| 2 | Offline field mode — the planner and saved guide still work locally. | 12 | F-1-5 |
| 3 | Nightjar / Slicer | 3 | — |
| 4 | Workflow | 1 | — |
| 5 | Try the planner | 3 | F-1-86 |
| 6 | Source | 1 | F-1-69 |
| 7 | Field utility / 01 | 4 | F-1-72 |
| 8 | Carry the whole night. | 4 | F-1-73 |
| 9 | Open only a window. | 4 | F-1-73 |
| 10 | Nightjar Slicer turns multi-gigabyte WAV and FLAC recordings into a quiet, resumable queue for the bird analyzer you already use. | 20 | F-1-6, F-1-74 |
| 11 | Install Nightjar | 2 | — |
| 12 | Plan clips in your browser | 5 | — |
| 13 | Streaming memory | 2 | F-1-7, F-1-75 |
| 14 | Resume checkpoints | 2 | F-1-8, F-1-76 |
| 15 | No upload | 2 | F-1-9 |
| 16 | Plate 01 | 2 | F-1-77 |
| 17 | One continuous recording becomes inspectable pieces before identification. | 8 | F-1-10, F-1-102 |
| 18 | Input | 1 | — |
| 19 | 4 GB / 11:42:18 | 4 | F-1-11 |
| 20 | One original recording | 3 | — |
| 21 | Output | 1 | — |
| 22 | 235 × 03:00 | 3 | F-1-11 |
| 23 | WAV clips + queue manifest | 5 | F-1-11 |
| 24 | The handoff before the model | 5 | F-1-78 |
| 25 | Make the recording manageable, not mysterious. | 6 | F-1-79 |
| 26 | BirdNET can identify sound. | 4 | F-1-12 |
| 27 | Nightjar handles the awkward scale and file preparation that comes first. | 11 | F-1-13 |
| 28 | Inspect the header | 3 | Technical but names the step |
| 29 | See duration, channels, sample rate, and size without loading the recording into a GUI. | 14 | F-1-14 |
| 30 | Choose the cuts | 3 | F-1-102 |
| 31 | Use exact intervals or nudge each boundary to the quietest nearby half-second. | 12 | F-1-15 |
| 32 | Resume the queue | 3 | F-1-102 |
| 33 | Completed clips are verified and reused. | 6 | F-1-16 |
| 34 | A stopped batch continues without repeating extraction. | 7 | F-1-17 |
| 35 | Local planning desk | 3 | F-1-80 |
| 36 | Try your WAV header here. | 5 | F-1-81 |
| 37 | The browser reads a small header slice only. | 8 | F-1-18 |
| 38 | Nothing leaves this device. | 4 | F-1-19 |
| 39 | FLAC and silence-aware planning are available in the CLI. | 9 | F-1-20 |
| 40 | WAV recording | 2 | — |
| 41 | Your file stays in this browser. | 6 | F-1-21 |
| 42 | Clip length | 2 | — |
| 43 | seconds | 1 | — |
| 44 | Between 10 seconds and one hour. | 6 | F-1-22 |
| 45 | Plan fixed clips | 3 | — |
| 46 | No recording selected | 3 | — |
| 47 | Choose a WAV to preview its time ranges and a privacy-safe manifest. | 12 | F-1-23 |
| 48 | Reading the field header… | 4 | — |
| 49 | Plan ready | 2 | — |
| 50 | First planned fixed-length audio clips | 5 | — |
| 51 | Clip | 1 | — |
| 52 | Start | 1 | — |
| 53 | End | 1 | — |
| 54 | Status | 1 | — |
| 55 | Showing 8 of [N] planned clips. | 6 | — |
| 56 | Showing all [N] planned clips. | 5 | — |
| 57 | Download sample manifest | 3 | F-1-88 |
| 58 | Version 0.1.0 / MIT | 4 | F-1-51 |
| 59 | A single local tool. | 4 | — |
| 60 | No model, no cloud. | 4 | F-1-25 |
| 61 | Build with stable Rust today. | 5 | F-1-24 |
| 62 | Release binaries can be dropped anywhere on your path. | 9 | F-1-70 |
| 63 | Field terminal | 2 | F-1-82 |
| 64 | Copy | 1 | F-1-87 |
| 65 | Installation command copied to the clipboard. | 6 | — |
| 66 | Clipboard access was blocked. | 4 | — |
| 67 | Select the command text to copy it. | 7 | — |
| 68 | A useful boundary | 3 | F-1-83 |
| 69 | Nightjar prepares evidence. | 3 | F-1-26, F-1-84 |
| 70 | It does not decide what sang. | 6 | F-1-27 |
| 71 | No BirdNET weights, accuracy claims, public reports, accounts, or location metadata are bundled. | 13 | F-1-28 |
| 72 | Nightjar / Slicer | 3 | — |
| 73 | Local preprocessing for long nights in the field. | 8 | F-1-85 |
| 74 | Privacy | 1 | — |
| 75 | Terms | 1 | — |
| 76 | GitHub | 1 | F-1-69 |
| 77 | Choose a WAV recording before planning clips. | 7 | — |
| 78 | Enter a clip length from 10 to 3,600 seconds. | 9 | — |
| 79 | Nightjar could not read this WAV header. | 7 | F-1-95 |
| 80 | This file is too small to contain a WAV header. | 10 | F-1-96 |
| 81 | This does not look like a RIFF or RF64 WAV recording. | 11 | F-1-97 |
| 82 | The WAV format block was not found in the first part of this file. | 14 | F-1-98 |
| 83 | The WAV audio data block was not found in the first part of this file. | 15 | F-1-99 |
| 84 | WAV encoding [number] is not supported by this planner. | 9 | F-1-100 |
| 85 | The CLI may still support it. | 6 | F-1-100 |
| 86 | The WAV header has invalid channel or sample-rate values. | 9 | F-1-101 |
| 87 | The WAV header reports no playable audio. | 7 | F-1-101 |
| 88 | Recording duration must be greater than zero. | 7 | Internal validation; plain |
| 89 | Clip length must be between 10 and 3,600 seconds. | 9 | Internal validation; plain |
| 90 | Generated locally; source filename, path, and recording metadata omitted. | 9 | F-1-23 |

No landing-page sentence exceeds 22 words. The failures are meaning, jargon,
metaphor, consistency, and unlisted claims rather than raw length.

## 7. Complete README copy audit

Code blocks are executable examples, not prose sentences, so they are excluded
from word counts.

| # | Exact copy | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Nightjar Slicer | 2 | — |
| 2 | Nightjar Slicer is a local, resume-safe CLI for turning long overnight WAV or FLAC field recordings into manageable WAV clips, timestamped queue manifests, and compact spectrogram thumbnails. | 27 | F-1-29, F-1-89 |
| 3 | It is for AudioMoth and field-recorder users who want to prepare recordings for tools such as BirdNET Analyzer without first opening a multi-gigabyte file in a GUI. | 27 | F-1-90 |
| 4 | Nightjar does not identify birds, upload audio, alter the source recording, or bundle any BirdNET model. | 16 | F-1-30 |
| 5 | Exported manifests omit source filenames, paths, and recording metadata by default. | 11 | F-1-31 |
| 6 | Install | 1 | — |
| 7 | Build the single binary with stable Rust: | 7 | F-1-24 |
| 8 | Prebuilt release binaries can also be placed anywhere on your PATH when they become available. | 15 | F-1-70 |
| 9 | Version 0.1.0 supports PCM/float WAV and FLAC input; clips are interoperable 16-bit PCM WAV. | 14 | F-1-32 |
| 10 | Usage | 1 | — |
| 11 | Inspect a file without decoding the whole recording: | 8 | F-1-33 |
| 12 | Create fixed three-minute clips: | 4 | F-1-34 |
| 13 | Move each boundary to the quietest 500 ms window within 12 seconds of the target, useful for avoiding calls at clip edges: | 22 | F-1-35 |
| 14 | Nightjar writes manifest.json, queue.csv, numbered WAV clips, SVG spectrograms, and a private .nightjar-state.json checkpoint. | 14 | F-1-36 |
| 15 | Re-running the same command resumes verified clips and repairs missing or incomplete outputs. | 13 | F-1-37 |
| 16 | Use --no-thumbnails to omit spectrograms, --force to replace an incompatible plan, and --include-source-path only when exposing the original local path is acceptable. | 22 | F-1-38, F-1-91 |
| 17 | The exported manifest is ready to inspect or script: | 9 | F-1-39 |
| 18 | Exit code 0 means success, 2 means invalid command arguments, 3 means the input could not be read or decoded, and 4 means output creation failed. | 26 | F-1-40, F-1-92 |
| 19 | Output contract | 2 | — |
| 20 | Source audio is never modified. | 5 | F-1-41 |
| 21 | Clip names include their one-based order and relative start timestamp. | 10 | F-1-42 |
| 22 | manifest.json uses schema nightjar-manifest/v1. | 4 | F-1-43 |
| 23 | Its source.name and source.path are null by default because a filename can reveal a location; --include-source-path explicitly includes both. | 19 | F-1-44 |
| 24 | queue.csv contains relative time ranges and clip/thumbnail paths for easy import or selection. | 13 | F-1-45 |
| 25 | Resume state is local implementation data; moving or deleting it starts a new verification pass but does not damage existing clips. | 21 | F-1-46, F-1-93 |
| 26 | Processing is streaming. | 3 | F-1-47 |
| 27 | Working memory depends on decoder buffers and a bounded spectrogram window, not input duration. | 14 | F-1-48, F-1-94 |
| 28 | Develop and verify | 3 | — |
| 29 | Requirements: stable Rust, Node.js 20+, and npm. | 7 | — |
| 30 | Run the site locally with npm run dev. | 8 | — |
| 31 | The browser demo reads only a selected WAV header and plans time ranges locally; it never uploads or stores the file. | 21 | F-1-2, F-1-49, F-1-102 |
| 32 | Privacy and license | 3 | — |
| 33 | There is no telemetry, account, cloud upload, or payment. | 9 | F-1-50 |
| 34 | See the site's privacy and terms pages for the hosted documentation. | 11 | — |
| 35 | Nightjar Slicer is MIT licensed; see LICENSE. | 7 | F-1-51 |

Terminology table:

| Concept | Current words | Required single term |
| --- | --- | --- |
| Output audio unit | window, piece, cut, clip, chunk | clip |
| Sample experience | planner, browser demo | demo only when sample data is loaded; planner for real files |
| Downstream tool | bird analyzer, BirdNET, BirdNET Analyzer, model | BirdNET Analyzer |
| Recovery | resumable, resume-safe, resume checkpoint, continue | continue an interrupted batch |
| Preview metadata | plan, queue manifest, sample manifest | clip plan for browser preview; manifest for CLI output |

## 8. History review

No earlier “.factory/review-*.md” or “.factory/polish-*.md” files exist.
The current handoff and both verification reports were read.

The three findings from “verification-1.md” were rechecked rather than trusted:

| Earlier finding | Live/code confirmation | Result |
| --- | --- | --- |
| P1: default manifest leaks location-bearing filename | Clean CLI tests and live browser download both returned null name/path; the sensitive filename was absent. | Fixed |
| P2: “--json” argument validation emits no JSON | Clean-clone test “json_argument_validation_failure_is_a_single_stdout_object” passed. | Fixed |
| P2: response policy/cache headers absent | Live root sends CSP, no-referrer, nosniff, permissions policy, and HSTS; hashed assets retain immutable policy. | Fixed |

The handoff's remaining real-recording and ten-pilot checks are still open and
are recorded as F-1-65. The handoff's overall PASS predates the stricter demo,
claims, plain-copy, and site-structure acceptance criteria used in this review.

## 9. Structure, links, accessibility, and verification evidence

- “npm ci”, “npm test”, and “npm run build” passed in clean clone
  “/tmp/nightjar-review-clean-b5ZKan”. Tests: 3 Rust unit, 6 Rust integration,
  4 Node, and 2 Playwright. Build produced “dist/site” and
  “dist/bin/nightjar”.
- The worker “verify-url.sh” passed: HTTPS 200, title, lang, one H1, main,
  image alt text, labeled buttons, and zero console errors.
- Axe 4.13 with WCAG 2 A/AA and 2.1 AA tags found zero violations at 390 × 844
  and 1440 × 900 on the live home page.
- The live home page produced no page errors. The only console warning in
  service-worker-blocked cold contexts was Playwright's own registration
  warning.
- All discovered product links were crawled. “/”, “/privacy/”, “/terms/”,
  “robots.txt”, “sitemap.xml”, the favicon, and the GitHub repository returned
  200. No dead published link was found.
- Titles pass the route pattern and length requirement:
  “Nightjar Slicer — prepare long bird recordings locally” (54),
  “Privacy — Nightjar Slicer” (25), and “Terms — Nightjar Slicer” (23).
- Each published product route has “lang=en”, one H1, a main landmark, ordered
  headings, a meta description, and an SVG favicon.
- Unknown paths return the platform 404, not a product page. That response
  loads Bootstrap, jQuery, localization JavaScript, and Microsoft imagery from
  third-party origins, causing F-1-3 and contradicting the site-wide privacy
  wording in F-1-60.

## What would make this perfect

Resolve every finding above, then rerun the review from a new browser profile
and a new temp directory. A perfect next candidate has:

1. A literal first screen that names the job, bird-recording audience, sample
   action, next result, and three tested facts within 390 × 844.
2. One sample-backed “/demo” and “nightjar demo” path with banner, reset,
   start-for-real, isolated storage, bundled data, and “.factory/demo.md”.
3. A complete “claims.json” whose exact tagged tests all pass from that demo.
4. A product-designed, self-hosted 404 and complete per-route metadata,
   navigation focus, shared header/footer, and external-link labels.
5. Versioned downloadable binaries plus a tested selected-clip handoff to
   BirdNET Analyzer.
6. Copy with every audit flag removed, one term per concept, and actionable
   errors.
7. Evidence from an actual 4 GB field recording and the ten-user success
   measure.

At that point, repeat the entire checklist. Do not treat the current clean
build, accessibility pass, or prior verification PASS as a waiver for any
remaining finding.
