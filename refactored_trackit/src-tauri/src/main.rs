// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod db;

use commands::{get_assets, get_asset};
use tauri::Builder;
use tauri_plugin_log::{LogTarget, LoggerBuilder};

#[derive(Debug, Serialize, Deserialize)]
pub struct Asset {
    id: String,
    name: String,
    #[serde(rename = "type")]
    asset_type: String,
    status: String,
    location: Location,
    assigned_to: Option<User>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Location {
    id: String,
    name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    id: String,
    name: String,
}

#[tauri::command]
async fn get_assets() -> Result<Vec<Asset>, String> {
    let client = get_client().await;
    let assets = client
        .asset()
        .find_many(vec![])
        .include(prisma::asset::include!({
            location: true,
            assigned_to: true
        }))
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    Ok(assets)
}

#[tauri::command]
async fn get_asset(id: String) -> Result<Asset, String> {
    let client = get_client().await;
    let asset = client
        .asset()
        .find_unique(prisma::asset::id::equals(id))
        .include(prisma::asset::include!({
            location: true,
            assigned_to: true,
            transactions: true,
            maintenance_logs: true
        }))
        .exec()
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Asset not found".to_string())?;

    Ok(asset)
}

#[tokio::main]
async fn main() {
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
        .invoke_handler(tauri::generate_handler![get_assets, get_asset])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
