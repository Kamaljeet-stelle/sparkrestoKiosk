import { Platform } from 'react-native';
import RNPrint from 'react-native-print';

/** Print the bill HTML returned by place_order (`vieworder.html`). */
export async function printOrderReceipt(receiptHtml: string) {
  if (Platform.OS === 'ios') {
    return;
  }

  const fragment = receiptHtml.trim();
  if (!fragment) {
    throw new Error('No receipt HTML to print.');
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          html, body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
          .row,
          .col-lg-12,
          .col-xs-12,
          .box,
          .box-content,
          #container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            float: none !important;
            box-shadow: none !important;
            border: none !important;
          }
          #invoice-POS,
          #invoice-POS.inch_2,
          #invoice-POS.inch_3 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          #invoice-POS table {
            width: 100% !important;
          }
          #invoice-POS img {
            max-width: 100% !important;
            height: auto !important;
          }
        </style>
      </head>
      <body>
        ${fragment.replace(/<script[\s\S]*?<\/script>/gi, '')}
      </body>
    </html>
  `;

  await RNPrint.print({ html });
}
