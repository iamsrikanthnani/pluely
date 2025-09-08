import React, { useState, useEffect } from "react";
import { Button, Header, Input, Switch } from "@/components";
import { KeyIcon, TrashIcon, LoaderIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useApp } from "@/contexts";

interface ActivationResponse {
  activated: boolean;
  error?: string;
  license_key?: string;
  instance?: {
    id: string;
    name: string;
    created_at: string;
  };
}

interface CheckoutResponse {
  success?: boolean;
  checkout_url?: string;
  error?: string;
}

interface StorageResult {
  license_key?: string;
  instance_id?: string;
}

const LICENSE_KEY_STORAGE_KEY = "pluely_license_key";
const INSTANCE_ID_STORAGE_KEY = "pluely_instance_id";

export const PluelyApiSetup = () => {
  const { pluelyApiEnabled, setPluelyApiEnabled } = useApp();

  const [licenseKey, setLicenseKey] = useState("");
  const [storedLicenseKey, setStoredLicenseKey] = useState<string | null>(null);
  const [maskedLicenseKey, setMaskedLicenseKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load license status on component mount
  useEffect(() => {
    loadLicenseStatus();
  }, []);

  const loadLicenseStatus = async () => {
    try {
      // Get all stored data in one call
      const storage = await invoke<StorageResult>("secure_storage_get");

      if (storage.license_key) {
        setStoredLicenseKey(storage.license_key);

        // Get masked version from Tauri command
        const masked = await invoke<string>("mask_license_key_cmd", {
          licenseKey: storage.license_key,
        });
        setMaskedLicenseKey(masked);
      } else {
        setStoredLicenseKey(null);
        setMaskedLicenseKey(null);
      }
    } catch (err) {
      console.error("Failed to load license status:", err);
      // If we can't read from storage, assume no license is stored
      setStoredLicenseKey(null);
      setMaskedLicenseKey(null);
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setError("Please enter a license key");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response: ActivationResponse = await invoke(
        "activate_license_api",
        {
          licenseKey: licenseKey.trim(),
        }
      );

      if (response.activated && response.instance) {
        // Store the license data securely in one call
        await invoke("secure_storage_save", {
          items: [
            {
              key: LICENSE_KEY_STORAGE_KEY,
              value: licenseKey.trim(),
            },
            {
              key: INSTANCE_ID_STORAGE_KEY,
              value: response.instance.id,
            },
          ],
        });

        setSuccess("License activated successfully!");
        setLicenseKey(""); // Clear the input

        // Auto-enable Pluely API when license is activated
        setPluelyApiEnabled(true);

        await loadLicenseStatus(); // Reload status
      } else {
        setError(response.error || "Failed to activate license");
      }
    } catch (err) {
      console.error("License activation failed:", err);
      setError(typeof err === "string" ? err : "Failed to activate license");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLicense = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Remove all license data from secure storage in one call
      await invoke("secure_storage_remove", {
        keys: [LICENSE_KEY_STORAGE_KEY, INSTANCE_ID_STORAGE_KEY],
      });

      setSuccess("License removed successfully!");

      // Disable Pluely API when license is removed
      setPluelyApiEnabled(false);

      await loadLicenseStatus(); // Reload status
    } catch (err) {
      console.error("Failed to remove license:", err);
      setError("Failed to remove license");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !storedLicenseKey) {
      handleActivateLicense();
    }
  };

  const handleGetLicenseKey = async () => {
    setIsCheckoutLoading(true);
    setError(null);

    try {
      const response: CheckoutResponse = await invoke("get_checkout_url");

      if (response.success && response.checkout_url) {
        // Open checkout URL in default browser
        await openUrl(response.checkout_url);
      } else {
        setError(response.error || "Failed to get checkout URL");
      }
    } catch (err) {
      console.error("Failed to get checkout URL:", err);
      setError(typeof err === "string" ? err : "Failed to get checkout URL");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 flex flex-row items-center justify-between border-b pb-2">
        <Header
          title="Support Pluely"
          description="Support Pluely to keep the project alive, and follow on X."
        />
        <div className="flex flex-row items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openUrl("https://x.com/truly_sn")}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
            </svg>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openUrl("https://buymeacoffee.com/srikanthnani")}
          >
            Support Pluely
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between border-b pb-2">
          <Header
            titleClassName="text-lg"
            title="Pluely Access"
            description="Pluely license to unlock faster responses, quicker support and premium features."
          />
          <div className="flex flex-row items-center gap-2">
            {!storedLicenseKey && (
              <Button
                onClick={handleGetLicenseKey}
                disabled={isCheckoutLoading}
                size="sm"
              >
                {isCheckoutLoading ? "Loading..." : "Get License Key"}
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <p className="text-sm text-green-700 dark:text-green-400">
              {success}
            </p>
          </div>
        )}

        {/* License Key Input or Display */}
        <div className="space-y-2">
          {!storedLicenseKey ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">License Key</label>
                <p className="text-sm font-medium text-muted-foreground">
                  After successful payment, you will receive a license key.
                  Enter it below to activate your license.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your license key (e.g., 38b1460a-5104-4067-a91d-77b872934d51)"
                  value={licenseKey}
                  onChange={(value) => {
                    setLicenseKey(
                      typeof value === "string" ? value : value.target.value
                    );
                    setError(null); // Clear error when user types
                    setSuccess(null); // Clear success when user types
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="flex-1 h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
                />
                <Button
                  onClick={handleActivateLicense}
                  disabled={isLoading || !licenseKey.trim()}
                  size="icon"
                  className="shrink-0 h-11 w-11"
                  title="Activate License"
                >
                  {isLoading ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <label className="text-sm font-medium">Current License</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={maskedLicenseKey || ""}
                  disabled={true}
                  className="flex-1 h-11 border-1 border-input/50 bg-muted/50"
                />
                <Button
                  onClick={handleRemoveLicense}
                  disabled={isLoading}
                  size="icon"
                  variant="destructive"
                  className="shrink-0 h-11 w-11"
                  title="Remove License"
                >
                  {isLoading ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {storedLicenseKey ? (
                <div className="-mt-1">
                  <p className="text-sm font-medium text-muted-foreground select-auto">
                    If you need any help or any assistance, contact
                    support@pluely.com
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Header
          title={`${pluelyApiEnabled ? "Disable" : "Enable"} Pluely API`}
          description={
            storedLicenseKey
              ? pluelyApiEnabled
                ? "Using all pluely APIs for audio, and chat."
                : "Using all your own AI Providers for audio, and chat."
              : "A valid license is required to enable Pluely API or you can use your own AI Providers and STT Providers."
          }
        />
        <Switch
          checked={pluelyApiEnabled}
          onCheckedChange={setPluelyApiEnabled}
          disabled={!storedLicenseKey} // Disable if no license is stored
        />
      </div>
    </div>
  );
};
