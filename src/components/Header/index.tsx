import { Label } from "@/components";

interface HeaderProps {
  title: string;
  description: string;
  isMainTitle?: boolean;
}

export const Header = ({
  title,
  description,
  isMainTitle = false,
}: HeaderProps) => {
  return (
    <div
      className={`flex flex-col ${
        isMainTitle ? "border-b border-input/50 pb-2" : ""
      }`}
    >
      <Label
        className={`font-semibold ${isMainTitle ? "text-lg" : "text-sm "}`}
      >
        {title}
      </Label>
      <p
        className={`text-muted-foreground leading-relaxed ${
          isMainTitle ? "text-sm" : "text-xs"
        }`}
      >
        {description}
      </p>
    </div>
  );
};
