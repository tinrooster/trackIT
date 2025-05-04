// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod db;

use commands::{
    get_assets, get_asset, get_locations, create_location, delete_location,
    get_projects, create_project, delete_project
};
use tauri::Builder;
use tauri_plugin_log::{LogTarget, LoggerBuilder};
use crate::db::get_client;
use serde::{Serialize, Deserialize};
use prisma_client_rust::QueryError;
use log::info;

#[derive(Debug, Serialize, Deserialize)]
pub struct Asset {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub status: String,
    pub location_id: String,
    pub project_id: Option<String>,
    pub assigned_to_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Location {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub location_type: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocationData {
    pub name: String,
    #[serde(rename = "type_")]
    pub location_type: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
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

#[tauri::command]
pub async fn get_locations(client: tauri::State<'_, PrismaClient>) -> Result<Vec<Location>, String> {
    let locations = client
        .location()
        .find_many(vec![])
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    Ok(locations.into_iter().map(|loc| Location {
        id: loc.id,
        name: loc.name,
        location_type: loc.type_,
        parent_id: loc.parent_location_id,
    }).collect())
}

#[tauri::command]
pub async fn create_location(
    location_data: LocationData,
    client: tauri::State<'_, PrismaClient>,
) -> Result<Location, String> {
    let mut params = vec![
        location::name::set(location_data.name),
        location::type_::set(location_data.location_type),
    ];

    if let Some(parent_id) = location_data.parent_id {
        // Verify parent exists
        let parent = client
            .location()
            .find_unique(location::id::equals(parent_id.clone()))
            .exec()
            .await
            .map_err(|e| e.to_string())?;

        if parent.is_none() {
            return Err("Parent location not found".to_string());
        }

        params.push(location::parent_location_id::set(Some(parent_id)));
    }

    let loc = client
        .location()
        .create(params)
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    Ok(Location {
        id: loc.id,
        name: loc.name,
        location_type: loc.type_,
        parent_id: loc.parent_location_id,
    })
}

#[tauri::command]
pub async fn delete_location(
    id: String,
    client: tauri::State<'_, PrismaClient>,
) -> Result<Location, String> {
    // First check if location exists
    let location = client
        .location()
        .find_unique(location::id::equals(id.clone()))
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    if location.is_none() {
        return Err("Location not found".to_string());
    }

    // Check if location has any children
    let children = client
        .location()
        .find_many(vec![location::parent_location_id::equals(Some(id.clone()))])
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    if !children.is_empty() {
        return Err("Cannot delete location with child locations".to_string());
    }

    // Check if location has any assets
    let assets = client
        .asset()
        .find_many(vec![asset::location_id::equals(id.clone())])
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    if !assets.is_empty() {
        return Err("Cannot delete location that contains assets".to_string());
    }

    let loc = client
        .location()
        .delete(location::id::equals(id))
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    Ok(Location {
        id: loc.id,
        name: loc.name,
        location_type: loc.type_,
        parent_id: loc.parent_location_id,
    })
}

#[tauri::command]
async fn get_projects(client: tauri::State<'_, PrismaClient>) -> Result<Vec<Project>, String> {
    let projects = client
        .project()
        .find_many(vec![])
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    Ok(projects.into_iter().map(|proj| Project {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        status: proj.status,
        start_date: proj.start_date,
        end_date: proj.end_date,
    }).collect())
}

#[tauri::command]
async fn create_project(project_data: ProjectData, client: tauri::State<'_, PrismaClient>) -> Result<Project, String> {
    let project = client
        .project()
        .create(vec![
            project::name::set(project_data.name),
            project::description::set(project_data.description),
            project::status::set(project_data.status),
            project::start_date::set(project_data.start_date),
            project::end_date::set(project_data.end_date),
        ])
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    Ok(Project {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
    })
}

#[tauri::command]
async fn delete_project(id: String, client: tauri::State<'_, PrismaClient>) -> Result<Project, String> {
    let project = client
        .project()
        .delete(project::id::equals(id))
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    Ok(Project {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
    })
}

#[tauri::command]
async fn test_log_entry() -> Result<String, String> {
    info!("Test log: backend started");
    Ok("Test log entry successful".to_string())
}

#[tokio::main]
async fn main() {
    info!("Test log: backend started");
    let logger = LoggerBuilder::new()
        .targets([
            LogTarget::Stdout,
            LogTarget::LogDir,
            LogTarget::Webview,
        ])
        .level(log::LevelFilter::Info)
        .build();

    let client = get_client().await;

    Builder::default()
        .plugin(logger)
        .manage(client)
        .invoke_handler(tauri::generate_handler![
            get_assets,
            get_asset,
            get_locations,
            create_location,
            delete_location,
            get_projects,
            create_project,
            delete_project,
            test_log_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
