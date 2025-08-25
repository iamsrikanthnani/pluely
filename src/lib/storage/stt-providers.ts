import { STORAGE_KEYS } from "@/config";
import { TYPE_STT_PROVIDER } from "@/types";

export function getCustomSttProviders(): TYPE_STT_PROVIDER[] {
  try {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_SPEECH_PROVIDERS);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p: any) =>
        p.id &&
        p.isCustom &&
        typeof p.name === "string" &&
        typeof p.baseUrl === "string"
    );
  } catch (error) {
    console.error("Error retrieving custom STT providers:", error);
    return [];
  }
}

export function setCustomSttProviders(providers: TYPE_STT_PROVIDER[]): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_SPEECH_PROVIDERS,
      JSON.stringify(providers)
    );
  } catch (error) {
    console.error("Error setting custom STT providers:", error);
  }
}

export function addCustomSttProvider(
  newProvider: Omit<TYPE_STT_PROVIDER, "id" | "isCustom">
): TYPE_STT_PROVIDER | null {
  try {
    const providers = getCustomSttProviders();
    const id = `custom-stt-${Date.now()}`;
    const provider: TYPE_STT_PROVIDER = {
      ...newProvider,
      id,
      isCustom: true,
      name: newProvider.name,
      baseUrl: newProvider.baseUrl,
      endpoint: newProvider.endpoint,
      method: newProvider.method,
      request: newProvider.request,
      response: newProvider.response,
      authType: newProvider.authType,
      streaming: newProvider.streaming,
    };
    providers.push(provider);
    setCustomSttProviders(providers);
    return provider;
  } catch (error) {
    console.error("Error adding custom STT provider:", error);
    return null;
  }
}

export function updateCustomSttProvider(
  id: string,
  updates: Partial<TYPE_STT_PROVIDER>
): boolean {
  try {
    const providers = getCustomSttProviders();
    const index = providers.findIndex((p) => p.id === id && p.isCustom);
    if (index === -1) return false;
    providers[index] = { ...providers[index], ...updates };
    setCustomSttProviders(providers);
    return true;
  } catch (error) {
    console.error("Error updating custom STT provider:", error);
    return false;
  }
}

export function removeCustomSttProvider(id: string): boolean {
  try {
    const providers = getCustomSttProviders();
    const filtered = providers.filter((p) => p.id !== id);
    if (filtered.length === providers.length) return false;
    setCustomSttProviders(filtered);
    return true;
  } catch (error) {
    console.error("Error removing custom STT provider:", error);
    return false;
  }
}
