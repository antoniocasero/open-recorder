use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri_plugin_http;

mod commands;

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioItem {
    id: String,
    name: String,
    path: String,
    size: u64,
    mtime: i64,
    duration: Option<f64>,
}

#[tauri::command]
async fn pick_folder(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;
    use futures::channel::oneshot;
    
    let (tx, rx) = oneshot::channel();
    
    app.dialog()
        .file()
        .pick_folder(move |path| {
            let result = path
                .map(|p| p.to_string())
                .ok_or_else(|| "No folder selected".to_string());
            let _ = tx.send(result);
        });
    
    rx.await.map_err(|_| "Dialog cancelled".to_string())?
}

#[tauri::command]
fn scan_folder_for_audio(folder_path: String) -> Result<Vec<AudioItem>, String> {
    let path = PathBuf::from(&folder_path);
    let mut items = Vec::new();
    
    scan_recursive(&path, &mut items)?;
    Ok(items)
}

fn scan_recursive(dir: &PathBuf, items: &mut Vec<AudioItem>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.is_dir() {
            let _ = scan_recursive(&path, items);
        } else if let Some(ext) = path.extension() {
            let ext = ext.to_string_lossy().to_lowercase();
            if ext == "mp3" || ext == "m4a" || ext == "wav" {
                if let Ok(metadata) = fs::metadata(&path) {
                    let path_str = path.to_string_lossy().to_string();
                    items.push(AudioItem {
                        id: format!("{:x}", md5::compute(&path_str)),
                        name: path.file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string(),
                        path: path_str,
                        size: metadata.len(),
                        mtime: metadata.modified()
                            .ok()
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| d.as_secs() as i64)
                            .unwrap_or(0),
                        duration: None,
                    });
                }
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
fn read_file_meta(file_path: String) -> Result<AudioItem, String> {
    let path = PathBuf::from(&file_path);
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    
    Ok(AudioItem {
        id: format!("{:x}", md5::compute(&file_path)),
        name: path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        path: file_path,
        size: metadata.len(),
        mtime: metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0),
        duration: None,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Load environment variables from .env files
  // Try multiple locations to find the project root where .env.local might be
  
  // Method 1: Try parent of CARGO_MANIFEST_DIR (project root)
  // CARGO_MANIFEST_DIR points to src-tauri/ at compile time
  let project_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).parent();
  if let Some(root) = project_root {
    let env_local = root.join(".env.local");
    if env_local.exists() {
      let _ = dotenv::from_path(&env_local);
    }
    let env_file = root.join(".env");
    if env_file.exists() {
      let _ = dotenv::from_path(&env_file);
    }
  }
  
  // Method 2: Try current working directory (fallback)
  dotenv::dotenv().ok();
  dotenv::from_filename(".env.local").ok();
  
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_http::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        pick_folder,
        scan_folder_for_audio,
        read_file_meta,
        commands::transcription::transcribe_audio,
        commands::transcription::transcribe_audio_batch,
        commands::transcription::save_transcript
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
