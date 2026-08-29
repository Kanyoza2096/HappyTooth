/**
 * Minimal PDF 1.4 writer (no external dependencies).
 * Supports Helvetica text, simple lines, and multi-page flow.
 */

type RGB = [number, number, number];

interface TextOp {
  kind: 'text';
  x: number;
  y: number;
  size: number;
  text: string;
  font: 'F1' | 'F2';
  color: RGB;
}

interface LineOp {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: RGB;
}

interface RectOp {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: RGB;
  stroke?: RGB;
  lineWidth?: number;
}

type Op = TextOp | LineOp | RectOp;

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, (ch) => {
      // Basic latin fallback for non-ascii: replace with closest or ?
      const code = ch.charCodeAt(0);
      if (code === 0x2013 || code === 0x2014) return '-';
      if (code === 0x2018 || code === 0x2019) return "'";
      if (code === 0x201c || code === 0x201d) return '"';
      return '?';
    });
}

function colorOps(rgb: RGB): string {
  const [r, g, b] = rgb.map((c) => (c / 255).toFixed(3));
  return `${r} ${g} ${b} rg`;
}

function strokeColorOps(rgb: RGB): string {
  const [r, g, b] = rgb.map((c) => (c / 255).toFixed(3));
  return `${r} ${g} ${b} RG`;
}

export class SimplePdf {
  private pages: Op[][] = [[]];
  private margin = 48;

  get pageWidth() {
    return PAGE_WIDTH;
  }

  get pageHeight() {
    return PAGE_HEIGHT;
  }

  get contentWidth() {
    return PAGE_WIDTH - this.margin * 2;
  }

  get left() {
    return this.margin;
  }

  get right() {
    return PAGE_WIDTH - this.margin;
  }

  private current(): Op[] {
    return this.pages[this.pages.length - 1];
  }

  newPage() {
    this.pages.push([]);
  }

  text(
    text: string,
    x: number,
    y: number,
    opts?: { size?: number; bold?: boolean; color?: RGB; align?: 'left' | 'right' | 'center' }
  ) {
    const size = opts?.size ?? 10;
    const font: 'F1' | 'F2' = opts?.bold ? 'F2' : 'F1';
    const color = opts?.color ?? ([15, 23, 42] as RGB);
    let drawX = x;
    if (opts?.align === 'right') {
      drawX = x - estimateTextWidth(text, size);
    } else if (opts?.align === 'center') {
      drawX = x - estimateTextWidth(text, size) / 2;
    }
    this.current().push({ kind: 'text', x: drawX, y, size, text, font, color });
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opts?: { width?: number; color?: RGB }
  ) {
    this.current().push({
      kind: 'line',
      x1,
      y1,
      x2,
      y2,
      width: opts?.width ?? 0.6,
      color: opts?.color ?? ([203, 213, 225] as RGB),
    });
  }

  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    opts?: { fill?: RGB; stroke?: RGB; lineWidth?: number }
  ) {
    this.current().push({
      kind: 'rect',
      x,
      y,
      w,
      h,
      fill: opts?.fill,
      stroke: opts?.stroke,
      lineWidth: opts?.lineWidth ?? 0.6,
    });
  }

  build(): Uint8Array {
    const objects: string[] = [];
    const offsets: number[] = [0];

    const addObj = (body: string) => {
      objects.push(body);
      return objects.length;
    };

    // 1: Catalog
    // 2: Pages
    // 3: Font Helvetica
    // 4: Font Helvetica-Bold
    // then page + content pairs

    const fontRegular = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const fontBold = addObj(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
    );

    const pageObjIds: number[] = [];

    for (const ops of this.pages) {
      const stream = opsToStream(ops);
      const contentId = addObj(
        `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`
      );
      const pageId = addObj(
        [
          '<< /Type /Page',
          `/Parent 0 0 R`, // patched later
          `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
          `/Contents ${contentId} 0 R`,
          `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >>`,
          '>>',
        ].join('\n')
      );
      pageObjIds.push(pageId);
    }

    const kids = pageObjIds.map((id) => `${id} 0 R`).join(' ');
    const pagesId = addObj(
      `<< /Type /Pages /Kids [ ${kids} ] /Count ${pageObjIds.length} >>`
    );

    // Patch Parent references in page objects
    for (const pageId of pageObjIds) {
      objects[pageId - 1] = objects[pageId - 1].replace(
        '/Parent 0 0 R',
        `/Parent ${pagesId} 0 R`
      );
    }

    const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    // Assemble file
    let pdf = '%PDF-1.4\n';
    const fileOffsets: number[] = [0];

    for (let i = 0; i < objects.length; i++) {
      fileOffsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefPos = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(fileOffsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
    pdf += `startxref\n${xrefPos}\n%%EOF\n`;

    return new Uint8Array(Buffer.from(pdf, 'utf8'));
  }
}

function estimateTextWidth(text: string, size: number): number {
  // Approximate Helvetica average width factor
  return text.length * size * 0.5;
}

function opsToStream(ops: Op[]): string {
  const lines: string[] = [];
  for (const op of ops) {
    if (op.kind === 'text') {
      lines.push('BT');
      lines.push(`/${op.font} ${op.size} Tf`);
      lines.push(colorOps(op.color));
      lines.push(`1 0 0 1 ${op.x.toFixed(2)} ${op.y.toFixed(2)} Tm`);
      lines.push(`(${escapePdfText(op.text)}) Tj`);
      lines.push('ET');
    } else if (op.kind === 'line') {
      lines.push(strokeColorOps(op.color));
      lines.push(`${op.width} w`);
      lines.push(`${op.x1.toFixed(2)} ${op.y1.toFixed(2)} m`);
      lines.push(`${op.x2.toFixed(2)} ${op.y2.toFixed(2)} l`);
      lines.push('S');
    } else if (op.kind === 'rect') {
      if (op.fill) {
        lines.push(colorOps(op.fill));
        lines.push(
          `${op.x.toFixed(2)} ${op.y.toFixed(2)} ${op.w.toFixed(2)} ${op.h.toFixed(2)} re`
        );
        lines.push('f');
      }
      if (op.stroke) {
        lines.push(strokeColorOps(op.stroke));
        lines.push(`${op.lineWidth ?? 0.6} w`);
        lines.push(
          `${op.x.toFixed(2)} ${op.y.toFixed(2)} ${op.w.toFixed(2)} ${op.h.toFixed(2)} re`
        );
        lines.push('S');
      }
    }
  }
  return lines.join('\n');
}
