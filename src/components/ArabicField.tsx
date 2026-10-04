import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

/**
 * Simple Arabic text input. The previous auto-diacritize behaviour was
 * removed at the user's request — enter the exact text (with or without
 * tashkeel) and it is kept verbatim.
 */
export function ArabicField({
  value,
  onChange,
  multiline,
  rows = 3,
  placeholder,
}: Props) {
  return multiline ? (
    <Textarea
      dir="rtl"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="warsh-text"
    />
  ) : (
    <Input
      dir="rtl"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="warsh-text"
    />
  );
}
