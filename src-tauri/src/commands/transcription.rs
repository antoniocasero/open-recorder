use async_openai::{
    config::OpenAIConfig,
    error::OpenAIError,
    types::audio::{
        AudioResponseFormat,
        CreateTranscriptionRequestArgs,
        TimestampGranularity,
        TranscriptionWord,
    },
    Client,
};
use serde::{Deserialize, Serialize};
use std::fs::File;
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

#[derive(Debug, Error)]
pub enum TranscriptionError {
    #[error("Missing API key: OPENAI_API_KEY environment variable not set")]
    MissingApiKey,
    #[error("Failed to read file: {0}")]
    FileError(String),
    #[error("OpenAI API error: {0}")]
    ApiError(String),
    #[error("Invalid request: {0}")]
    RequestError(String),
    #[error("Failed to save transcript: {0}")]
    SaveError(String),
}

impl From<std::io::Error> for TranscriptionError {
    fn from(err: std::io::Error) -> Self {
        TranscriptionError::FileError(err.to_string())
    }
}

impl From<async_openai::error::OpenAIError> for TranscriptionError {
    fn from(err: async_openai::error::OpenAIError) -> Self {
        TranscriptionError::ApiError(err.to_string())
    }
}

#[tauri::command]
pub async fn transcribe_audio(path: PathBuf) -> Result<Transcript, String> {
    transcribe_audio_inner(path).await.map_err(|e| e.to_string())
}

async fn transcribe_audio_inner(path: PathBuf) -> Result<Transcript, TranscriptionError> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| TranscriptionError::MissingApiKey)?;

    let config = OpenAIConfig::new().with_api_key(&api_key);
    let client = Client::with_config(config);
    
    // Validate file size (25 MB limit)
    let metadata = std::fs::metadata(&path)?;
    if metadata.len() > 25 * 1024 * 1024 {
        return Err(TranscriptionError::FileError(
            "File size exceeds 25 MB limit".to_string(),
        ));
    }
    

    
    let request = CreateTranscriptionRequestArgs::default()
        .file(&path)
        .model("gpt-4o-transcribe")
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
}