use clap::{Args, Parser, Subcommand, ValueEnum};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::f32::consts::PI;
use std::fs::{self, File};
use std::io::{BufWriter, Write};
use std::path::{Path, PathBuf};
use std::process::ExitCode;
use std::time::{SystemTime, UNIX_EPOCH};
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::{CodecParameters, Decoder, DecoderOptions};
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::{FormatOptions, FormatReader};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

const STATE_FILE: &str = ".nightjar-state.json";
const MANIFEST_FILE: &str = "manifest.json";
const QUEUE_FILE: &str = "queue.csv";

/// Prepare long field recordings for analysis without uploading or modifying them.
#[derive(Debug, Parser)]
#[command(name = "nightjar", version, about, long_about = None)]
struct Cli {
    /// Print one machine-readable JSON object to stdout.
    #[arg(long, global = true)]
    json: bool,

    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// Read recording metadata without loading the whole file into memory.
    Inspect(InspectArgs),
    /// Split a recording into resume-safe WAV clips and queue metadata.
    Slice(SliceArgs),
}

#[derive(Debug, Args)]
struct InspectArgs {
    /// WAV or FLAC recording to inspect.
    input: PathBuf,
}

#[derive(Debug, Args)]
struct SliceArgs {
    /// WAV or FLAC recording to split. The original is never changed.
    input: PathBuf,

    /// Directory for clips, thumbnails, manifest, and resume state.
    #[arg(short, long)]
    output: PathBuf,

    /// Desired clip length in seconds (10–3600).
    #[arg(long, default_value_t = 180, value_parser = clap::value_parser!(u64).range(10..=3600))]
    chunk_seconds: u64,

    /// Use exact boundaries or move them to nearby low-energy audio.
    #[arg(long, value_enum, default_value_t = SliceMode::Fixed)]
    mode: SliceMode,

    /// Search this many seconds on either side of a silence-aware boundary.
    #[arg(long, default_value_t = 12, value_parser = clap::value_parser!(u64).range(1..=60))]
    search_window_seconds: u64,

    /// Skip the SVG spectrogram generated beside each clip.
    #[arg(long)]
    no_thumbnails: bool,

    /// Include the absolute source path in exported metadata (off by default).
    #[arg(long)]
    include_source_path: bool,

    /// Replace an incompatible checkpoint in the output directory.
    #[arg(long)]
    force: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, ValueEnum)]
#[serde(rename_all = "lowercase")]
enum SliceMode {
    Fixed,
    Silence,
}

#[derive(Debug, Clone, Serialize)]
struct AudioInfo {
    name: String,
    format: String,
    file_bytes: u64,
    sample_rate_hz: u32,
    channels: u16,
    total_frames: Option<u64>,
    duration_seconds: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct Fingerprint {
    name: String,
    file_bytes: u64,
    modified_unix: u64,
    sample_rate_hz: u32,
    channels: u16,
    total_frames: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct Settings {
    chunk_seconds: u64,
    mode: SliceMode,
    search_window_seconds: u64,
    thumbnails: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CompletedClip {
    bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ResumeState {
    schema: String,
    fingerprint: Fingerprint,
    settings: Settings,
    boundaries: Vec<u64>,
    completed: BTreeMap<usize, CompletedClip>,
}

#[derive(Debug, Serialize)]
struct Manifest {
    schema: &'static str,
    created_at_unix: u64,
    privacy: Privacy,
    source: ManifestSource,
    settings: Settings,
    chunks: Vec<ManifestChunk>,
}

#[derive(Debug, Serialize)]
struct Privacy {
    source_path_included: bool,
    note: &'static str,
}

#[derive(Debug, Serialize)]
struct ManifestSource {
    name: String,
    path: Option<String>,
    file_bytes: u64,
    sample_rate_hz: u32,
    channels: u16,
    duration_seconds: f64,
}

#[derive(Debug, Serialize)]
struct ManifestChunk {
    index: usize,
    start_seconds: f64,
    end_seconds: f64,
    start_timestamp: String,
    end_timestamp: String,
    file: String,
    spectrogram: Option<String>,
    bytes: u64,
    status: &'static str,
}

#[derive(Debug, Serialize)]
struct SliceResult {
    status: &'static str,
    output: String,
    manifest: String,
    chunks_ready: usize,
    chunks_reused: usize,
    source_path_included: bool,
}

#[derive(Debug)]
struct AppError {
    code: u8,
    message: String,
}

impl AppError {
    fn input(message: impl Into<String>) -> Self {
        Self {
            code: 3,
            message: message.into(),
        }
    }

    fn output(message: impl Into<String>) -> Self {
        Self {
            code: 4,
            message: message.into(),
        }
    }
}

struct OpenAudio {
    format: Box<dyn FormatReader>,
    decoder: Box<dyn Decoder>,
    track_id: u32,
    params: CodecParameters,
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    match run(&cli) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            if cli.json {
                let value = serde_json::json!({ "status": "error", "message": error.message, "exit_code": error.code });
                println!("{}", serde_json::to_string(&value).unwrap_or_default());
            } else {
                eprintln!("nightjar: {}", error.message);
            }
            ExitCode::from(error.code)
        }
    }
}

fn run(cli: &Cli) -> Result<(), AppError> {
    match &cli.command {
        Command::Inspect(args) => {
            let info = inspect(&args.input)?;
            if cli.json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&info).map_err(json_error)?
                );
            } else {
                println!("{}", info.name);
                println!("  format       {}", info.format);
                println!("  sample rate  {} Hz", info.sample_rate_hz);
                println!("  channels     {}", info.channels);
                match info.duration_seconds {
                    Some(seconds) => {
                        println!("  duration     {} ({seconds:.3} s)", timestamp(seconds))
                    }
                    None => println!("  duration     unknown"),
                }
                println!("  file size    {} bytes", info.file_bytes);
            }
            Ok(())
        }
        Command::Slice(args) => slice(args, cli.json),
    }
}

