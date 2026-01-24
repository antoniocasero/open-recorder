use async_openai::{
    config::OpenAIConfig,
    error::OpenAIError,
    types::audio::{
        AudioResponseFormat,
        CreateTranscriptionRequestArgs,
        TimestampGranularity,
    },
    types::chat::{ChatCompletionRequestMessage, ChatCompletionRequestUserMessage, ChatCompletionRequestUserMessageContent, CreateChatCompletionRequestArgs},
    Client,
};
use tauri_plugin_http::reqwest::Error as ReqwestError;
use serde::{Deserialize, Serialize};
use std::io::ErrorKind;
use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct WordTimestamp {
    pub word: String,
    pub start: f32,
    pub end: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Transcript {
    pub text: String,
    pub words: Vec<WordTimestamp>,
    pub duration: f32,
    pub language: String,
}

fn is_supported_format(path: &PathBuf) -> bool {
    if let Some(ext) = path.extension() {
        let ext = ext.to_string_lossy().to_lowercase();
        matches!(ext.as_str(), "mp3" | "m4a" | "wav" | "flac" | "ogg" | "aac")
    } else {
        false
    }
}

#[derive(Debug, Error)]
pub enum TranscriptionError {
    #[error("Missing API key: OPENAI_API_KEY environment variable not set")]
    MissingApiKey,
    #[error("File not found: {0}")]
    FileNotFound(String),
    #[error("File too large: {0} (max 25 MB)")]
    FileTooLarge(String),
    #[error("Unsupported audio format. Supported: mp3, m4a, wav, flac, ogg, aac")]
    UnsupportedFormat,
    #[error("OpenAI API error: {0}")]
    ApiError(String),
    #[error("Network error: {0}")]
    NetworkError(String),
    #[error("Transcription failed: {0}")]
    TranscriptionFailed(String),
    #[error("Failed to save transcript: {0}")]
    SaveError(String),
    #[error("File error: {0}")]
    FileError(String),
    #[error("Invalid request: {0}")]
    RequestError(String),
}

impl From<std::io::Error> for TranscriptionError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            ErrorKind::NotFound => TranscriptionError::FileNotFound(err.to_string()),
            _ => TranscriptionError::FileError(err.to_string()),
        }
    }
}

impl From<async_openai::error::OpenAIError> for TranscriptionError {
    fn from(err: async_openai::error::OpenAIError) -> Self {
        TranscriptionError::ApiError(err.to_string())
    }
}

impl From<ReqwestError> for TranscriptionError {
    fn from(err: ReqwestError) -> Self {
        TranscriptionError::NetworkError(err.to_string())
    }
}

#[tauri::command]
pub async fn transcribe_audio(path: PathBuf) -> Result<Transcript, String> {
    transcribe_audio_inner(path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn transcribe_audio_batch(paths: Vec<PathBuf>) -> Result<Vec<Result<Transcript, String>>, String> {
    let mut results = Vec::new();
    for path in paths {
        let result = transcribe_audio_inner(path).await;
        results.push(result.map_err(|e| e.to_string()));
    }
    Ok(results)
}

async fn transcribe_audio_inner(path: PathBuf) -> Result<Transcript, TranscriptionError> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| TranscriptionError::MissingApiKey)?;

    let config = OpenAIConfig::new().with_api_key(&api_key);
    let client = Client::with_config(config);
    
    // Validate file size (25 MB limit)
    let metadata = std::fs::metadata(&path)?;
    if metadata.len() > 25 * 1024 * 1024 {
        return Err(TranscriptionError::FileTooLarge(path.display().to_string()));
    }

    // Validate file extension
    if !is_supported_format(&path) {
        return Err(TranscriptionError::UnsupportedFormat);
    }
    

    
    // Try whisper-1 model which supports verbose_json with word timestamps
    // If that fails, fall back to gpt-4o-transcribe with json format (no word timestamps)
    let request = CreateTranscriptionRequestArgs::default()
        .file(&path)
        .model("whisper-1")
        .response_format(AudioResponseFormat::VerboseJson)
        .timestamp_granularities(&[TimestampGranularity::Word])
        .build()
        .map_err(|e: OpenAIError| TranscriptionError::RequestError(e.to_string()))?;
    
    let response = client
        .audio()
        .transcription()
        .create_verbose_json(request)
        .await?;
    
    // Extract words from response (words field is available in verbose_json)
    let words = response
        .words
        .unwrap_or_default()
        .into_iter()
        .map(|w| WordTimestamp {
            word: w.word,
            start: w.start,
            end: w.end,
        })
        .collect();
    
    // Save transcript as .txt file alongside original audio
    let transcript_path = path.with_extension("txt");
    std::fs::write(&transcript_path, &response.text)
        .map_err(|e| TranscriptionError::SaveError(e.to_string()))?;
    
    Ok(Transcript {
        text: response.text,
        words,
        duration: response.duration,
        language: response.language,
    })
}

