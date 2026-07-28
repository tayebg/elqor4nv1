import { useState, useEffect } from "react";
import { fetchChapters, fetchReciters, fetchVerses, fetchTimedVerses } from "../services/quranApi";

export function useQuranData() {
  const [chapters, setChapters] = useState([]);
  const [reciters, setReciters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
          setChapters(chaptersData);
          
          const seen = new Map();
          const uniqueReciters = recitersData.filter((r) => {
            const name = r.reciter_name || r.translated_name?.name || "";
            if (seen.has(name)) return false;
            seen.set(name, true);
            return true;
          });
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
    return () => { cancelled = true; };
  }, []);

  return { chapters, reciters, loading, error };
}

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
        
        const data = await fetchVerses(chapterId, 1, 300);

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
    return () => { cancelled = true; };
  }, [chapterId, fromAyah, toAyah]);

  return { verses, loading, error };
}

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
        const result = await fetchTimedVerses(
          reciterId,
          chapterId,
          fromAyah,
          toAyah
        );

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
    return () => { cancelled = true; };
  }, [reciterId, chapterId, fromAyah, toAyah]);

  return { timedVerses: data.verses, audioUrl: data.audioUrl, loading, error };
}
