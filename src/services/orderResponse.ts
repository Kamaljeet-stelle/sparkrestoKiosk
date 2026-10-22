export function parsePlaceOrderResponse(body: string):
  | { ok: true; message: string; orderNumber: string; receiptHtml: string }
  | { ok: false; message: string } {
  try {
    const data = JSON.parse(body) as {
      status?: string;
      message?: string;
      order_number?: string | number;
      data?: {
        bill_num?: string | number;
        order_number?: string | number;
      };
      vieworder?: {
        html?: string;
        order_number?: string | number;
      };
    };
    if (data.status !== 'success') {
      return { ok: false, message: data.message || 'Order failed.' };
    }
    const orderNumber = String(
      data.data?.bill_num ??
        data.data?.order_number ??
        data.order_number ??
        data.vieworder?.order_number ??
        '',
    );
    const receiptHtml =
      typeof data.vieworder?.html === 'string' ? data.vieworder.html.trim() : '';
    return {
      ok: true,
      message: data.message || 'Your order has been confirmed.',
      orderNumber,
      receiptHtml,
    };
  } catch {
    return { ok: false, message: 'Invalid response.' };
  }
}
