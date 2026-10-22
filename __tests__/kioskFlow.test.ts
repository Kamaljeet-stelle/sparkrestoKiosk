import { changeQuantity, quoteCart, upsertLine } from '../src/services/cart';
import { parseCouponResponse } from '../src/services/coupon';
import { validateCustomer } from '../src/services/customer';
import { mapMenuResponse } from '../src/services/menuMapper';
import { parseMembers, parseSavedAddresses } from '../src/services/members';
import { buildOrderBody } from '../src/services/orderPayload';
import { parsePlaceOrderResponse } from '../src/services/orderResponse';
import { setSession } from '../src/services/session';
import type { CartLine, Product } from '../src/types/kiosk';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

const menuJson = {
  status: 'success',
  message: 'Menu fetched successfully',
  domainId: 803,
  currency: 'R',
  data: [
    {
      id: 31317,
      name: 'Burger',
      img: 'burger.jpg',
      img_url: 'https://example.test/burger.jpg',
      items: [
        {
          id: 31321,
          name: 'Aloo Tikki Burger',
          price: '70.00',
          img: 'aloo.jpg',
          img_url: 'https://example.test/aloo.jpg',
        },
        {
          id: 31319,
          name: 'Cheese Burger',
          price: '100.50',
          img: 'cheese.jpg',
          img_url: 'https://example.test/cheese.jpg',
        },
      ],
    },
    {
      id: 30123,
      name: 'Cakes',
      img: 'cakes.jpg',
      img_url: 'https://example.test/cakes.jpg',
      items: [
        {
          id: 30125,
          name: 'Birthday Cake',
          price: '1500.00',
          img: 'cake.jpg',
          img_url: 'https://example.test/cake.jpg',
        },
        {
          id: 30126,
          name: 'Placeholder Cake',
          price: '10.00',
          img: '',
          img_url: 'https://example.test/img/plan/default.png',
        },
      ],
    },
  ],
};

const aloo: Product = {
  id: '31321',
  name: 'Aloo Tikki Burger',
  price: '70.00',
  imageUrl: 'https://example.test/aloo.jpg',
  categoryId: '31317',
};

