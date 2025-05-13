// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
pub mod entity;

use commands::get_assets;
use tauri_plugin_log::{LogTarget, Builder as LogBuilder};
use tauri::Builder;
use std::env;
use std::fs::{self, File};
use std::io::Write;
use chrono::Local;
use crate::commands::{create_location, create_project};

fn main() {
    // Logging setup (startup file log)
    let cwd = env::current_dir().unwrap_or_else(|e| {
        println!("[ERROR] Could not get current dir: {}", e);
        std::path::PathBuf::from(".")
    });
    let proj_root = cwd.parent().unwrap_or(&cwd);
    let logs_dir = proj_root.join("logs");
    let now = Local::now();
    let now_str = now.format("%Y-%m-%d_%H-%M-%S");
    let log_file_path = logs_dir.join(format!("db_url_log_{}.txt", now_str));
    println!("[LOG] Attempting to write log file at: {}", log_file_path.display());

    if let Err(e) = fs::create_dir_all(&logs_dir) {
        println!("[ERROR] Could not create logs directory: {}", e);
    }

    let db_url = env::var("DATABASE_URL").unwrap_or_else(|_| "(not set)".to_string());

    match File::create(&log_file_path) {
        Ok(mut file) => {
            let ts = Local::now().format("%Y-%m-%d %H:%M:%S");
            let _ = writeln!(file, "[{}] DATABASE_URL: {}", ts, db_url);
            let _ = writeln!(file, "[{}] Startup OK", ts);
            let _ = file.flush();
        },
        Err(e) => {
            println!("[ERROR] Could not create log file: {}", e);
        }
    }

    let ts = Local::now().format("%Y-%m-%d %H:%M:%S");
    println!("[{}] DATABASE_URL: {}", ts, db_url);
    println!("[{}] Startup OK", ts);

    // Enable tauri-plugin-log for all actions
    let logger = LogBuilder::new()
        .targets([LogTarget::Stdout, LogTarget::LogDir])
        .level(log::LevelFilter::Info)
        .build();

    Builder::default()
        .plugin(logger)
        .invoke_handler(tauri::generate_handler![get_assets, create_location, create_project])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 