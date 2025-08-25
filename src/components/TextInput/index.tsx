import { Input, Label } from "@/components";

export const TextInput = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  notes,
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  notes?: string;
}) => {
  return (
    <div className="space-y-1">
      {label ? <Label className="text-xs font-medium">{label}</Label> : null}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 border-1 border-input/50 focus:border-primary/50 transition-colors ${
          error ? "border-destructive" : ""
        }`}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {notes && <p className="text-xs text-muted-foreground">{notes}</p>}
    </div>
  );
};
