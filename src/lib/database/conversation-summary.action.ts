import { getDatabase } from "./config";
import type { ConversationSummary } from "@/types";

interface DbSummary {
  id: string;
  conversation_id: string;
  content: string;
  generated_at: number;
  updated_at: number;
}

function mapRow(row: DbSummary): ConversationSummary {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    generatedAt: row.generated_at,
    updatedAt: row.updated_at,
  };
}

export async function getSummaryByConversationId(
  conversationId: string
): Promise<ConversationSummary | null> {
  const db = await getDatabase();
  const results = await db.select<DbSummary[]>(
    "SELECT * FROM conversation_summaries WHERE conversation_id = ?",
    [conversationId]
  );
  if (results.length === 0) return null;
  return mapRow(results[0]);
}

export async function saveSummary(
  conversationId: string,
  content: string
): Promise<ConversationSummary> {
  const db = await getDatabase();
  const now = Date.now();
  const existing = await getSummaryByConversationId(conversationId);

  if (existing) {
    await db.execute(
      "UPDATE conversation_summaries SET content = ?, updated_at = ? WHERE conversation_id = ?",
      [content, now, conversationId]
    );
    return { ...existing, content, updatedAt: now };
  } else {
    const id = `summary_${now}_${Math.random().toString(36).substring(2, 11)}`;
    await db.execute(
      "INSERT INTO conversation_summaries (id, conversation_id, content, generated_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [id, conversationId, content, now, now]
    );
    return { id, conversationId, content, generatedAt: now, updatedAt: now };
  }
}

export async function deleteSummary(conversationId: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "DELETE FROM conversation_summaries WHERE conversation_id = ?",
    [conversationId]
  );
}
