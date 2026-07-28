import { useState, useCallback } from "react";
import { searchPixabay } from "@/lib/pixabay.functions";

export function usePixabay() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, type = "image") => {
    const q = query?.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const pixabayResults = await searchPixabay({ data: { q, type } });
      setResults(pixabayResults);
    } catch (err) {
      console.error("[Pixabay]", err);
      setError(err?.message || "Pixabay error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchImages = useCallback((query) => search(query, "image"), [search]);
  const searchVideos = useCallback((query) => search(query, "video"), [search]);

  return { results, images: results, loading, error, searchImages, searchVideos, search };
}
