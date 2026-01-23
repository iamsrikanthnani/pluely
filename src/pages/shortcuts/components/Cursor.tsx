import {
  Header,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { useApp } from "@/contexts";
import { getPlatform } from "@/lib";
import { CursorType } from "@/lib/storage";
import { MousePointer, MousePointer2, Pointer, TextCursor } from "lucide-react";

interface CursorSelectionProps {
  className?: string;
}

export const CursorSelection = ({ className }: CursorSelectionProps) => {
  const { customizable, setCursorType } = useApp();
  const platform = getPlatform();

  return (
    <div id="cursor" className={`space-y-2 ${className}`}>
      <Header
        title="Cursor"
        description="Control Nluely cursor visibility"
        isMainTitle
        rightSlot={
          <Select
            value={customizable.cursor.type}
            onValueChange={(value) => setCursorType(value as CursorType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a cursor type" />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="invisible" disabled={platform === "linux"}>
                Invisible (<MousePointer2 className="size-3 px-0" />){" "}
                {platform === "linux" && (
                  <span className="text-xs text-muted-foreground">
                    Not supported on Linux
                  </span>
                )}
              </SelectItem>
              <SelectItem value="default">
                Default (<MousePointer className="size-3" />)
              </SelectItem>
              <SelectItem value="auto">
                Auto (
                <MousePointer className="size-3" />/
                <TextCursor className="size-3" /> /
                <Pointer className="size-3" />)
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
};
