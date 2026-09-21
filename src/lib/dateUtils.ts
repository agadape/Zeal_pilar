const padDatePart = (value: number) => String(value).padStart(2, '0');

export function toLocalDateValue(value: Date | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function toLocalDateTimeValue(value: Date | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${toLocalDateValue(date)}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(Number.NaN);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(
  value: string,
  options: Intl.DateTimeFormatOptions
): string {
  const date = parseDateOnly(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', options);
}
