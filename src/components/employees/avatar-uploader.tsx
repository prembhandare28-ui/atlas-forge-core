import { useRef, useState } from "react";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "./employee-avatar";

const MAX_MB = 4;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export interface AvatarUploaderProps {
  name: string;
  value: string | null | undefined;
  onChange: (file: File | null, preview: string | null) => void | Promise<void>;
  disabled?: boolean;
}

export function AvatarUploader({ name, value, onChange, disabled }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const handle = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a PNG, JPG, or WebP image");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_MB}MB`);
      return;
    }
    setBusy(true);
    try {
      const preview = URL.createObjectURL(file);
      await onChange(file, preview);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <EmployeeAvatar name={name || "?"} src={value} size="xl" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={disabled || busy} onClick={pick}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImageUp className="mr-2 h-4 w-4" />
            )}
            {value ? "Replace" : "Upload photo"}
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || busy}
              onClick={() => onChange(null, null)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG or WebP · up to {MAX_MB}MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}