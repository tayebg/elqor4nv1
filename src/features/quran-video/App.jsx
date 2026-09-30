import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuranData, useVerses, useTimedVerses } from "./hooks/useQuranData";
import { useVideoExport } from "./hooks/useVideoExport";
import { useAudioBlob } from "./hooks/useAudioBlob";
import { useTranslation as useQuranTranslation } from "./hooks/useTranslation";
import { useTafsir } from "./hooks/useTafsir";
import { videoSizes } from "./data/quranData";
import { defaultColors } from "./data/backgrounds";
import SettingsPanel from "./components/SettingsPanel";
import PreviewPanel from "./components/PreviewPanel";
import { useSettings, useResolvedBranding } from "@/lib/settings";
import { ShareMenu } from "@/components/ShareMenu";
import { startDownload } from "@/lib/download-manager";

function App() {
  const { chapters, reciters, loading, error } = useQuranData();
  const audioRef = useRef(null);
  const { exportVideo, isExporting, progress, statusText } = useVideoExport();

  const { pageState, setPageState } = useSettings();
  const videoState = pageState.videoState || {};

  const [settings, setSettings] = useState({
    surahId: videoState.surahId ?? 1,
    fromAyah: videoState.fromAyah ?? 1,
    toAyah: videoState.toAyah ?? 7,
    videoSize: videoState.videoSize ?? "16:9",
    reciterId: videoState.reciterId ?? "7",
  });

  const [bgImage, setBgImage] = useState(videoState.bgImage ?? "/quran-video-assets/quran-bg.png");
  const [customBgUrl, setCustomBgUrl] = useState(videoState.customBgUrl ?? "");
  const [textColor, setTextColor] = useState(videoState.textColor ?? defaultColors.textColor);
  const [translationColor, setTranslationColor] = useState(videoState.translationColor ?? "#B0C4DE");
  const [showTranslation, setShowTranslation] = useState(videoState.showTranslation ?? true);
  const [translationId, setTranslationId] = useState(videoState.translationId ?? 20);
  // Watermark is derived from the global ELQOR4N branding (Settings → Branding).
  // Users configure it in one place; every generator — including this video tool — reads from there.
  const resolvedBrand = useResolvedBranding();
  const appUsername = resolvedBrand.username;
  const appLogoUrl = resolvedBrand.logoUrl;
  const appCollab = resolvedBrand.collaboration;
  const appSecondaryLogoUrl = resolvedBrand.secondaryLogoUrl;
  const appSecondaryUsername = resolvedBrand.secondaryUsername;
  const watermarkText = appUsername || "";
  const setWatermarkText = () => {}; // no-op — kept for SettingsPanel compatibility
  const [enableReverb, setEnableReverb] = useState(videoState.enableReverb ?? false);

  const [bgScale, setBgScale] = useState(videoState.bgScale ?? 100);
  const [bgDim, setBgDim] = useState(videoState.bgDim ?? 30);
  const [bgBlur, setBgBlur] = useState(videoState.bgBlur ?? 0);
  const [textScale, setTextScale] = useState(videoState.textScale ?? 100);
  const [bgIsVideo, setBgIsVideo] = useState(videoState.bgIsVideo ?? false);

  const [contentMode, setContentMode] = useState(videoState.contentMode ?? "translation");
  const [tafsirId, setTafsirId] = useState(videoState.tafsirId ?? 16); 

  useEffect(() => {
    setPageState('videoState', {
      surahId: settings.surahId,
      fromAyah: settings.fromAyah,
      toAyah: settings.toAyah,
      videoSize: settings.videoSize,
      reciterId: settings.reciterId,
      bgImage,
      customBgUrl,
      textColor,
      translationColor,
      showTranslation,
      translationId,
      contentMode,
      tafsirId,
      bgScale,
      bgDim,
      bgBlur,
      textScale,
      bgIsVideo,
      enableReverb,
    });
  }, [settings, bgImage, customBgUrl, textColor, translationColor, showTranslation, translationId, contentMode, tafsirId, bgScale, bgDim, bgBlur, textScale, bgIsVideo, enableReverb, setPageState]);

  // Last successfully rendered video, kept so it can be shared without re-export.
  const [lastVideo, setLastVideo] = useState(null); // { blob, name }
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const downloadRef = useRef(null);

  const handleCancelExport = useCallback(() => {
    if (downloadRef.current) {
      downloadRef.current.cancel();
      downloadRef.current = null;
    }
  }, []);

  const effectiveBg = useMemo(() => customBgUrl || bgImage, [customBgUrl, bgImage]);

  const { verses, loading: versesLoading } = useVerses(
    settings.surahId, settings.fromAyah, settings.toAyah
  );

  const effectiveReciterId = useMemo(
    () => settings.reciterId || (reciters.length > 0 ? String(reciters[0].id) : ""),
    [settings.reciterId, reciters]
  );

  const selectedReciterName = useMemo(() => {
    const r = reciters.find(r => String(r.id) === effectiveReciterId);
    return r?.translated_name?.name || r?.reciter_name || '';
  }, [reciters, effectiveReciterId]);

  const { timedVerses, audioUrl, loading: timedLoading, error: timedError } = useTimedVerses(
    effectiveReciterId, settings.surahId, settings.fromAyah, settings.toAyah
  );

  const timedVersesRef = useRef(timedVerses);
  useEffect(() => { timedVersesRef.current = timedVerses; }, [timedVerses]);

  const { blobUrl: audioBlobUrl, audioBlob, loading: audioBlobLoading, progress: audioBlobProgress, error: audioBlobError } =
    useAudioBlob(audioUrl);

  const lastValidAudioRef = useRef('');
  useEffect(() => {
    if (audioBlobUrl) lastValidAudioRef.current = audioBlobUrl;
  }, [audioBlobUrl]);

  const { translations, loading: transLoading } = useQuranTranslation(
    settings.surahId, settings.fromAyah, settings.toAyah,
    contentMode === "translation" && showTranslation ? translationId : null
  );

  const { tafsirs, loading: tafsirLoading } = useTafsir(
    settings.surahId, settings.fromAyah, settings.toAyah,
    contentMode === "tafsir" && showTranslation ? tafsirId : null
  );

  const displayTexts = useMemo(
    () => (contentMode === "tafsir" ? tafsirs : translations),
    [contentMode, tafsirs, translations]
  );

  useEffect(() => {
    if (audioBlobError) {
      console.warn(`⚠️ فشل جلب الصوت للقارئ ${effectiveReciterId}:`, audioBlobError);
    }
  }, [audioBlobError, effectiveReciterId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setCurrentTimeMs(0);
  }, [settings.surahId, settings.fromAyah, settings.toAyah, effectiveReciterId]);

  useEffect(() => {
    if (audioRef.current && audioBlobUrl) audioRef.current.load();
  }, [audioBlobUrl]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const ms = audioRef.current.currentTime * 1000;
    setCurrentTimeMs(ms);
    const tv = timedVersesRef.current;
    if (tv.length > 0) {
      const end = tv[tv.length - 1].timestampTo;
      if (ms >= end) { audioRef.current.pause(); setIsPlaying(false); }
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || !audioBlobUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const tv = timedVersesRef.current;
      if (tv.length > 0) {
        const firstStart = tv[0].timestampFrom / 1000;
        const lastEnd = tv[tv.length - 1].timestampTo / 1000;
        if (audioRef.current.currentTime < firstStart || audioRef.current.currentTime >= lastEnd) {
          audioRef.current.currentTime = firstStart;
        }
      }
      audioRef.current.play().catch((e) => console.warn("خطأ في التشغيل:", e));
      setIsPlaying(true);
    }
  }, [isPlaying, audioBlobUrl]);

  const handleDownloadAudio = useCallback(() => {
    if (!audioBlob) return;
    const chapter = chapters.find((c) => c.id === settings.surahId);
    const surahName = chapter?.name_arabic || `Surah${settings.surahId}`;
    const fileName = `Tarteel_Audio_${surahName}_${settings.fromAyah}-${settings.toAyah}.mp3`;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [audioBlob, settings.surahId, settings.fromAyah, settings.toAyah, chapters]);

  // Robust custom-background upload:
  // - Accepts any image/* or video/mp4|webm.
  // - Revokes previous blob URL so we don't leak memory across uploads.
  // - Logs a clear error and shows an alert if the file type isn't supported,
  //   so the user knows the picker did fire but the file was rejected.
  const handleCustomBgUpload = useCallback((file) => {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      alert("⚠️ نوع الملف غير مدعوم. اختر صورة أو فيديو.");
      return;
    }
    // Free the previous object URL, if any.
    setCustomBgUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        try { URL.revokeObjectURL(prev); } catch { /* noop */ }
      }
      return URL.createObjectURL(file);
    });
    setBgImage("custom");
    setBgIsVideo(isVideo);
    console.log(`✅ [BG Upload] ${isVideo ? "video" : "image"} · ${(file.size / 1024).toFixed(0)} KB`);
  }, []);

  const buildBgSrc = useCallback(() => {
    const bg = effectiveBg;
    if (!bg) return "";
    
    if (bg.startsWith("blob:") || bg.startsWith("http://") || bg.startsWith("https://")) {
      return bg;
    }
    
    return window.location.origin + (bg.startsWith("/") ? bg : "/" + bg);
  }, [effectiveBg]);

  const handleAutoShorts = useCallback(() => {
    const tv = timedVersesRef.current;
    if (!tv || tv.length === 0) {
      console.warn("⚠️ [Auto-Shorts] لا توجد بيانات توقيتات");
      return;
    }
    const startMs = tv[0].timestampFrom;
    let lastIdx = 0;
    for (let i = 0; i < tv.length; i++) {
      const elapsed = (tv[i].timestampTo - startMs) / 1000;
      if (elapsed <= 59) {
        lastIdx = i;
      } else {
        break;
      }
    }
    const totalDuration = ((tv[lastIdx].timestampTo - startMs) / 1000).toFixed(1);
    console.log(`🎬 [Auto-Shorts] آيات: ${lastIdx + 1}/${tv.length} | المدة: ${totalDuration}s`);

    setSettings((prev) => ({ ...prev, toAyah: prev.fromAyah + lastIdx }));
    
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setCurrentTimeMs(0);
  }, []); 

  const handleExportVideo = useCallback(() => {
    const tv = timedVersesRef.current;
    if (!tv?.length) {
      alert("⚠️ لا توجد بيانات آيات. يرجى انتظار تحميل التوقيتات.");
      return;
    }
    if (!audioBlob) {
      alert("⚠️ لا يوجد صوت جاهز. يرجى انتظار تحميل الصوت.");
      return;
    }

    const size = videoSizes.find((s) => s.id === settings.videoSize) || videoSizes[0];
    const chapter = chapters.find((c) => c.id === settings.surahId);
    const surahName = chapter?.name_arabic || `Surah${settings.surahId}`;
    const fileName = `Tarteel_${surahName}_${settings.fromAyah}-${settings.toAyah}`;
    const bgSrc = buildBgSrc();
    console.log(`📤 [Export] bgSrc: ${bgSrc.substring(0, 80)}...`);

    const textLines = (displayTexts || []).map((t) => t?.text || "");
    console.log(`📤 [Export] تصدير ${tv.length} آية | نصوص: ${textLines.length} سطر | الوضع: ${contentMode}`);

    downloadRef.current = startDownload({
      id: 'video-export',
      label: 'تصدير الفيديو',
      filename: `${fileName}.mp4`,
      generateBlob: async (onProgress, signal) => {
        const outBlob = await exportVideo(bgSrc, audioBlobUrl, tv,
          { width: size.width, height: size.height }, fileName,
          { textColor, translationColor, watermarkText, enableReverb,
            translationLines: textLines, audioBlob, autoDownload: false,
            bgIsVideo, bgScale, bgDim, bgBlur, textScale,
            showTranslation, contentMode,
            chapterName: surahName,
            logoUrl: appLogoUrl,
            collaboration: appCollab,
            secondaryLogoUrl: appSecondaryLogoUrl,
            secondaryUsername: appSecondaryUsername,
            reciterName: selectedReciterName,
            onProgress, signal }
        );
        if (outBlob && outBlob.size > 1000) {
          setLastVideo({ blob: outBlob, name: `${fileName}.mp4` });
          return outBlob;
        }
        throw new Error("فشل تصدير الفيديو أو حجمه صغير جداً.");
      }
    });
  }, [settings, chapters, buildBgSrc, audioBlobUrl, audioBlob, exportVideo, textColor, translationColor, watermarkText, enableReverb, displayTexts, contentMode, bgIsVideo, bgScale, bgDim, bgBlur, textScale, showTranslation, appLogoUrl, appCollab, appSecondaryLogoUrl, appSecondaryUsername, selectedReciterName]);

  const handleExportReels = useCallback(async (opts = {}) => {
    console.log("🚀 [Reels] بدء تصدير الريلز...");
    const tv = timedVersesRef.current;
    if (!tv?.length) {
      alert("⚠️ لا توجد بيانات توقيتات. يرجى انتظار تحميل البيانات.");
      return;
    }
    if (!audioBlob) {
      alert("⚠️ لا يوجد صوت جاهز. يرجى انتظار تحميل الصوت.");
      return;
    }

    try {
      const startMs = tv[0].timestampFrom;
      let lastIdx = 0;
      for (let i = 0; i < tv.length; i++) {
        const elapsed = (tv[i].timestampTo - startMs) / 1000;
        if (elapsed <= 59) {
          lastIdx = i;
        } else {
          break;
        }
      }

      const reelVerses = tv.slice(0, lastIdx + 1);
      const reelDuration = ((reelVerses[reelVerses.length - 1].timestampTo - startMs) / 1000).toFixed(1);
      console.log(`🎬 [Reels] ${reelVerses.length} آية | ${reelDuration}s | 9:16`);

      const textLines = (displayTexts || []).slice(0, lastIdx + 1).map((t) => t?.text || "");

      const chapter = chapters.find((c) => c.id === settings.surahId);
      const surahName = chapter?.name_arabic || `Surah${settings.surahId}`;
      const fileName = `Reel_${surahName}_${settings.fromAyah}-${settings.fromAyah + lastIdx}`;
      const bgSrc = buildBgSrc();
      console.log(`📤 [Reels] bgSrc: ${bgSrc.substring(0, 80)}...`);

      const generateVideo = async (onProgress, signal) => {
        const blob = await exportVideo(bgSrc, audioBlobUrl, reelVerses,
          { width: 1080, height: 1920 }, fileName,
          { textColor, translationColor, watermarkText, enableReverb,
            translationLines: textLines, autoDownload: false, audioBlob,
            bgIsVideo, bgScale, bgDim, bgBlur, textScale,
            showTranslation, contentMode,
            chapterName: surahName,
            logoUrl: appLogoUrl,
            collaboration: appCollab,
            secondaryLogoUrl: appSecondaryLogoUrl,
            secondaryUsername: appSecondaryUsername,
            reciterName: selectedReciterName,
            onProgress, signal }
        );
        if (blob && blob.size > 1000) {
          setLastVideo({ blob, name: `${fileName}.mp4` });
          return blob;
        }
        throw new Error("ملف الريلز صغير جداً.");
      };

      if (opts.share) {
        return await generateVideo();
      } else {
        downloadRef.current = startDownload({
          id: 'reels-export',
          label: 'تصدير الريلز',
          filename: `${fileName}.mp4`,
          generateBlob: generateVideo
        });
      }
    } catch (err) {
      console.error("❌ [Reels] خطأ:", err);
      if (opts.share) throw err;
      alert(`❌ فشل تصدير الريلز:\n${err.message}`);
    }
  }, [chapters, settings, buildBgSrc, audioBlobUrl, audioBlob, exportVideo, textColor, translationColor, watermarkText, enableReverb, displayTexts, bgIsVideo, bgScale, bgDim, bgBlur, textScale, showTranslation, contentMode, appLogoUrl, appCollab, appSecondaryLogoUrl, appSecondaryUsername, selectedReciterName]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full lg:h-[calc(100dvh-8rem)] lg:overflow-hidden bg-background" dir="rtl">
      {audioBlobUrl && (
        <audio ref={audioRef} src={audioBlobUrl} onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)} preload="auto" />
      )}

      {/* Main preview area — chrome-less. All account, language, and
          contact controls were moved to the global ELQOR4N Settings page. */}
      <main className="flex h-[50vh] w-full min-w-0 shrink-0 flex-col border-b border-border bg-muted/40 lg:h-full lg:w-2/3 lg:border-b-0">

        {}
        <PreviewPanel
          settings={settings}
          chapters={chapters}
          verses={verses}
          versesLoading={versesLoading}
          timedVerses={timedVerses}
          currentTimeMs={currentTimeMs}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          timedLoading={timedLoading || audioBlobLoading}
          audioLoading={audioBlobLoading}
          audioProgress={audioBlobProgress}
          audioUrl={audioBlobUrl || lastValidAudioRef.current}
          bgImage={effectiveBg}
          bgIsVideo={bgIsVideo}
          textColor={textColor}
          translationColor={translationColor}
          translations={displayTexts}
          showTranslation={showTranslation}
          watermarkText={watermarkText}
          contentMode={contentMode}
          bgScale={bgScale}
          bgDim={bgDim}
          bgBlur={bgBlur}
          textScale={textScale}
          logoUrl={appLogoUrl}
          collaboration={appCollab}
          secondaryLogoUrl={appSecondaryLogoUrl}
          secondaryUsername={appSecondaryUsername}
          selectedReciterName={selectedReciterName}
        />
      </main>

      {}
      <SettingsPanel
        settings={{ ...settings, reciterId: effectiveReciterId }}
        onSettingsChange={setSettings}
        chapters={chapters}
        reciters={reciters}
        loading={loading}
        error={error}
        bgImage={bgImage}
        onBgChange={(src) => { setBgImage(src); setCustomBgUrl(""); setBgIsVideo(false); }}
        onCustomBgUpload={handleCustomBgUpload}
        onCustomBgFromUrl={(url, isVideo = false) => {
          setCustomBgUrl((prev) => {
            if (prev && prev.startsWith("blob:") && prev !== url) {
              try { URL.revokeObjectURL(prev); } catch { /* noop */ }
            }
            return url;
          });
          setBgImage("custom");
          setBgIsVideo(Boolean(isVideo));
        }}
        textColor={textColor}
        onTextColorChange={setTextColor}
        translationColor={translationColor}
        onTranslationColorChange={setTranslationColor}
        showTranslation={showTranslation}
        onShowTranslationChange={setShowTranslation}
        translationId={translationId}
        onTranslationIdChange={setTranslationId}
        contentMode={contentMode}
        onContentModeChange={setContentMode}
        tafsirId={tafsirId}
        onTafsirIdChange={setTafsirId}
        bgScale={bgScale}
        onBgScaleChange={setBgScale}
        bgDim={bgDim}
        onBgDimChange={setBgDim}
        bgBlur={bgBlur}
        onBgBlurChange={setBgBlur}
        textScale={textScale}
        onTextScaleChange={setTextScale}
        timedVerses={timedVerses}
        onAutoShorts={handleAutoShorts}
        onExportVideo={handleExportVideo}
        onExportReels={handleExportReels}
        onDownloadAudio={handleDownloadAudio}
        isExporting={isExporting}
        exportProgress={progress}
        exportStatus={statusText}
        audioReady={!!(audioBlobUrl || audioBlob) && !audioBlobLoading}
        onCancelExport={handleCancelExport}
        shareSlot={
          <ShareMenu
            className="w-full"
            label={lastVideo ? "مشاركة الفيديو" : "تصدير ومشاركة"}
            title="فيديو قرآني"
            text={watermarkText}
            disabled={isExporting || !(audioBlobUrl || audioBlob)}
            getFile={async () => {
              if (lastVideo) {
                return new File([lastVideo.blob], lastVideo.name, {
                  type: lastVideo.blob.type || "video/mp4",
                });
              }
              const blob = await handleExportReels({ share: true });
              if (!blob) throw new Error("يرجى إنشاء الفيديو أولًا ثم مشاركته.");
              return new File([blob], "quran-reel.mp4", { type: blob.type || "video/mp4" });
            }}
          />
        }
      />
    </div>
  );
}

export default App;
