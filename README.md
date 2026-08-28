# Nightjar Slicer

Nightjar Slicer is a local, resume-safe CLI for turning long overnight WAV or
FLAC field recordings into manageable WAV clips, timestamped queue manifests,
and compact spectrogram thumbnails. It is for AudioMoth and field-recorder users
who want to prepare recordings for tools such as BirdNET Analyzer without first
opening a multi-gigabyte file in a GUI.

Nightjar does **not** identify birds, upload audio, alter the source recording,
or bundle any BirdNET model. Exported manifests omit source filenames, paths,
and recording metadata by default.

## Install

Build the single binary with stable Rust:

```sh
cargo install --path .
nightjar --help
```

Prebuilt release binaries can also be placed anywhere on your `PATH` when they
become available. Version 0.1.0 supports PCM/float WAV and FLAC input; clips
are interoperable 16-bit PCM WAV.

## Usage

Inspect a file without decoding the whole recording:

```sh
nightjar inspect NIGHT.WAV
nightjar --json inspect NIGHT.WAV
```

Create fixed three-minute clips:

```sh
nightjar slice NIGHT.WAV --output ./queue --chunk-seconds 180
```

Move each boundary to the quietest 500 ms window within 12 seconds of the
target, useful for avoiding calls at clip edges:

```sh
nightjar slice NIGHT.flac --output ./queue \
  --mode silence --chunk-seconds 180 --search-window-seconds 12
```

Nightjar writes `manifest.json`, `queue.csv`, numbered WAV clips, SVG
spectrograms, and a private `.nightjar-state.json` checkpoint. Re-running the
same command resumes verified clips and repairs missing or incomplete outputs.
Use `--no-thumbnails` to omit spectrograms, `--force` to replace an incompatible
plan, and `--include-source-path` only when exposing the original local path is
acceptable.

The exported manifest is ready to inspect or script:

```sh
jq '.chunks[] | select(.status == "ready") | .file' queue/manifest.json
nightjar --json slice NIGHT.WAV --output ./queue > result.json
```

Exit code `0` means success, `2` means invalid command arguments, `3` means the
input could not be read or decoded, and `4` means output creation failed.

## Output contract

- Source audio is never modified.
- Clip names include their one-based order and relative start timestamp.
- `manifest.json` uses schema `nightjar-manifest/v1`. Its `source.name` and
  `source.path` are `null` by default because a filename can reveal a location;
  `--include-source-path` explicitly includes both.
- `queue.csv` contains relative time ranges and clip/thumbnail paths for easy
  import or selection.
- Resume state is local implementation data; moving or deleting it starts a new
  verification pass but does not damage existing clips.
- Processing is streaming. Working memory depends on decoder buffers and a
  bounded spectrogram window, not input duration.

## Develop and verify

Requirements: stable Rust, Node.js 20+, and npm.

```sh
npm ci
npm test
npm run build        # CLI release build + site -> dist/bin and dist/site
npm run build:site   # static landing/docs site only -> dist/site
cargo package --allow-dirty
```

Run the site locally with `npm run dev`. The browser demo reads only a selected
WAV header and plans time ranges locally; it never uploads or stores the file.

## Privacy and license

There is no telemetry, account, cloud upload, or payment. See the site's
privacy and terms pages for the hosted documentation. Nightjar Slicer is MIT
licensed; see [LICENSE](LICENSE).
