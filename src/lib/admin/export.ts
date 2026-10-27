/* Client-side exports: real files, built from the exact rows on screen.
   CSV opens everywhere; the .xls variant is SpreadsheetML, which Excel and
   LibreOffice open natively — both without adding a dependency. */

export type ExportCell = string | number | null | undefined;

export interface ExportSheet {
  headers: string[];
  rows: ExportCell[][];
}

function csvEscape(cell: ExportCell): string {
  if (cell === null || cell === undefined) return "";
  const text = String(cell);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv({ headers, rows }: ExportSheet): string {
  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(","));
  // BOM so Excel detects UTF-8 and route arrows survive.
  return "﻿" + lines.join("\r\n");
}

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xlsCell(cell: ExportCell): string {
  if (typeof cell === "number" && Number.isFinite(cell)) {
    return `<Cell><Data ss:Type="Number">${cell}</Data></Cell>`;
  }
  const text = cell === null || cell === undefined ? "" : String(cell);
  return `<Cell><Data ss:Type="String">${xmlEscape(text)}</Data></Cell>`;
}

export function toExcelXml({ headers, rows }: ExportSheet, sheetName: string): string {
  const headerRow = `<Row>${headers.map((h) => xlsCell(h)).join("")}</Row>`;
  const bodyRows = rows.map((row) => `<Row>${row.map(xlsCell).join("")}</Row>`).join("");
  return (
    `<?xml version="1.0"?>` +
    `<?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"` +
    ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    `<Worksheet ss:Name="${xmlEscape(sheetName).slice(0, 30)}">` +
    `<Table>${headerRow}${bodyRows}</Table>` +
    `</Worksheet></Workbook>`
  );
}

function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(sheet: ExportSheet, basename: string): void {
  download(toCsv(sheet), `${basename}.csv`, "text/csv;charset=utf-8");
}

export function downloadExcel(sheet: ExportSheet, basename: string): void {
  download(
    toExcelXml(sheet, basename),
    `${basename}.xls`,
    "application/vnd.ms-excel",
  );
}
