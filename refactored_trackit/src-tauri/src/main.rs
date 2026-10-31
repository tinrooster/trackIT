// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use log::info;
use tauri::Builder;
use tauri_plugin_log::{LogTarget, LoggerBuilder};

#[tauri::command]
fn test_log_entry() -> Result<String, String> {
    info!("Test log: backend started");
    Ok("Test log entry successful".to_string())
}

fn main() {
    let logger = LoggerBuilder::new()
        .targets([
            LogTarget::Stdout,
            LogTarget::LogDir,
            LogTarget::Webview,
        ])
        .level(log::LevelFilter::Info)
        .build();

    Builder::default()
        .plugin(logger)
        .invoke_handler(tauri::generate_handler![test_log_entry])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
