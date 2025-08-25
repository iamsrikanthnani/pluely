import {
  blobToBase64,
  getAuthHeaders,
  getByPath,
  setByPath,
} from "./common.function";
import { fetch } from "@tauri-apps/plugin-http";
import { TYPE_STT_PROVIDER } from "@/types/stt.types";

export const fetchSTT = async (params: {
  provider: TYPE_STT_PROVIDER;
  apiKey: string;
  audio: Blob;
}): Promise<string> => {
  try {
    const { provider, apiKey, audio } = params;
    if (!provider) {
      return `Provider not provided`;
    }
    let url = `${provider?.baseUrl ?? ""}${provider?.endpoint ?? ""}`;
    const queryParams = new URLSearchParams(provider?.request?.query as any);
    if ("authParam" in (provider ?? {}) && provider?.authParam) {
      queryParams.append(provider.authParam, apiKey);
    }
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    const headers = {
      ...provider?.request?.headers,
      ...getAuthHeaders(provider, apiKey),
    };
    let body: FormData | string | Blob | null = null;
    const audioFormat = provider?.request?.audioFormat ?? "";
    switch (provider?.request?.bodyType) {
      case "formdata":
        body = new FormData();
        if (provider?.request?.audioKey) {
          body.append(provider.request.audioKey, audio, `audio.${audioFormat}`);
        }
        for (const [key, value] of Object.entries(
          provider?.request?.fields ?? {}
        )) {
          body.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : value
          );
        }
        break;
      case "json":
        const jsonBody: any = { ...(provider?.request?.fields ?? {}) };
        if (provider?.request?.audioKey) {
          const base64 = await blobToBase64(audio);
          setByPath(jsonBody, provider.request.audioKey, base64);
        }
        body = JSON.stringify(jsonBody);
        break;
      case "raw":
        body = audio;
        if (!headers["Content-Type"]) {
          headers["Content-Type"] = `audio/${audioFormat}`;
        }
        break;
      default:
        return `Unsupported body type: ${
          provider?.request?.bodyType ?? "unknown"
        }`;
    }
    let response;
    try {
      response = await fetch(url, {
        method: provider?.method ?? "POST",
        headers: headers as any,
        body,
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
      return `API request failed: ${response.status} ${response.statusText}${
        errorText ? ` - ${errorText}` : ""
      }`;
    }
    let content: string = "";
    const fields = provider?.request?.fields as any;
    const isTextResponse = fields?.response_format === "text";
    if (isTextResponse) {
      try {
        content = await response.text();
      } catch (textError) {
        return `Failed to read text response: ${
          textError instanceof Error ? textError.message : "Unknown error"
        }`;
      }
    } else {
      let json;
      try {
        json = await response.json();
      } catch (parseError) {
        return `Failed to parse JSON response: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`;
      }
      if (provider?.id === "speechmatics-stt") {
        const jobId = getByPath(json, provider?.response?.contentPath ?? "");
        if (!jobId) {
          return "Job ID not found in response";
        }
        const transcriptUrl = `${
          provider?.baseUrl ?? ""
        }/v2/jobs/${jobId}/transcript?format=txt`;
        const transHeaders = getAuthHeaders(provider, apiKey);
        while (true) {
          let transResponse;
          try {
            transResponse = await fetch(transcriptUrl, {
              headers: transHeaders,
            });
          } catch (fetchError) {
            return `Network error during polling: ${
              fetchError instanceof Error ? fetchError.message : "Unknown error"
            }`;
          }
          if (!transResponse.ok) {
            let errText = "";
            try {
              errText = await transResponse.text();
            } catch {}
            if (transResponse.status === 404 || transResponse.status === 202) {
              await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
              continue;
            }
            return `Polling failed: ${transResponse.status} ${
              transResponse.statusText
            }${errText ? ` - ${errText}` : ""}`;
          }
          let transJson;
          try {
            transJson = await transResponse.json();
          } catch (parseError) {
            return `Failed to parse polling response: ${
              parseError instanceof Error ? parseError.message : "Unknown error"
            }`;
          }
          if (transJson?.job?.status === "done") {
            content = transJson.results
              .map((r: any) => r.alternatives[0].content)
              .join(" ");
            break;
          } else if (
            transJson?.job?.status === "rejected" ||
            transJson?.job?.status === "failed"
          ) {
            return `Transcription job failed: ${
              transJson?.job?.status ?? "unknown"
            }`;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } else {
        content = getByPath(json, provider?.response?.contentPath ?? "") || "";
      }
    }
    return content.trim();
  } catch (error) {
    return `Error in fetchSTT: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }
};
