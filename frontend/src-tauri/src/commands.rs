use prisma_client_rust::QueryError;
use serde::{Deserialize, Serialize};
use crate::db::get_client;
use crate::prisma::{location, project, PrismaClient};
use tauri::State;
use log::{info, error};
use chrono::Local;

macro_rules! log_info {
    ($($arg:tt)*) => {
        info!("[{}] {}", Local::now().format("%Y-%m-%d %H:%M:%S"), format!($($arg)*));
    };
}

macro_rules! log_error {
    ($($arg:tt)*) => {
        error!("[{}] {}", Local::now().format("%Y-%m-%d %H:%M:%S"), format!($($arg)*));
    };
}

#[derive(Debug, Serialize)]
pub struct Asset {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub status: String,
    pub location: Location,
    pub assigned_to: Option<User>,
}

#[derive(Debug, Serialize)]
pub struct Location {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct User {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocationData {
    pub id: Option<String>,
    pub name: String,
    pub type_: String,  // Using type_ as type is a reserved keyword
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[tauri::command]
pub async fn get_assets() -> Result<Vec<Asset>, String> {
    log_info!("[get_assets] Fetching all assets");
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
        .map_err(|e| {
            log_error!("[get_assets] Failed to fetch assets: {}", e);
            e.to_string()
        })?;
    log_info!("[get_assets] Fetched {} assets", assets.len());
    Ok(assets)
}

#[tauri::command]
pub async fn get_asset(id: String) -> Result<Asset, String> {
    log_info!("[get_asset] Fetching asset with id: {}", id);
    let client = get_client().await;
    let asset = client
        .asset()
        .find_unique(prisma::asset::id::equals(id.clone()))
        .include(prisma::asset::include!({
            location: true,
            assigned_to: true,
            transactions: true,
            maintenance_logs: true
        }))
        .exec()
        .await
        .map_err(|e| {
            log_error!("[get_asset] Failed to fetch asset {}: {}", id, e);
            e.to_string()
        })?
        .ok_or_else(|| {
            log_error!("[get_asset] Asset not found: {}", id);
            "Asset not found".to_string()
        })?;
    log_info!("[get_asset] Asset fetched: {}", asset.id);
    Ok(asset)
}

#[tauri::command]
pub async fn get_locations(client: State<'_, PrismaClient>) -> Result<Vec<location::Data>, String> {
    log_info!("[get_locations] Fetching all locations");
    let result = client
        .location()
        .find_many(vec![])
        .exec()
        .await;
    match &result {
        Ok(locs) => log_info!("[get_locations] Fetched {} locations", locs.len()),
        Err(e) => log_error!("[get_locations] Failed to fetch locations: {}", e),
    }
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_location(
    location_data: LocationData,
    client: State<'_, PrismaClient>,
) -> Result<location::Data, String> {
    log_info!("[create_location] Creating location: {:?}", location_data);
    let mut params = vec![
        location::name::set(location_data.name.clone()),
        location::type_::set(location_data.type_.clone()),
    ];
    if let Some(parent_id) = location_data.parent_id.clone() {
        params.push(location::parent_location_id::set(Some(parent_id)));
    }
    let result = client
        .location()
        .create(params)
        .exec()
        .await;
    match &result {
        Ok(loc) => log_info!("[create_location] Location created: {}", loc.id),
        Err(e) => log_error!("[create_location] Failed to create location: {}", e),
    }
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_location(
    id: String,
    client: State<'_, PrismaClient>,
) -> Result<location::Data, String> {
    log_info!("[delete_location] Deleting location: {}", id);
    // First check if location has any children
    let children = client
        .location()
        .find_many(vec![location::parent_location_id::equals(Some(id.clone()))])
        .exec()
        .await
        .map_err(|e| {
            log_error!("[delete_location] Failed to check children: {}", e);
            e.to_string()
        })?;
    if !children.is_empty() {
        log_error!("[delete_location] Cannot delete location {}: has child locations", id);
        return Err("Cannot delete location with child locations".to_string());
    }
    // Then check if location has any assets
    let assets = client
        .asset()
        .find_many(vec![asset::location_id::equals(id.clone())])
        .exec()
        .await
        .map_err(|e| {
            log_error!("[delete_location] Failed to check assets: {}", e);
            e.to_string()
        })?;
    if !assets.is_empty() {
        log_error!("[delete_location] Cannot delete location {}: contains assets", id);
        return Err("Cannot delete location that contains assets".to_string());
    }
    let result = client
        .location()
        .delete(location::id::equals(id.clone()))
        .exec()
        .await;
    match &result {
        Ok(loc) => log_info!("[delete_location] Location deleted: {}", loc.id),
        Err(e) => log_error!("[delete_location] Failed to delete location {}: {}", id, e),
    }
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_projects(client: State<'_, PrismaClient>) -> Result<Vec<project::Data>, String> {
    log_info!("[get_projects] Fetching all projects");
    let result = client
        .project()
        .find_many(vec![])
        .exec()
        .await;
    match &result {
        Ok(projs) => log_info!("[get_projects] Fetched {} projects", projs.len()),
        Err(e) => log_error!("[get_projects] Failed to fetch projects: {}", e),
    }
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_project(
    project_data: ProjectData,
    client: State<'_, PrismaClient>,
) -> Result<project::Data, String> {
    log_info!("[create_project] Creating project: {:?}", project_data);
    let mut params = vec![
        project::name::set(project_data.name.clone()),
        project::status::set(project_data.status.clone()),
    ];
    if let Some(description) = project_data.description.clone() {
        params.push(project::description::set(Some(description)));
    }
    if let Some(start_date) = project_data.start_date.clone() {
        params.push(project::start_date::set(Some(start_date.parse().map_err(|e| e.to_string())?)));
    }
    if let Some(end_date) = project_data.end_date.clone() {
        params.push(project::end_date::set(Some(end_date.parse().map_err(|e| e.to_string())?)));
    }
    let result = client
        .project()
        .create(params)
        .exec()
        .await;
    match &result {
        Ok(proj) => log_info!("[create_project] Project created: {}", proj.id),
        Err(e) => log_error!("[create_project] Failed to create project: {}", e),
    }
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_project(
    id: String,
    client: State<'_, PrismaClient>,
) -> Result<project::Data, String> {
    log_info!("[delete_project] Deleting project: {}", id);
    let assets = client
        .asset()
        .find_many(vec![asset::project_id::equals(Some(id.clone()))])
        .exec()
        .await
        .map_err(|e| {
            log_error!("[delete_project] Failed to check assets for project {}: {}", id, e);
            e.to_string()
        })?;
    if !assets.is_empty() {
        log_error!("[delete_project] Cannot delete project {}: has assigned assets", id);
        return Err("Cannot delete project that has assigned assets".to_string());
    }
    let result = client
        .project()
        .delete(project::id::equals(id.clone()))
        .exec()
        .await;
    match &result {
        Ok(proj) => log_info!("[delete_project] Project deleted: {}", proj.id),
        Err(e) => log_error!("[delete_project] Failed to delete project {}: {}", id, e),
    }
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_log_entry() -> Result<(), String> {
    log_info!("[test_log_entry] Test log entry from frontend trigger");
    Ok(())
}

#[tauri::command]
pub async fn create_asset(/* ... */) -> Result<asset::Data, String> {
    log_info!("[create_asset] Called");
    // ... existing code ...
    match client.asset().create(params).exec().await {
        Ok(asset) => {
            log_info!("[create_asset] Asset created: {:?}", asset);
            Ok(asset)
        }
        Err(e) => {
            log_error!("[create_asset] Failed to create asset: {}", e);
            Err(e.to_string())
        }
    }
} 