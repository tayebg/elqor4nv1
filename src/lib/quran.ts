import { HIZB_STARTS, THUMUN_END_LABELS } from "./hizb-map";

export interface Ayah {
  id: number;
  jozz: number;
  page: string;
  sura_no: number;
  sura_name_en: string;
  sura_name_ar: string;
  line_start: number;
  line_end: number;
  aya_no: number;
  aya_text: string;
}

let cache: Ayah[] | null = null;

export async function loadQuran(): Promise<Ayah[]> {
  if (cache) return cache;
  const res = await fetch("/quran/warsh.json");
  if (!res.ok) throw new Error("Failed to load Warsh data");
  cache = (await res.json()) as Ayah[];
  return cache;
}

export const RUB_HIZB = "\u06DE"; // ۞

function startsWithRubHizb(text: string) {
  return /^[\s\u00a0]*۞/.test(text);
}

function stripLeadingRubHizb(text: string) {
  return text.replace(/^[\s\u00a0]*۞[\s\u00a0]*/, "");
}

export interface AyahRender {
  ayah: Ayah;
  endLabel?: string;
  endLabelInline?: boolean;
  startsSurah?: number;
}

export interface HizbSlice {
  hizb: number;
  ayahs: Ayah[];
  rendered: AyahRender[];
}

/**
 * Hizb boundaries are anchored to the canonical KFGQPC HIZB_STARTS table.
 * Hizb h spans [start(h), start(h+1) - 1]. This eliminates drift caused by
 * dataset ۞-markers being fewer than 60×8 = 480 (dataset has ~434).
 * Within each hizb, ۞ markers are used only for label placement.
 */
function indexOfStart(all: Ayah[], sura: number, aya: number) {
  const idx = all.findIndex((a) => a.sura_no === sura && a.aya_no === aya);
  return idx < 0 ? 0 : idx;
}

let boundariesCache: Array<{ startIdx: number; endIdx: number }> | null = null;
function getHizbBoundaries(all: Ayah[]) {
  if (boundariesCache) return boundariesCache;
  const bounds: Array<{ startIdx: number; endIdx: number }> = [];
  for (let h = 1; h <= HIZB_STARTS.length; h++) {
    const cur = HIZB_STARTS[h - 1];
    const startIdx = indexOfStart(all, cur.sura, cur.aya);
    const next = HIZB_STARTS[h] ?? null;
    const endIdx = next
      ? Math.max(startIdx, indexOfStart(all, next.sura, next.aya) - 1)
      : all.length - 1;
    bounds.push({ startIdx, endIdx });
  }
  boundariesCache = bounds;
  return bounds;
}

export function getHizbSlice(all: Ayah[], hizb: number): HizbSlice {
  const { startIdx, endIdx } = getHizbBoundaries(all)[hizb - 1];
  const ayahs = all.slice(startIdx, endIdx + 1);

  const rendered: AyahRender[] = ayahs.map((a, index) => ({
    ayah: index === 0 && hizb > 1 && startsWithRubHizb(a.aya_text)
      ? { ...a, aya_text: stripLeadingRubHizb(a.aya_text) }
      : a,
  }));

  // Place labels at ۞ occurrences within the hizb, in order.
  let count = 0;
  for (let i = 0; i < ayahs.length; i++) {
    if (rendered[i].ayah.aya_text.includes(RUB_HIZB)) {
      const labelIdx = Math.min(count, THUMUN_END_LABELS.length - 1);
      rendered[i].endLabel = THUMUN_END_LABELS[labelIdx];
      rendered[i].endLabelInline = true;
      count++;
    }
  }
  // Ensure the last ayah of every hizb carries the "حِزْبٌ" label,
  // even if the dataset lacks a ۞ at that exact position.
  const last = rendered.length - 1;
  if (last >= 0) {
    const already = rendered[last].endLabel === THUMUN_END_LABELS[THUMUN_END_LABELS.length - 1];
    if (!already) {
      // If the last ayah already has some earlier label (e.g. "ثُمُنٌ"),
      // still overwrite to "حِزْبٌ" — end-of-hizb takes precedence.
      rendered[last].endLabel = THUMUN_END_LABELS[THUMUN_END_LABELS.length - 1];
      // If a ۞ is inside the ayah use inline; otherwise append at end.
      rendered[last].endLabelInline = rendered[last].ayah.aya_text.includes(RUB_HIZB);
    }
  }

  // Flag surah starts.
  for (let i = 0; i < ayahs.length; i++) {
    const prevSura = i === 0 ? null : ayahs[i - 1].sura_no;
    if (prevSura !== ayahs[i].sura_no && ayahs[i].aya_no === 1) {
      rendered[i].startsSurah = ayahs[i].sura_no;
    }
  }
  return { hizb, ayahs, rendered };
}

export interface ContentPage {
  items: AyahRender[];
}

export function paginateHizb(slice: HizbSlice, maxPages = 18): ContentPage[] {
  const { rendered } = slice;
  if (rendered.length === 0) return [];
  const weights = rendered.map((r) => r.ayah.aya_text.length);
  const total = weights.reduce((s, w) => s + w, 0);
  const target = total / maxPages;
  const pages: AyahRender[][] = [];
  let cur: AyahRender[] = [];
  let curW = 0;
  for (let i = 0; i < rendered.length; i++) {
    cur.push(rendered[i]);
    curW += weights[i];
    const remaining = maxPages - pages.length - 1;
    if (remaining > 0 && curW >= target * 0.95 && rendered.length - i - 1 >= remaining) {
      pages.push(cur);
      cur = [];
      curW = 0;
    }
  }
  if (cur.length) pages.push(cur);
  return pages.filter((p) => p.length > 0).map((items) => ({ items }));
}
