import { useState, useEffect, useRef } from "react";

export function useAudioBlob(audioUrl) {
  const [blobUrl, setBlobUrl] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const prevUrlRef = useRef("");

  useEffect(() => {
    if (!audioUrl || audioUrl === prevUrlRef.current) return;
    prevUrlRef.current = audioUrl;

    let cancelled = false;
    let currentBlobUrl = "";

    async function fetchAudioAsBlob() {
      setBlobUrl("");
      setAudioBlob(null);
      setLoading(true);
      setProgress(0);
      setError(null);

      try {
        console.log("🔊 [useAudioBlob] جارٍ جلب الصوت:", audioUrl);

        const blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", audioUrl, true);
          xhr.responseType = "blob";

          xhr.onprogress = (e) => {
            if (e.lengthComputable && !cancelled) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(
                new Error(
                  `فشل جلب الصوت: HTTP ${xhr.status} ${xhr.statusText}`,
                ),
              );
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.ontimeout = () => reject(new Error("Timeout"));
          xhr.send();
        });

        console.log(
          "✅ [useAudioBlob] تم جلب الصوت بنجاح:",
          (blob.size / 1024 / 1024).toFixed(2),
          "MB",
        );

        if (!cancelled) {
          currentBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(currentBlobUrl);
          setAudioBlob(blob);
        }
      } catch (err) {
        console.error("❌ [useAudioBlob] خطأ في جلب الصوت:", err.message);
        if (!cancelled) {
          setError(err.message);
          setBlobUrl("");
          setAudioBlob(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAudioAsBlob();

    return () => {
      cancelled = true;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, []);

  return { blobUrl, audioBlob, loading, progress, error };
}
