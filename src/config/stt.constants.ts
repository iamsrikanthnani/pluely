export const SPEECH_TO_TEXT_PROVIDERS = [
  {
    id: "openai-whisper",
    name: "OpenAI Whisper",
    curl: `curl -X POST "https://api.openai.com/v1/audio/transcriptions" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "file={{AUDIO_BASE64}}" \\
      -F "model={{MODEL}}"`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "groq-whisper",
    name: "Groq Whisper",
    curl: `curl -X POST "https://api.groq.com/openai/v1/audio/transcriptions" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "file={{AUDIO_BASE64}}" \\
      -F "model={{MODEL}}" \\
      -F "response_format=text"`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "elevenlabs-stt",
    name: "ElevenLabs Speech-to-Text",
    curl: `curl -X POST "https://api.elevenlabs.io/v1/speech-to-text" \\
      -H "xi-api-key: {{API_KEY}}" \\
      -F "file={{AUDIO_BASE64}}" \\
      -F "model_id={{MODEL}}"`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "google-stt",
    name: "Google Speech-to-Text",
    curl: `curl -X POST "https://speech.googleapis.com/v1/speech:recognize" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -H "Content-Type: application/json" \\
      -d '{
        "config": {
          "encoding": "LINEAR16", 
          "sampleRateHertz": 16000,
          "languageCode": "en-US"
        },
        "audio": {
          "content": "{{AUDIO_BASE64}}"
        }
      }'`,
    responseContentPath: "results[0].alternatives[0].transcript",
    streaming: false,
  },
  {
    id: "deepgram-stt",
    name: "Deepgram Speech-to-Text",
    curl: `curl -X POST "https://api.deepgram.com/v1/listen?model={{MODEL}}" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -H "Content-Type: audio/wav" \\
      --data-binary {{AUDIO_BASE64}}`,
    responseContentPath: "results.channels[0].alternatives[0].transcript",
    streaming: false,
  },
  {
    id: "azure-stt",
    name: "Azure Speech-to-Text",
    curl: `curl -X POST "https://{{REGION}}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US" \\
      -H "Ocp-Apim-Subscription-Key: {{API_KEY}}" \\
      -H "Content-Type: audio/wav" \\
      --data-binary {{AUDIO_BASE64}}`,
    responseContentPath: "DisplayText",
    streaming: false,
  },
  {
    id: "assembly-ai-stt",
    name: "AssemblyAI Speech-to-Text",
    curl: `curl -X POST "https://api.assemblyai.com/v2/transcript" \\
      -H "Authorization: {{API_KEY}}" \\
      -H "Content-Type: application/json" \\
      -d '{
        "audio_url": "data:audio/wav;base64,{{AUDIO_BASE64}}"
      }'`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "speechmatics-stt",
    name: "Speechmatics",
    curl: `curl -X POST "https://asr.api.speechmatics.com/v2/jobs" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "data_file={{AUDIO_BASE64}}" \\
      -F 'config={"type": "transcription", "transcription_config": {"language": "en"}}'`,
    responseContentPath: "job.id",
    streaming: false,
  },
  {
    id: "rev-ai-stt",
    name: "Rev.ai Speech-to-Text",
    curl: `curl -X POST "https://api.rev.ai/speechtotext/v1/jobs" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "media={{AUDIO_BASE64}}" \\
      -F "options={{OPTIONS}}"`,
    responseContentPath: "id",
    streaming: false,
  },
  {
    id: "ibm-watson-stt",
    name: "IBM Watson Speech-to-Text",
    curl: `curl -X POST "https://api.us-south.speech-to-text.watson.cloud.ibm.com/v1/recognize" \\
      -H "Authorization: Basic {{API_KEY}}" \\
      -H "Content-Type: audio/wav" \\
      --data-binary {{AUDIO_BASE64}}`,
    responseContentPath: "results[0].alternatives[0].transcript",
    streaming: false,
  },
];
