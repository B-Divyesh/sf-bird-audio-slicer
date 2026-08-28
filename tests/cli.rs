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
    let input = temp.path().join("SecretMarsh_51.501N_-0.142W.wav");
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
    assert!(manifest["source"]["name"].is_null());
    assert!(
        !fs::read_to_string(output.join("manifest.json"))
            .unwrap()
            .contains("SecretMarsh_51.501N_-0.142W.wav"),
        "a location-bearing filename must not leave the private checkpoint by default"
    );
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

    let damaged = output.join("clip_0002_00-00-10.wav");
    fs::write(&damaged, b"incomplete").unwrap();
    let repaired = Command::new(env!("CARGO_BIN_EXE_nightjar"))
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
    assert!(repaired.status.success());
    let result: serde_json::Value = serde_json::from_slice(&repaired.stdout).unwrap();
    assert_eq!(result["chunks_reused"], 2);
    assert!(damaged.metadata().unwrap().len() > 44);
}

#[test]
fn source_filename_is_exported_only_with_explicit_path_opt_in() {
    let temp = tempfile::tempdir().unwrap();
    let input = temp.path().join("SecretMarsh_51.501N_-0.142W.wav");
    let output = temp.path().join("queue");
    fixture(&input, 12);

    let result = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args([
            "--json",
            "slice",
            input.to_str().unwrap(),
            "--output",
            output.to_str().unwrap(),
            "--chunk-seconds",
            "10",
            "--include-source-path",
        ])
        .output()
        .unwrap();
    assert!(result.status.success());
    let manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(output.join("manifest.json")).unwrap()).unwrap();
    assert_eq!(
        manifest["source"]["name"],
        "SecretMarsh_51.501N_-0.142W.wav"
    );
    assert!(
        manifest["source"]["path"]
            .as_str()
            .unwrap()
            .ends_with("SecretMarsh_51.501N_-0.142W.wav")
    );
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
    let manifest_text = fs::read_to_string(output.join("manifest.json")).unwrap();
    assert!(!manifest_text.contains(temp.path().to_str().unwrap()));
    let manifest: serde_json::Value = serde_json::from_str(&manifest_text).unwrap();
    assert_ne!(manifest["chunks"][1]["start_seconds"], 10.0);
}

#[test]
fn missing_input_has_documented_machine_readable_exit() {
    let result = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args(["--json", "inspect", "/definitely/missing/night.wav"])
        .output()
        .unwrap();
    assert_eq!(result.status.code(), Some(3));
    let error: serde_json::Value = serde_json::from_slice(&result.stdout).unwrap();
    assert_eq!(error["status"], "error");
    assert_eq!(error["exit_code"], 3);
}

#[test]
fn json_argument_validation_failure_is_a_single_stdout_object() {
    let temp = tempfile::tempdir().unwrap();
    let input = temp.path().join("night.wav");
    fixture(&input, 12);
    let result = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args([
            "--json",
            "slice",
            input.to_str().unwrap(),
            "--output",
            temp.path().join("queue").to_str().unwrap(),
            "--chunk-seconds",
            "9",
        ])
        .output()
        .unwrap();
    assert_eq!(result.status.code(), Some(2));
    assert!(result.stderr.is_empty());
    let error: serde_json::Value = serde_json::from_slice(&result.stdout).unwrap();
    assert_eq!(error["status"], "error");
    assert_eq!(error["error"], "invalid_arguments");
    assert_eq!(error["exit_code"], 2);
    assert!(error["message"].as_str().unwrap().contains("9"));
}
