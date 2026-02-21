use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use serde_json::Value;
use std::sync::{Arc, Mutex, mpsc};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Manager};
use vosk::{Model, Recognizer};

pub struct SpeechState {
    pub running: Arc<AtomicBool>,
}

#[derive(Clone, serde::Serialize)]
struct SpeechEvent {
    partial: String,
    is_final: bool,
}

#[tauri::command]
pub fn start_listening(app: AppHandle, state: tauri::State<SpeechState>) -> Result<(), String> {
    if state.running.load(Ordering::SeqCst) {
        return Ok(());
    }
    state.running.store(true, Ordering::SeqCst);
    let running = state.running.clone();

    // Channel for audio data
    let (tx, rx) = mpsc::channel();

    // Spawn thread to handle audio
    std::thread::spawn(move || {
        let host = cpal::default_host();
        let device = match host.default_input_device() {
            Some(d) => d,
            None => {
                let _ = app.emit("speech-error", "No input device available");
                running.store(false, Ordering::SeqCst);
                return;
            }
        };

        let supported_configs_range = match device.supported_input_configs() {
            Ok(r) => r,
             Err(e) => {
                let _ = app.emit("speech-error", format!("Error querying configs: {}", e));
                running.store(false, Ordering::SeqCst);
                return;
             }
        };

        let supported_config = supported_configs_range
            .max_by_key(|c| c.max_sample_rate().0)
            .expect("no supported config?!")
            .with_max_sample_rate();

        let sample_rate = supported_config.sample_rate().0;
        let channels = supported_config.channels();
        let config: cpal::StreamConfig = supported_config.clone().into();

        // Load model
        let resource_dir = app.path().resource_dir().unwrap_or(std::path::PathBuf::from("."));
        let model_path = resource_dir.join("model");

        if !model_path.exists() {
             let _ = app.emit("speech-error", format!("Model not found at {:?}. Please download Vosk model.", model_path));
             running.store(false, Ordering::SeqCst);
             return;
        }

        let model = match Model::new(model_path.to_str().unwrap()) {
            Some(m) => m,
            None => {
                 let _ = app.emit("speech-error", "Could not load model");
                 running.store(false, Ordering::SeqCst);
                 return;
            }
        };

        let mut recognizer = match Recognizer::new(&model, sample_rate as f32) {
             Some(r) => r,
             None => {
                 let _ = app.emit("speech-error", "Could not create recognizer");
                 running.store(false, Ordering::SeqCst);
                 return;
             }
        };

        let err_fn = move |err| {
            eprintln!("an error occurred on stream: {}", err);
        };

        let tx_clone = tx.clone();

        let stream = match supported_config.sample_format() {
            SampleFormat::F32 => device.build_input_stream(
                &config,
                move |data: &[f32], _: &_| {
                    let mono: Vec<i16> = data.chunks(channels as usize)
                        .map(|chunk| (chunk[0] * 32767.0) as i16)
                        .collect();
                    let _ = tx_clone.send(mono);
                },
                err_fn,
                None
            ),
            SampleFormat::I16 => device.build_input_stream(
                &config,
                move |data: &[i16], _: &_| {
                     let mono: Vec<i16> = data.chunks(channels as usize)
                        .map(|chunk| chunk[0])
                        .collect();
                    let _ = tx_clone.send(mono);
                },
                err_fn,
                None
            ),
             _ => return,
        }.unwrap();

        if let Err(e) = stream.play() {
             let _ = app.emit("speech-error", format!("Failed to start stream: {}", e));
             running.store(false, Ordering::SeqCst);
             return;
        }

        while running.load(Ordering::SeqCst) {
            // Process all pending audio chunks
            let mut processed_any = false;
            while let Ok(data) = rx.try_recv() {
                processed_any = true;
                if recognizer.accept_waveform(&data) {
                    // Silence detected, result available
                    let final_res = recognizer.result().text;
                    // Emit final result so frontend knows to commit the text
                    // But usually partial is enough if we handle reset correctly.
                    // Let's emit it with a flag.
                    if !final_res.is_empty() {
                         let _ = app.emit("speech-event", SpeechEvent {
                            partial: final_res.to_string(),
                            is_final: true,
                        });
                    } else {
                        // Empty final result means silence/noise was processed.
                        // We still emit an empty final to signal "phrase end".
                         let _ = app.emit("speech-event", SpeechEvent {
                            partial: "".to_string(),
                            is_final: true,
                        });
                    }
                }
            }

            if processed_any {
                 // Get partial result
                 let partial_json = recognizer.partial_result().partial;
                 if !partial_json.is_empty() {
                     if let Ok(v) = serde_json::from_str::<Value>(partial_json) {
                         if let Some(text) = v["partial"].as_str() {
                             // Only emit if not empty, OR if we want to clear previous partial?
                             // Partial usually grows.
                             if !text.is_empty() {
                                 let _ = app.emit("speech-event", SpeechEvent {
                                     partial: text.to_string(),
                                     is_final: false,
                                 });
                             }
                         }
                     }
                 }
            }

            std::thread::sleep(std::time::Duration::from_millis(10));
        }
    });

    Ok(())
}

#[tauri::command]
pub fn stop_listening(state: tauri::State<SpeechState>) {
    state.running.store(false, Ordering::SeqCst);
}
