import { useState, useCallback } from "react";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { renderFrame } from "./useCanvasRenderer";

const FPS = 30;

export function useVideoExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const loadImage = useCallback((url) => {
    return new Promise((resolve, reject) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      if (url.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("فشل تحميل الصورة: " + url));
      img.src = url;
    });
  }, []);

  const exportVideo = useCallback(
    async (
      bgImageUrl,
      audioUrl,
      timedVerses,
      videoSize,
      fileName = "Tarteel_Video",
      exportOptions = {},
    ) => {
      if (!timedVerses?.length) {
        alert("⚠️ لا توجد بيانات آيات للتصدير.");
        return null;
      }
      if (!exportOptions.audioBlob && !audioUrl) {
        alert("⚠️ لا يوجد صوت للتصدير.");
        return null;
      }

      if (typeof VideoEncoder === "undefined") {
        alert(
          "❌ متصفحك لا يدعم WebCodecs API.\nيرجى استخدام Google Chrome أو Microsoft Edge بأحدث إصدار.",
        );
        return null;
      }

      const {
        textColor = "#FFFFFF",
        translationColor = "#B0C4DE",
        watermarkText = "",
        translationLines = [],
        enableReverb = false,
        autoDownload = true,
        bgIsVideo = false,
        bgScale = 100,
        bgDim = 30,
        bgBlur = 0,
        textScale = 100,
        showTranslation = true,
        contentMode = "translation",
        chapterName = "",
        logoUrl = "",
        collaboration = false,
        secondaryLogoUrl = "",
        secondaryUsername = "",
        reciterName = "",
        onProgress,
        signal,
      } = exportOptions;

      setIsExporting(true);
      setProgress(0);
      onProgress?.(0);
      setStatusText("جارٍ التحضير...");

      let wakeLock = null;
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
          console.log("🔒 [Export] Wake Lock مُفعّل — الشاشة لن تنطفئ");
        }
      } catch (e) {
        console.warn("⚠️ [Export] Wake Lock غير متاح:", e.message);
      }

      const handleVisibility = () => {
        if (document.visibilityState === "hidden") {
          console.warn("⚠️ [Export] التطبيق في الخلفية — التصدير قد يتباطأ!");
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = "";
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      let exportCanvas = null;

      try {
        const { width: w, height: h } = videoSize;
        const offsetMs = timedVerses[0].timestampFrom;
        const lastEnd = timedVerses[timedVerses.length - 1].timestampTo;
        const durationMs = lastEnd - offsetMs;

        if (durationMs <= 0 || isNaN(durationMs)) {
          throw new Error(`مدة غير صالحة: ${durationMs}ms`);
        }

        const durationSec = durationMs / 1000;
        const totalFrames = Math.ceil(durationSec * FPS);
        console.log(
          `🎬 [Export] ${w}×${h} | ${durationSec.toFixed(1)}s | ${totalFrames} إطار | ${timedVerses.length} آية`,
        );

        setStatusText("تحميل الخلفية...");
        let bgElement = null;

        if (bgIsVideo) {
          bgElement = await new Promise((resolve, reject) => {
            const vid = document.createElement("video");
            if (bgImageUrl.startsWith("http")) {
              vid.crossOrigin = "anonymous";
            }
            vid.src = bgImageUrl;
            vid.muted = true;
            vid.playsInline = true;
            vid.preload = "auto";
            vid.onloadeddata = () => resolve(vid);
            vid.onerror = () => reject(new Error("فشل تحميل فيديو الخلفية"));
            vid.load();
          });
        } else {
          bgElement = await loadImage(bgImageUrl);
        }
        // Also load logo + secondary logo images used by the canvas renderer.
        let logoImage = null;
        let secondaryLogoImage = null;
        try {
          if (logoUrl) logoImage = await loadImage(logoUrl);
        } catch (e) {
          console.warn("logo load failed", e.message);
        }
        try {
          if (secondaryLogoUrl)
            secondaryLogoImage = await loadImage(secondaryLogoUrl);
        } catch (e) {
          console.warn("secondary logo load failed", e.message);
        }
        setProgress(10);

        setStatusText("معالجة الصوت...");
        let audioArrayBuffer;
        if (exportOptions.audioBlob instanceof Blob) {
          audioArrayBuffer = await exportOptions.audioBlob.arrayBuffer();
        } else {
          const res = await fetch(audioUrl);
          audioArrayBuffer = await res.arrayBuffer();
        }

        const offlineCtx = new OfflineAudioContext(2, 1, 44100);
        const fullAudioBuffer = await offlineCtx.decodeAudioData(
          audioArrayBuffer.slice(0),
        );

        const sampleRate = fullAudioBuffer.sampleRate;
        const numChannels = fullAudioBuffer.numberOfChannels;
        const startSample = Math.floor((offsetMs / 1000) * sampleRate);
        const endSample = Math.min(
          Math.floor((lastEnd / 1000) * sampleRate),
          fullAudioBuffer.length,
        );
        const trimmedLength = endSample - startSample;

        if (trimmedLength <= 0) {
          throw new Error("طول الصوت المقطوع غير صالح");
        }

        const trimmedCtx2 = new OfflineAudioContext(
          numChannels,
          trimmedLength,
          sampleRate,
        );
        const trimmedBuffer = trimmedCtx2.createBuffer(
          numChannels,
          trimmedLength,
          sampleRate,
        );
        for (let ch = 0; ch < numChannels; ch++) {
          const src = fullAudioBuffer.getChannelData(ch);
          const dst = trimmedBuffer.getChannelData(ch);
          for (let i = 0; i < trimmedLength; i++) {
            dst[i] = src[startSample + i];
          }
        }
        setProgress(20);

        const translations = (translationLines || []).map((t) => ({
          text: typeof t === "string" ? t : t?.text || "",
        }));

        setStatusText("إعداد محرك الفيديو...");
        exportCanvas = document.createElement("canvas");
        exportCanvas.width = w;
        exportCanvas.height = h;

        exportCanvas.style.cssText =
          "position:fixed;top:-9999px;left:-9999px;pointer-events:none;opacity:0;";
        document.body.appendChild(exportCanvas);

        const ctx = exportCanvas.getContext("2d", {
          willReadFrequently: false,
        });
        if (!ctx) throw new Error("فشل إنشاء Canvas context");

        try {
          await document.fonts.load('40px "Amiri Quran"');
          await document.fonts.load('40px "Amiri"');
          await document.fonts.load('italic 40px "Inter"');
        } catch (_) {}

        const muxer = new Muxer({
          target: new ArrayBufferTarget(),
          video: {
            codec: "avc",
            width: w,
            height: h,
            frameRate: FPS,
          },
          audio: {
            codec: "aac",
            numberOfChannels: numChannels,
            sampleRate: sampleRate,
          },
          fastStart: "in-memory",
          firstTimestampBehavior: "offset",
        });

        let videoError = null;
        const videoEncoder = new VideoEncoder({
          output: (chunk, meta) => {
            muxer.addVideoChunk(chunk, meta);
          },
          error: (e) => {
            console.error("❌ VideoEncoder error:", e);
            videoError = e;
          },
        });

        const codecConfig = {
          codec: "avc1.640028",
          width: w,
          height: h,
          bitrate: 5_000_000,
          framerate: FPS,
          hardwareAcceleration: "prefer-hardware",
        };

        try {
          const support = await VideoEncoder.isConfigSupported(codecConfig);
          if (!support.supported) {
            codecConfig.hardwareAcceleration = "prefer-software";
            const support2 = await VideoEncoder.isConfigSupported(codecConfig);
            if (!support2.supported) {
              throw new Error("كودك الفيديو غير مدعوم في هذا المتصفح");
            }
          }
        } catch (e) {
          console.warn("⚠️ فشل فحص الكودك، متابعة...", e.message);
          codecConfig.hardwareAcceleration = "no-preference";
        }

        videoEncoder.configure(codecConfig);

        setProgress(25);
        setStatusText("جارٍ إنشاء الفيديو...");

        const frameDurationUs = Math.round((1 / FPS) * 1_000_000);

        for (let frame = 0; frame < totalFrames; frame++) {
          if (signal?.aborted) throw new Error("Aborted");

          if (videoError) throw videoError;
          if (videoEncoder.state === "closed") {
            throw new Error("انتهى الترميز بشكل غير متوقع");
          }

          const timeMs = offsetMs + (frame / FPS) * 1000;

          if (bgIsVideo && bgElement) {
            const seekTime = (frame / FPS) % (bgElement.duration || 1);
            bgElement.currentTime = seekTime;
            await new Promise((r) => {
              bgElement.onseeked = r;
              setTimeout(r, 80);
            });
          }

          renderFrame(ctx, w, h, timeMs, {
            bgImage: bgElement,
            bgScale,
            bgDim,
            bgBlur,
            textColor,
            translationColor,
            textScale,
            timedVerses,
            translations,
            showTranslation,
            watermarkText,
            contentMode,
            chapterName,
            fallbackText: "",
            logoImage,
            collaboration,
            secondaryLogoImage,
            secondaryUsername,
            reciterName,
          });

          const videoFrame = new VideoFrame(exportCanvas, {
            timestamp: frame * frameDurationUs,
            duration: frameDurationUs,
          });

          const keyFrame = frame % (FPS * 2) === 0;

          while (videoEncoder.encodeQueueSize > 5) {
            if (signal?.aborted) throw new Error("Aborted");
            await new Promise((r) => setTimeout(r, 10));
          }

          videoEncoder.encode(videoFrame, { keyFrame });
          videoFrame.close();

          if (frame % 5 === 0) {
            const pct = 25 + Math.round((frame / totalFrames) * 55);
            setProgress(pct);
            onProgress?.(pct);
            await new Promise((r) => setTimeout(r, 0));
          }
        }

        setStatusText("جارٍ إنهاء ترميز الفيديو...");
        await videoEncoder.flush();
        videoEncoder.close();
        setProgress(82);

        setStatusText("ترميز الصوت...");
        let audioError = null;
        const audioEncoder = new AudioEncoder({
          output: (chunk, meta) => {
            muxer.addAudioChunk(chunk, meta);
          },
          error: (e) => {
            console.error("❌ AudioEncoder error:", e);
            audioError = e;
          },
        });

        audioEncoder.configure({
          codec: "mp4a.40.2",
          numberOfChannels: numChannels,
          sampleRate: sampleRate,
          bitrate: 192_000,
        });

        const chunkSize = 1024;
        for (let offset = 0; offset < trimmedLength; offset += chunkSize) {
          if (signal?.aborted) throw new Error("Aborted");
          if (audioError) throw audioError;
          if (audioEncoder.state === "closed") break;

          const count = Math.min(chunkSize, trimmedLength - offset);

          const planarData = new Float32Array(count * numChannels);
          for (let ch = 0; ch < numChannels; ch++) {
            const channelData = trimmedBuffer.getChannelData(ch);
            for (let i = 0; i < count; i++) {
              planarData[ch * count + i] = channelData[offset + i];
            }
          }

          const audioData = new AudioData({
            format: "f32-planar",
            sampleRate: sampleRate,
            numberOfFrames: count,
            numberOfChannels: numChannels,
            timestamp: Math.round((offset / sampleRate) * 1_000_000),
            data: planarData,
          });

          audioEncoder.encode(audioData);
          audioData.close();

          while (audioEncoder.encodeQueueSize > 10) {
            if (signal?.aborted) throw new Error("Aborted");
            await new Promise((r) => setTimeout(r, 5));
          }
        }

        await audioEncoder.flush();
        audioEncoder.close();
        setProgress(95);

        setStatusText("تجهيز الملف...");
        muxer.finalize();

        const { buffer } = muxer.target;
        const blob = new Blob([buffer], { type: "video/mp4" });

        if (blob.size < 1000) {
          throw new Error("الملف المُصدَّر صغير جداً — ربما فشل الرندر");
        }

        console.log(
          `📥 [Export] حجم: ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        );

        if (autoDownload) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fileName}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        }

        setStatusText("تم التصدير بنجاح ✅");
        setProgress(100);
        return blob;
      } catch (err) {
        if (err.name === "AbortError" || err.message === "Aborted") {
          console.log("🛑 [Export] تم الإلغاء بواسطة المستخدم");
          setStatusText("تم إلغاء التحميل بنجاح");
          setProgress(0);
          throw err;
        }
        console.error("❌ [Export] خطأ:", err);
        setStatusText("❌ فشل التصدير");
        setProgress(0);
        alert(
          `❌ فشل تصدير الفيديو:\n${err.message}\n\nيرجى المحاولة مجدداً أو تقليل عدد الآيات.`,
        );
        return null;
      } finally {
        setIsExporting(false);

        if (exportCanvas && exportCanvas.parentNode) {
          exportCanvas.parentNode.removeChild(exportCanvas);
        }

        if (wakeLock) {
          wakeLock.release().catch(() => {});
          console.log("🔓 [Export] Wake Lock مُحرَّر");
        }

        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    },
    [loadImage],
  );

  return { exportVideo, isExporting, progress, statusText };
}
