use std::sync::Arc;
use std::sync::atomic::AtomicBool;

mod file_processing;
mod speech;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(speech::SpeechState { running: Arc::new(AtomicBool::new(false)) })
    .invoke_handler(tauri::generate_handler![
        file_processing::extract_pptx_notes,
        file_processing::parse_markdown,
        speech::start_listening,
        speech::stop_listening
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
