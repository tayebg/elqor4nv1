import { useState, useEffect, useRef } from "react";

export function useAudioBlob(audioUrl) {
  const [blobUrl, setBlobUrl] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
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
      setError(null);

      try {
        console.log("🔊 [useAudioBlob] جارٍ جلب الصوت:", audioUrl);

        const response = await fetch(audioUrl);

        if (!response.ok) {
          throw new Error(
            `فشل جلب الصوت: HTTP ${response.status} ${response.statusText}`
          );
        }

        const blob = await response.blob();
        console.log(
          "✅ [useAudioBlob] تم جلب الصوت بنجاح:",
          (blob.size / 1024 / 1024).toFixed(2),
          "MB"
        );

        if (!cancelled) {
          currentBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(currentBlobUrl);
          setAudioBlob(blob);
        }
      } catch (err) {
        console.error("❌ [useAudioBlob] خطأ في جلب الصوت:", err.message);

        if (!cancelled) {
          console.log("🔄 [useAudioBlob] محاولة بديلة: تحميل مباشر عبر Audio element...");
          try {
            const fallbackBlob = await fetchViaAudioElement(audioUrl);
            if (!cancelled && fallbackBlob) {
              currentBlobUrl = URL.createObjectURL(fallbackBlob);
              setBlobUrl(currentBlobUrl);
              setAudioBlob(fallbackBlob);
              console.log("✅ [useAudioBlob] نجح التحميل البديل!");
            }
          } catch (fallbackErr) {
            console.error("❌ [useAudioBlob] فشل التحميل البديل أيضاً:", fallbackErr.message);
            if (!cancelled) {
              setError(err.message);
              setBlobUrl("");
              setAudioBlob(null);
            }
          }
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

  return { blobUrl, audioBlob, loading, error };
}

function fetchViaAudioElement(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.timeout = 60000; 

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`XHR failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("XHR network error"));
    xhr.ontimeout = () => reject(new Error("XHR timeout"));
    xhr.send();
  });
}
