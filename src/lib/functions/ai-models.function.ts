import { getAuthHeaders, getByPath } from "./common.function";
import { fetch } from "@tauri-apps/plugin-http";
import { TYPE_AI_PROVIDER } from "@/types";

export const fetchModels = async (params: {
  provider: TYPE_AI_PROVIDER;
  apiKey: string;
}): Promise<string[] | string> => {
  try {
    const { provider, apiKey } = params;
    if (!provider) {
      return `Provider not provided`;
    }
    if (!provider?.models) {
      return [];
    }
    let url = `${provider?.baseUrl ?? ""}${provider?.models?.endpoint ?? ""}`;
    const queryParams = new URLSearchParams();
    if ("authParam" in (provider ?? {}) && provider?.authParam) {
      queryParams.append(provider.authParam, apiKey);
    }
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    const headers = {
      ...getAuthHeaders(provider, apiKey),
    };
    let response;
    try {
      response = await fetch(url, {
        method: provider?.models?.method ?? "GET",
        headers,
      });
    } catch (fetchError) {
      return `Network error during API request: ${
        fetchError instanceof Error ? fetchError.message : "Unknown error"
      }`;
    }
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {}
      return `Failed to fetch models: ${response.status} ${
        response.statusText
      }${errorText ? ` - ${errorText}` : ""}`;
    }
    let json;
    try {
      json = await response.json();
    } catch (parseError) {
      return `Failed to parse response: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`;
    }
    const modelsData =
      getByPath(json, provider?.models?.responsePath ?? "") || [];
    return modelsData.map((m: any) => m[provider?.models?.idKey ?? "id"]);
  } catch (error) {
    return `Error in fetchModels: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }
};
