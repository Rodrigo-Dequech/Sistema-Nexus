export function formatQuotationNumber(number) {
  if (!number) return 'COT-0001';
  const parts = number.split('-');
  if (parts.length < 3) {
    return number;
  }
  const suffix = parts[parts.length - 1];
  return `COT-${suffix.substring(0, 4).toUpperCase()}`;
}

