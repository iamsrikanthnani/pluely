import { STORAGE_KEYS } from "@/config";
import { TYPE_AI_PROVIDER } from "@/types";

export function getCustomAiProviders(): TYPE_AI_PROVIDER[] {
  try {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_AI_PROVIDERS);
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
    console.error("Error retrieving custom AI providers:", error);
    return [];
  }
}

export function setCustomAiProviders(providers: TYPE_AI_PROVIDER[]): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_AI_PROVIDERS,
      JSON.stringify(providers)
    );
  } catch (error) {
    console.error("Error setting custom AI providers:", error);
  }
}

export function addCustomAiProvider(
  newProvider: Omit<TYPE_AI_PROVIDER, "id" | "isCustom">
): TYPE_AI_PROVIDER | null {
  try {
    const providers = getCustomAiProviders();
    const id = `custom-ai-${
      newProvider?.name?.toLowerCase() || new Date().toISOString()
    }`;
    const provider: TYPE_AI_PROVIDER = {
      ...newProvider,
      id,
      isCustom: true,
    };
    providers.push(provider);
    setCustomAiProviders(providers);
    return provider;
  } catch (error) {
    console.error("Error adding custom AI provider:", error);
    return null;
  }
}

export function updateCustomAiProvider(
  id: string,
  updates: Partial<TYPE_AI_PROVIDER>
): boolean {
  try {
    const providers = getCustomAiProviders();
    const index = providers.findIndex((p) => p.id === id && p.isCustom);
    if (index === -1) return false;
    providers[index] = { ...providers[index], ...updates };
    setCustomAiProviders(providers);
    return true;
  } catch (error) {
    console.error("Error updating custom AI provider:", error);
    return false;
  }
}

export function removeCustomAiProvider(id: string): boolean {
  try {
    const providers = getCustomAiProviders();
    const filtered = providers.filter((p) => p.id !== id);
    if (filtered.length === providers.length) return false; // No removal happened
    setCustomAiProviders(filtered);
    return true;
  } catch (error) {
    console.error("Error removing custom AI provider:", error);
    return false;
  }
}
