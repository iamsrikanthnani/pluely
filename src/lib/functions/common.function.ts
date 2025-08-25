import { TYPE_AI_PROVIDER, TYPE_STT_PROVIDER } from "@/types";

export const AUTH_TYPES = [
  "bearer",
  "token",
  "x-api-key",
  "xi-api-key",
  "basic-apikey",
  "subscription-key",
  "x-goog-api-key",
  "api-key",
  "custom",
  "query",
] as const;

export function getByPath(obj: any, path: string): any {
  if (!path) return obj;
  return path
    .replace(/\[/g, ".")
    .replace(/\]/g, "")
    .split(".")
    .reduce((o, k) => (o || {})[k], obj);
}

export function setByPath(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i].replace(/\[(\d+)\]/g, ".$1");
    if (!current[key]) current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    current = current[key];
  }
  current[keys[keys.length - 1].replace(/\[(\d+)\]/g, ".$1")] = value;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = (reader.result as string)?.split(",")[1] ?? "";
      resolve(base64data);
    };
    reader.onerror = reject;
  });
}

export function getAuthHeaders(
  provider: TYPE_AI_PROVIDER | TYPE_STT_PROVIDER,
  apiKey: string
): Record<string, string> {
  if ("authParam" in provider && provider.authParam) {
    return {};
  }
  const headers: Record<string, string> = {};
  switch (provider.authType) {
    case "bearer":
      headers["Authorization"] = `Bearer ${apiKey}`;
      break;
    case "token":
      headers["Authorization"] = `Token ${apiKey}`;
      break;
    case "x-api-key":
      headers["x-api-key"] = apiKey;
      break;
    case "xi-api-key":
      headers["xi-api-key"] = apiKey;
      break;
    case "basic-apikey":
      headers["Authorization"] = `Basic ${btoa(`apikey:${apiKey}`)}`;
      break;
    case "subscription-key":
      headers["Ocp-Apim-Subscription-Key"] = apiKey;
      break;
    case "x-goog-api-key":
      headers["x-goog-api-key"] = apiKey;
      break;
    case "api-key":
      headers["api-key"] = apiKey;
      break;
    default:
      // For custom auth types, assume the authType is the header name
      headers[provider.authType] = apiKey;
      break;
  }
  return headers;
}
