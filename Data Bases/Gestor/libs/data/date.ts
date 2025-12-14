export function getCurrentMonth(locale: string = "es-ES"): string {
  const now = new Date();

  const monthName = now.toLocaleDateString(locale, {
    month: "long",
  });

  const year = now.getFullYear();

  // Capitalizar primera letra
  const capitalizedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return `${capitalizedMonth} ${year}`;
}

export function getMonthYear(date: Date, locale: string = "es-ES"): string {
  const monthName = date.toLocaleDateString(locale, {
    month: "long",
  });

  const year = date.getFullYear();
  const capitalizedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return `${capitalizedMonth} ${year}`;
}

export function formatDate(
  date: Date | string,
  locale: string = "es-ES"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
