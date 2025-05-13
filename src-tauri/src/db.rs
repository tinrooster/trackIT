use sea_orm::{Database, DbConn};
use std::sync::OnceLock;

static DB_CONN: OnceLock<DbConn> = OnceLock::new();

pub async fn get_conn() -> &'static DbConn {
    DB_CONN.get_or_init(|| {
        tokio::runtime::Handle::current().block_on(async {
            Database::connect(std::env::var("DATABASE_URL").expect("DATABASE_URL must be set")).await.expect("Failed to connect to DB")
        })
    })
} 