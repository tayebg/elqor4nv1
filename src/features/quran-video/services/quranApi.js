

const API_BASE = import.meta.env.VITE_QURAN_API_BASE_URL || "https://api.quran.com/api/v4";
const CLIENT_ID = import.meta.env.VITE_QURAN_CLIENT_ID || "";
const CLIENT_SECRET = import.meta.env.VITE_QURAN_CLIENT_SECRET || "";
const OAUTH_URL = import.meta.env.VITE_QURAN_OAUTH_URL || "";

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  
  if (!CLIENT_ID || !CLIENT_SECRET || !OAUTH_URL) {
    return null;
  }

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${OAUTH_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      console.warn("⚠️ فشل الحصول على OAuth token، سيتم استخدام API العام");
      return null;
    }

    const data = await response.json();
    cachedToken = data.access_token;
    
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.warn("⚠️ خطأ في OAuth:", error.message);
    return null;
  }
}

async function apiFetch(endpoint, options = {}) {
  const token = await getAccessToken();

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchChapters(language = "ar") {
  const data = await apiFetch(`/chapters?language=${language}`);
  return data.chapters;
}

export async function fetchChapter(chapterId) {
  const data = await apiFetch(`/chapters/${chapterId}?language=ar`);
  return data.chapter;
}

export async function fetchVerses(chapterId, page = 1, perPage = 50) {
  const data = await apiFetch(
    `/verses/by_chapter/${chapterId}?language=ar&words=false&page=${page}&per_page=${perPage}&fields=text_uthmani`
  );
  return data;
}

export async function fetchReciters(language = "ar") {
  const data = await apiFetch(`/resources/recitations?language=${language}`);
  return data.recitations || [];
}

export async function fetchChapterAudioWithTimestamps(reciterId, chapterId) {
  const data = await apiFetch(
    `/chapter_recitations/${reciterId}/${chapterId}?segments=true`
  );
  return data.audio_file;
}

export async function fetchVersesWithWords(chapterId, perPage = 300) {
  const data = await apiFetch(
    `/verses/by_chapter/${chapterId}?language=ar&words=true&fields=text_uthmani&per_page=${perPage}`
  );
  return data;
}

export async function fetchTimedVerses(reciterId, chapterId, fromAyah, toAyah) {
  
  const [audioData, versesData] = await Promise.all([
    fetchChapterAudioWithTimestamps(reciterId, chapterId),
    fetchVersesWithWords(chapterId),
  ]);

  const rawAudioUrl = audioData.audio_url || "";

  let audioUrl = rawAudioUrl;
  if (rawAudioUrl.includes("download.quranicaudio.com")) {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      
      audioUrl = rawAudioUrl.replace(
        "https://download.quranicaudio.com",
        "/audio-proxy"
      );
    }
    
    console.log("🔗 [quranApi] رابط الصوت:", audioUrl);
  }
  const timestamps = audioData.timestamps || [];
  const allVerses = versesData.verses || [];

  const versesMap = new Map();
  allVerses.forEach((v) => {
    versesMap.set(v.verse_key, v);
  });

  const timedVerses = timestamps
    .filter((ts) => {
      const ayahNum = parseInt(ts.verse_key.split(":")[1]);
      return ayahNum >= fromAyah && ayahNum <= toAyah;
    })
    .map((ts) => {
      const verse = versesMap.get(ts.verse_key);
      const ayahNum = parseInt(ts.verse_key.split(":")[1]);

      const verseWords = verse
        ? verse.words.filter((w) => w.char_type_name === "word")
        : [];

      const words = [];
      if (ts.segments) {
        ts.segments.forEach((seg) => {
          
          if (seg.length >= 3) {
            const wordIndex = seg[0]; 
            const startMs = seg[1];
            const endMs = seg[2];
            const word = verseWords[wordIndex - 1];

            words.push({
              position: wordIndex,
              text: word ? word.translation?.text || "" : "",
              textArabic: word
                ? verse.text_uthmani.split(" ")[wordIndex - 1] || ""
                : "",
              startMs,
              endMs,
              durationMs: endMs - startMs,
            });
          }
        });
      }

      return {
        verseKey: ts.verse_key,
        verseNumber: ayahNum,
        text: verse?.text_uthmani || "",
        timestampFrom: ts.timestamp_from,
        timestampTo: ts.timestamp_to,
        duration: ts.duration,
        words,
      };
    });

  return {
    audioUrl,
    verses: timedVerses,
  };
}
