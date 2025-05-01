use std::sync::OnceLock;
use prisma_client_rust::PrismaClient;

static CLIENT: OnceLock<PrismaClient> = OnceLock::new();

pub async fn get_client() -> &'static PrismaClient {
    CLIENT.get_or_init(|| async {
        PrismaClient::_builder()
            .build()
            .await
            .expect("Failed to create Prisma client")
    }).await
} 