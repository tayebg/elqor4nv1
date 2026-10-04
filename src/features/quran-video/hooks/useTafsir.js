import { useState, useEffect } from "react";
import { sanitizeHTML } from "../utils/sanitize";

const API_BASE = "https://api.quran.com/api/v4";

export function useTafsir(chapterId, fromAyah, toAyah, tafsirId) {
  const [tafsirs, setTafsirs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tafsirId || !chapterId) {
      setTafsirs([]);
      return;
    }

    let cancelled = false;

    async function fetchTafsirs() {
      setLoading(true);
      try {
        const results = [];
        for (let ayah = fromAyah; ayah <= toAyah; ayah++) {
          const verseKey = `${chapterId}:${ayah}`;
          const url = `${API_BASE}/tafsirs/${tafsirId}/by_ayah/${verseKey}`;
          console.log("📖 [Tafsir] جلب:", url);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          const text = sanitizeHTML(data.tafsir?.text);

          results.push({ verseKey, text });
        }

        if (!cancelled) {
          setTafsirs(results);
          console.log("✅ [Tafsir] تم جلب", results.length, "تفسير");
        }
      } catch (err) {
        console.error("❌ [Tafsir] خطأ:", err.message);
        if (!cancelled) setTafsirs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTafsirs();
    return () => {
      cancelled = true;
    };
  }, [chapterId, fromAyah, toAyah, tafsirId]);

  return { tafsirs, loading };
}
