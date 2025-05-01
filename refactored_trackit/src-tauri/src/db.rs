use std::sync::OnceLock;
use prisma::PrismaClient;
use tokio::runtime::Runtime;

static CLIENT: OnceLock<PrismaClient> = OnceLock::new();
static RUNTIME: OnceLock<Runtime> = OnceLock::new();

fn get_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| {
        Runtime::new().expect("Failed to create Tokio runtime")
    })
}

pub async fn get_client() -> &'static PrismaClient {
    CLIENT.get_or_init(|| {
        get_runtime().block_on(async {
            PrismaClient::_builder()
                .build()
                .await
                .expect("Failed to create Prisma client")
        })
    })
} 