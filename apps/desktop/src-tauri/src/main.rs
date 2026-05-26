// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // Add Rust commands here if/when needed.
            // For now, the desktop app is a pure WebView wrapper —
            // all logic stays in the React Native web build.
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pup Portrait desktop");
}