#[tauri::command]
pub async fn save_transcript(path: PathBuf, text: String) -> Result<(), String> {
    save_transcript_inner(path, text).await.map_err(|e| e.to_string())
}

async fn save_transcript_inner(path: PathBuf, text: String) -> Result<(), TranscriptionError> {
    // Validate path exists (audio file optional, but at least parent directory should exist)
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            return Err(TranscriptionError::FileNotFound(format!("Parent directory not found: {}", parent.display())));
        }
    }
    
    // Write to sidecar .txt file
    let transcript_path = path.with_extension("txt");
    std::fs::write(&transcript_path, text)
        .map_err(|e| TranscriptionError::SaveError(e.to_string()))?;
    
    Ok(())
}

#[tauri::command]
pub async fn read_transcript(path: PathBuf) -> Result<String, String> {
    read_transcript_inner(path).await.map_err(|e| e.to_string())
}

async fn read_transcript_inner(path: PathBuf) -> Result<String, TranscriptionError> {
    // Get transcript file path
    let transcript_path = path.with_extension("txt");
    
    // Check if file exists
    if !transcript_path.exists() {
        return Err(TranscriptionError::FileNotFound(format!("Transcript file not found: {}", transcript_path.display())));
    }
    
    // Read file content
    let content = std::fs::read_to_string(&transcript_path)
        .map_err(|e| TranscriptionError::FileError(e.to_string()))?;
    
    Ok(content)
}

#[tauri::command]
pub async fn summarize_transcript(text: String) -> Result<String, String> {
    summarize_transcript_inner(text).await.map_err(|e| e.to_string())
}

async fn summarize_transcript_inner(text: String) -> Result<String, TranscriptionError> {
    // Validate input
    if text.trim().is_empty() {
        return Err(TranscriptionError::TranscriptionFailed(
            "Transcript text is empty".to_string(),
        ));
    }

    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| TranscriptionError::MissingApiKey)?;

    let config = OpenAIConfig::new().with_api_key(&api_key);
    let client = Client::with_config(config);

    let prompt = format!(
        "Summarize the following transcript in 3‑5 bullet points. Focus on key points, decisions, and action items. Transcript:\n\n{}",
        text
    );

    let request = CreateChatCompletionRequestArgs::default()
        .model("gpt-3.5-turbo")
        .messages(vec![ChatCompletionRequestMessage::User(ChatCompletionRequestUserMessage {
            content: ChatCompletionRequestUserMessageContent::Text(prompt),
            name: None,
        })])
        .build()
        .map_err(|e| TranscriptionError::RequestError(e.to_string()))?;

    let response = client
        .chat()
        .create(request)
        .await
        .map_err(|e| TranscriptionError::ApiError(e.to_string()))?;

    response
        .choices
        .first()
        .and_then(|choice| choice.message.content.clone())
        .ok_or_else(|| TranscriptionError::TranscriptionFailed("No content in response".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_transcribe_audio_missing_api_key() {
        // Temporarily remove API key if set
        std::env::remove_var("OPENAI_API_KEY");
        
        let result = transcribe_audio_inner(PathBuf::from("nonexistent.mp3")).await;
        assert!(matches!(result, Err(TranscriptionError::MissingApiKey)));
    }
    
    #[tokio::test]
    async fn test_transcribe_audio_file_not_found() {
        // Set a dummy API key to bypass missing api key error
        std::env::set_var("OPENAI_API_KEY", "dummy_key");
        
        let result = transcribe_audio_inner(PathBuf::from("nonexistent.mp3")).await;
        // Should be FileError because file doesn't exist
        assert!(matches!(result, Err(TranscriptionError::FileError(_))));
        
        // Clean up
        std::env::remove_var("OPENAI_API_KEY");
    }
    
    #[tokio::test]
    async fn test_read_transcript() {
        // Create a temporary transcript file
        let temp_dir = std::env::temp_dir();
        let audio_path = temp_dir.join("test_audio.mp3");
        let transcript_path = audio_path.with_extension("txt");
        let test_content = "This is a test transcript.";
        
        std::fs::write(&transcript_path, test_content).unwrap();
        
        // Test reading
        let result = read_transcript_inner(audio_path).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), test_content);
        
        // Clean up
        std::fs::remove_file(&transcript_path).unwrap();
    }
}