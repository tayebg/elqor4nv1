export interface HisnChapter {
  index: number;
  title: string;
  items: { text: string; footnote?: string }[];
}

let cache: HisnChapter[] | null = null;

// Chapters that are introductory prose, not dhikr collections — skip from carousel picker.
const SKIP = new Set(["المقدمة", "فضل الذكر"]);

export async function loadHisn(): Promise<HisnChapter[]> {
  if (cache) return cache;
  const res = await fetch("/data/hisn.json");
  const raw: Record<string, { text: string[]; footnote?: string[] }> =
    await res.json();
  const out: HisnChapter[] = [];
  let idx = 1;
  for (const [title, ch] of Object.entries(raw)) {
    if (SKIP.has(title)) continue;
    const items = (ch.text || []).map((t, i) => ({
      text: t.trim(),
      footnote: ch.footnote?.[i]?.trim(),
    }));
    if (items.length === 0) continue;
    out.push({ index: idx++, title, items });
  }
  cache = out;
  return cache;
}
