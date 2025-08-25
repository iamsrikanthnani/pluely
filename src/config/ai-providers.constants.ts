export const AI_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com",
    chatEndpoint: "/v1/chat/completions",
    authType: "bearer",
    defaultModel: "gpt-5",
    streaming: true,
    response: {
      contentPath: "choices[0].message.content",
      usagePath: "usage",
    },
    input: {
      text: {
        messages: [
          {
            role: "user",
            content: "Hello!",
          },
        ],
      },
      image: {
        type: "base64",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: "data:image/jpeg;base64,$BASE64_IMAGE" },
              },
            ],
          },
        ],
      },
    },
    models: {
      endpoint: "/v1/models",
      method: "GET",
      responsePath: "data",
      idKey: "id",
    },
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    baseUrl: "https://api.anthropic.com",
    chatEndpoint: "/v1/messages",
    authType: "x-api-key",
    defaultModel: "claude-sonnet-4-20250514",
    streaming: true,
    response: {
      contentPath: "content[0].text",
      usagePath: "usage",
    },
    input: {
      text: {
        messages: [
          {
            role: "user",
            content: "Hello!",
          },
        ],
      },
      image: {
        type: "base64",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: "$BASE64_IMAGE",
                },
              },
            ],
          },
        ],
      },
    },
    models: null,
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    baseUrl: "https://api.x.ai",
    chatEndpoint: "/v1/chat/completions",
    authType: "bearer",
    defaultModel: "grok-4",
    streaming: true,
    response: {
      contentPath: "choices[0].message.content",
      usagePath: "usage",
    },
    input: {
      text: {
        messages: [
          {
            role: "user",
            content: "Hello!",
          },
        ],
      },
      image: {
        type: "base64",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: "data:image/jpeg;base64,$BASE64_IMAGE" },
              },
            ],
          },
        ],
      },
    },
    models: {
      endpoint: "/v1/models",
      method: "GET",
      responsePath: "data",
      idKey: "id",
    },
  },
  {
    id: "gemini",
    name: "Gemini (Google)",
    baseUrl: "https://generativelanguage.googleapis.com",
    chatEndpoint: "/v1beta/models/${model}:streamGenerateContent?alt=sse",
    authType: "x-goog-api-key",
    authParam: "key",
    defaultModel: "gemini-2.5-flash",
    streaming: true,
    response: {
      contentPath: "candidates[0].content.parts[0].text",
      usagePath: "usageMetadata",
    },
    input: {
      text: {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Hello!",
              },
            ],
          },
        ],
      },
      image: {
        type: "base64",
        contents: [
          {
            role: "user",
            parts: [
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: "$BASE64_IMAGE",
                },
              },
              {
                text: "Describe this image.",
              },
            ],
          },
        ],
      },
    },
    models: {
      endpoint: "/v1beta/models",
      method: "GET",
      responsePath: "models",
      idKey: "name",
    },
  },
  {
    id: "mistral",
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai",
    chatEndpoint: "/v1/chat/completions",
    authType: "bearer",
    defaultModel: "mistral-large-latest",
    streaming: true,
    response: {
      contentPath: "choices[0].message.content",
      usagePath: "usage",
    },
    input: {
      text: {
        messages: [
          {
            role: "user",
            content: "Hello!",
          },
        ],
      },
      image: {
        type: "base64",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this image.",
              },
              {
                type: "image_url",
                image_url: "data:image/jpeg;base64,$BASE64_IMAGE",
              },
            ],
          },
        ],
      },
    },
    models: {
      endpoint: "/v1/models",
      method: "GET",
      responsePath: "data",
      idKey: "id",
    },
  },
  {
    id: "cohere",
    name: "Cohere",
    baseUrl: "https://api.cohere.com",
    chatEndpoint: "/v1/chat",
    authType: "bearer",
    defaultModel: "command-r-plus",
    streaming: true,
    response: {
      contentPath: "text",
      usagePath: "usage",
    },
    input: {
      text: {
        messages: [
          {
            role: "User",
            message: "Hello!",
          },
        ],
      },
      image: null,
    },
    models: null,
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai",
    chatEndpoint: "/v1/chat/completions",
    authType: "bearer",
    defaultModel: "llama-3.1-70b-versatile",
    streaming: true,
    response: {
      contentPath: "choices[0].message.content",
      usagePath: "usage",
    },
    input: {
      text: {
        messages: [
          {
            role: "user",
            content: "Hello!",
          },
        ],
      },
      image: {
        type: "base64",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: "data:image/jpeg;base64,$BASE64_IMAGE" },
              },
            ],
          },
        ],
      },
    },
    models: {
      endpoint: "/v1/models",
      method: "GET",
      responsePath: "data",
      idKey: "id",
    },
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    baseUrl: "https://api.perplexity.ai",
    chatEndpoint: "/chat/completions",
    authType: "bearer",
    defaultModel: "sonar-medium-online",
    streaming: true,
    response: {
      contentPath: "choices[0].message.content",
      usagePath: "usage",
    },
    input: {
      text: {
        messages: [
          {
            role: "user",
            content: "Hello!",
          },
        ],
      },
      image: null,
    },
    models: null,
  },
];
