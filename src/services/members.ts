import type { MemberSuggestion } from '../types/kiosk';
import { decodeHtml, htmlToText } from '../utils/html';

function asString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

export function parseMembers(data: unknown): MemberSuggestion[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const suggestions: MemberSuggestion[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const contact = asString(row.value ?? row.contact ?? row.phone ?? row.label);
    const name = asString(row.name ?? row.customer_name ?? '');
    if (!contact) {
      continue;
    }
    const cleanName = name === contact ? '' : name;
    suggestions.push({
      contact,
      name: cleanName,
      label: cleanName ? `${cleanName} · ${contact}` : contact,
    });
  }
  return suggestions;
}

export function parseSavedAddresses(html: string): string[] {
  const addresses: string[] = [];
  const tagRe = /<(div|li|a|span|p|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    const attrs = match[2];
    if (!/address/i.test(attrs) && !/selected_address/i.test(attrs)) {
      continue;
    }
    const id = /id="([^"]+)"/i.exec(attrs)?.[1];
    const fromId =
      id && id !== 'delivery_address' && id !== 'customer_contact_wrap'
        ? decodeHtml(id).trim()
        : '';
    const fromText = htmlToText(match[3]);
    const value = fromId || fromText;
    if (value) {
      addresses.push(value);
    }
  }
  return [...new Set(addresses)];
}
