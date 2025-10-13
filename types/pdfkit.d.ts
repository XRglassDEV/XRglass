declare module "pdfkit" {
  import type { Writable } from "stream";

  interface PDFOptions {
    size?: string | [number, number];
    margin?: number;
  }

  class PDFDocument extends Writable {
    constructor(options?: PDFOptions);
    fillColor(color: string): this;
    fontSize(size: number): this;
    text(text: string, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
  }

  export = PDFDocument;
}
