use prisma_client_rust::QueryError;
use serde::{Deserialize, Serialize};
use crate::db::get_client;

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

#[tauri::command]
pub async fn get_assets() -> Result<Vec<Asset>, String> {
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
pub async fn get_asset(id: String) -> Result<Asset, String> {
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