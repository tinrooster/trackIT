fn main() {
    tauri_build::build();
    
    // Generate Prisma client
    println!("cargo:rerun-if-changed=../prisma/schema.prisma");
    
    let status = std::process::Command::new("cargo")
        .args(["run", "--bin", "prisma", "generate"])
        .status()
        .expect("Failed to execute prisma generate command");

    if !status.success() {
        panic!("Failed to generate Prisma client");
    }
}
