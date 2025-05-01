use prisma_client_rust::QueryError;
use serde::{Deserialize, Serialize};
use crate::db::get_client;

#[derive(Serialize)]
pub struct Asset {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub status: String,
    pub location: Location,
    pub assigned_to: Option<User>,
}

#[derive(Serialize)]
pub struct Location {
    pub id: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct User {
    pub id: String,
    pub name: String,
}

#[tauri::command]
pub async fn get_assets() -> Result<Vec<Asset>, String> {
    let client = get_client().await;
    
    match client.asset().find_many(vec![])
        .include(prisma::asset::include!({
            location: select {
                id
                name
            }
            assigned_to: select {
                id
                name
            }
        }))
        .exec()
        .await {
            Ok(assets) => Ok(assets.into_iter().map(|a| Asset {
                id: a.id,
                name: a.name,
                r#type: a.r#type,
                status: a.status,
                location: Location {
                    id: a.location.id,
                    name: a.location.name,
                },
                assigned_to: a.assigned_to.map(|u| User {
                    id: u.id,
                    name: u.name,
                }),
            }).collect()),
            Err(e) => Err(format!("Failed to fetch assets: {}", e)),
    }
} 