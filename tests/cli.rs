use std::fs;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;

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

#[test]
fn bundled_demo_runs_in_an_isolated_temporary_directory() {
    let result = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .arg("demo")
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    let stdout = String::from_utf8(result.stdout).unwrap();
    let output = stdout
        .lines()
        .find_map(|line| line.strip_prefix("Demo files: "))
        .expect("demo output path");
    let output = std::path::Path::new(output);
    assert!(output.join("manifest.json").is_file());
    assert!(output.join("clip_0001_00-00-00.wav").is_file());
    assert_eq!(
        serde_json::from_slice::<serde_json::Value>(
            &fs::read(output.join("manifest.json")).unwrap()
        )
        .unwrap()["chunks"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
}

#[test]
fn selected_clips_are_copied_for_birdnet_analyzer() {
    let temp = tempfile::tempdir().unwrap();
    let input = temp.path().join("night.wav");
    let queue = temp.path().join("queue");
    let selected = temp.path().join("birdnet-selection");
    fixture(&input, 25);
    assert!(
        Command::new(env!("CARGO_BIN_EXE_nightjar"))
            .args([
                "slice",
                input.to_str().unwrap(),
                "--output",
                queue.to_str().unwrap(),
                "--chunk-seconds",
                "10"
            ])
            .status()
            .unwrap()
            .success()
    );
    let result = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args([
            "--json",
            "select",
            queue.join("manifest.json").to_str().unwrap(),
            "--output",
            selected.to_str().unwrap(),
            "--clips",
            "1,3",
        ])
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    let json: serde_json::Value = serde_json::from_slice(&result.stdout).unwrap();
    assert_eq!(json["clips_selected"], 2);
    assert!(selected.join("clip_0001_00-00-00.wav").is_file());
    assert!(selected.join("clip_0003_00-00-20.wav").is_file());
    let csv = fs::read_to_string(selected.join("selection.csv")).unwrap();
    assert!(csv.contains("1,00:00:00.000,00:00:10.000"));
    assert!(csv.contains("3,00:00:20.000,00:00:25.000"));
}

#[test]
fn stopped_batch_continues_from_completed_checkpoint() {
    let temp = tempfile::tempdir().unwrap();
    let input = temp.path().join("long-night.wav");
    let output = temp.path().join("queue");
    fixture(&input, 180);
    let mut child = Command::new(env!("CARGO_BIN_EXE_nightjar"))
        .args([
            "--json",
            "slice",
            input.to_str().unwrap(),
            "--output",
            output.to_str().unwrap(),
            "--chunk-seconds",
            "10",
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let mut completed_before_stop = 0;
    for _ in 0..2_000 {
        if let Ok(bytes) = fs::read(output.join(".nightjar-state.json")) {
            if let Ok(state) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                completed_before_stop = state["completed"]
                    .as_object()
                    .map_or(0, |value| value.len());
                if completed_before_stop > 0 && completed_before_stop < 18 {
                    child.kill().unwrap();
                    break;
                }
            }
        }
        if child.try_wait().unwrap().is_some() {
            break;
        }
        thread::sleep(Duration::from_millis(2));
    }
    let _ = child.wait();
    assert!(
        completed_before_stop > 0 && completed_before_stop < 18,
        "batch finished before interruption: {completed_before_stop}"
    );
    let resumed = Command::new(env!("CARGO_BIN_EXE_nightjar"))
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
        resumed.status.success(),
        "{}",
        String::from_utf8_lossy(&resumed.stderr)
    );
    let result: serde_json::Value = serde_json::from_slice(&resumed.stdout).unwrap();
    assert_eq!(result["chunks_reused"], completed_before_stop);
    assert_eq!(result["chunks_ready"], 18);
}