fn open_audio(path: &Path) -> Result<OpenAudio, AppError> {
    let file = File::open(path)
        .map_err(|e| AppError::input(format!("cannot open {}: {e}", path.display())))?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    let mut hint = Hint::new();
    if let Some(extension) = path.extension().and_then(|value| value.to_str()) {
        hint.with_extension(extension);
    }
    let probed = symphonia::default::get_probe()
        .format(
            &hint,
            mss,
            &FormatOptions::default(),
            &MetadataOptions::default(),
        )
        .map_err(|e| {
            AppError::input(format!(
                "{} is not a supported WAV or FLAC recording: {e}",
                path.display()
            ))
        })?;
    let format = probed.format;
    let track = format
        .default_track()
        .ok_or_else(|| AppError::input("the recording has no decodable default audio track"))?;
    let track_id = track.id;
    let params = track.codec_params.clone();
    let decoder = symphonia::default::get_codecs()
        .make(&params, &DecoderOptions::default())
        .map_err(|e| AppError::input(format!("unsupported audio codec: {e}")))?;
    Ok(OpenAudio {
        format,
        decoder,
        track_id,
        params,
    })
}

fn inspect(path: &Path) -> Result<AudioInfo, AppError> {
    let audio = open_audio(path)?;
    let metadata = fs::metadata(path)
        .map_err(|e| AppError::input(format!("cannot read input metadata: {e}")))?;
    let sample_rate = audio
        .params
        .sample_rate
        .ok_or_else(|| AppError::input("recording does not declare a sample rate"))?;
    let channels = audio
        .params
        .channels
        .map(|value| value.count() as u16)
        .ok_or_else(|| AppError::input("recording does not declare a channel count"))?;
    let frames = audio.params.n_frames;
    Ok(AudioInfo {
        name: path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("recording")
            .to_owned(),
        format: path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("audio")
            .to_ascii_uppercase(),
        file_bytes: metadata.len(),
        sample_rate_hz: sample_rate,
        channels,
        total_frames: frames,
        duration_seconds: frames.map(|value| value as f64 / sample_rate as f64),
    })
}

