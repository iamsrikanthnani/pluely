export interface TYPE_AI_PROVIDER {
  id: string;
  name: string;
  baseUrl: string;
  chatEndpoint: string;
  authType: string; // One of the values from AUTH_TYPES, e.g., 'bearer', 'x-api-key', or custom header name
  defaultModel: string;
  streaming?: boolean; // Indicates if the provider supports streaming responses
  response: {
    contentPath: string; // Dot notation path to extract content from response JSON, e.g., 'choices[0].message.content'
    usagePath: string; // Dot notation path to extract usage data from response JSON, e.g., 'usage'
  };
  input: {
    text: {
      // Example structure for text input; can be customized for the provider
      messages: Array<{
        role: "system" | "user" | "assistant";
        content: string | Array<any>;
      }>;
    };
    image?: {
      type: "base64" | "url" | "url_or_base64" | string; // Type of image support, or custom
      messages: Array<{
        role: "system" | "user" | "assistant";
        content: Array<any>;
      }> | null;
    } | null; // null if images not supported
  };
  models?: {
    endpoint: string; // Endpoint to fetch available models, e.g., '/v1/models'
    method: "GET" | "POST" | string;
    responsePath: string; // Path to models array in response, e.g., 'data'
    idKey: string; // Key for model ID in each model object, e.g., 'id'
  } | null; // null if model listing not supported
  authParam?: string; // If auth is via query param, e.g., 'key' for Gemini
  compat?: "openai" | "claude" | "gemini" | "cohere" | string; // Compatibility mode for request/response formatting; defaults to 'openai' for custom providers
  isCustom?: boolean; // Flag to indicate if it's a user-added custom provider
  // Any additional provider-specific fields can be added here for extensibility
  // [key: string]: any;
}
