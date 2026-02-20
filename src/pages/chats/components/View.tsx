import {
  Button,
  Textarea,
  GetLicense,
} from "@/components";
import { getConversationById } from "@/lib";
import { ChatConversation } from "@/types";
import {
  Download,
  MessageCircleReplyIcon,
  Trash2,
  SendIcon,
  Check,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/layouts";
import { useHistory, useChatCompletion } from "@/hooks";
import { useApp } from "@/contexts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DeleteConfirmationDialog,
  ChatAudio,
  ChatScreenshot,
  ChatFiles,
  AudioRecorder,
  UsageTab,
  TranscriptTab,
  SummaryTab,
} from ".";

const View = () => {
  const { conversationId } = useParams();
  const { hasActiveLicense, supportsImages } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatConversation | null>(null);
  const [activeTab, setActiveTab] = useState<string>("summary");

  const {
    handleDeleteConfirm,
    confirmDelete,
    cancelDelete,
    deleteConfirm,
    handleAttachToOverlay,
    handleDownload,
    isDownloaded,
    isAttached,
  } = useHistory();

  const completion = useChatCompletion(
    conversationId as string,
    messages,
    setMessages
  );

  useEffect(() => {
    const getMessages = async () => {
      const conversation = await getConversationById(conversationId as string);
      setMessages(conversation || null);
    };
    getMessages();
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages load (only on usage tab)
    if (messages?.messages.length && activeTab === "usage") {
      setTimeout(() => {
        completion.messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages?.messages.length, activeTab]);

  const handleDelete = async () => {
    await confirmDelete();
    navigate(-1);
  };

  return (
    <PageLayout
      isMainTitle={false}
      allowBackButton={true}
      title={messages?.title || ""}
      description={`${messages?.messages.length || 0} messages in this conversation`}
      rightSlot={
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            title="Open this conversation in overlay"
            className="text-[10px] lg:text-sm h-6 lg:h-8"
            onClick={() =>
              conversationId && handleAttachToOverlay(conversationId)
            }
            disabled={isAttached}
          >
            {isAttached ? (
              <>
                <Check className="size-3 lg:size-4 text-green-600" />
                Attached
              </>
            ) : (
              <>
                Open in Overlay{" "}
                <MessageCircleReplyIcon className="size-3 lg:size-4" />
              </>
            )}
          </Button>
          <Button
            variant={"outline"}
            title="Download conversation as markdown"
            className="text-[10px] lg:text-sm h-6 lg:h-8"
            onClick={(e) => handleDownload(messages, e)}
            disabled={isDownloaded}
          >
            {isDownloaded ? (
              <>
                <Check className="size-3 lg:size-4 text-green-600" />
                Downloaded
              </>
            ) : (
              <>
                Download <Download className="size-3 lg:size-4" />
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            title="Delete conversation"
            onClick={() =>
              conversationId && handleDeleteConfirm(conversationId)
            }
            className="text-[10px] lg:text-sm h-6 lg:h-8"
          >
            Delete <Trash2 className="size-3 lg:size-4" />
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="px-2 pt-1">
          <TabsList className="w-full">
            <TabsTrigger value="summary" className="flex-1">
              Summary
            </TabsTrigger>
            <TabsTrigger value="transcript" className="flex-1">
              Transcript
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex-1">
              Usage
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="summary" className="px-2">
          <SummaryTab
            conversationId={conversationId as string}
            messages={messages}
          />
        </TabsContent>

        <TabsContent value="transcript" className="px-2">
          <TranscriptTab messages={messages} />
        </TabsContent>

        <TabsContent value="usage">
          <UsageTab
            messages={messages}
            messagesEndRef={completion.messagesEndRef}
          />
        </TabsContent>
      </Tabs>

      {/* Sticky Footer Input - only on Usage tab */}
      {activeTab === "usage" && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/10 backdrop-blur">
          {completion.error && (
            <div className="px-4 pt-3 pb-0">
              <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                <strong>Error:</strong> {completion.error}
              </div>
            </div>
          )}

          <div className="relative flex items-start gap-2 p-4">
            {!hasActiveLicense && (
              <div className="select-none p-5 z-100 bg-primary/5 border border-primary/20 rounded-xl absolute top-4 left-4 right-4">
                <div className="max-w-sm mx-auto">
                  <p className="text-sm font-medium text-center">
                    You need an active license to use this feature.
                  </p>

                  <GetLicense
                    buttonText="Get License"
                    buttonClassName="w-full mt-2"
                  />
                </div>
              </div>
            )}
            <div className="flex-1 relative">
              {completion.isRecording ? (
                <AudioRecorder
                  onTranscriptionComplete={(text) => {
                    completion.setIsRecording(false);
                    completion.submit(text);
                  }}
                  onCancel={() => completion.setIsRecording(false)}
                />
              ) : (
                <>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 z-10">
                    <ChatFiles
                      attachedFiles={completion.attachedFiles}
                      handleFileSelect={completion.handleFileSelect}
                      removeFile={completion.removeFile}
                      onRemoveAllFiles={completion.onRemoveAllFiles}
                      isLoading={completion.isLoading}
                      isFilesPopoverOpen={completion.isFilesPopoverOpen}
                      setIsFilesPopoverOpen={completion.setIsFilesPopoverOpen}
                      disabled={!hasActiveLicense || !supportsImages}
                    />
                    <ChatAudio
                      micOpen={completion.micOpen}
                      setMicOpen={completion.setMicOpen}
                      isRecording={completion.isRecording}
                      setIsRecording={completion.setIsRecording}
                      disabled={!hasActiveLicense}
                    />
                    <ChatScreenshot
                      screenshotConfiguration={completion.screenshotConfiguration}
                      attachedFiles={completion.attachedFiles}
                      isLoading={completion.isLoading}
                      captureScreenshot={completion.captureScreenshot}
                      isScreenshotLoading={completion.isScreenshotLoading}
                      disabled={!hasActiveLicense || !supportsImages}
                    />
                  </div>

                  <Textarea
                    ref={completion.inputRef}
                    placeholder="Type a message..."
                    className="pr-12 pl-2 resize-none pb-12 pt-3"
                    rows={2}
                    value={completion.input}
                    onChange={(e) => completion.setInput(e.target.value)}
                    onKeyDown={completion.handleKeyPress}
                    onPaste={completion.handlePaste}
                    disabled={completion.isLoading || !hasActiveLicense}
                  />
                  <Button
                    size="icon"
                    className="size-7 lg:size-9 rounded-lg lg:rounded-xl absolute right-2 bottom-2"
                    title="Send message"
                    onClick={() => completion.submit()}
                    disabled={
                      completion.isLoading ||
                      !completion.input.trim() ||
                      !hasActiveLicense
                    }
                  >
                    {completion.isLoading ? (
                      <Loader2 className="size-3 lg:size-4 animate-spin" />
                    ) : (
                      <SendIcon className="size-3 lg:size-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        deleteConfirm={deleteConfirm}
        cancelDelete={cancelDelete}
        confirmDelete={handleDelete}
      />
    </PageLayout>
  );
};

export default View;
