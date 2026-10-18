"use client";

import { useRef, useState } from "react";
import { FileCheck2, Paperclip, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  type DocumentMeta,
} from "@/lib/partner-application";
import { cn } from "@/lib/utils";

/**
 * A supporting document.
 *
 * Validates type and size in the browser and keeps only the metadata. This
 * demo has no object storage, so the bytes deliberately never leave the page
 * — pretending to upload, and recording a filename we could never produce
 * again, would be worse than being plain about it.
 */
export function DocumentField({
  id,
  label,
  value,
  onChange,
  required,
  invalid,
}: {
  id: string;
  label: string;
  value: DocumentMeta | null;
  onChange: (next: DocumentMeta | null) => void;
  required?: boolean;
  invalid?: boolean;
}) {
  const { dict, t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
      setError(dict.register.docWrongType);
      onChange(null);
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(dict.register.docTooBig);
      onChange(null);
      return;
    }
    setError(null);
    onChange({
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type as DocumentMeta["mimeType"],
    });
  };

  return (
    <div>
      <p className="mb-2 flex items-baseline gap-2 text-[13.5px]">
        <span className="font-medium">{label}</span>
        <span className="text-[12px] text-muted-foreground">
          {required ? dict.register.required : dict.register.optional}
        </span>
      </p>

      <input
        ref={input}
        id={id}
        type="file"
        className="sr-only"
        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
        onChange={(e) => accept(e.target.files?.[0])}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-verify/40 bg-surface p-3.5">
          <FileCheck2 className="size-4 shrink-0 text-verify" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium">{value.name}</span>
            <span className="block text-[12px] text-muted-foreground tnum">
              {t.number(Math.max(1, Math.round(value.sizeBytes / 1024)))} KB
            </span>
          </span>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="shrink-0 rounded-full px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {dict.register.docReplace}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setError(null);
              if (input.current) input.current.value = "";
            }}
            aria-label={dict.register.docRemove}
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border border-dashed p-3.5 text-start transition-colors",
            "hover:border-foreground/25 hover:bg-muted/40",
            (invalid || error) && "border-destructive",
          )}
        >
          <Paperclip className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-medium">{dict.register.docChoose}</span>
            <span className="block text-[12px] text-muted-foreground">{dict.register.docHint}</span>
          </span>
        </button>
      )}

      {error && <p className="mt-1.5 text-[12.5px] text-destructive">{error}</p>}
    </div>
  );
}
