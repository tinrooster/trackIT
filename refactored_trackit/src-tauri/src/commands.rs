use prisma_client_rust::QueryError;
use serde::{Deserialize, Serialize};
use crate::db::get_client;
use crate::prisma::{location, project, PrismaClient};
use tauri::State;
use log::{info, error};

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
    info!("Fetching all assets");
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
            error!("Failed to fetch assets: {}", e);
            e.to_string()
        })?;
    Ok(assets)
}

#[tauri::command]
pub async fn get_asset(id: String) -> Result<Asset, String> {
    info!("Fetching asset with id: {}", id);
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
        .map_err(|e| {
            error!("Failed to fetch asset {}: {}", id, e);
            e.to_string()
        })?
        .ok_or_else(|| {
            error!("Asset not found: {}", id);
            "Asset not found".to_string()
        })?;
    Ok(asset)
}

#[tauri::command]
pub async fn get_locations(client: State<'_, PrismaClient>) -> Result<Vec<location::Data>, String> {
    client
        .location()
        .find_many(vec![])
        .exec()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_location(
    location_data: LocationData,
    client: State<'_, PrismaClient>,
) -> Result<location::Data, String> {
    info!("Creating location: {}", location_data.name);
    let mut params = vec![
        location::name::set(location_data.name.clone()),
        location::type_::set(location_data.type_.clone()),
    ];
    if let Some(parent_id) = location_data.parent_id.clone() {
        params.push(location::parent_location_id::set(Some(parent_id)));
    }
    client
        .location()
        .create(params)
        .exec()
        .await
        .map(|loc| {
            info!("Location created: {}", loc.id);
            loc
        })
        .map_err(|e| {
            error!("Failed to create location: {}", e);
            e.to_string()
        })
}

#[tauri::command]
pub async fn delete_location(
    id: String,
    client: State<'_, PrismaClient>,
) -> Result<location::Data, String> {
    // First check if location has any children
    let children = client
        .location()
        .find_many(vec![location::parent_location_id::equals(Some(id.clone()))])
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    if !children.is_empty() {
        return Err("Cannot delete location with child locations".to_string());
    }

    // Then check if location has any assets
    let assets = client
        .asset()
        .find_many(vec![asset::location_id::equals(id.clone())])
        .exec()
        .await
        .map_err(|e| e.to_string())?;

    if !assets.is_empty() {
        return Err("Cannot delete location that contains assets".to_string());
    }

    client
        .location()
        .delete(location::id::equals(id))
        .exec()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_projects(client: State<'_, PrismaClient>) -> Result<Vec<project::Data>, String> {
    client
        .project()
        .find_many(vec![])
        .exec()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_project(
    project_data: ProjectData,
    client: State<'_, PrismaClient>,
) -> Result<project::Data, String> {
    info!("Creating project: {}", project_data.name);
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
    client
        .project()
        .create(params)
        .exec()
        .await
        .map(|proj| {
            info!("Project created: {}", proj.id);
            proj
        })
        .map_err(|e| {
            error!("Failed to create project: {}", e);
            e.to_string()
        })
}

#[tauri::command]
pub async fn delete_project(
    id: String,
    client: State<'_, PrismaClient>,
) -> Result<project::Data, String> {
    info!("Deleting project: {}", id);
    let assets = client
        .asset()
        .find_many(vec![asset::project_id::equals(Some(id.clone()))])
        .exec()
        .await
        .map_err(|e| {
            error!("Failed to check assets for project {}: {}", id, e);
            e.to_string()
        })?;
    if !assets.is_empty() {
        error!("Cannot delete project {}: has assigned assets", id);
        return Err("Cannot delete project that has assigned assets".to_string());
    }
    client
        .project()
        .delete(project::id::equals(id.clone()))
        .exec()
        .await
        .map(|proj| {
            info!("Project deleted: {}", proj.id);
            proj
        })
        .map_err(|e| {
            error!("Failed to delete project {}: {}", id, e);
            e.to_string()
        })
} 