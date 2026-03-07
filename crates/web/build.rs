fn main() {
    // Force recompile when any asset changes so incremental builds pick up updates.
    println!("cargo:rerun-if-changed=src/assets/");
}
