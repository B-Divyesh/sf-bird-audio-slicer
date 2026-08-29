# Nightjar Slicer

Nightjar Slicer splits long WAV and FLAC bird recordings into WAV clips.
It also writes a JSON manifest, CSV queue, and SVG spectrograms.

It is for AudioMoth and field-recorder users preparing overnight audio for BirdNET Analyzer.
Nightjar does not identify birds or include a bird-identification model.

## Try the sample

The sample command needs no input file.
It writes two clips from the bundled 20-second recording into a new temporary directory.

```sh
cargo run -- demo
```

The browser demo is at <https://bird-audio-slicer.sociobot.in/demo/>.
It shows the same recording and saves nothing to your browser data.

## Install

Installation from source requires Rust 1.85 or newer.
This repository does not provide prebuilt binaries.

```sh
cargo install --path .
nightjar --help
```

## Inspect and split

Print recording details:

```sh
nightjar inspect NIGHT.WAV
nightjar --json inspect NIGHT.flac
```

Create fixed three-minute clips:

```sh
nightjar slice NIGHT.WAV --output ./queue --chunk-seconds 180
```

Move each boundary to the quietest nearby half-second:

```sh
nightjar slice NIGHT.flac --output ./queue \
  --mode silence --chunk-seconds 180 --search-window-seconds 12
```

Nightjar accepts PCM WAV, float WAV, and FLAC input.
It writes decodable 16-bit PCM WAV clips.
Clip lengths can range from 10 to 3,600 seconds.

Each output directory contains these files:

- `manifest.json` using schema `nightjar-manifest/v1`
- `queue.csv` with one time range per clip
- numbered WAV clips with relative start timestamps
- SVG spectrograms
- a private `.nightjar-state.json` checkpoint

Run the same command again to continue an interrupted batch.
Nightjar reuses complete clips and repairs missing or incomplete clips.

Use `--no-thumbnails` to omit SVG spectrograms.
Use `--force` to replace an incompatible clip plan.
Use `--include-source-path` only when you want the manifest to include the source name and path.

## Send selected clips to BirdNET Analyzer

Choose clip numbers from `queue.csv`, then copy those clips into a separate folder:

```sh
nightjar select queue/manifest.json \
  --output ./birdnet-selection --clips 1,4,7
```

Nightjar writes the selected WAV files and `selection.csv` into that folder.
In BirdNET Analyzer, choose `birdnet-selection` as the input folder.

## Scripts and exit codes

The `--json` option prints one JSON object to standard output.

| Code | Meaning | Next action |
| ---: | --- | --- |
| 0 | The command completed. | Use the output files. |
| 2 | The command arguments are invalid. | Correct the named argument. |
| 3 | The recording cannot be read. | Check its path and format. |
| 4 | The output cannot be created safely. | Choose another directory or use `--force` when instructed. |

This command lists ready clip names:

```sh
jq -r '.chunks[] | select(.status == "ready") | .file' queue/manifest.json
```

## Privacy

Nightjar does not change the source recording.
Manifests omit the source name, path, and embedded recording metadata by default.
The CLI has no network client or telemetry dependency.

The browser planner reads at most 256 KiB from your selected WAV.
It does not upload or retain that file.
The demo works offline after its first visit.

See [Privacy](https://bird-audio-slicer.sociobot.in/privacy/) and [Terms](https://bird-audio-slicer.sociobot.in/terms/).

## Develop and verify

Development requires Node.js 20+, npm, and Rust 1.85+.

```sh
npm ci
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --allow-dirty
```

`npm run build` creates the static site in `dist/site` and the CLI in `dist/bin`.
The crate is ready for the factory to publish, but this repository does not publish it automatically.

Nightjar Slicer uses the [MIT License](LICENSE).
