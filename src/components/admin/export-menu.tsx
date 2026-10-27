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
  const run = (kind: "csv" | "excel") => {
    const sheet = buildSheet();
    if (sheet.rows.length === 0) {
      toast.info("Nothing to export with the current filters.");
      return;
    }
    if (kind === "csv") downloadCsv(sheet, basename);
    else downloadExcel(sheet, basename);
    toast.success(`Exported ${sheet.rows.length} rows`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <Download aria-hidden />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run("csv")}>CSV (.csv)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("excel")}>Excel (.xls)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
