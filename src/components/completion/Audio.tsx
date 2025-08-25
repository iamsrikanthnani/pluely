import { InfoIcon, MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { AutoSpeechVAD } from "./AutoSpeechVad";
import { UseCompletionReturn } from "@/types";
import { useApp } from "@/contexts";

export const Audio = ({
  micOpen,
  setMicOpen,
  enableVAD,
  setEnableVAD,
  submit,
  setState,
}: UseCompletionReturn) => {
  const { selectedSttProvider } = useApp();

  const speechProviderStatus =
    selectedSttProvider.apiKey &&
    selectedSttProvider.provider &&
    selectedSttProvider.model;

  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        {speechProviderStatus && enableVAD ? (
          <AutoSpeechVAD
            submit={submit}
            setState={setState}
            setEnableVAD={setEnableVAD}
          />
        ) : (
          <Button
            size="icon"
            onClick={() => {
              setEnableVAD(!enableVAD);
            }}
            className="cursor-pointer"
            title="Toggle voice input"
          >
            <MicIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        className={`w-80 p-3 ${speechProviderStatus ? "hidden" : ""}`}
        sideOffset={8}
      >
        <div className="text-sm select-none">
          <div className="font-semibold text-orange-600 mb-1">
            Speech Provider Configuration Required
          </div>
          <p className="text-muted-foreground">
            {!speechProviderStatus ? (
              <>
                <div className="mt-2 flex flex-row gap-1 items-center text-orange-600">
                  <InfoIcon size={16} />
                  {selectedSttProvider.apiKey ? null : (
                    <p>API KEY IS MISSING</p>
                  )}
                  {selectedSttProvider.provider ? null : (
                    <p>PROVIDER IS MISSING</p>
                  )}
                  {selectedSttProvider.model ? null : <p>MODEL IS MISSING</p>}
                </div>

                <span className="block mt-2">
                  Please go to settings and configure your speech provider to
                  enable voice input.
                </span>
              </>
            ) : null}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
