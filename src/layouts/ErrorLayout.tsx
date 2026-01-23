import { Button, Card, DragButton } from "@/components";
import { RefreshCcwIcon, SparklesIcon } from "lucide-react";

export const ErrorLayout = ({ isCompact }: { isCompact?: boolean }) => {
  return isCompact ? (
    <Card className="flex flex-row w-screen h-screen items-center justify-between p-4">
      <div className="flex size-8 items-center justify-center rounded-xl bg-foreground">
        <SparklesIcon className="size-5 text-background" />
      </div>
      <p className="text-sm md:text-xl">
        Oops! Something went wrong. Click reload to restart the app.
      </p>

      <div className="flex flex-row items-center gap-2">
        <Button size="icon" onClick={() => window.location.reload()}>
          <RefreshCcwIcon className="size-4" />
        </Button>
        <DragButton />
      </div>
    </Card>
  ) : (
    <div className="relative flex flex-col h-screen w-screen justify-center items-center overflow-hidden bg-background">
      <div className="flex flex-col justify-center items-center gap-8 max-w-[600px] px-4 animate-fadeIn">
        <div className="absolute top-1/4 left-0 right-0 flex justify-center items-center transform hover:scale-105 transition-transform duration-200">
          <div className="flex h-16 items-center px-4 pt-10 gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-foreground">
              <SparklesIcon className="size-4 text-background" />
            </div>
            <h1 className="text-md font-semibold text-foreground">Nluely</h1>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center text-center select-none mt-8">
          <h1 className="text-6xl md:text-6xl font-bold hover:scale-105 transition-transform duration-200">
            Oops!
          </h1>
          <div className="space-y-2">
            <p className="text-xl md:text-2xl font-medium text-foreground">
              Something unexpected happened
            </p>
            <p className="text-sm md:text-base text-muted-foreground">
              Don't worry! Just click the reload button below to restart the
              app.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-[200px]">
          <Button
            variant="default"
            onClick={() => window.location.reload()}
            className="w-full shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <RefreshCcwIcon className="size-4" /> Reload
          </Button>
        </div>
      </div>
    </div>
  );
};