fn slice(args: &SliceArgs, json: bool) -> Result<(), AppError> {
    let mut info = inspect(&args.input)?;
    if info.total_frames.is_none() {
        if !json {
            eprintln!("Scanning once to determine recording length…");
        }
        info.total_frames = Some(scan_frame_count(&args.input)?);
        info.duration_seconds = info
            .total_frames
            .map(|frames| frames as f64 / info.sample_rate_hz as f64);
    }
    let total_frames = info.total_frames.unwrap_or(0);
    if total_frames == 0 {
        return Err(AppError::input("the recording contains no audio frames"));
    }

    fs::create_dir_all(&args.output)
        .map_err(|e| AppError::output(format!("cannot create {}: {e}", args.output.display())))?;
    let settings = Settings {
        chunk_seconds: args.chunk_seconds,
        mode: args.mode,
        search_window_seconds: args.search_window_seconds,
        thumbnails: !args.no_thumbnails,
    };
    let fingerprint = fingerprint(&args.input, &info, total_frames)?;
    let state_path = args.output.join(STATE_FILE);
    let mut state = if state_path.exists() {
        let previous: ResumeState = read_json(&state_path)?;
        if previous.fingerprint == fingerprint && previous.settings == settings {
            previous
        } else if args.force {
            make_state(
                args,
                fingerprint.clone(),
                settings.clone(),
                total_frames,
                info.sample_rate_hz,
                json,
            )?
        } else {
            return Err(AppError::output(format!(
                "{} belongs to a different input or plan; choose another output directory or pass --force",
                state_path.display()
            )));
        }
    } else {
        make_state(
            args,
            fingerprint.clone(),
            settings.clone(),
            total_frames,
            info.sample_rate_hz,
            json,
        )?
    };

    validate_completed(&args.output, &mut state);
    atomic_json(&state_path, &state)?;
    let reused = state.completed.len();
    if reused > 0 && !json {
        eprintln!("Resuming: {reused} verified clip(s) already complete.");
    }
    extract(
        &args.input,
        &args.output,
        info.sample_rate_hz,
        info.channels,
        &mut state,
        json,
    )?;
    write_exports(args, &info, &state)?;

    let result = SliceResult {
        status: "ready",
        output: args.output.display().to_string(),
        manifest: args.output.join(MANIFEST_FILE).display().to_string(),
        chunks_ready: state.boundaries.len().saturating_sub(1),
        chunks_reused: reused,
        source_path_included: args.include_source_path,
    };
    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(&result).map_err(json_error)?
        );
    } else {
        println!(
            "Ready: {} clips in {}",
            result.chunks_ready,
            args.output.display()
        );
        println!("Manifest: {}", result.manifest);
    }
    Ok(())
}

fn make_state(
    args: &SliceArgs,
    fingerprint: Fingerprint,
    settings: Settings,
    total_frames: u64,
    sample_rate: u32,
    json: bool,
) -> Result<ResumeState, AppError> {
    let boundaries = match args.mode {
        SliceMode::Fixed => fixed_boundaries(total_frames, args.chunk_seconds * sample_rate as u64),
        SliceMode::Silence => {
            if !json {
                eprintln!("Finding quiet boundaries (one streaming pass)…");
            }
            silence_boundaries(
                &args.input,
                total_frames,
                sample_rate,
                args.chunk_seconds,
                args.search_window_seconds,
            )?
        }
    };
    Ok(ResumeState {
        schema: "nightjar-state/v1".to_owned(),
        fingerprint,
        settings,
        boundaries,
        completed: BTreeMap::new(),
    })
}

fn fingerprint(path: &Path, info: &AudioInfo, total_frames: u64) -> Result<Fingerprint, AppError> {
    let metadata = fs::metadata(path)
        .map_err(|e| AppError::input(format!("cannot read input metadata: {e}")))?;
    let modified_unix = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs())
        .unwrap_or(0);
    Ok(Fingerprint {
        name: info.name.clone(),
        file_bytes: metadata.len(),
        modified_unix,
        sample_rate_hz: info.sample_rate_hz,
        channels: info.channels,
        total_frames,
    })
}

fn fixed_boundaries(total_frames: u64, chunk_frames: u64) -> Vec<u64> {
    let mut boundaries = vec![0];
    let mut next = chunk_frames;
    while next < total_frames {
        boundaries.push(next);
        next = next.saturating_add(chunk_frames);
    }
    boundaries.push(total_frames);
    boundaries
}

fn scan_frame_count(path: &Path) -> Result<u64, AppError> {
    let mut audio = open_audio(path)?;
    let channels = audio
        .params
        .channels
        .map(|value| value.count())
        .ok_or_else(|| AppError::input("missing channel count"))?;
    let mut total = 0u64;
    decode_each(&mut audio, |samples| {
        total += (samples.len() / channels) as u64;
        Ok(())
    })?;
    Ok(total)
}

