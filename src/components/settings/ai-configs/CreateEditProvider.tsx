import {
  Card,
  Label,
  Button,
  Header,
  Selection,
  TextInput,
  Switch,
} from "@/components";
import { PlusIcon, SaveIcon, SparklesIcon } from "lucide-react";
import { useCustomAiProviders } from "@/hooks";
import { AUTH_TYPES } from "@/lib";

interface CreateEditProviderProps {
  customProviderHook?: ReturnType<typeof useCustomAiProviders>;
}

export const CreateEditProvider = ({
  customProviderHook,
}: CreateEditProviderProps) => {
  // Use the provided hook instance or create a new one
  const hookInstance = customProviderHook || useCustomAiProviders();

  const {
    showForm,
    setShowForm,
    editingProvider,
    formData,
    setFormData,
    errors,
    handleSave,
    setErrors,
    handleAutoFill,
    customHeaderName,
    setCustomHeaderName,
    queryParamName,
    setQueryParamName,
  } = hookInstance;

  return (
    <>
      {!showForm ? (
        <Button
          onClick={() => {
            setShowForm(true);
            setErrors({});
          }}
          variant="outline"
          className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Custom Provider
        </Button>
      ) : (
        <Card className="p-4 border border-input/50 ">
          <div className="flex justify-between items-center">
            <Header
              title={
                editingProvider
                  ? `Edit ${formData.name || "Provider"}`
                  : "Add Custom Provider"
              }
              description="Create a custom AI provider to use with your AI-powered applications."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAutoFill("openai")}
              className="flex items-center gap-2"
            >
              <SparklesIcon className="h-4 w-4" />
              Auto-fill with OpenAI
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Configuration */}
            <div className="space-y-3">
              <TextInput
                label="Provider Name *"
                placeholder="My Custom Provider"
                value={formData.name}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                error={errors.name}
                notes="The name of your custom AI provider."
              />

              <TextInput
                label="Base URL *"
                placeholder="https://api.example.com"
                value={formData.baseUrl}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, baseUrl: value }))
                }
                error={errors.baseUrl}
                notes="The base URL of your custom AI provider."
              />

              <TextInput
                label="Chat Endpoint *"
                placeholder="/v1/chat/completions"
                value={formData.chatEndpoint}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, chatEndpoint: value }))
                }
                error={errors.chatEndpoint}
                notes="The chat endpoint of your custom AI provider."
              />

              <div className="space-y-1">
                <Label className="text-xs font-medium">Auth Type *</Label>
                <Selection
                  selected={formData.authType}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, authType: value }))
                  }
                  options={AUTH_TYPES.map((type) => ({
                    label: type,
                    value: type,
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  header is used to authenticate the API request.
                </p>
              </div>

              {formData.authType === "custom" && (
                <TextInput
                  label="Custom Header Name"
                  placeholder="x-api-key"
                  value={customHeaderName}
                  onChange={setCustomHeaderName}
                  error={errors.customHeaderName}
                  notes="The custom header name for the API key. This is used to authenticate the API request."
                />
              )}

              {formData.authType === "query" && (
                <TextInput
                  label="Query Parameter Name"
                  placeholder="api_key"
                  value={queryParamName}
                  onChange={setQueryParamName}
                  error={errors.queryParamName}
                  notes="The query parameter name for the API key. This is used to authenticate the API request."
                />
              )}

              <TextInput
                label="Default Model"
                placeholder="gpt-4"
                value={formData.defaultModel}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, defaultModel: value }))
                }
                error={errors.defaultModel}
                notes="The default model to use for the AI provider."
              />

              <div className="flex justify-between items-center space-x-2">
                <Header
                  title="Streaming"
                  description="streaming is used to stream the response from the AI provider."
                />
                <Switch
                  checked={formData.streaming}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      streaming: checked,
                    }))
                  }
                />
              </div>
            </div>

            {/* Response Configuration */}
            <div className="space-y-3">
              <Header
                title="Response Configuration"
                description="Configure how responses are handled from the AI provider."
              />

              <TextInput
                label="Content Path"
                placeholder="choices[0].message.content"
                value={(formData as any).response?.contentPath || ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    response: { ...(prev as any).response, contentPath: value },
                  }))
                }
                error={(errors as any).response?.contentPath}
                notes="The path to extract content from the API response. Examples: choices[0].message.content, text, candidates[0].content.parts[0].text"
              />

              <TextInput
                label="Usage Path"
                placeholder="usage"
                value={(formData as any).response?.usagePath || ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    response: { ...(prev as any).response, usagePath: value },
                  }))
                }
                error={(errors as any).response?.usagePath}
                notes="The path to extract usage information from the API response. Examples: usage, usageMetadata, meta.usage"
              />
            </div>
          </div>

          {/* Input Configuration */}
          <div className="space-y-4">
            <Header
              title="Input Configuration"
              description="Configure how input data is structured for the AI provider."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text Input Configuration */}
              <div className="space-y-3">
                <Header
                  title="Text Input"
                  description="Configure text message structure."
                />

                <TextInput
                  label="Text Messages Format"
                  placeholder='[{"role": "user", "content": "Hello"}]'
                  value={
                    JSON.stringify((formData as any).input?.text?.messages) ||
                    "[]"
                  }
                  onChange={(value) => {
                    try {
                      const parsed = JSON.parse(value || "[]");
                      setFormData((prev) => ({
                        ...prev,
                        input: {
                          ...(prev as any).input,
                          text: {
                            ...(prev as any).input?.text,
                            messages: Array.isArray(parsed) ? parsed : [],
                          },
                        },
                      }));
                    } catch (e) {
                      // Invalid JSON, keep current value
                    }
                  }}
                  error={(errors as any).input?.text?.messages}
                  notes={`JSON array of message object for user role and content fields. Example: [{"role": "user", "content": "Hello"}]`}
                />
              </div>

              {/* Image Input Configuration */}
              <div className="space-y-3">
                <Header
                  title="Image Input"
                  description="Configure image input structure."
                />

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Image Type</Label>
                  <Selection
                    selected={(formData as any).input?.image?.type || ""}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        input: {
                          ...(prev as any).input,
                          image: (prev as any).input?.image
                            ? {
                                ...(prev as any).input.image,
                                type: value,
                              }
                            : {
                                type: value,
                                messages: [],
                              },
                        },
                      }))
                    }
                    options={[
                      { label: "base64", value: "base64" },
                      { label: "url", value: "url" },
                      { label: "url_or_base64", value: "url_or_base64" },
                      { label: "none", value: "none" },
                    ]}
                  />
                  <p className="text-xs text-muted-foreground">
                    The type of image input supported by the provider.
                  </p>
                </div>

                {formData.input?.image?.type !== "none" && (
                  <TextInput
                    label="Image Messages Format"
                    placeholder='[{"role": "user", "content": []}]'
                    value={
                      (formData as any).input?.image?.messages
                        ? JSON.stringify((formData as any).input.image.messages)
                        : "[]"
                    }
                    onChange={(value) => {
                      try {
                        const parsed = JSON.parse(value || "[]");
                        setFormData((prev) => ({
                          ...prev,
                          input: {
                            ...(prev as any).input,
                            image: (prev as any).input?.image
                              ? {
                                  ...(prev as any).input.image,
                                  messages: Array.isArray(parsed) ? parsed : [],
                                }
                              : {
                                  type: "",
                                  messages: Array.isArray(parsed) ? parsed : [],
                                },
                          },
                        }));
                      } catch (e) {
                        // Invalid JSON, keep current value
                      }
                    }}
                    error={(errors as any).input?.image?.messages}
                    notes="JSON array of image message objects with role and content fields. Examples: OpenAI format, Claude format, etc."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 -mt-3">
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.name.trim() ||
                !formData.baseUrl.trim() ||
                !formData.chatEndpoint.trim()
              }
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {editingProvider ? "Update" : "Save"} Provider
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
