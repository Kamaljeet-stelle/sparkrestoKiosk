export function formatProductName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(
      /(^|[^a-z0-9]+)([a-z])/g,
      (_match, lead: string, letter: string) => `${lead}${letter.toUpperCase()}`,
    );
}