fn silence_boundaries(
    path: &Path,
    total_frames: u64,
    sample_rate: u32,
    chunk_seconds: u64,
    search_seconds: u64,
) -> Result<Vec<u64>, AppError> {
    let mut audio = open_audio(path)?;
    let channels = audio
        .params
        .channels
        .map(|value| value.count())
        .ok_or_else(|| AppError::input("missing channel count"))?;
    let block_frames = (sample_rate as u64 / 2).max(1);
    let mut rms_blocks: Vec<(u64, f64)> = Vec::new();
    let mut frame_cursor = 0u64;
    let mut block_start = 0u64;
    let mut energy = 0.0f64;
    let mut count = 0u64;
    decode_each(&mut audio, |samples| {
        for frame in samples.chunks_exact(channels) {
            let mono = frame.iter().map(|sample| *sample as f64).sum::<f64>() / channels as f64;
            energy += mono * mono;
            count += 1;
            frame_cursor += 1;
            if count == block_frames {
                rms_blocks.push((block_start + count / 2, (energy / count as f64).sqrt()));
                block_start = frame_cursor;
                energy = 0.0;
                count = 0;
            }
        }
        Ok(())
    })?;
    if count > 0 {
        rms_blocks.push((block_start + count / 2, (energy / count as f64).sqrt()));
    }

    let nominal = chunk_seconds * sample_rate as u64;
    let search = search_seconds * sample_rate as u64;
    let mut boundaries = vec![0];
    let mut target = nominal;
    while target < total_frames {
        let low = target
            .saturating_sub(search)
            .max(*boundaries.last().unwrap() + sample_rate as u64);
        let high = (target + search).min(total_frames.saturating_sub(sample_rate as u64));
        let choice = rms_blocks
            .iter()
            .filter(|(center, _)| *center >= low && *center <= high)
            .min_by(|a, b| a.1.total_cmp(&b.1))
            .map(|(center, _)| *center)
            .unwrap_or(target);
        boundaries.push(choice);
        target = choice.saturating_add(nominal);
    }
    if *boundaries.last().unwrap() != total_frames {
        boundaries.push(total_frames);
    }
    Ok(boundaries)
}

fn decode_each<F>(audio: &mut OpenAudio, mut callback: F) -> Result<(), AppError>
where
    F: FnMut(&[f32]) -> Result<(), AppError>,
{
    loop {
        let packet = match audio.format.next_packet() {
            Ok(packet) => packet,
            Err(SymphoniaError::IoError(error))
                if error.kind() == std::io::ErrorKind::UnexpectedEof =>
            {
                break;
            }
            Err(SymphoniaError::ResetRequired) => {
                return Err(AppError::input("audio stream changed format mid-recording"));
            }
            Err(error) => {
                return Err(AppError::input(format!(
                    "cannot read audio packet: {error}"
                )));
            }
        };
        if packet.track_id() != audio.track_id {
            continue;
        }
        let decoded = match audio.decoder.decode(&packet) {
            Ok(decoded) => decoded,
            Err(SymphoniaError::DecodeError(error)) => {
                return Err(AppError::input(format!("damaged audio packet: {error}")));
            }
            Err(error) => return Err(AppError::input(format!("cannot decode recording: {error}"))),
        };
        let mut samples = SampleBuffer::<f32>::new(decoded.capacity() as u64, *decoded.spec());
        samples.copy_interleaved_ref(decoded);
        callback(samples.samples())?;
    }
    Ok(())
}

fn validate_completed(output: &Path, state: &mut ResumeState) {
    let thumbnails = state.settings.thumbnails;
    state.completed.retain(|index, completed| {
        if *index + 1 >= state.boundaries.len() {
            return false;
        }
        let stem = chunk_stem(
            *index,
            state.boundaries[*index],
            state.fingerprint.sample_rate_hz,
        );
        let clip_ok = output
            .join(format!("{stem}.wav"))
            .metadata()
            .map(|metadata| {
                metadata.is_file() && metadata.len() == completed.bytes && completed.bytes > 44
            })
            .unwrap_or(false);
        let thumb_ok = !thumbnails || output.join(format!("{stem}.svg")).is_file();
        clip_ok && thumb_ok
    });
}

