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

// ... (rest of the code from frontend/src-tauri/src/commands.rs, unchanged) ... 