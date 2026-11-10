import PDFDocument from 'pdfkit';
import { formatDateFr, formatMoney, formatQuantity } from './format.js';

export interface QuotePdfInput {
  workshopName: string;
  reference: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  title: string;
  description: string | null;
  createdAt: Date;
  validUntil: string | null;
  client: {
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  lines: {
    label: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    vatRate: string;
    totalExclTax: string;
  }[];
  totals: { totalExclTax: string; totalVat: string; totalInclTax: string };
}

const STATUS_LABELS: Record<QuotePdfInput['status'], string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
};

const MARGIN = 50;
const CONTENT_WIDTH = 595.28 - 2 * MARGIN;
const TEXT = '#111827';
const MUTED = '#6B7280';
const LINE = '#D1D5DB';
const HEADER_FILL = '#E5E7EB';
const BOX_FILL = '#F3F4F6';

type Column = {
  label: string;
  width: number;
  align: 'left' | 'right';
};

const COLUMNS: Column[] = [
  { label: 'Désignation', width: 215, align: 'left' },
  { label: 'Qté', width: 45, align: 'right' },
  { label: 'Unité', width: 50, align: 'left' },
  { label: 'PU HT', width: 70, align: 'right' },
  { label: 'TVA', width: 45, align: 'right' },
  { label: 'Total HT', width: 70, align: 'right' },
];

/** Génère le PDF d'un devis (A4) et le renvoie sous forme de Buffer. */
export function renderQuotePdf(input: QuotePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      bufferPages: true,
      info: {
        Title: `Devis ${input.reference}`,
        Author: input.workshopName,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const bottomLimit = () => doc.page.height - MARGIN - 20;

    // --- En-tête : atelier à gauche, référence et dates à droite -----------
    const rightX = MARGIN + CONTENT_WIDTH - 230;
    let y = MARGIN;

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(TEXT)
      .text(input.workshopName, MARGIN, y, { width: 250 });
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('DEVIS', rightX, y, { width: 230, align: 'right' });
    y += 30;

    const metaLines = [
      `N° ${input.reference}`,
      `Date : ${formatDateFr(input.createdAt)}`,
      ...(input.validUntil
        ? [`Valable jusqu’au ${formatDateFr(input.validUntil)}`]
        : []),
      `Statut : ${STATUS_LABELS[input.status]}`,
    ];
    doc.font('Helvetica').fontSize(10).fillColor(TEXT);
    for (const line of metaLines) {
      doc.text(line, rightX, y, { width: 230, align: 'right' });
      y += 14;
    }

    // --- Bloc client -------------------------------------------------------
    const clientLines = [
      input.client.name,
      ...(input.client.address ? [input.client.address] : []),
      ...(input.client.phone ? [`Tél. : ${input.client.phone}`] : []),
      ...(input.client.email ? [input.client.email] : []),
    ];
    const boxY = Math.max(y + 10, 130);
    const boxHeight = 28 + clientLines.length * 14;

    doc.roundedRect(MARGIN, boxY, 260, boxHeight, 4).fill(BOX_FILL);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(`CLIENT  ${input.client.code}`, MARGIN + 10, boxY + 8, {
        width: 240,
      });
    doc.fontSize(10).fillColor(TEXT);
    clientLines.forEach((line, index) => {
      doc
        .font(index === 0 ? 'Helvetica-Bold' : 'Helvetica')
        .text(line, MARGIN + 10, boxY + 24 + index * 14, { width: 240 });
    });

    // --- Titre et description ---------------------------------------------
    y = boxY + boxHeight + 24;
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(TEXT)
      .text(input.title, MARGIN, y, { width: CONTENT_WIDTH });
    if (input.description) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(MUTED)
        .text(input.description, MARGIN, doc.y + 4, { width: CONTENT_WIDTH });
    }
    y = doc.y + 18;

    // --- Tableau des lignes ------------------------------------------------
    const drawTableHeader = (top: number) => {
      doc.rect(MARGIN, top, CONTENT_WIDTH, 20).fill(HEADER_FILL);
      let x = MARGIN;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT);
      for (const column of COLUMNS) {
        doc.text(column.label, x + 4, top + 6, {
          width: column.width - 8,
          align: column.align,
        });
        x += column.width;
      }
      return top + 20;
    };

    y = drawTableHeader(y);

    for (const line of input.lines) {
      const cells = [
        line.label,
        formatQuantity(line.quantity),
        line.unit,
        formatMoney(line.unitPrice),
        `${formatQuantity(line.vatRate)} %`,
        formatMoney(line.totalExclTax),
      ];

      doc.font('Helvetica').fontSize(9);
      const labelHeight = doc.heightOfString(cells[0], {
        width: COLUMNS[0].width - 8,
      });
      const rowHeight = Math.max(20, labelHeight + 10);

      if (y + rowHeight > bottomLimit()) {
        doc.addPage();
        y = drawTableHeader(MARGIN);
      }

      let x = MARGIN;
      doc.font('Helvetica').fontSize(9).fillColor(TEXT);
      COLUMNS.forEach((column, index) => {
        doc.text(cells[index], x + 4, y + 6, {
          width: column.width - 8,
          align: column.align,
        });
        x += column.width;
      });

      y += rowHeight;
      doc
        .moveTo(MARGIN, y)
        .lineTo(MARGIN + CONTENT_WIDTH, y)
        .lineWidth(0.5)
        .strokeColor(LINE)
        .stroke();
    }

    // --- Totaux ------------------------------------------------------------
    const totalsHeight = 70;
    if (y + 16 + totalsHeight > bottomLimit()) {
      doc.addPage();
      y = MARGIN - 16;
    }
    y += 16;

    const totalsX = MARGIN + CONTENT_WIDTH - 230;
    const totalRows: [string, string, boolean][] = [
      ['Total HT', input.totals.totalExclTax, false],
      ['TVA', input.totals.totalVat, false],
      ['Total TTC', input.totals.totalInclTax, true],
    ];

    totalRows.forEach(([label, value, strong], index) => {
      const rowY = y + index * 20;
      if (strong) {
        doc
          .moveTo(totalsX, rowY - 4)
          .lineTo(totalsX + 230, rowY - 4)
          .lineWidth(1)
          .strokeColor(TEXT)
          .stroke();
      }
      doc
        .font(strong ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(strong ? 12 : 10)
        .fillColor(TEXT)
        .text(label, totalsX, rowY, { width: 110 });
      doc.text(formatMoney(value), totalsX + 110, rowY, {
        width: 120,
        align: 'right',
      });
    });

    // --- Pied de page : numéro de page sur chaque page ---------------------
    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index++) {
      doc.switchToPage(range.start + index);
      // Écrire dans la marge basse ajouterait une page : on la neutralise.
      doc.page.margins.bottom = 0;
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(MUTED)
        .text(
          `${input.reference} - Page ${index + 1} / ${range.count}`,
          MARGIN,
          doc.page.height - 35,
          { width: CONTENT_WIDTH, align: 'center' }
        );
    }

    doc.end();
  });
}
