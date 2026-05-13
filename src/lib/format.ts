const UTC_LOCALE_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

export function formatDateTimeUTC(value: string | number | Date): string {
  return `${new Date(value).toLocaleString("en-GB", UTC_LOCALE_OPTS)} UTC`;
}
