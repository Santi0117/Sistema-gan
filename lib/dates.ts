import { format, toZonedTime, fromZonedTime } from "date-fns-tz";
import { parse, parseISO } from "date-fns";

export const CR_TIMEZONE = "America/Costa_Rica";

/** Get current date/time in Costa Rica timezone */
export function nowCR(): Date {
  return toZonedTime(new Date(), CR_TIMEZONE);
}

/** Format a date as DD/MM/YYYY (Costa Rica locale) */
export function formatDateCR(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(toZonedTime(d, CR_TIMEZONE), "dd/MM/yyyy", {
    timeZone: CR_TIMEZONE,
  });
}

/** Format a date as DD/MM/YYYY HH:mm */
export function formatDateTimeCR(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(toZonedTime(d, CR_TIMEZONE), "dd/MM/yyyy HH:mm", {
    timeZone: CR_TIMEZONE,
  });
}

/** Format date as YYYYMMDD for clave numérica */
export function formatDateKey(date: Date): string {
  return format(toZonedTime(date, CR_TIMEZONE), "ddMMyyyy", {
    timeZone: CR_TIMEZONE,
  });
}

/** Convert a Costa Rica local date to UTC for storage */
export function crToUtc(date: Date): Date {
  return fromZonedTime(date, CR_TIMEZONE);
}

/** Parse a date string in DD/MM/YYYY format */
export function parseDateCR(dateStr: string): Date {
  return parse(dateStr, "dd/MM/yyyy", new Date());
}
