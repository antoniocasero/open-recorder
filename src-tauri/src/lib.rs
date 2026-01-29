use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use symphonia::default::get_probe;
use tauri_plugin_http;
use tauri::AppHandle;

mod commands;
pub mod storage;

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioItem {
    id: String,
    name: String,
    path: String,
    size: u64,
    mtime: i64,
    duration: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InsightsSeriesPoint {
    day_start_unix: i64,
    recording_seconds: f64,
    transcribed_seconds: f64,
    recordings: u64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InsightsBucket {
    id: String,
    label: String,
    count: u64,
    seconds: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InsightsKpis {
    total_recordings: u64,
    total_recording_seconds: f64,
    transcribed_recordings: u64,
    transcribed_seconds: f64,
    transcription_coverage_pct: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InsightsRecordingRow {
    id: String,
    name: String,
    path: String,
    mtime_unix: i64,
    duration_seconds: Option<f64>,
    has_transcript: bool,
    language: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageDistributionItem {
    language: String,
    count: u64,
    transcribed_seconds: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileTypeDistributionItem {
    ext: String,
    count: u64,
    seconds: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryInsightsPayload {
    preset: String,
    kpis: InsightsKpis,
    series: Vec<InsightsSeriesPoint>,
    duration_buckets: Vec<InsightsBucket>,
    language_distribution: Vec<LanguageDistributionItem>,
    file_type_distribution: Vec<FileTypeDistributionItem>,
    recent: Vec<InsightsRecordingRow>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptionMetaItem {
    language: String,
    transcription_seconds: Option<f64>,
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
                    let duration = read_audio_duration(&path);
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
                        duration,
                    });
                }
            }
        }
    }
    
    Ok(())
}

fn read_audio_duration(path: &PathBuf) -> Option<f64> {
    let source = fs::File::open(path).ok()?;
    let mss = MediaSourceStream::new(Box::new(source), Default::default());
    let mut hint = Hint::new();

    if let Some(ext) = path.extension().and_then(|ext| ext.to_str()) {
        hint.with_extension(ext);
    }

    let probed = get_probe()
        .format(&hint, mss, &FormatOptions::default(), &MetadataOptions::default())
        .ok()?;
    let format = probed.format;
    let track = format
        .default_track()
        .or_else(|| format.tracks().first())?;
    let n_frames = track.codec_params.n_frames?;
    let time_base = track.codec_params.time_base?;
    let time = time_base.calc_time(n_frames);

    Some(time.seconds as f64 + time.frac)
}

fn now_unix() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn preset_min_mtime(preset: &str, now: i64) -> Result<Option<i64>, String> {
    let day = 86400_i64;

    match preset {
        "7d" => Ok(Some(now - 7 * day)),
        "30d" => Ok(Some(now - 30 * day)),
        "90d" => Ok(Some(now - 90 * day)),
        "all" => Ok(None),
        _ => Err(format!("Invalid preset: {preset}")),
    }
}

#[tauri::command]
fn get_library_insights(
    app: AppHandle,
    folder_path: String,
    preset: String,
    transcription_meta_by_path: Option<HashMap<String, TranscriptionMetaItem>>,
) -> Result<LibraryInsightsPayload, String> {
    let now = now_unix();
    let min_mtime = preset_min_mtime(&preset, now)?;

    let scan_path = PathBuf::from(&folder_path);
    let mut items = Vec::new();
    scan_recursive(&scan_path, &mut items)?;

    let mut kpi_total_recordings = 0_u64;
    let mut kpi_total_recording_seconds = 0_f64;
    let mut kpi_transcribed_recordings = 0_u64;
    let mut kpi_transcribed_seconds = 0_f64;

    let mut series_by_day: HashMap<i64, (f64, f64, u64)> = HashMap::new();

    let mut duration_buckets: Vec<InsightsBucket> = vec![
        InsightsBucket {
            id: "0-2m".to_string(),
            label: "0-2m".to_string(),
            count: 0,
            seconds: 0.0,
        },
        InsightsBucket {
            id: "2-5m".to_string(),
            label: "2-5m".to_string(),
            count: 0,
            seconds: 0.0,
        },
        InsightsBucket {
            id: "5-15m".to_string(),
            label: "5-15m".to_string(),
            count: 0,
            seconds: 0.0,
        },
        InsightsBucket {
            id: "15m+".to_string(),
            label: "15m+".to_string(),
            count: 0,
            seconds: 0.0,
        },
    ];

    let mut file_type_dist: HashMap<String, (u64, f64)> = HashMap::new();
    let mut language_dist: HashMap<String, (u64, f64)> = HashMap::new();
    let mut recent_rows: Vec<InsightsRecordingRow> = Vec::new();

    for item in items {
        if let Some(min) = min_mtime {
            if item.mtime < min {
                continue;
            }
        }

        let duration_seconds = item.duration.unwrap_or(0.0);
        let audio_path = PathBuf::from(&item.path);
        let has_transcript = match crate::storage::get_managed_path(&app, &audio_path) {
            Ok(managed_dir) => {
                let managed_transcript = managed_dir.join("transcript.txt");
                if managed_transcript.exists() {
                    true
                } else {
                    audio_path.with_extension("txt").exists()
                }
            }
            Err(_) => audio_path.with_extension("txt").exists(),
        };

        let meta = transcription_meta_by_path
            .as_ref()
            .and_then(|m| m.get(&item.path));

        let language = if has_transcript {
            meta.map(|m| m.language.clone()).unwrap_or_else(|| "unknown".to_string())
        } else {
            "unknown".to_string()
        };
        let language = language.to_lowercase();

        let transcribed_seconds = if has_transcript {
            if let Some(m) = meta {
                if let Some(s) = m.transcription_seconds {
                    s
                } else if item.duration.is_some() {
                    duration_seconds
                } else {
                    0.0
                }
            } else if item.duration.is_some() {
                duration_seconds
            } else {
                0.0
            }
        } else {
            0.0
        };

        kpi_total_recordings += 1;
        kpi_total_recording_seconds += duration_seconds;

        if has_transcript {
            kpi_transcribed_recordings += 1;
            kpi_transcribed_seconds += transcribed_seconds;
        }

        let day_start_unix = item.mtime - (item.mtime % 86400);
        let entry = series_by_day.entry(day_start_unix).or_insert((0.0, 0.0, 0));
        entry.0 += duration_seconds;
        entry.1 += transcribed_seconds;
        entry.2 += 1;

        let bucket_idx = if duration_seconds < 120.0 {
            0
        } else if duration_seconds < 300.0 {
            1
        } else if duration_seconds < 900.0 {
            2
        } else {
            3
        };
        duration_buckets[bucket_idx].count += 1;
        duration_buckets[bucket_idx].seconds += duration_seconds;

        let ext = PathBuf::from(&item.path)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        let ext = if ext.is_empty() { "unknown".to_string() } else { ext };
        let ext_entry = file_type_dist.entry(ext).or_insert((0, 0.0));
        ext_entry.0 += 1;
        ext_entry.1 += duration_seconds;

        if has_transcript {
            let lang_entry = language_dist.entry(language.clone()).or_insert((0, 0.0));
            lang_entry.0 += 1;
            lang_entry.1 += transcribed_seconds;
        }

        recent_rows.push(InsightsRecordingRow {
            id: item.id,
            name: item.name,
            path: item.path,
            mtime_unix: item.mtime,
            duration_seconds: item.duration,
            has_transcript,
            language,
        });
    }

    recent_rows.sort_by(|a, b| b.mtime_unix.cmp(&a.mtime_unix));
    if recent_rows.len() > 10 {
        recent_rows.truncate(10);
    }

    let mut series: Vec<InsightsSeriesPoint> = series_by_day
        .into_iter()
        .map(|(day_start_unix, (recording_seconds, transcribed_seconds, recordings))| {
            InsightsSeriesPoint {
                day_start_unix,
                recording_seconds,
                transcribed_seconds,
                recordings,
            }
        })
        .collect();
    series.sort_by(|a, b| a.day_start_unix.cmp(&b.day_start_unix));

    let mut file_type_distribution: Vec<FileTypeDistributionItem> = file_type_dist
        .into_iter()
        .map(|(ext, (count, seconds))| FileTypeDistributionItem { ext, count, seconds })
        .collect();
    file_type_distribution.sort_by(|a, b| b.seconds.partial_cmp(&a.seconds).unwrap_or(std::cmp::Ordering::Equal));

    let mut language_distribution: Vec<LanguageDistributionItem> = language_dist
        .into_iter()
        .map(|(language, (count, transcribed_seconds))| LanguageDistributionItem {
            language,
            count,
            transcribed_seconds,
        })
        .collect();
    language_distribution.sort_by(|a, b| b.transcribed_seconds.partial_cmp(&a.transcribed_seconds).unwrap_or(std::cmp::Ordering::Equal));

    let coverage_pct = if kpi_total_recording_seconds > 0.0 {
        (kpi_transcribed_seconds / kpi_total_recording_seconds) * 100.0
    } else {
        0.0
    };

    Ok(LibraryInsightsPayload {
        preset,
        kpis: InsightsKpis {
            total_recordings: kpi_total_recordings,
            total_recording_seconds: kpi_total_recording_seconds,
            transcribed_recordings: kpi_transcribed_recordings,
            transcribed_seconds: kpi_transcribed_seconds,
            transcription_coverage_pct: coverage_pct,
        },
        series,
        duration_buckets: duration_buckets,
        language_distribution,
        file_type_distribution,
        recent: recent_rows,
    })
}

#[tauri::command]
fn read_file_meta(file_path: String) -> Result<AudioItem, String> {
    let path = PathBuf::from(&file_path);
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let duration = read_audio_duration(&path);
    
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
        duration,
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
        get_library_insights,
        storage::get_storage_root_command,
        storage::get_insights_dir_command,
        storage::ensure_audio_dir_command,
        storage::list_managed_recordings,
        storage::get_transcript_path,
        commands::transcription::transcribe_audio,
        commands::transcription::transcribe_audio_batch,
        commands::transcription::save_transcript,
        commands::transcription::save_export,
        commands::transcription::read_transcript,
        commands::transcription::summarize_transcript,
        commands::transcription::recommend_actions,
        commands::transcription::extract_key_topics,
        commands::transcription::get_transcript_insights
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
