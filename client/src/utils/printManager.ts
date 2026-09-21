import { PrintLayout } from '../types/photobooth';

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
