import { fetchAIResponse } from "./ai-response.function";
import { ChatConversation, Message, TYPE_PROVIDER } from "@/types";

const SUMMARY_SYSTEM_PROMPT = `You are a meeting summarizer. Given a conversation transcript, produce a structured summary in markdown with these sections:

## Overview
A 2-3 sentence overview of the conversation.

## Key Points
- Bullet points of the most important topics discussed.

## Action Items
- Any tasks, decisions, or follow-ups mentioned.

## Participants
Brief note on who was involved and their roles if apparent.

Be concise and factual. Use the conversation content only.`;

export async function* generateConversationSummary(params: {
  conversation: ChatConversation;
  provider: TYPE_PROVIDER | undefined;
  selectedProvider: {
    provider: string;
    variables: Record<string, string>;
  };
  signal?: AbortSignal;
}): AsyncIterable<string> {
  const { conversation, provider, selectedProvider, signal } = params;

  const transcript = conversation.messages
    .map((msg) => {
      const speaker = msg.role === "user" ? "Speaker" : "AI Assistant";
      return `${speaker}: ${msg.content}`;
    })
    .join("\n\n");

  yield* fetchAIResponse({
    provider,
    selectedProvider,
    systemPrompt: SUMMARY_SYSTEM_PROMPT,
    history: [] as Message[],
    userMessage: `Summarize this conversation:\n\n${transcript}`,
    imagesBase64: [],
    signal,
  });
}
