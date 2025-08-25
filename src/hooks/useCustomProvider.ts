import { useState } from "react";
import { TYPE_AI_PROVIDER } from "@/types";
import {
  addCustomAiProvider,
  updateCustomAiProvider,
  removeCustomAiProvider,
  getCustomAiProviders,
} from "@/lib";
import { AI_PROVIDERS } from "@/config";
import { AUTH_TYPES } from "@/lib/functions/common.function";
import { useApp } from "@/contexts";

export function useCustomAiProviders() {
  const { loadData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<TYPE_AI_PROVIDER>({
    name: "",
    baseUrl: "",
    chatEndpoint: "",
    authType: "bearer",
    authParam: "",
    defaultModel: "",
    streaming: false,
    response: {
      contentPath: "",
      usagePath: "",
    },
    input: {
      text: {
        messages: [],
      },
      image: {
        type: "",
        messages: [],
      },
    },
    id: "",
    isCustom: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Local state for custom header and query parameter names
  const [customHeaderName, setCustomHeaderName] = useState("");
  const [queryParamName, setQueryParamName] = useState("");

  // Helper function to determine auth type and set local states
  const setAuthTypeFromProvider = (provider: TYPE_AI_PROVIDER) => {
    const authType = provider.authType;
    const authParam = provider.authParam || "";

    // Check if it's a standard auth type
    if (AUTH_TYPES.includes(authType as any)) {
      setFormData((prev) => ({ ...prev, authType, authParam }));
      setCustomHeaderName("");
      setQueryParamName("");
    } else {
      // It's a custom header or query parameter
      if (authParam) {
        // If authParam exists, it's a query parameter
        setFormData((prev) => ({ ...prev, authType: "query", authParam }));
        setQueryParamName(authType); // authType contains the query param name
        setCustomHeaderName("");
      } else {
        // If no authParam, it's a custom header
        setFormData((prev) => ({ ...prev, authType: "custom", authParam: "" }));
        setCustomHeaderName(authType); // authType contains the header name
        setQueryParamName("");
      }
    }
  };

  const handleAutoFill = (providerId: string) => {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    const providerData = {
      ...formData,
      name: provider.name,
      baseUrl: provider.baseUrl,
      chatEndpoint: provider.chatEndpoint,
      defaultModel: provider.defaultModel,
      streaming: provider.streaming || false,
      response: {
        contentPath: provider.response.contentPath,
        usagePath: provider.response.usagePath,
      },
      input: {
        text: {
          messages: (provider.input.text.messages || []) as any[],
        },
        image: provider.input.image
          ? {
              type: provider.input.image.type,
              messages: (provider.input.image.messages || []) as any[],
            }
          : null,
      },
      authParam: (provider as any).authParam || "",
      compat: (provider as any).compat || "openai",
      isCustom: true,
    };

    setFormData(providerData);
    setAuthTypeFromProvider(providerData);
    setErrors({});
  };

  const validateForm = (data: typeof formData) => {
    const newErrors: { [key: string]: string } = {};

    // Required fields validation
    if (!data.name.trim()) {
      newErrors.name = "Provider name is required";
    }

    if (!data.baseUrl.trim()) {
      newErrors.baseUrl = "Base URL is required";
    } else if (
      !data.baseUrl.startsWith("http://") &&
      !data.baseUrl.startsWith("https://")
    ) {
      newErrors.baseUrl = "Base URL must start with http:// or https://";
    }

    if (!data.chatEndpoint.trim()) {
      newErrors.chatEndpoint = "Chat endpoint is required";
    }

    if (!data.defaultModel.trim()) {
      newErrors.defaultModel = "Default model is required";
    }

    // Response validation
    if (!data.response.contentPath.trim()) {
      newErrors["response.contentPath"] = "Content path is required";
    }

    if (!data.response.usagePath.trim()) {
      newErrors["response.usagePath"] = "Usage path is required";
    }

    // Auth validation
    if (data.authType === "custom" && !customHeaderName.trim()) {
      newErrors.customHeaderName = "Custom header name is required";
    }

    if (data.authType === "query" && !queryParamName.trim()) {
      newErrors.queryParamName = "Query parameter name is required";
    }

    return newErrors;
  };

  const handleEdit = (providerId: string) => {
    // Clear any existing errors
    setErrors({});

    // Set editing state first
    setEditingProvider(providerId);

    // Find the provider from custom providers
    const customProviders = getCustomAiProviders();
    const provider = customProviders.find((p) => p.id === providerId);

    if (!provider) {
      setErrors({ general: "Provider not found" });
      return;
    }

    // Populate form with provider data
    const providerData = {
      ...provider,
      authParam: provider.authParam || "",
    };

    setFormData(providerData);
    setAuthTypeFromProvider(providerData);

    // Show the form
    setShowForm(true);
  };

  const handleDelete = (providerId: string) => {
    setDeleteConfirm(providerId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const result = removeCustomAiProvider(deleteConfirm);
      if (result) {
        loadData();
        setDeleteConfirm(null);
        // If we're editing the deleted provider, reset form
        if (editingProvider === deleteConfirm) {
          setShowForm(false);
          setEditingProvider(null);
          setFormData({
            name: "",
            baseUrl: "",
            chatEndpoint: "",
            authType: "bearer",
            authParam: "",
            defaultModel: "",
            streaming: false,
            response: {
              contentPath: "",
              usagePath: "",
            },
            input: {
              text: {
                messages: [],
              },
              image: {
                type: "",
                messages: [],
              },
            },
            id: "",
            isCustom: true,
          });
        }
      } else {
        setErrors({ general: "Failed to delete provider" });
      }
    } catch (error) {
      console.error("Error deleting custom provider:", error);
      setErrors({ general: "An unexpected error occurred while deleting" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    try {
      // Clear previous errors
      setErrors({});

      // Validate form data
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Prepare provider data
      let authType = formData.authType;
      let authParam = formData.authParam;

      // Handle custom header and query parameter
      if (formData.authType === "custom") {
        authType = customHeaderName; // Use the custom header name as authType
        authParam = ""; // No authParam for custom headers
      } else if (formData.authType === "query") {
        authType = queryParamName; // Use the query param name as authType
        authParam = formData.authParam; // Keep the authParam for query
      }

      const providerData = {
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        chatEndpoint: formData.chatEndpoint.trim(),
        authType,
        authParam,
        defaultModel: formData.defaultModel.trim(),
        streaming: formData.streaming,
        response: {
          contentPath: formData.response.contentPath.trim(),
          usagePath: formData.response.usagePath.trim(),
        },
        input: {
          text: {
            messages: formData.input.text.messages,
          },
          image: formData.input.image,
        },
        models: null, // Custom providers don't need models
      };

      let result;
      if (editingProvider) {
        // Update existing provider
        result = updateCustomAiProvider(editingProvider, providerData);
      } else {
        // Add new provider
        result = addCustomAiProvider(providerData);
      }

      if (result) {
        loadData();
        // Success - close form and reset
        setShowForm(false);
        setEditingProvider(null);

        // Reset form data
        setFormData({
          name: "",
          baseUrl: "",
          chatEndpoint: "",
          authType: "bearer",
          authParam: "",
          defaultModel: "",
          streaming: false,
          response: {
            contentPath: "",
            usagePath: "",
          },
          input: {
            text: {
              messages: [],
            },
            image: {
              type: "",
              messages: [],
            },
          },
          id: "",
          isCustom: true,
        });
      } else {
        // Failed to save provider
        const action = editingProvider ? "update" : "save";
        setErrors({ general: `Failed to ${action} provider` });
      }
    } catch (error) {
      console.error("Error saving custom provider:", error);
      setErrors({ general: "An unexpected error occurred" });
    }
  };

  return {
    errors,
    setErrors,
    showForm,
    setShowForm,
    editingProvider,
    setEditingProvider,
    deleteConfirm,
    formData,
    setFormData,
    handleSave,
    handleAutoFill,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    customHeaderName,
    setCustomHeaderName,
    queryParamName,
    setQueryParamName,
  };
}
