import { useState } from "react";
import { TYPE_STT_PROVIDER } from "@/types";
import {
  addCustomSttProvider,
  updateCustomSttProvider,
  removeCustomSttProvider,
  getCustomSttProviders,
} from "@/lib";
import { SPEECH_TO_TEXT_PROVIDERS } from "@/config";
import { AUTH_TYPES } from "@/lib/functions/common.function";
import { useApp } from "@/contexts";

export function useCustomSttProviders() {
  const { loadData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Local state for custom header and query parameter names
  const [customHeaderName, setCustomHeaderName] = useState("");
  const [queryParamName, setQueryParamName] = useState("");

  // Helper function to determine auth type and set local states
  const setAuthTypeFromProvider = (provider: TYPE_STT_PROVIDER) => {
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

  const [formData, setFormData] = useState<TYPE_STT_PROVIDER>({
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

    if (!data.endpoint.trim()) {
      newErrors.endpoint = "Endpoint is required";
    }

    if (!data.response.contentPath.trim()) {
      newErrors["response.contentPath"] = "Content path is required";
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

  const handleAutoFill = (providerId: string) => {
    const provider = SPEECH_TO_TEXT_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    const providerData = {
      ...formData,
      name: provider.name,
      baseUrl: provider.baseUrl,
      endpoint: provider.endpoint,
      method: provider.method,
      request: {
        bodyType: provider.request.bodyType,
        audioFormat: provider.request.audioFormat,
        audioKey: provider.request.audioKey,
        fields: (provider.request.fields || {}) as Record<string, any>,
        query: (provider.request.query || {}) as Record<string, any>,
        headers: (provider.request.headers || {}) as Record<string, any>,
      },
      response: {
        contentPath: provider.response.contentPath,
      },
      streaming: provider.streaming,
      authParam: (provider as any).authParam || "",
      isCustom: true,
    };

    setFormData(providerData);
    setAuthTypeFromProvider(providerData);
    setErrors({});
  };

  const handleEdit = (providerId: string) => {
    const provider = getCustomSttProviders().find((p) => p.id === providerId);
    if (!provider) return;

    setEditingProvider(providerId);
    const providerData = {
      ...provider,
      authParam: provider.authParam || "",
    };
    setFormData(providerData);
    setAuthTypeFromProvider(providerData);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (providerId: string) => {
    setDeleteConfirm(providerId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const result = removeCustomSttProvider(deleteConfirm);
      if (result) {
        loadData();
        setDeleteConfirm(null);
        if (editingProvider === deleteConfirm) {
          setShowForm(false);
          setEditingProvider(null);
          setFormData({
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
            id: "",
            isCustom: true,
          });
        }
      } else {
        setErrors({ general: "Failed to delete provider" });
      }
    } catch (error) {
      console.error("Error deleting custom STT provider:", error);
      setErrors({ general: "An unexpected error occurred while deleting" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    try {
      setErrors({});

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
        endpoint: formData.endpoint.trim(),
        method: formData.method,
        authType,
        authParam,
        request: {
          bodyType: formData.request.bodyType,
          audioFormat: formData.request.audioFormat,
          audioKey: formData.request.audioKey,
          fields: formData.request.fields,
          query: formData.request.query,
          headers: formData.request.headers,
        },
        response: {
          contentPath: formData.response.contentPath.trim(),
        },
        streaming: formData.streaming,
      };

      let result;
      if (editingProvider) {
        result = updateCustomSttProvider(editingProvider, providerData);
      } else {
        result = addCustomSttProvider(providerData);
      }

      if (result) {
        loadData();
        setShowForm(false);
        setEditingProvider(null);
        setFormData({
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
          id: "",
          isCustom: true,
        });
      } else {
        const action = editingProvider ? "update" : "save";
        setErrors({ general: `Failed to ${action} provider` });
      }
    } catch (error) {
      console.error("Error saving custom STT provider:", error);
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
