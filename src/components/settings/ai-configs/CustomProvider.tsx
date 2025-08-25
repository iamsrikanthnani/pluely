import { UseSettingsReturn } from "@/types";
import { Card, Button, Header } from "@/components";
import { EditIcon, TrashIcon } from "lucide-react";
import { CreateEditProvider } from "./CreateEditProvider";
import { useCustomAiProviders } from "@/hooks";

export const CustomProviders = ({ allAiProviders }: UseSettingsReturn) => {
  const customProviderHook = useCustomAiProviders();
  const {
    handleEdit,
    handleDelete,
    deleteConfirm,
    confirmDelete,
    cancelDelete,
  } = customProviderHook;

  return (
    <div className="space-y-2">
      <Header
        title="Custom Providers"
        description="Create and manage custom AI providers. Configure endpoints, authentication, and response formats."
      />

      <div className="space-y-2">
        {/* Existing Custom Providers */}
        {allAiProviders.filter((provider) => provider.isCustom).length > 0 && (
          <div className="space-y-2">
            {allAiProviders
              .filter((provider) => provider.isCustom)
              .map((provider) => (
                <Card key={provider.id} className="p-3 border border-input/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{provider.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {provider.baseUrl}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(provider.id)}
                        title="Edit Provider"
                      >
                        <EditIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(provider.id)}
                        title="Delete Provider"
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
      <CreateEditProvider customProviderHook={customProviderHook} />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              Delete Custom Provider
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this custom provider? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