fn extract(
    input: &Path,
    output: &Path,
    sample_rate: u32,
    channels: u16,
    state: &mut ResumeState,
    json: bool,
) -> Result<(), AppError> {
    if state.completed.len() == state.boundaries.len().saturating_sub(1) {
        return Ok(());
    }
    let mut audio = open_audio(input)?;
    let mut frame_cursor = 0u64;
    let mut chunk_index = 0usize;
    let mut sink: Option<ClipSink> = None;
    let state_path = output.join(STATE_FILE);

    decode_each(&mut audio, |samples| {
        for frame in samples.chunks_exact(channels as usize) {
            while chunk_index + 1 < state.boundaries.len()
                && frame_cursor >= state.boundaries[chunk_index + 1]
            {
                if let Some(active) = sink.take() {
                    complete_sink(active, output, state, chunk_index, &state_path)?;
                    if !json {
                        eprintln!("  clip {:04} ready", chunk_index + 1);
                    }
                }
                chunk_index += 1;
            }
            if chunk_index + 1 >= state.boundaries.len() {
                break;
            }
            if !state.completed.contains_key(&chunk_index) {
                if sink.is_none() {
                    sink = Some(ClipSink::new(
                        output,
                        chunk_index,
                        state.boundaries[chunk_index],
                        state.boundaries[chunk_index + 1],
                        sample_rate,
                        channels,
                        state.settings.thumbnails,
                    )?);
                }
                sink.as_mut().unwrap().write_frame(frame)?;
            }
            frame_cursor += 1;
        }
        Ok(())
    })?;
    if let Some(active) = sink.take() {
        complete_sink(active, output, state, chunk_index, &state_path)?;
        if !json {
            eprintln!("  clip {:04} ready", chunk_index + 1);
        }
    }
    let expected = state.boundaries.len().saturating_sub(1);
    if state.completed.len() != expected {
        return Err(AppError::input(format!(
            "recording ended before all planned clips were written ({} of {expected})",
            state.completed.len()
        )));
    }
    Ok(())
}

struct ClipSink {
    writer: hound::WavWriter<BufWriter<File>>,
    part_path: PathBuf,
    final_path: PathBuf,
    thumbnail_path: Option<PathBuf>,
    spectrogram: Spectrogram,
}

impl ClipSink {
    fn new(
        output: &Path,
        index: usize,
        start_frame: u64,
        end_frame: u64,
        sample_rate: u32,
        channels: u16,
        thumbnails: bool,
    ) -> Result<Self, AppError> {
        let stem = chunk_stem(index, start_frame, sample_rate);
        let final_path = output.join(format!("{stem}.wav"));
        let part_path = output.join(format!(".{stem}.wav.part"));
        let thumbnail_path = thumbnails.then(|| output.join(format!("{stem}.svg")));
        let spec = hound::WavSpec {
            channels,
            sample_rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };
        let writer = hound::WavWriter::create(&part_path, spec)
            .map_err(|e| AppError::output(format!("cannot create {}: {e}", part_path.display())))?;
        Ok(Self {
            writer,
            part_path,
            final_path,
            thumbnail_path,
            spectrogram: Spectrogram::new(end_frame - start_frame),
        })
    }

    fn write_frame(&mut self, frame: &[f32]) -> Result<(), AppError> {
        let mono = frame.iter().copied().sum::<f32>() / frame.len() as f32;
        self.spectrogram.push(mono);
        for sample in frame {
            let quantized = (sample.clamp(-1.0, 1.0) * i16::MAX as f32).round() as i16;
            self.writer
                .write_sample(quantized)
                .map_err(|e| AppError::output(format!("cannot write clip audio: {e}")))?;
        }
        Ok(())
    }
}

fn complete_sink(
    sink: ClipSink,
    output: &Path,
    state: &mut ResumeState,
    index: usize,
    state_path: &Path,
) -> Result<(), AppError> {
    sink.writer
        .finalize()
        .map_err(|e| AppError::output(format!("cannot finalize clip: {e}")))?;
    fs::rename(&sink.part_path, &sink.final_path).map_err(|e| {
        AppError::output(format!("cannot publish {}: {e}", sink.final_path.display()))
    })?;
    if let Some(path) = sink.thumbnail_path {
        atomic_text(&path, &sink.spectrogram.svg(index + 1))?;
    }
    let bytes = sink
        .final_path
        .metadata()
        .map_err(|e| AppError::output(format!("cannot verify clip: {e}")))?
        .len();
    state.completed.insert(index, CompletedClip { bytes });
    atomic_json(state_path, state)?;
    let _ = output;
    Ok(())
}

