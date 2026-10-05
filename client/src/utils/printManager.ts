import { PrintLayout, TextPrintLayout, PrintTextOptions } from '../types/photobooth';

/**
 * Triggers printing of the polaroid photo strip using a hidden iframe.
 * Compatible with Chrome / Edge silent kiosk printing (--kiosk-printing).
 */
export function printPhotoStrip(
  photoUrl: string,
  layout: PrintLayout = 'single-2x6'
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!photoUrl) {
      resolve(false);
      return;
    }

    const iframeId = '__photobooth_print_iframe__';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;

    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const isDouble = layout === 'double-4x6';

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Print Photo Strip</title>
          <style>
            @page {
              size: ${isDouble ? '4in 6in' : '2in 6in'};
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: #fff;
              overflow: hidden;
            }
            .print-container {
              display: flex;
              flex-direction: row;
              width: 100%;
              height: 100%;
            }
            .strip-wrapper {
              flex: 1;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              position: relative;
            }
            ${
              isDouble
                ? `
            .strip-wrapper:first-child {
              border-right: 1px dashed #d1d5db;
            }
            `
                : ''
            }
            .strip-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="strip-wrapper">
              <img id="img1" class="strip-img" src="${photoUrl}" alt="Photo Strip" />
            </div>
            ${
              isDouble
                ? `
            <div class="strip-wrapper">
              <img id="img2" class="strip-img" src="${photoUrl}" alt="Photo Strip (Duplicate)" />
            </div>
            `
                : ''
            }
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      resolve(false);
      return;
    }

    doc.open();
    doc.write(printHtml);
    doc.close();

    const win = iframe.contentWindow;
    if (!win) {
      resolve(false);
      return;
    }

    const triggerPrint = () => {
      try {
        win.focus();
        win.print();
        resolve(true);
      } catch (err) {
        console.warn('Print trigger error:', err);
        resolve(false);
      }
    };

    const img1 = doc.getElementById('img1') as HTMLImageElement | null;
    if (img1) {
      if (img1.complete) {
        setTimeout(triggerPrint, 150);
      } else {
        img1.onload = () => setTimeout(triggerPrint, 150);
        img1.onerror = () => resolve(false);
      }
    } else {
      setTimeout(triggerPrint, 250);
    }
  });
}

/**
 * Triggers printing of text/diagnostic receipts using a hidden iframe.
 * Compatible with Chrome / Edge silent kiosk printing (--kiosk-printing).
 */
export function printTextDocument(options: PrintTextOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const { title = 'PHOTOBOOTH TEST PRINT', text, layout, showRuler = false } = options;

    const iframeId = '__photobooth_text_print_iframe__';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;

    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const now = new Date();
    const timestamp = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });

    let pageSizeRule = '2in 6in';
    let pageMargin = '0';
    let containerWidth = '100%';
    let fontSize = '12px';

    switch (layout) {
      case 'double-4x6':
        pageSizeRule = '4in 6in';
        pageMargin = '0';
        containerWidth = '100%';
        fontSize = '12px';
        break;
      case 'thermal-58':
        pageSizeRule = '58mm auto';
        pageMargin = '2mm';
        containerWidth = '48mm';
        fontSize = '11px';
        break;
      case 'thermal-80':
        pageSizeRule = '80mm auto';
        pageMargin = '3mm';
        containerWidth = '72mm';
        fontSize = '12px';
        break;
      case 'a4':
        pageSizeRule = 'A4 portrait';
        pageMargin = '10mm';
        containerWidth = '100%';
        fontSize = '14px';
        break;
      case 'single-2x6':
      default:
        pageSizeRule = '2in 6in';
        pageMargin = '0';
        containerWidth = '100%';
        fontSize = '11px';
        break;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              size: ${pageSizeRule};
              margin: ${pageMargin};
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 100%;
              background: #fff;
              color: #000;
              font-family: 'Courier New', Courier, monospace;
              font-size: ${fontSize};
              line-height: 1.35;
            }
            .page-container {
              width: ${containerWidth};
              margin: 0 auto;
              padding: ${layout.startsWith('thermal') ? '4px' : '16px'};
              position: relative;
            }
            .ruler-border {
              border: 1px dashed #000;
              padding: 10px;
              position: relative;
            }
            .corner {
              position: absolute;
              font-weight: bold;
              font-size: 14px;
              line-height: 1;
            }
            .tl { top: 2px; left: 2px; }
            .tr { top: 2px; right: 2px; }
            .bl { bottom: 2px; left: 2px; }
            .br { bottom: 2px; right: 2px; }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .title {
              font-weight: bold;
              font-size: 1.15em;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .meta {
              font-size: 0.85em;
              color: #333;
            }
            .content {
              white-space: pre-wrap;
              word-break: break-word;
              margin-bottom: 12px;
            }
            .footer {
              border-top: 1px dashed #000;
              padding-top: 8px;
              margin-top: 10px;
              text-align: center;
              font-size: 0.85em;
            }
          </style>
        </head>
        <body>
          <div class="page-container ${showRuler ? 'ruler-border' : ''}">
            ${showRuler ? `
              <div class="corner tl">+</div>
              <div class="corner tr">+</div>
              <div class="corner bl">+</div>
              <div class="corner br">+</div>
            ` : ''}
            <div class="header">
              <div class="title">${title}</div>
              <div class="meta">Waktu: ${timestamp}</div>
              <div class="meta">Layout: ${layout}</div>
            </div>
            <div class="content">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="footer">
              <div>*** PHOTOBOOTH TEST OK ***</div>
              <div>Hardware & Spooler Diagnostic</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      resolve(false);
      return;
    }

    doc.open();
    doc.write(printHtml);
    doc.close();

    const win = iframe.contentWindow;
    if (!win) {
      resolve(false);
      return;
    }

    setTimeout(() => {
      try {
        win.focus();
        win.print();
        resolve(true);
      } catch (err) {
        console.warn('Text print trigger error:', err);
        resolve(false);
      }
    }, 150);
  });
}

