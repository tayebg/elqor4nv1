export interface NawawiRaw {
  hadith: string;
  description: string;
}

export interface NawawiHadith {
  index: number;
  title: string;
  body: string;
  narrator: string;
}

let cache: NawawiHadith[] | null = null;

const ARABIC_NUMS = [
  "الأول", "الثاني", "الثالث", "الرابع", "الخامس",
  "السادس", "السابع", "الثامن", "التاسع", "العاشر",
];

export function hadithTitleAr(index: number): string {
  const n = index;
  if (n <= 10) return `الحديث ${ARABIC_NUMS[n - 1]}`;
  if (n < 20) return `الحديث ${ARABIC_NUMS[n - 11]} عشر`;
  if (n === 20) return `الحديث العشرون`;
  if (n < 30) return `الحديث ${ARABIC_NUMS[n - 21]} والعشرون`;
  if (n === 30) return `الحديث الثلاثون`;
  if (n < 40) return `الحديث ${ARABIC_NUMS[n - 31]} والثلاثون`;
  if (n === 40) return `الحديث الأربعون`;
  if (n === 41) return `الحديث الحادي والأربعون`;
  if (n === 42) return `الحديث الثاني والأربعون`;
  return `الحديث ${n}`;
}

function parse(raw: string, index: number): NawawiHadith {
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const title = lines[0] || hadithTitleAr(index);
  const rest = lines.slice(1).join(" ").trim();
  // narrator = last parenthetical
  const m = rest.match(/^(.*?)(\([^()]*رواه[^()]*\)|\([^()]*أخرجه[^()]*\))\s*\.?$/);
  if (m) {
    return { index, title, body: m[1].trim(), narrator: m[2].trim() };
  }
  return { index, title, body: rest, narrator: "" };
}

export async function loadNawawi(): Promise<NawawiHadith[]> {
  if (cache) return cache;
  const res = await fetch("/data/nawawi.json");
  const data: NawawiRaw[] = await res.json();
  cache = data.map((d, i) => parse(d.hadith, i + 1));
  return cache;
}

/** Split a hadith body into N slide pages. */
export function paginateHadith(body: string, targetLength: number = 650): string[] {
  if (body.length <= targetLength) return [body];
  // Split on sentence-ish boundaries (period, Arabic comma, exclamation, question, quotation closers).
  const sentences = body.split(/(?<=[\"\u201D”\.،!؟])\s+/);
  const pages: string[] = [];
  let cur = "";

  const pushCur = () => {
    if (!cur) return;
    if (cur.length > targetLength * 1.2) {
      const words = cur.split(/\s+/);
      let temp = "";
      for (const w of words) {
        if (temp.length + w.length + 1 > targetLength && temp) {
          pages.push(temp.trim());
          temp = w;
        } else {
          temp = temp ? `${temp} ${w}` : w;
        }
      }
      if (temp) pages.push(temp.trim());
    } else {
      pages.push(cur.trim());
    }
    cur = "";
  };

  for (const s of sentences) {
    if (cur.length + s.length + 1 > targetLength && cur) {
      pushCur();
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  pushCur();
  return pages;
}
