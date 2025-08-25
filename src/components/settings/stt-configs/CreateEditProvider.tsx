import {
  Card,
  Label,
  Button,
  Header,
  Selection,
  TextInput,
  Switch,
} from "@/components";
import { PlusIcon, SaveIcon, SparklesIcon, XIcon } from "lucide-react";
import { useCustomSttProviders } from "@/hooks";
import { AUTH_TYPES } from "@/lib";

interface CreateEditProviderProps {
  customProviderHook?: ReturnType<typeof useCustomSttProviders>;
}

export const CreateEditProvider = ({
  customProviderHook,
}: CreateEditProviderProps) => {
  // Use the provided hook instance or create a new one
  const hookInstance = customProviderHook || useCustomSttProviders();

  const {
    showForm,
    setShowForm,
    editingProvider,
    setEditingProvider,
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

  // Key-value pair management functions
  const addKeyValuePair = (field: "headers" | "fields" | "query") => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      request: {
        ...prev.request,
        [field]: {
          ...prev.request[field],
          [""]: "",
        },
      },
    }));
  };

  const removeKeyValuePair = (
    field: "headers" | "fields" | "query",
    key: string
  ) => {
    setFormData((prev: typeof formData) => {
      const newField = { ...prev.request[field] };
      delete newField[key];
      return {
        ...prev,
        request: {
          ...prev.request,
          [field]: newField,
        },
      };
    });
  };

  const updateKeyValuePair = (
    field: "headers" | "fields" | "query",
    oldKey: string,
    newKey: string,
    newValue: string
  ) => {
    setFormData((prev: typeof formData) => {
      const newField = { ...prev.request[field] };
      delete newField[oldKey];
      newField[newKey] = newValue;
      return {
        ...prev,
        request: {
          ...prev.request,
          [field]: newField,
        },
      };
    });
  };

  const KeyValueEditor = ({
    field,
    title,
  }: {
    field: "headers" | "fields" | "query";
    title: string;
  }) => {
    const entries = Object.entries(formData.request[field]);

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{title}</Label>
        <div className="space-y-2">
          {entries.map(([key, value], index) => (
            <div
              key={`${field}-entry-${index}`}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Key"
                defaultValue={key}
                onBlur={(e) => {
                  const newKey = e.target.value.trim();
                  if (newKey !== key && newKey !== "") {
                    updateKeyValuePair(field, key, newKey, value);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="text"
                placeholder="Value"
                defaultValue={value}
                onBlur={(e) => {
                  const newValue = e.target.value;
                  if (newValue !== value) {
                    updateKeyValuePair(field, key, key, newValue);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:ring-2 focus:ring-primary/20"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeKeyValuePair(field, key)}
                className="p-2 h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addKeyValuePair(field)}
          className="w-full"
        >
          Add {title.slice(0, -1).toLowerCase()}
        </Button>
      </div>
    );
  };

  return (
    <>
      {!showForm ? (
        <Button
          onClick={() => {
            setShowForm(true);
            setErrors({});
            // Clear editing state and reset form data
            setEditingProvider(null);
            setFormData({
              id: "",
              name: "",
              baseUrl: "",
              endpoint: "",
              method: "POST",
              authType: "bearer",
              authParam: "",
              request: {
                bodyType: "formdata",
                audioFormat: "wav",
                audioKey: "file",
                fields: {},
                query: {},
                headers: {},
              },
              response: {
                contentPath: "",
              },
              streaming: false,
              isCustom: true,
            });
          }}
          variant="outline"
          className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Custom Provider
        </Button>
      ) : (
        <Card className="p-4 border border-input/50 space-y-4">
          <div className="flex justify-between items-center">
            <Header
              title={
                editingProvider
                  ? `Edit ${formData.name || "Provider"}`
                  : "Add Custom STT Provider"
              }
              description="Create a custom speech-to-text provider to use with your AI-powered applications."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAutoFill("openai-whisper")}
              className="flex items-center gap-2"
            >
              <SparklesIcon className="h-4 w-4" />
              Auto-fill with OpenAI Whisper
            </Button>
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium">
                {errors.general}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Configuration */}
            <div className="space-y-3">
              <TextInput
                label="Provider Name *"
                placeholder="My Custom STT Provider"
                value={formData.name}
                onChange={(value) =>
                  setFormData((prev: typeof formData) => ({
                    ...prev,
                    name: value,
                  }))
                }
                error={errors.name}
                notes="The name of your custom STT provider."
              />

              <TextInput
                label="Base URL *"
                placeholder="https://api.example.com"
                value={formData.baseUrl}
                onChange={(value) =>
                  setFormData((prev: typeof formData) => ({
                    ...prev,
                    baseUrl: value,
                  }))
                }
                error={errors.baseUrl}
                notes="The base URL of your custom STT provider."
              />

              <TextInput
                label="Endpoint *"
                placeholder="/v1/audio/transcriptions"
                value={formData.endpoint}
                onChange={(value) =>
                  setFormData((prev: typeof formData) => ({
                    ...prev,
                    endpoint: value,
                  }))
                }
                error={errors.endpoint}
                notes="The endpoint path for the STT service."
              />

              <div className="space-y-1">
                <Label className="text-xs font-medium">Auth Type *</Label>
                <Selection
                  selected={formData.authType}
                  onChange={(value) =>
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      authType: value,
                    }))
                  }
                  options={AUTH_TYPES.map((type) => ({
                    label: type,
                    value: type,
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  The authentication method for the API request.
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

              <div className="space-y-1">
                <Label className="text-xs font-medium">Body Type</Label>
                <Selection
                  selected={formData.request.bodyType}
                  onChange={(value) =>
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      request: { ...prev.request, bodyType: value },
                    }))
                  }
                  options={[
                    { label: "Form Data", value: "formdata" },
                    { label: "JSON", value: "json" },
                    { label: "Raw", value: "raw" },
                  ]}
                />
                <p className="text-xs text-muted-foreground">
                  The format of the request body.
                </p>
              </div>

              <TextInput
                label="Audio Format"
                placeholder="wav"
                value={formData.request.audioFormat}
                onChange={(value) =>
                  setFormData((prev: typeof formData) => ({
                    ...prev,
                    request: { ...prev.request, audioFormat: value },
                  }))
                }
                notes="The audio format expected by the provider (e.g., wav, mp3)."
              />

              <TextInput
                label="Audio Key"
                placeholder="file"
                value={formData.request.audioKey || ""}
                onChange={(value) =>
                  setFormData((prev: typeof formData) => ({
                    ...prev,
                    request: { ...prev.request, audioKey: value },
                  }))
                }
                notes="The key name for the audio file in the request."
              />

              <div className="flex justify-between items-center space-x-2">
                <Header
                  title="Streaming"
                  description="Whether the provider supports streaming responses."
                />
                <Switch
                  checked={formData.streaming}
                  onCheckedChange={(checked) =>
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      streaming: checked,
                    }))
                  }
                />
              </div>
            </div>

            {/* Request Configuration */}
            <div className="space-y-4">
              <Header
                title="Request Configuration"
                description="Configure how requests are structured for the STT provider."
              />

              <KeyValueEditor field="headers" title="Headers" />

              <KeyValueEditor field="fields" title="Form Fields" />

              <KeyValueEditor field="query" title="Query Parameters" />

              <div className="space-y-3">
                <Header
                  title="Response Configuration"
                  description="Configure how responses are handled from the STT provider."
                />

                <TextInput
                  label="Content Path *"
                  placeholder="text"
                  value={formData.response.contentPath}
                  onChange={(value) =>
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      response: { ...prev.response, contentPath: value },
                    }))
                  }
                  error={errors["response.contentPath"]}
                  notes="The path to extract content from the API response. Examples: text, results[0].alternatives[0].transcript"
                />
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
                !formData.endpoint.trim() ||
                !formData.response.contentPath.trim()
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
