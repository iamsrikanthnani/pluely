export const SPEECH_TO_TEXT_PROVIDERS = [
  {
    id: "openai-whisper",
    name: "OpenAI Whisper",
    baseUrl: "https://api.openai.com",
    endpoint: "/v1/audio/transcriptions",
    method: "POST",
    authType: "bearer",
    request: {
      bodyType: "formdata",
      audioFormat: "wav",
      audioKey: "file",
      fields: {
        model: "whisper-1",
        response_format: "text",
      },
      query: {},
      headers: {},
    },
    response: {
      contentPath: "text",
    },
    streaming: false,
  },
  {
    id: "groq-whisper",
    name: "Groq Whisper",
    baseUrl: "https://api.groq.com/openai",
    endpoint: "/v1/audio/transcriptions",
    method: "POST",
    authType: "bearer",
    request: {
      bodyType: "formdata",
      audioFormat: "wav",
      audioKey: "file",
      fields: {
        model: "whisper-large-v3",
        response_format: "text",
      },
      query: {},
      headers: {},
    },
    response: {
      contentPath: "text",
    },
    streaming: false,
  },
  {
    id: "elevenlabs-stt",
    name: "ElevenLabs Speech-to-Text",
    baseUrl: "https://api.elevenlabs.io",
    endpoint: "/v1/speech-to-text",
    method: "POST",
    authType: "xi-api-key",
    request: {
      bodyType: "formdata",
      audioFormat: "wav",
      audioKey: "file",
      fields: {
        model_id: "scribe_v1",
      },
      query: {},
      headers: {},
    },
    response: {
      contentPath: "text",
    },
    streaming: false,
  },
  {
    id: "google-stt",
    name: "Google Speech-to-Text",
    baseUrl: "https://speech.googleapis.com",
    endpoint: "/v1/speech:recognize",
    method: "POST",
    authType: "bearer",
    request: {
      bodyType: "json",
      audioFormat: "wav",
      audioKey: "audio.content",
      fields: {
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "en-US",
        },
      },
      query: {},
      headers: {
        "Content-Type": "application/json",
      },
    },
    response: {
      contentPath: "results[0].alternatives[0].transcript",
    },
    streaming: false,
  },
  {
    id: "deepgram-stt",
    name: "Deepgram Speech-to-Text",
    baseUrl: "https://api.deepgram.com",
    endpoint: "/v1/listen",
    method: "POST",
    authType: "bearer",
    request: {
      bodyType: "raw",
      audioFormat: "wav",
      audioKey: null,
      fields: {},
      query: {
        model: "nova-2",
      },
      headers: {
        "Content-Type": "audio/wav",
      },
    },
    response: {
      contentPath: "results.channels[0].alternatives[0].transcript",
    },
    streaming: false,
  },
  {
    id: "ibm-watson-stt",
    name: "IBM Watson Speech-to-Text",
    baseUrl: "https://api.us-south.speech-to-text.watson.cloud.ibm.com",
    endpoint: "/v1/recognize",
    method: "POST",
    authType: "basic-apikey", // Use username: 'apikey', password: API_KEY
    request: {
      bodyType: "raw",
      audioFormat: "wav",
      audioKey: null,
      fields: {},
      query: {
        model: "en-US_BroadbandModel",
      },
      headers: {
        "Content-Type": "audio/wav",
      },
    },
    response: {
      contentPath: "results[0].alternatives[0].transcript",
    },
    streaming: false,
  },
  {
    id: "azure-stt",
    name: "Azure Speech-to-Text",
    baseUrl: "https://eastus.stt.speech.microsoft.com", // Replace with appropriate region
    endpoint: "/speech/recognition/conversation/cognitiveservices/v1",
    method: "POST",
    authType: "subscription-key", // Header: Ocp-Apim-Subscription-Key
    request: {
      bodyType: "raw",
      audioFormat: "wav",
      audioKey: null,
      fields: {},
      query: {
        language: "en-US",
      },
      headers: {
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
      },
    },
    response: {
      contentPath: "DisplayText",
    },
    streaming: false,
  },
  {
    id: "speechmatics-stt",
    name: "Speechmatics",
    baseUrl: "https://asr.api.speechmatics.com",
    endpoint: "/v2/jobs",
    method: "POST",
    authType: "bearer",
    request: {
      bodyType: "formdata",
      audioFormat: "wav",
      audioKey: "data_file",
      fields: {
        config: JSON.stringify({
          type: "transcription",
          transcription_config: {
            language: "en",
          },
        }),
      },
      query: {},
      headers: {},
    },
    response: {
      contentPath: "job.id", // Note: This is async; need to poll /v2/jobs/{id}/transcript for "transcript" path: "results[].alternatives[0].content" and join them
    },
    streaming: false,
    note: "Async API; requires polling for results",
  },
  {
    id: "zhipu-glm-asr",
    name: "Zhipu GLM-ASR",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    endpoint: "/audio/transcriptions",
    method: "POST",
    authType: "bearer",
    request: {
      bodyType: "formdata",
      audioFormat: "wav",
      audioKey: "file",
      fields: {
        model: "glm-asr",
        response_format: "text",
      },
      query: {},
      headers: {},
    },
    response: {
      contentPath: "text",
    },
    streaming: false,
  },
  {
    id: "doubao-stt",
    name: "Doubao Speech-to-Text",
    baseUrl: "https://ark.volcengine.com/api/v3",
    endpoint: "/audio/transcriptions",
    method: "POST",
    authType: "bearer",
    request: {
      bodyType: "formdata",
      audioFormat: "wav",
      audioKey: "file",
      fields: {
        model: "whisper-1",
        response_format: "text",
      },
      query: {},
      headers: {},
    },
    response: {
      contentPath: "text",
    },
    streaming: false,
  },
];
