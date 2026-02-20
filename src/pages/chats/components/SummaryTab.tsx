import { useState, useEffect, useRef } from "react";
import { Button, Card, Empty, Markdown, Textarea } from "@/components";
import { ChatConversation } from "@/types";
import { SparklesIcon, PencilIcon, RefreshCwIcon, Loader2 } from "lucide-react";
import { useApp } from "@/contexts";
import { getSummaryByConversationId, saveSummary } from "@/lib";
import { generateConversationSummary } from "@/lib/functions/generate-summary.function";

interface SummaryTabProps {
  conversationId: string;
  messages: ChatConversation | null;
}

export const SummaryTab = ({ conversationId, messages }: SummaryTabProps) => {
  const { selectedAIProvider, allAiProviders } = useApp();

  const [summary, setSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [hasExistingSummary, setHasExistingSummary] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      const existing = await getSummaryByConversationId(conversationId);
      if (existing) {
        setSummary(existing.content);
        setHasExistingSummary(true);
      }
    };
    loadSummary();
  }, [conversationId]);

  const handleGenerate = async () => {
    if (!messages || messages.messages.length === 0) return;

    const provider = allAiProviders.find(
      (p) => p.id === selectedAIProvider.provider
    );

    if (!provider && !selectedAIProvider.provider) {
      setSummary("Please configure an AI provider in Settings first.");
      return;
    }

    setIsGenerating(true);
    setSummary("");

    abortControllerRef.current = new AbortController();
    let fullContent = "";

    try {
      for await (const chunk of generateConversationSummary({
        conversation: messages,
        provider,
        selectedProvider: selectedAIProvider,
        signal: abortControllerRef.current.signal,
      })) {
        fullContent += chunk;
        setSummary(fullContent);
      }

      await saveSummary(conversationId, fullContent);
      setHasExistingSummary(true);
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        setSummary(
          fullContent || "Failed to generate summary. Please try again."
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSave = async () => {
    await saveSummary(conversationId, editContent);
    setSummary(editContent);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditContent(summary);
    setIsEditing(true);
  };

  if (!hasExistingSummary && !isGenerating && !summary) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Empty
          isLoading={false}
          icon={SparklesIcon}
          title="No summary yet"
          description="Generate an AI summary of this conversation"
        />
        <Button
          onClick={handleGenerate}
          disabled={!messages || messages.messages.length === 0}
          className="mt-2"
        >
          <SparklesIcon className="size-4 mr-2" />
          Generate Summary
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex gap-2">
        {!isEditing && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="size-3 mr-1 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-3 mr-1" />
              )}
              {isGenerating ? "Generating..." : "Regenerate"}
            </Button>
            {hasExistingSummary && (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <PencilIcon className="size-3 mr-1" />
                Edit
              </Button>
            )}
          </>
        )}
        {isEditing && (
          <>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={15}
          className="font-mono text-sm"
        />
      ) : (
        <Card className="p-4 shadow-none !bg-muted/30">
          <Markdown>{summary}</Markdown>
        </Card>
      )}
    </div>
  );
};