struct Spectrogram {
    columns: Vec<Vec<u8>>,
    window: Vec<f32>,
    until_window: u64,
    hop: u64,
}

impl Spectrogram {
    fn new(chunk_frames: u64) -> Self {
        Self {
            columns: Vec::with_capacity(72),
            window: Vec::with_capacity(256),
            until_window: 0,
            hop: (chunk_frames / 72).max(256),
        }
    }

    fn push(&mut self, sample: f32) {
        if self.columns.len() >= 72 {
            return;
        }
        if self.until_window > 0 {
            self.until_window -= 1;
            return;
        }
        self.window.push(sample);
        if self.window.len() == 256 {
            let mut bands = Vec::with_capacity(32);
            for bin in 1..=32 {
                let mut re = 0.0f32;
                let mut im = 0.0f32;
                for (n, value) in self.window.iter().enumerate() {
                    let tapered = value * (0.5 - 0.5 * (2.0 * PI * n as f32 / 255.0).cos());
                    let phase = 2.0 * PI * bin as f32 * n as f32 / 256.0;
                    re += tapered * phase.cos();
                    im -= tapered * phase.sin();
                }
                let db = (re.mul_add(re, im * im).sqrt() / 128.0).max(0.0001).log10() * 20.0;
                bands.push(((db + 80.0) / 80.0 * 255.0).clamp(0.0, 255.0) as u8);
            }
            self.columns.push(bands);
            self.window.clear();
            self.until_window = self.hop.saturating_sub(256);
        }
    }

    fn svg(&self, index: usize) -> String {
        let mut body = String::new();
        let columns = self.columns.len().max(1);
        let cell_w = 320.0 / columns as f32;
        let cell_h = 144.0 / 32.0;
        for (x, column) in self.columns.iter().enumerate() {
            for (y, value) in column.iter().enumerate() {
                let t = *value as f32 / 255.0;
                let red = (25.0 + 214.0 * t) as u8;
                let green = (42.0 + 154.0 * t) as u8;
                let blue = (45.0 + 57.0 * t) as u8;
                let plot_y = 144.0 - (y + 1) as f32 * cell_h;
                body.push_str(&format!("<rect x=\"{:.2}\" y=\"{plot_y:.2}\" width=\"{:.2}\" height=\"{cell_h:.2}\" fill=\"#{red:02x}{green:02x}{blue:02x}\"/>", x as f32 * cell_w, cell_w + 0.2));
            }
        }
        format!(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"160\" viewBox=\"0 0 320 160\" role=\"img\" aria-labelledby=\"t d\"><title id=\"t\">Spectrogram for clip {index}</title><desc id=\"d\">Time runs left to right and frequency low to high.</desc><rect width=\"320\" height=\"160\" fill=\"#101b1d\"/>{body}<path d=\"M0 144H320\" stroke=\"#aebfba\"/><text x=\"8\" y=\"156\" fill=\"#f1efd8\" font-family=\"monospace\" font-size=\"9\">CLIP {index:04} · TIME →</text></svg>\n"
        )
    }
}

