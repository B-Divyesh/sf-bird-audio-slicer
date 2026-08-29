# Nightjar demo

## Browser

Open <https://bird-audio-slicer.sociobot.in/demo/> or use `/?demo=1`.
The page loads `examples/nightjar-demo.wav`, a project-made 20-second dawn-call sample.
It immediately shows two ten-second clip ranges and a redacted manifest download.

The banner identifies demo mode and offers **Reset demo** and **Start for real**.
Reset reloads the bundled sample.
Start for real opens the file planner at `/#planner`.

The browser demo has no persistent namespace because it writes no application data.
Its effective namespace is ephemeral page memory, separate from user-selected files.
The service worker caches only public application files for offline use.

## CLI

Run:

```sh
nightjar demo
```

The command embeds the same sample in the binary.
Each run creates a unique directory under the operating system's temporary directory.
It prints the output path after creating two WAV clips, two SVG spectrograms, a manifest, CSV, and checkpoint.

The source fixtures are `examples/nightjar-demo.wav` and `examples/nightjar-demo.flac`.
`examples/generate_sample.rs` records how the synthetic field sample was created.
The FLAC fixture is a lossless conversion made with the open-source FLAC 1.4.3 encoder.
