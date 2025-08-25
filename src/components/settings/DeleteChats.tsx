import { Loader2, TrashIcon } from "lucide-react";
import { Button, Header } from "@/components";
import { UseSettingsReturn } from "@/types";
import { useState } from "react";

export const DeleteChats = ({
  handleDeleteAllChatsConfirm,
  showDeleteConfirmDialog,
  setShowDeleteConfirmDialog,
}: UseSettingsReturn) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAllChats = () => {
    setIsDeleting(true);
    handleDeleteAllChatsConfirm();
    setTimeout(() => {
      setIsDeleting(false);
    }, 2000);
  };

  return (
    <div className="space-y-3">
      <Header
        title="Delete Chat History"
        description="Permanently delete all your chat conversations and history. This action cannot be undone and will remove all stored conversations from your local storage."
        isMainTitle
      />

      <div className="space-y-2">
        {isDeleting && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700 font-medium">
              ✅ All chat history has been successfully deleted.
            </p>
          </div>
        )}

        <Button
          onClick={() => setShowDeleteConfirmDialog(true)}
          disabled={isDeleting}
          variant="destructive"
          className="w-full h-11"
          title="Delete all chat history"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete All Chats
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              Delete All Chat History
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete all chat history? This action
              cannot be undone and will permanently remove all stored
              conversations.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteAllChats}>
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