fn write_exports(args: &SliceArgs, info: &AudioInfo, state: &ResumeState) -> Result<(), AppError> {
    let mut chunks = Vec::new();
    for index in 0..state.boundaries.len() - 1 {
        let start = state.boundaries[index];
        let end = state.boundaries[index + 1];
        let stem = chunk_stem(index, start, info.sample_rate_hz);
        chunks.push(ManifestChunk {
            index: index + 1,
            start_seconds: start as f64 / info.sample_rate_hz as f64,
            end_seconds: end as f64 / info.sample_rate_hz as f64,
            start_timestamp: timestamp(start as f64 / info.sample_rate_hz as f64),
            end_timestamp: timestamp(end as f64 / info.sample_rate_hz as f64),
            file: format!("{stem}.wav"),
            spectrogram: state.settings.thumbnails.then(|| format!("{stem}.svg")),
            bytes: state
                .completed
                .get(&index)
                .map(|clip| clip.bytes)
                .unwrap_or(0),
            status: "ready",
        });
    }
    let absolute_path = if args.include_source_path {
        Some(
            fs::canonicalize(&args.input)
                .unwrap_or_else(|_| args.input.clone())
                .display()
                .to_string(),
        )
    } else {
        None
    };
    let manifest = Manifest {
        schema: "nightjar-manifest/v1",
        created_at_unix: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        privacy: Privacy {
            source_path_included: args.include_source_path,
            note: "Location-bearing source metadata is omitted unless explicitly requested.",
        },
        source: ManifestSource {
            name: info.name.clone(),
            path: absolute_path,
            file_bytes: info.file_bytes,
            sample_rate_hz: info.sample_rate_hz,
            channels: info.channels,
            duration_seconds: state.fingerprint.total_frames as f64 / info.sample_rate_hz as f64,
        },
        settings: state.settings.clone(),
        chunks,
    };
    atomic_json(&args.output.join(MANIFEST_FILE), &manifest)?;

    let mut csv = String::from(
        "index,start_seconds,end_seconds,start_timestamp,end_timestamp,file,spectrogram,status\n",
    );
    for chunk in &manifest.chunks {
        csv.push_str(&format!(
            "{},{:.6},{:.6},{},{},{},{},{}\n",
            chunk.index,
            chunk.start_seconds,
            chunk.end_seconds,
            chunk.start_timestamp,
            chunk.end_timestamp,
            chunk.file,
            chunk.spectrogram.as_deref().unwrap_or(""),
            chunk.status,
        ));
    }
    atomic_text(&args.output.join(QUEUE_FILE), &csv)
}

fn chunk_stem(index: usize, start_frame: u64, sample_rate: u32) -> String {
    let seconds = start_frame / sample_rate as u64;
    let hours = seconds / 3600;
    let minutes = (seconds % 3600) / 60;
    let secs = seconds % 60;
    format!("clip_{:04}_{hours:02}-{minutes:02}-{secs:02}", index + 1)
}

fn timestamp(seconds: f64) -> String {
    let millis = (seconds.max(0.0) * 1000.0).round() as u64;
    let hours = millis / 3_600_000;
    let minutes = (millis % 3_600_000) / 60_000;
    let secs = (millis % 60_000) / 1000;
    let ms = millis % 1000;
    format!("{hours:02}:{minutes:02}:{secs:02}.{ms:03}")
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, AppError> {
    let contents = fs::read_to_string(path)
        .map_err(|e| AppError::output(format!("cannot read {}: {e}", path.display())))?;
    serde_json::from_str(&contents).map_err(|e| {
        AppError::output(format!(
            "{} is not valid Nightjar state: {e}",
            path.display()
        ))
    })
}

fn atomic_json(path: &Path, value: &impl Serialize) -> Result<(), AppError> {
    let mut serialized = serde_json::to_string_pretty(value).map_err(json_error)?;
    serialized.push('\n');
    atomic_text(path, &serialized)
}

fn atomic_text(path: &Path, value: &str) -> Result<(), AppError> {
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("nightjar");
    let temporary = path.with_file_name(format!(".{file_name}.tmp"));
    let mut file = File::create(&temporary)
        .map_err(|e| AppError::output(format!("cannot create {}: {e}", temporary.display())))?;
    file.write_all(value.as_bytes())
        .and_then(|_| file.sync_all())
        .map_err(|e| AppError::output(format!("cannot write {}: {e}", temporary.display())))?;
    fs::rename(&temporary, path)
        .map_err(|e| AppError::output(format!("cannot publish {}: {e}", path.display())))
}

fn json_error(error: serde_json::Error) -> AppError {
    AppError::output(format!("cannot serialize metadata: {error}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fixed_plan_has_remainder() {
        assert_eq!(fixed_boundaries(100, 30), vec![0, 30, 60, 90, 100]);
    }

    #[test]
    fn timestamps_do_not_wrap_after_a_day() {
        assert_eq!(timestamp(90_061.234), "25:01:01.234");
    }

    #[test]
    fn names_are_stable_and_sorted() {
        assert_eq!(chunk_stem(8, 3_661 * 48_000, 48_000), "clip_0009_01-01-01");
    }
}
