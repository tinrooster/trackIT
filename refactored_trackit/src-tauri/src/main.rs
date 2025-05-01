// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod db;

use commands::*;
use prisma_client_rust::NewClientError;
use serde::{Deserialize, Serialize};
use tauri::State;
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
    let client = prisma::new_client().await.map_err(|e| e.to_string())?;
    let assets = client
        .asset()
        .find_many(vec![])
        .include(asset::Include {
            location: true,
            assigned_to: true,
            ..Default::default()
        })
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    Ok(assets)
}

#[tauri::command]
async fn get_asset(id: String) -> Result<Asset, String> {
    let client = prisma::new_client().await.map_err(|e| e.to_string())?;
    let asset = client
        .asset()
        .find_unique(asset::UniqueWhereParam::IdEquals(id))
        .include(asset::Include {
            location: true,
            assigned_to: true,
            transactions: true,
            maintenance_logs: true,
        })
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
