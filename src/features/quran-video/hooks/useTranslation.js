import { useState, useEffect } from "react";
import { translationLanguages } from "../data/backgrounds";
import { sanitizeHTML } from "../utils/sanitize";

const API_BASE = "https://api.quran.com/api/v4";

export function useTranslation(chapterId, fromAyah, toAyah, translationId) {
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!translationId || !chapterId) {
      setTranslations([]);
      return;
    }

    let cancelled = false;

    async function fetchTranslations() {
      setLoading(true);
      try {
        
        const langEntry = translationLanguages.find((l) => l.id === translationId);
        const lang = langEntry?.lang || "en";
        const url = `${API_BASE}/verses/by_chapter/${chapterId}?language=${lang}&translations=${translationId}&fields=text_uthmani&per_page=286&page=1`;

        console.log("🌐 [Translation] جلب الترجمة:", url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!cancelled && data.verses) {
          
          const result = [];
          for (let ayah = fromAyah; ayah <= toAyah; ayah++) {
            const key = `${chapterId}:${ayah}`;
            const verse = data.verses.find((v) => v.verse_key === key);
            if (verse) {
              const trans = verse.translations?.[0];
              const text = sanitizeHTML(trans?.text);
              result.push({ verseKey: key, text });
            } else {
              result.push({ verseKey: key, text: "" });
            }
          }

          setTranslations(result);
          console.log("✅ [Translation] تم جلب", result.length, "ترجمة لنطاق", `${chapterId}:${fromAyah}-${toAyah}`);
        }
      } catch (err) {
        console.error("❌ [Translation] خطأ:", err.message);
        if (!cancelled) setTranslations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTranslations();
    return () => { cancelled = true; };
  }, [chapterId, fromAyah, toAyah, translationId]);

  return { translations, loading };
}
