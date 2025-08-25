import { DEFAULT_SYSTEM_PROMPT } from "@/config";
import { getAuthHeaders, getByPath } from "./common.function";
import { TYPE_AI_PROVIDER } from "@/types";
import { fetch } from "@tauri-apps/plugin-http";

interface Message {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{
        type: string;
        text?: string;
        image_url?: { url: string };
        source?: any;
        inline_data?: any;
      }>;
}

export async function* fetchAIResponse(params: {
  provider: TYPE_AI_PROVIDER;
  apiKey: string;
  systemPrompt?: string;
  history?: Message[];
  userMessage: string;
  model?: string;
  stream?: boolean;
  imageBase64?: string;
}): AsyncIterable<string> {
  try {
    const {
      provider,
      apiKey,
      systemPrompt,
      history = [],
      userMessage,
      model = "",
      stream = false,
      imageBase64,
    } = params;
    if (!provider) {
      throw new Error(`Provider not provided`);
    }
    if (imageBase64 && !provider?.input?.image) {
      throw new Error(
        `Provider ${provider?.id ?? "unknown"} does not support image input`
      );
    }
    const effectiveModel = model || provider?.defaultModel;
    if (!effectiveModel) {
      throw new Error("No model specified and no default model available");
    }
    let messages: Message[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages = [...messages, ...history];
    if (!userMessage) {
      throw new Error("User message is required");
    }
    messages.push({ role: "user", content: userMessage });
    let url = `${provider?.baseUrl ?? ""}${
      provider?.chatEndpoint?.replace(/\${model}/g, effectiveModel) ?? ""
    }`;
    const queryParams = new URLSearchParams();
    if ("authParam" in (provider ?? {}) && provider?.authParam) {
      queryParams.append(provider.authParam, apiKey);
    }
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    const headers = {
      ...getAuthHeaders(provider, apiKey),
      "Content-Type": "application/json",
    };
    let bodyObj: any = {};
    const format = provider?.compat || provider?.id || "openai";
    switch (format) {
      case "claude":
        let systemMessage = "";

        // extract system message from messages array and set it directly
        if (messages && Array.isArray(messages)) {
          const systemMessageIndex = messages.findIndex(
            (msg: any) => msg.role === "system"
          );

          if (systemMessageIndex !== -1) {
            systemMessage =
              typeof messages[systemMessageIndex].content === "string"
                ? messages[systemMessageIndex].content
                : "";
            // remove system message from messages array
            messages.splice(systemMessageIndex, 1);
          }
        }

        bodyObj = {
          model: effectiveModel,
          messages: messages,
          system: systemMessage || DEFAULT_SYSTEM_PROMPT,
          stream: stream && !!provider?.streaming,
          max_tokens: 4096, // Required for Claude
        };

        (headers as any)["anthropic-version"] = "2023-06-01";
        (headers as any)["anthropic-dangerous-direct-browser-access"] = "true";

        if (imageBase64) {
          const lastMsgIndex = bodyObj.messages.length - 1;
          const lastMsg = bodyObj.messages[lastMsgIndex];
          if (lastMsg && lastMsg.role === "user") {
            const textContent =
              typeof lastMsg.content === "string" ? lastMsg.content : "";
            lastMsg.content = [
              { type: "text", text: textContent },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ];
          }
        }
        break;
      case "gemini":
        const mappedContents = messages.map((m) => ({
          role: m.role === "assistant" ? "model" : m.role,
          parts:
            typeof m.content === "string"
              ? [{ text: m.content }]
              : m.content.map((c: any) =>
                  c.text ? { text: c.text } : c.inline_data || c
                ),
        }));
        bodyObj = {
          contents: mappedContents,
        };
        if (!stream) {
          url = url.replace(
            ":streamGenerateContent?alt=sse",
            ":generateContent"
          );
        }
        if (imageBase64) {
          const lastIndex = bodyObj.contents.length - 1;
          const last = bodyObj.contents[lastIndex];
          if (last && last.role === "user") {
            const textParts = last.parts;
            last.parts = [
              ...textParts,
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
            ];
          }
        }
        break;
      case "cohere":
        const chatHistory = messages.slice(0, -1).map((m) => ({
          role: m.role.toUpperCase(),
          message: typeof m.content === "string" ? m.content : "",
        }));
        const messageContent = messages[messages.length - 1]
          ? typeof messages[messages.length - 1].content === "string"
            ? messages[messages.length - 1].content
            : ""
          : "";
        bodyObj = {
          model: effectiveModel,
          message: messageContent,
          chat_history: chatHistory,
          stream: stream && !!provider?.streaming,
        };
        break;
      default: // 'openai' compatible, including custom
        bodyObj = {
          model: effectiveModel,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: stream && !!provider?.streaming,
        };
        if (imageBase64) {
          const lastMsgIndex = bodyObj.messages.length - 1;
          const lastMsg = bodyObj.messages[lastMsgIndex];
          if (lastMsg && lastMsg.role === "user") {
            const textContent =
              typeof lastMsg.content === "string" ? lastMsg.content : "";
            lastMsg.content = [
              { type: "text", text: textContent },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ];
          }
        }
        break;
    }
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyObj),
      });
    } catch (fetchError) {
      yield `Network error during API request: ${
        fetchError instanceof Error ? fetchError.message : "Unknown error"
      }`;
      return;
    }
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {}
      yield `API request failed: ${response.status} ${response.statusText}${
        errorText ? ` - ${errorText}` : ""
      }`;
      return;
    }
    if (!stream || !provider?.streaming) {
      let json;
      try {
        json = await response.json();
      } catch (parseError) {
        yield `Failed to parse non-streaming response: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`;
        return;
      }
      const content =
        getByPath(json, provider?.response?.contentPath ?? "") || "";
      yield content;
      return;
    }
    if (!response.body) {
      yield "Streaming not supported or response body missing";
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      let readResult;
      try {
        readResult = await reader.read();
      } catch (readError) {
        yield `Error reading stream: ${
          readError instanceof Error ? readError.message : "Unknown error"
        }`;
        return;
      }
      const { done, value } = readResult;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let lines: string[];
      switch (format) {
        case "openai":
        case "grok":
        case "mistral":
        case "groq":
        case "perplexity":
          lines = buffer.split("data: ");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "[DONE]") continue;
            try {
              const parsed = JSON.parse(trimmed);
              const delta = getByPath(parsed, "choices[0].delta.content");
              if (delta) yield delta;
            } catch (e) {
              yield `Error parsing stream chunk: ${
                e instanceof Error ? e.message : "Unknown error"
              }`;
              return;
            }
          }
          break;
        case "claude":
          lines = buffer.split("event: ");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const eventLines = line.split("\n");
            const eventType = eventLines[0]?.trim();
            if (eventType === "content_block_delta") {
              const dataLine = eventLines
                .find((l) => l.startsWith("data: "))
                ?.replace("data: ", "")
                .trim();
              if (dataLine) {
                try {
                  const parsed = JSON.parse(dataLine);
                  const text = parsed.delta?.text;
                  if (text) yield text;
                } catch (e) {
                  yield `Error parsing stream chunk: ${
                    e instanceof Error ? e.message : "Unknown error"
                  }`;
                  return;
                }
              }
            }
          }
          break;
        case "gemini":
          lines = buffer.split("\n\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              const text = getByPath(
                parsed,
                provider?.response?.contentPath ?? ""
              );
              if (text) yield text;
            } catch (e) {
              yield `Error parsing stream chunk: ${
                e instanceof Error ? e.message : "Unknown error"
              }`;
              return;
            }
          }
          break;
        case "cohere":
          lines = buffer.split("data: ");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              const text = parsed.text;
              if (text) yield text;
            } catch (e) {
              yield `Error parsing stream chunk: ${
                e instanceof Error ? e.message : "Unknown error"
              }`;
              return;
            }
          }
          break;
        default:
          buffer = "";
          break;
      }
    }
  } catch (error) {
    yield `Error in fetchAIResponse: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    return;
  }
}
