export interface TYPE_STT_PROVIDER {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  method: string; // e.g., 'POST', 'GET'
  authType: string; // One of the values from AUTH_TYPES, e.g., 'bearer', 'basic-apikey', or custom header name
  request: {
    bodyType: "formdata" | "json" | "raw" | string;
    audioFormat: string;
    audioKey: string | null;
    fields: Record<string, any>; // Additional form fields or JSON properties
    query: Record<string, string>; // Query parameters
    headers: Record<string, string>; // Additional headers
  };
  response: {
    contentPath: string; // Dot notation path to extract content from response JSON, e.g., 'text'
  };
  streaming: boolean; // Indicates if the provider supports streaming (though most STT don't)
  note?: string; // Optional notes, e.g., for async APIs
  isCustom?: boolean; // Flag to indicate if it's a user-added custom provider
  authParam?: string; // If auth is via query param
}
