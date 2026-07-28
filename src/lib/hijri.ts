// Umm al-Qura Hijri date via the platform Intl API. Zero-dep, ships in every
// evergreen browser. Returns Arabic-Indic digits for the display component and
// Latin digits for compact/formatter callers.

const AR_MONTHS_LONG = [
  "مُحَرَّم", "صَفَر", "رَبِيع الْأَوَّل", "رَبِيع الثَّانِي",
  "جُمَادَى الْأُولَى", "جُمَادَى الْآخِرَة", "رَجَب", "شَعْبَان",
  "رَمَضَان", "شَوَّال", "ذُو الْقَعْدَة", "ذُو الْحِجَّة",
];

export interface HijriParts {
  day: number;
  month: number; // 1-12
  year: number;
  monthAr: string;
}

export function getHijri(date: Date = new Date()): HijriParts {
  // 'en-u-ca-islamic-umalqura' gives us numeric parts we can parse safely,
  // avoiding locale-specific digit shaping.
  const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric", month: "numeric", year: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const day = get("day");
  const month = get("month");
  const year = get("year");
  return { day, month, year, monthAr: AR_MONTHS_LONG[month - 1] ?? "" };
}

/** e.g. "15 رَمَضَان 1447هـ" — Western digits per app-wide UI convention. */
export function formatHijriLong(date: Date = new Date()): string {
  const h = getHijri(date);
  return `${h.day} ${h.monthAr} ${h.year}هـ`;
}

/** e.g. "15 Ramadan 1447 AH" (Latin, for meta/log usage) */
export function formatHijriLatin(date: Date = new Date()): string {
  const h = getHijri(date);
  return `${h.day} ${h.monthAr} ${h.year} AH`;
}
