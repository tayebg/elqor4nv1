import { useState, useEffect } from "react";
import {
  fetchChapters,
  fetchReciters,
  fetchVerses,
  fetchTimedVerses,
} from "../services/quranApi";

let cachedChapters = null;
let cachedReciters = null;

export function useQuranData() {
  const [chapters, setChapters] = useState(cachedChapters || []);
  const [reciters, setReciters] = useState(cachedReciters || []);
  const [loading, setLoading] = useState(!cachedChapters);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedChapters && cachedReciters) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [chaptersData, recitersData] = await Promise.all([
          fetchChapters("ar"),
          fetchReciters("ar"),
        ]);

        if (!cancelled) {
          cachedChapters = chaptersData;
          setChapters(chaptersData);

          const seen = new Map();
          const uniqueReciters = recitersData.filter((r) => {
            const name = r.reciter_name || r.translated_name?.name || "";
            if (seen.has(name)) return false;
            seen.set(name, true);
            return true;
          });
          cachedReciters = uniqueReciters;
          setReciters(uniqueReciters);
        }
      } catch (err) {
        console.error("❌ خطأ في جلب البيانات:", err);
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { chapters, reciters, loading, error };
}

const versesCache = new Map();

export function useVerses(chapterId, fromAyah, toAyah) {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chapterId) return;

    let cancelled = false;

    async function loadVerses() {
      setLoading(true);
      setError(null);

      try {
        const cacheKey = `${chapterId}`;
        let data;
        if (versesCache.has(cacheKey)) {
          data = versesCache.get(cacheKey);
        } else {
          data = await fetchVerses(chapterId, 1, 300);
          versesCache.set(cacheKey, data);
        }

        if (!cancelled) {
          const filtered = (data.verses || []).filter((v) => {
            const ayahNum = v.verse_number;
            return ayahNum >= fromAyah && ayahNum <= toAyah;
          });
          setVerses(filtered);
        }
      } catch (err) {
        console.error("❌ خطأ في جلب الآيات:", err);
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVerses();
    return () => {
      cancelled = true;
    };
  }, [chapterId, fromAyah, toAyah]);

  return { verses, loading, error };
}

const timedVersesCache = new Map();

export function useTimedVerses(reciterId, chapterId, fromAyah, toAyah) {
  const [data, setData] = useState({ verses: [], audioUrl: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reciterId || !chapterId) return;

    let cancelled = false;

    async function loadTimedVerses() {
      setLoading(true);
      setError(null);

      setData({ verses: [], audioUrl: "" });

      try {
        const cacheKey = `${reciterId}-${chapterId}-${fromAyah}-${toAyah}`;
        let result;
        if (timedVersesCache.has(cacheKey)) {
          result = timedVersesCache.get(cacheKey);
        } else {
          result = await fetchTimedVerses(
            reciterId,
            chapterId,
            fromAyah,
            toAyah,
          );
          timedVersesCache.set(cacheKey, result);
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        console.error("❌ خطأ في جلب التوقيتات:", err);
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTimedVerses();
    return () => {
      cancelled = true;
    };
  }, [reciterId, chapterId, fromAyah, toAyah]);

  return { timedVerses: data.verses, audioUrl: data.audioUrl, loading, error };
}
