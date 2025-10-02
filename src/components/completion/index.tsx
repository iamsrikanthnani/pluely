import { useCompletion } from "@/hooks";
import { Screenshot } from "./Screenshot";
import { Files } from "./Files";
import { Audio } from "./Audio";
import { Input } from "./Input";

export const Completion = ({ isHidden }: { isHidden: boolean }) => {
  const completion = useCompletion();

  return (
    <>
      <div className="flex items-center gap-0">
        <Audio {...completion} />
        <Input {...completion} isHidden={isHidden} />
      </div>
      {completion?.screenshotConfiguration?.enabled && (
        <Screenshot {...completion} />
      )}
      <Files {...completion} />
    </>
  );
};
