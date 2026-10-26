import type { Category, Menu, Product } from '../types/kiosk';

type ApiMenuItem = {
  id?: number | string;
  name?: string;
  price?: string | number;
  img?: string;
  img_url?: string;
};

type ApiMenuCategory = {
  id?: number | string;
  name?: string;
  img?: string;
  img_url?: string;
  items?: ApiMenuItem[];
};

type ApiMenuResponse = {
  status?: string;
  message?: string;
  data?: ApiMenuCategory[];
};

function isDefaultImage(img: string | undefined, imgUrl: string | undefined): boolean {
  if (!imgUrl) {
    return true;
  }
  if (!img) {
    return true;
  }
  return /\/default\.png(?:\?|$)/i.test(imgUrl);
}

function imageUrl(img: string | undefined, imgUrl: string | undefined): string {
  return isDefaultImage(img, imgUrl) ? '' : String(imgUrl).trim();
}

export function mapMenuResponse(payload: unknown): Menu {
  const body = (payload ?? {}) as ApiMenuResponse;
  if (body.status && body.status !== 'success') {
    throw new Error(body.message || 'Unable to load the menu.');
  }

  const rows = Array.isArray(body.data) ? body.data : [];
  const categories: Category[] = rows
    .map(row => {
      const categoryId = String(row.id ?? '').trim();
      const name = String(row.name ?? '').trim();
      if (!categoryId || !name) {
        return null;
      }
      const products: Product[] = (Array.isArray(row.items) ? row.items : [])
        .map(item => {
          const id = String(item.id ?? '').trim();
          const itemName = String(item.name ?? '').trim();
          if (!id || !itemName) {
            return null;
          }
          return {
            id,
            name: itemName,
            price: String(item.price ?? '0'),
            imageUrl: imageUrl(item.img, item.img_url),
            categoryId,
          };
        })
        .filter((product): product is Product => product != null);

      return {
        id: categoryId,
        name,
        imageUrl: imageUrl(row.img, row.img_url),
        products,
      };
    })
    .filter(
      (category): category is Category =>
        category != null && category.products.length > 0,
    );

  if (categories.length === 0) {
    throw new Error('The menu is empty right now.');
  }

  return { categories };
}
