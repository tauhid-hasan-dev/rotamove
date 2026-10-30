/**
 * A very small PDF writer.
 *
 * Hand-assembled rather than taken from a library: the two documents this
 * product produces — a placeholder for a seeded application, and a partner's
 * archived invoice — are one page of text and a few rules each, which is
 * about eighty lines of PDF. A dependency that can typeset anything would be
 * several hundred kilobytes shipped to the browser to draw a table.
 *
 * It runs on either side. The invoice is written in the browser when a
 * partner clicks Download, so nothing here may touch Node or the DOM.
 */

/** A4, in PDF points. The origin is the bottom-left corner. */
export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;

/**
 * The three base-14 faces this uses. No embedding, no font file, no licence
 * question — every PDF reader already has them.
 */
export type PdfFont = "sans" | "sansBold" | "mono";

const FONT_RESOURCE: Record<PdfFont, string> = {
  sans: "F1",
  sansBold: "F2",
  mono: "F3",
};

/**
 * Courier is 600/1000 em at every code point, which is the whole reason the
 * numbers on the invoice are set in it: a right-aligned column needs a text
 * width, and this is the only one of the three faces whose width is a
 * multiplication rather than a table of 229 glyph metrics.
 */
const MONO_ADVANCE = 0.6;

export interface PdfText {
  kind: "text";
  x: number;
  /** From the bottom of the page, PDF-style. */
  y: number;
  text: string;
  size?: number;
  font?: PdfFont;
  /**
   * Right-align the run so it *ends* at `x`.
   *
   * Forces the mono face, whatever `font` says — see `MONO_ADVANCE`. An
   * alignment computed from the wrong metrics is worse than an obviously
   * monospaced column, because it looks almost right.
   */
  align?: "right";
  /** 0 is black, 1 is white. */
  gray?: number;
}

export interface PdfRule {
  kind: "rule";
  x1: number;
  x2: number;
  y: number;
  gray?: number;
  lineWidth?: number;
}

export type PdfItem = PdfText | PdfRule;

/**
 * Down to WinAnsi, which is what the base-14 faces can draw.
 *
 * Decomposing and dropping the combining marks turns ş into s and ğ into g
 * while leaving ö, ü and ß alone, because those have WinAnsi code points of
 * their own. Dotless ı decomposes to nothing, so it is mapped by hand;
 * anything still outside the byte range becomes a question mark rather than a
 * silently wrong glyph.
 *
 * The euro sign is the one character worth naming. It is absent from
 * Latin-1 but present in WinAnsi at 0x80, and every amount in this product
 * carries one, so it is mapped explicitly instead of being transliterated
 * into a question mark on every line of every invoice.
 */
export function winAnsi(input: string): string {
  return input
    .replace(/ı/g, "i")
    .replace(/€/g, "\x80")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x00-\xff]/g, "?");
}

const escape = (s: string) => winAnsi(s).replace(/([\\()])/g, "\\$1");

/** How wide this run will be, for right alignment. Mono metrics only. */
const monoWidth = (text: string, size: number) => winAnsi(text).length * size * MONO_ADVANCE;

function textCommands(item: PdfText): string {
  const size = item.size ?? 11;
  const font = item.align === "right" ? "mono" : (item.font ?? "sans");
  const x = item.align === "right" ? item.x - monoWidth(item.text, size) : item.x;
  const gray = item.gray ?? 0;
  return [
    "BT",
    `${gray} g`,
    `/${FONT_RESOURCE[font]} ${size} Tf`,
    `${x.toFixed(2)} ${item.y.toFixed(2)} Td`,
    `(${escape(item.text)}) Tj`,
    "ET",
  ].join("\n");
}

function ruleCommands(item: PdfRule): string {
  return [
    `${item.gray ?? 0.8} G`,
    `${item.lineWidth ?? 0.6} w`,
    `${item.x1.toFixed(2)} ${item.y.toFixed(2)} m`,
    `${item.x2.toFixed(2)} ${item.y.toFixed(2)} l`,
    "S",
  ].join("\n");
}

/** Assemble one page of positioned runs into a valid PDF. */
export function writePdf(items: PdfItem[]): Uint8Array {
  const body = items
    .map((item) => (item.kind === "text" ? textCommands(item) : ruleCommands(item)))
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      "/Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  ];

  // The cross-reference table records a byte offset per object, so the file
  // has to be assembled before the table can be written.
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });

  const startxref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  // Latin-1, not UTF-8: the offsets above are string indices, and a
  // multi-byte encoding would shift every one of them past the first
  // non-ASCII character and corrupt the table.
  return Uint8Array.from(pdf, (c) => c.charCodeAt(0) & 0xff);
}

/**
 * A title and a stack of lines — the shape the application placeholder needs.
 *
 * Kept as its own entry point so the document store does not have to know
 * about page coordinates to produce the one document it produces.
 */
export function simplePdf(title: string, lines: string[]): Uint8Array {
  const left = 56;
  let y = PAGE_HEIGHT - 100;
  return writePdf([
    { kind: "text", x: left, y: PAGE_HEIGHT - 72, text: title, size: 16, font: "sansBold" },
    ...lines.map((line): PdfItem => {
      y -= 16;
      return { kind: "text", x: left, y, text: line, size: 11 };
    }),
  ]);
}
