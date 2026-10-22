import type { CustomerDraft, CustomerErrors } from '../types/kiosk';

export function validateCustomer(customer: CustomerDraft): CustomerErrors {
  const errors: CustomerErrors = {};
  const contact = customer.contact.trim();

  if (!customer.name.trim()) {
    errors.name = 'Name Field is required!';
  }
  if (!contact) {
    errors.contact = 'Contact Field is required!';
  } else if (!/^\d{8,15}$/.test(contact)) {
    errors.contact = 'Please enter minimum 8 digits';
  }

  return errors;
}

export function digitsOnly(value: string, max = 15): string {
  return value.replace(/\D/g, '').slice(0, max);
}
