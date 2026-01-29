use md5;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn get_storage_root(app: &AppHandle) -> Result<PathBuf, String> {
    let local_data_dir = app.path().local_data_dir().map_err(|e| e.to_string())?;
    Ok(local_data_dir.join("open-recorder"))
}

pub fn get_insights_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let root = get_storage_root(app)?;
    Ok(root.join("insights"))
}

pub fn get_managed_audio_dir_name(source_path: &PathBuf) -> String {
    let filename = source_path
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    // We use the full path for the hash to ensure uniqueness even if filenames are same
    let full_path_str = source_path.to_string_lossy().to_string();
    let digest = md5::compute(full_path_str);
    let hash = format!("{:x}", digest);
    // Take first 6 chars of hash
    let hash_short = &hash[0..6];

    format!("{}-{}", filename, hash_short)
}

pub fn get_managed_path(app: &AppHandle, source_path: &PathBuf) -> Result<PathBuf, String> {
    let root = get_storage_root(app)?;
    let audios_dir = root.join("audios");
    let dir_name = get_managed_audio_dir_name(source_path);
    Ok(audios_dir.join(dir_name))
}

pub fn ensure_audio_dir(app: &AppHandle, source_path: &PathBuf) -> Result<PathBuf, String> {
    let managed_path = get_managed_path(app, source_path)?;

    if !managed_path.exists() {
        fs::create_dir_all(&managed_path).map_err(|e| e.to_string())?;
    }

    let ext = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bin");

    let dest_file = managed_path.join(format!("audio.{}", ext));

    if !dest_file.exists() {
        fs::copy(source_path, &dest_file).map_err(|e| e.to_string())?;
    }

    Ok(managed_path)
}

#[tauri::command]
pub async fn get_storage_root_command(app: AppHandle) -> Result<String, String> {
    let root = get_storage_root(&app)?;
    Ok(root.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_insights_dir_command(app: AppHandle) -> Result<String, String> {
    let dir = get_insights_dir(&app)?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn ensure_audio_dir_command(app: AppHandle, source_path: String) -> Result<String, String> {
    let path = PathBuf::from(source_path);
    let managed_path = ensure_audio_dir(&app, &path)?;
    Ok(managed_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn list_managed_recordings(app: AppHandle) -> Result<Vec<String>, String> {
    let root = get_storage_root(&app)?;
    let audios_dir = root.join("audios");
    
    if !audios_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut recordings = Vec::new();
    let entries = fs::read_dir(audios_dir).map_err(|e| e.to_string())?;
    
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
            let dir_name = entry.file_name().to_string_lossy().to_string();
            recordings.push(dir_name);
        }
    }
    
    Ok(recordings)
}

#[tauri::command]
pub async fn get_transcript_path(app: AppHandle, source_path: String) -> Result<Option<String>, String> {
    let path = PathBuf::from(&source_path);
    
    // First check managed transcript
    let managed_dir = get_managed_path(&app, &path)?;
    let managed_transcript = managed_dir.join("transcript.txt");
    if managed_transcript.exists() {
        return Ok(Some(managed_transcript.to_string_lossy().to_string()));
    }
    
    // Check sidecar transcript
    let sidecar_transcript = path.with_extension("txt");
    if sidecar_transcript.exists() {
        return Ok(Some(sidecar_transcript.to_string_lossy().to_string()));
    }
    
    Ok(None)
}
