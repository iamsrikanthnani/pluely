import { GithubIcon } from "lucide-react";
import { useVersion } from "@/hooks";

export const Disclaimer = () => {
  const { version, isLoading: isVersionLoading } = useVersion();

  return (
    <div className="flex items-center justify-between py-4 px-4">
      <a
        href="https://github.com/iamsrikanthnani/pluely/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
      >
        Report a bug
      </a>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground/70 leading-relaxed">
          {isVersionLoading ? (
            <span>Loading version...</span>
          ) : (
            <span>Version: {version}</span>
          )}
        </div>

        <a
          href="https://github.com/iamsrikanthnani/pluely"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <GithubIcon className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};
