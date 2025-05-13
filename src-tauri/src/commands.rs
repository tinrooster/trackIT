use sea_orm::{EntityTrait, QuerySelect, ActiveModelTrait, Set};
use serde::Serialize;
use crate::db::get_conn;
use crate::entity::{asset, location, project};
use log::{info, error};
use chrono::Utc;
use uuid::Uuid;

#[derive(Serialize)]
pub struct AssetOut {
    pub id: String,
    pub name: String,
    pub barcode: String,
    pub status: String,
    pub type_: String,
}

#[tauri::command]
pub async fn get_assets() -> Result<Vec<AssetOut>, String> {
    info!("[get_assets] Command called");
    let db = get_conn().await;
    let assets = match asset::Entity::find().all(db).await {
        Ok(a) => a,
        Err(e) => {
            error!("[get_assets] DB error: {}", e);
            return Err(e.to_string());
        }
    };
    info!("[get_assets] Returning {} assets", assets.len());
    Ok(assets.into_iter().map(|a| AssetOut {
        id: a.id,
        name: a.name,
        barcode: a.barcode,
        status: a.status,
        type_: a.r#type,
    }).collect())
}

#[tauri::command]
pub async fn create_location(
    name: String,
    r#type: String,
    description: Option<String>,
    parent_location_id: Option<String>
) -> Result<String, String> {
    println!("[create_location] Backend command called with name={}, type={}, parent_location_id={:?}", name, r#type, parent_location_id);
    info!("[create_location] Called with name={}, type={}, parent_location_id={:?}", name, r#type, parent_location_id);
    let db = get_conn().await;
    let new_id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().naive_utc();
    let active = location::ActiveModel {
        id: Set(new_id.clone()),
        name: Set(name.clone()),
        r#type: Set(r#type.clone()),
        description: Set(description.clone()),
        created_at: Set(now),
        updated_at: Set(now),
        parent_location_id: Set(parent_location_id.clone()),
        order: Set(Some(0)),
    };
    match active.insert(db).await {
        Ok(_) => {
            info!("[create_location] Created location {} ({})", name, new_id);
            Ok(new_id)
        },
        Err(e) => {
            error!("[create_location] DB error: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn create_project(
    name: String,
    description: Option<String>,
    status: String,
    start_date: Option<chrono::NaiveDateTime>,
    end_date: Option<chrono::NaiveDateTime>
) -> Result<String, String> {
    info!("[create_project] Called with name={}, status={}", name, status);
    let db = get_conn().await;
    let new_id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().naive_utc();
    let active = project::ActiveModel {
        id: Set(new_id.clone()),
        name: Set(name.clone()),
        description: Set(description.clone()),
        status: Set(status.clone()),
        start_date: Set(start_date),
        end_date: Set(end_date),
        created_at: Set(now),
        updated_at: Set(now),
        order: Set(Some(0)),
    };
    match active.insert(db).await {
        Ok(_) => {
            info!("[create_project] Created project {} ({})", name, new_id);
            Ok(new_id)
        },
        Err(e) => {
            error!("[create_project] DB error: {}", e);
            Err(e.to_string())
        }
    }
} 