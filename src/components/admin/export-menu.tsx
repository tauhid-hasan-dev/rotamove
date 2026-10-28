"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv, downloadExcel, type ExportSheet } from "@/lib/admin/export";
import { useI18n } from "@/i18n/provider";

/* Export the rows currently on screen (filters applied) as CSV or Excel. */

export function ExportMenu({
  basename,
  buildSheet,
  disabled = false,
}: {
  basename: string;
  /** Called at click time so the export always matches the live filters. */
  buildSheet: () => ExportSheet;
  disabled?: boolean;
}) {
  const { dict, t } = useI18n();
  const run = (kind: "csv" | "excel") => {
    const sheet = buildSheet();
    if (sheet.rows.length === 0) {
      toast.info(dict.admin.common.nothingToExport);
      return;
    }
    if (kind === "csv") downloadCsv(sheet, basename);
    else downloadExcel(sheet, basename);
    toast.success(t.fill(dict.admin.common.exportedRows, { n: t.number(sheet.rows.length) }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <Download aria-hidden />
          {dict.admin.common.export}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run("csv")}>CSV (.csv)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("excel")}>Excel (.xls)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
