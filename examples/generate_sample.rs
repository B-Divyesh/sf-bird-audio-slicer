use std::f32::consts::TAU;

fn main() {
    let path = std::path::Path::new("examples/nightjar-demo.wav");
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate: 8_000,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };
    let mut writer = hound::WavWriter::create(path, spec).expect("create sample");
    for frame in 0u32..160_000 {
        let seconds = frame as f32 / 8_000.0;
        let pulse = if (seconds % 3.7) < 0.34 { 1.0 } else { 0.18 };
        let dawn_call = (frame as f32 * 1_850.0 * TAU / 8_000.0).sin() * 4_800.0 * pulse;
        let lower_call = (frame as f32 * 930.0 * TAU / 8_000.0).sin() * 1_500.0;
        let reed_noise =
            ((frame.wrapping_mul(1_103_515_245).wrapping_add(12_345) & 255) as f32 - 128.0) * 5.0;
        writer
            .write_sample((dawn_call + lower_call + reed_noise) as i16)
            .expect("sample");
    }
    writer.finalize().expect("finalize sample");
}
