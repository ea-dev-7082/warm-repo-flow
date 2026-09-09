const MM_TO_PX = 96 / 25.4;

export type PrintOrientation = "landscape" | "portrait";

export interface PrintDocumentOptions {
  /** id do elemento que será impresso */
  elementId: string;
  /** CSS específico do documento (classes utilitárias já usadas hoje) */
  css: string;
  title?: string;
  orientation?: PrintOrientation;
  /** margem da página em mm */
  marginMm?: number;
  /** "auto" reduz o conteúdo até caber em uma única folha; "none" mantém o tamanho original */
  fit?: "auto" | "none";
  /** menor fator de redução aceito antes de deixar paginar normalmente */
  minScale?: number;
}

const A4_LONG_MM = 297;
const A4_SHORT_MM = 210;

export function printDocument({
  elementId,
  css,
  title = "Documento",
  orientation = "landscape",
  marginMm = 8,
  fit = "auto",
  minScale = 0.7,
}: PrintDocumentOptions) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const printWin = window.open("", "_blank", "width=900,height=700");
  if (!printWin) return;

  const pageWidthMm = (orientation === "landscape" ? A4_LONG_MM : A4_SHORT_MM) - marginMm * 2;
  const pageHeightMm = (orientation === "landscape" ? A4_SHORT_MM : A4_LONG_MM) - marginMm * 2;
  const pageWidthPx = Math.floor(pageWidthMm * MM_TO_PX);
  const pageHeightPx = Math.floor(pageHeightMm * MM_TO_PX);

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          ${css}

          html, body { height: auto !important; overflow: visible !important; }
          body { width: ${pageWidthPx}px; }
          #print-fit-root { transform-origin: top left; width: ${pageWidthPx}px; }
          #print-fit-root > * { max-width: 100%; }

          @page { size: A4 ${orientation}; margin: ${marginMm}mm; }
          @media print {
            @page { size: A4 ${orientation}; margin: ${marginMm}mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            select, input, .print\\:hidden { display: none !important; }
            .print\\:inline { display: inline !important; }
            .print\\:block { display: block !important; }
            .grid, .flex, .border-2 > div, tr, thead, tfoot { break-inside: avoid; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body><div id="print-fit-root">${el.outerHTML}</div></body>
    </html>
  `);
  printWin.document.close();
  printWin.focus();

  const finish = () => {
    try {
      if (fit === "auto") {
        const root = printWin.document.getElementById("print-fit-root");
        if (root) {
          const contentHeight = root.scrollHeight;
          if (contentHeight > pageHeightPx) {
            const factor = pageHeightPx / contentHeight;
            if (factor >= minScale) {
              root.style.transform = `scale(${factor})`;
              root.style.height = `${pageHeightPx}px`;
            }
          }
        }
      }
    } catch {
      /* ignora falhas de medição e imprime normalmente */
    }
    printWin.print();
    printWin.close();
  };

  const waitReady = (attempts = 0) => {
    if (printWin.closed) return;
    if (printWin.document.readyState === "complete" || attempts > 40) {
      // um frame extra para garantir layout calculado
      printWin.requestAnimationFrame(() => printWin.requestAnimationFrame(finish));
      return;
    }
    printWin.setTimeout(() => waitReady(attempts + 1), 50);
  };

  waitReady();
}
