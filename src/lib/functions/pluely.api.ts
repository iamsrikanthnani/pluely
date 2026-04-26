import { safeLocalStorage } from "../storage";
import { STORAGE_KEYS } from "@/config";

// Helper function to check if Pluely API should be used
export async function shouldUsePluelyAPI(): Promise<boolean> {
  try {
    return safeLocalStorage.getItem(STORAGE_KEYS.PLUELY_API_ENABLED) === "true";
  } catch (error) {
    console.warn("Failed to check Pluely API availability:", error);
    return false;
  }
}