describe('self kiosk menu and cart', () => {
  test('maps JSON menu categories, prices, and images', () => {
    const menu = mapMenuResponse(menuJson);
    expect(menu.categories.map(category => category.name)).toEqual([
      'Burger',
      'Cakes',
    ]);
    expect(menu.categories[0].products.map(product => product.name)).toEqual([
      'Aloo Tikki Burger',
      'Cheese Burger',
    ]);
    expect(menu.categories[0].products[1].price).toBe('100.50');
    expect(menu.categories[1].products[0].imageUrl).toBe(
      'https://example.test/cake.jpg',
    );
    expect(menu.categories[1].products[1].imageUrl).toBe('');
  });

  test('adds a product once, then increases quantity up to the cap', () => {
    const once = upsertLine([], aloo);
    const twice = upsertLine(once, aloo);
    expect(twice).toEqual([
      expect.objectContaining({ productId: '31321', quantity: 2 }),
    ]);
    const capped = changeQuantity(twice, '31321', 250);
    expect(capped[0].quantity).toBe(99);
    expect(changeQuantity(capped, '31321', 0)).toEqual([]);
  });

  test('quotes subtotal, percentage and fixed discounts, and floors at zero', () => {
    const lines: CartLine[] = [
      {
        productId: '31321',
        name: 'Aloo Tikki Burger',
        imageUrl: '',
        unitPrice: '70.00',
        quantity: 2,
      },
      {
        productId: '31319',
        name: 'Cheese Burger',
        imageUrl: '',
        unitPrice: '100.50',
        quantity: 1,
      },
    ];
    expect(quoteCart(lines, null)).toEqual({
      subtotal: 240,
      discount: 0,
      total: 240,
    });
    expect(
      quoteCart(lines, {
        code: 'TEN',
        raw: '10~Percentage',
        offer: 10,
        offerType: 'Percentage',
      }),
    ).toEqual({ subtotal: 240, discount: 24, total: 216 });
    expect(
      quoteCart(lines, {
        code: 'BIG',
        raw: '500~Fixed',
        offer: 500,
        offerType: 'Fixed',
      }).total,
    ).toBe(0);
  });

  test('reads apply_coupon JSON responses', () => {
    expect(
      parseCouponResponse(
        JSON.stringify({
          status: 'success',
          message: 'Coupon applied successfully',
          data: {
            coupon_code: 'TBA1234567',
            coupon_offer: 5,
            coupon_offer_type: 'Percentage',
            raw: '5~Percentage',
          },
        }),
      ),
    ).toEqual({
      raw: '5~Percentage',
      offer: 5,
      offerType: 'Percentage',
    });
    expect(
      parseCouponResponse(
        JSON.stringify({
          status: 'error',
          message: 'Coupon does not exists!',
        }),
      ),
    ).toEqual({
      error: 'Coupon does not exists!',
    });
  });

  test('requires a name and contact before checkout', () => {
    expect(
      validateCustomer({ contact: '123', name: '', address: '' }),
    ).toEqual({
      name: 'Name Field is required!',
      contact: 'Please enter minimum 8 digits',
    });
    expect(
      validateCustomer({
        contact: '0821234567',
        name: 'Amina',
        address: '',
      }),
    ).toEqual({});
  });

  test('builds the place_order payload with aligned item arrays', async () => {
    await setSession({
      authToken: 'test-auth-token',
      domainId: '803',
    });
    const body = buildOrderBody({
      coupon: {
        code: 'TBA1234567',
        raw: '5~Fixed',
        offer: 5,
        offerType: 'Fixed',
      },
      quote: { subtotal: 170, discount: 5, total: 165 },
      customer: {
        contact: '0821234567',
        name: 'Amina',
        address: '',
      },
      lines: [
        {
          productId: '31321',
          name: 'Aloo Tikki Burger',
          imageUrl: '',
          unitPrice: '70.00',
          quantity: 1,
        },
        {
          productId: '31319',
          name: 'Cheese Burger',
          imageUrl: '',
          unitPrice: '100.00',
          quantity: 1,
        },
      ],
    });
    const params = new URLSearchParams(body);
    expect(params.get('domainId')).toBe('803');
    expect(params.get('auth_token')).toBeTruthy();
    expect(params.get('customer_name')).toBe('Amina');
    expect(params.get('delivery_address')).toBeNull();
    expect(params.get('apply_coupon')).toBe('TBA1234567');
    expect(params.get('coupan_amount')).toBe('5');
    expect(params.get('grandtotal')).toBe('165');
    expect(params.getAll('item_id[]')).toEqual(['31321', '31319']);
    expect(params.getAll('item_quantity[]')).toEqual(['1', '1']);
    expect(params.getAll('item_price[]')).toEqual(['70', '100']);
    expect(params.getAll('item_total[]')).toEqual(['70', '100']);
  });

  test('reads place_order JSON success and failure', () => {
    expect(
      parsePlaceOrderResponse(
        JSON.stringify({ status: 'error', message: 'All fields are required!' }),
      ),
    ).toEqual({ ok: false, message: 'All fields are required!' });

    expect(
      parsePlaceOrderResponse(
        JSON.stringify({
          status: 'success',
          message: 'Your order has been confirmed.',
          data: { bill_num: 1060 },
          vieworder: { html: '<div id="invoice-POS">Bill</div>', order_number: '1060' },
        }),
      ),
    ).toEqual({
      ok: true,
      message: 'Your order has been confirmed.',
      orderNumber: '1060',
      receiptHtml: '<div id="invoice-POS">Bill</div>',
    });
  });

  test('reads member suggestions and saved addresses', () => {
    expect(
      parseMembers([
        { label: '0821234567', value: '0821234567', name: 'Amina' },
        { value: '' },
      ]),
    ).toEqual([
      { contact: '0821234567', name: 'Amina', label: 'Amina · 0821234567' },
    ]);
    expect(
      parseSavedAddresses(
        '<div class="address-item" id="12 Oak Street" onclick="selected_address(this)">12 Oak Street</div>',
      ),
    ).toEqual(['12 Oak Street']);
  });
});
