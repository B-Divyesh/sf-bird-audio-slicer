use std::fs;
use std::process::Command;

fn fixture(path: &std::path::Path, seconds: u32) {
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate: 8_000,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };
    let mut writer = hound::WavWriter::create(path, spec).unwrap();
    for frame in 0..seconds * 8_000 {
        let sample = if (frame / 8_000) % 4 == 2 {
            0
        } else {
            (((frame as f32 * 440.0 * std::f32::consts::TAU / 8_000.0).sin()) * 8_000.0) as i16
        };
        writer.write_sample(sample).unwrap();
    }
    writer.finalize().unwrap();
}

#[test]
fn documented_inspect_example_is_json_scriptable() {
    let temp = tempfile::tempdir().unwrap();
    let input = temp.path().join("NIGHT.WAV");
    fixture(&input, 12);
    let result = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args(["--json", "inspect", input.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    let data: serde_json::Value = serde_json::from_slice(&result.stdout).unwrap();
    assert_eq!(data["sample_rate_hz"], 8_000);
    assert_eq!(data["channels"], 1);
    assert_eq!(data["duration_seconds"], 12.0);
}

#[test]
fn slice_writes_private_manifest_and_resumes() {
    let temp = tempfile::tempdir().unwrap();
    let input = temp.path().join("AudioMoth-site-51.wav");
    let output = temp.path().join("queue");
    fixture(&input, 25);

    let first = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args([
            "--json",
            "slice",
            input.to_str().unwrap(),
            "--output",
            output.to_str().unwrap(),
            "--chunk-seconds",
            "10",
        ])
        .output()
        .unwrap();
    assert!(
        first.status.success(),
        "{}",
        String::from_utf8_lossy(&first.stderr)
    );
    let manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(output.join("manifest.json")).unwrap()).unwrap();
    assert_eq!(manifest["chunks"].as_array().unwrap().len(), 3);
    assert!(manifest["source"]["path"].is_null());
    assert_eq!(manifest["privacy"]["source_path_included"], false);
    assert!(output.join("clip_0001_00-00-00.wav").is_file());
    assert!(output.join("clip_0001_00-00-00.svg").is_file());

    let second = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args([
            "--json",
            "slice",
            input.to_str().unwrap(),
            "--output",
            output.to_str().unwrap(),
            "--chunk-seconds",
            "10",
        ])
        .output()
        .unwrap();
    assert!(second.status.success());
    let result: serde_json::Value = serde_json::from_slice(&second.stdout).unwrap();
    assert_eq!(result["chunks_reused"], 3);
}

#[test]
fn silence_mode_finishes_and_redacts_paths() {
    let temp = tempfile::tempdir().unwrap();
    let input = temp.path().join("overnight.wav");
    let output = temp.path().join("silence-queue");
    fixture(&input, 25);
    let result = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args([
            "slice",
            input.to_str().unwrap(),
            "--output",
            output.to_str().unwrap(),
            "--chunk-seconds",
            "10",
            "--mode",
            "silence",
            "--search-window-seconds",
            "2",
        ])
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    let manifest = fs::read_to_string(output.join("manifest.json")).unwrap();
    assert!(!manifest.contains(temp.path().to_str().unwrap()));
}
