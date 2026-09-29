
import { useRef, useCallback } from "react";

function drawCover(ctx, img, canvasW, canvasH, scale = 1) {
  const iw = img.videoWidth || img.naturalWidth || img.width;
  const ih = img.videoHeight || img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const imgRatio = iw / ih;
  const canvasRatio = canvasW / canvasH;

  let sw, sh, sx, sy;
  if (imgRatio > canvasRatio) {
    
    sh = ih;
    sw = ih * canvasRatio;
    sx = (iw - sw) / 2;
    sy = 0;
  } else {
    
    sw = iw;
    sh = iw / canvasRatio;
    sx = 0;
    sy = (ih - sh) / 2;
  }

  const drawW = canvasW * scale;
  const drawH = canvasH * scale;
  const offsetX = (canvasW - drawW) / 2;
  const offsetY = (canvasH - drawH) / 2;

  ctx.drawImage(img, sx, sy, sw, sh, offsetX, offsetY, drawW, drawH);
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + " " + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawMultilineText(ctx, lines, centerX, startY, lineHeight) {
  lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * lineHeight);
  });
  return lines.length;
}

function drawDecorativeCorners(ctx, w, h, margin, size, lineWidth) {
  ctx.save();
  ctx.strokeStyle = "rgba(212, 168, 67, 0.3)";
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(w - margin, margin + size);
  ctx.lineTo(w - margin, margin);
  ctx.lineTo(w - margin - size, margin);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(margin + size, margin);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin, margin + size);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w - margin, h - margin - size);
  ctx.lineTo(w - margin, h - margin);
  ctx.lineTo(w - margin - size, h - margin);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(margin + size, h - margin);
  ctx.lineTo(margin, h - margin);
  ctx.lineTo(margin, h - margin - size);
  ctx.stroke();

  ctx.restore();
}

export function renderFrame(ctx, width, height, timestampMs, options) {
  const {
    bgImage = null,         
    bgScale = 100,
    bgDim = 30,
    bgBlur = 0,
    textColor = "#FFFFFF",
    translationColor = "#B0C4DE",
    textScale = 100,
    timedVerses = [],
    translations = [],
    showTranslation = false,
    watermarkText = "",
    contentMode = "translation",
    fallbackText = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ",
    chapterName = "الفاتحة",
    logoImage = null,
    collaboration = false,
    secondaryLogoImage = null,
    secondaryUsername = "",
    reciterName = "",
  } = options;

  const isPortrait = height > width;
  const sf = textScale / 100;

  const quranFontSize = Math.round((isPortrait ? height * 0.038 : height * 0.055) * sf);
  const transFontSize = Math.round((isPortrait ? height * 0.024 : height * 0.032) * sf);
  const wmFontSize = Math.round((isPortrait ? height * 0.013 : height * 0.016) * sf);
  const marginH = isPortrait ? Math.round(width * 0.08) : Math.round(width * 0.10);
  const maxTextWidth = width - marginH * 2;

  ctx.clearRect(0, 0, width, height);

  if (bgImage) {
    ctx.save();
    
    if (bgBlur > 0) {
      ctx.filter = `blur(${Math.min(bgBlur, 20)}px)`;
    }
    drawCover(ctx, bgImage, width, height, bgScale / 100);
    ctx.filter = "none";
    ctx.restore();
  } else {
    
    ctx.fillStyle = "#0a1a14";
    ctx.fillRect(0, 0, width, height);
  }

  if (bgDim > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${bgDim / 100})`;
    ctx.fillRect(0, 0, width, height);
  }

  const cornerMargin = Math.round(Math.min(width, height) * 0.025);
  const cornerSize = Math.round(Math.min(width, height) * 0.05);
  drawDecorativeCorners(ctx, width, height, cornerMargin, cornerSize, 3);

  let activeIdx = -1;
  if (timedVerses.length > 0) {
    activeIdx = timedVerses.findIndex(
      (v) => timestampMs >= v.timestampFrom && timestampMs < v.timestampTo
    );
  }
  const displayIdx = activeIdx >= 0 ? activeIdx : 0;
  const activeVerse = timedVerses.length > 0 ? timedVerses[displayIdx] : null;
  const activeTranslation = translations[displayIdx]?.text || "";

  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const centerX = width / 2;
  let textY = height * (isPortrait ? 0.40 : 0.42);

  const verseText = activeVerse
    ? `${activeVerse.text} \u200F﴿${activeVerse.verseNumber}﴾\u200F`
    : fallbackText;

  ctx.font = `${quranFontSize}px "Amiri Quran", "Amiri", serif`;
  ctx.fillStyle = textColor;

  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  const quranLines = wrapText(ctx, verseText, maxTextWidth);
  const quranLineHeight = quranFontSize * 2.2;
  const quranBlockHeight = quranLines.length * quranLineHeight;

  let totalBlockHeight = quranBlockHeight;
  let transLines = [];
  let transLineHeight = 0;

  if (showTranslation && activeTranslation) {
    ctx.font = `${contentMode === "tafsir" ? "" : "italic "}${transFontSize}px ${
      contentMode === "tafsir" ? 'system-ui, -apple-system, sans-serif' : '"Inter", system-ui, -apple-system, sans-serif'
    }`;
    const transText = contentMode === "tafsir" && activeTranslation.length > 200
      ? activeTranslation.substring(0, 200) + "..."
      : activeTranslation;
    transLines = wrapText(ctx, transText, maxTextWidth * 0.95);
    transLineHeight = transFontSize * 1.8;
    totalBlockHeight += transLines.length * transLineHeight + quranFontSize * 0.8; 
  }

  const blockStartY = (height / 2) - (totalBlockHeight / 2) + quranFontSize;

  ctx.font = `${quranFontSize}px "Amiri Quran", "Amiri", serif`;
  ctx.fillStyle = textColor;
  drawMultilineText(ctx, quranLines, centerX, blockStartY, quranLineHeight);

  if (showTranslation && activeTranslation && transLines.length > 0) {
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 2;
    ctx.direction = contentMode === "tafsir" ? "rtl" : "ltr";
    ctx.font = `${contentMode === "tafsir" ? "" : "italic "}${transFontSize}px ${
      contentMode === "tafsir" ? 'system-ui, -apple-system, sans-serif' : '"Inter", system-ui, -apple-system, sans-serif'
    }`;
    ctx.fillStyle = translationColor;
    ctx.globalAlpha = 0.85;

    const transStartY = blockStartY + quranBlockHeight + quranFontSize * 0.8;
    drawMultilineText(ctx, transLines, centerX, transStartY, transLineHeight);

    ctx.globalAlpha = 1;
  }

  // Watermark: single brand (logo + handle) by default; when collaboration is
  // enabled and a second logo is available, draw:  logo1 + handle1  ×  logo2 + handle2.
  const hasSecondaryLogo = !!(secondaryLogoImage && secondaryLogoImage.naturalWidth);
  const hasSecondary =
    collaboration && (hasSecondaryLogo || !!secondaryUsername);
  if (hasSecondary) {
    ctx.save();
    ctx.direction = "ltr";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${wmFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    const label1 = watermarkText || "";
    const label2 = secondaryUsername || "";
    const logoSize = Math.round(wmFontSize * 2.2);
    const gap = Math.round(wmFontSize * 0.5);
    const w1 =
      (logoImage && logoImage.naturalWidth ? logoSize + gap : 0) +
      (label1 ? ctx.measureText(label1).width : 0);
    const w2 =
      (hasSecondaryLogo ? logoSize + gap : 0) +
      (label2 ? ctx.measureText(label2).width : 0);
    const xGap = Math.round(wmFontSize * 1.6);
    const totalW = w1 + xGap + w2;
    let x = centerX - totalW / 2;
    const y = height - Math.round(height * 0.08);
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    // Block 1
    if (logoImage && logoImage.naturalWidth) {
      ctx.drawImage(logoImage, x, y - logoSize / 2, logoSize, logoSize);
      x += logoSize + gap;
    }
    if (label1) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(label1, x, y);
      x += ctx.measureText(label1).width;
    }
    // × connector
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `500 ${Math.round(wmFontSize * 1.2)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("×", x + xGap / 2, y);
    ctx.textAlign = "left";
    ctx.font = `600 ${wmFontSize}px system-ui, -apple-system, sans-serif`;
    x += xGap;
    // Block 2
    if (hasSecondaryLogo) {
      ctx.drawImage(secondaryLogoImage, x, y - logoSize / 2, logoSize, logoSize);
      x += logoSize + gap;
    }
    if (label2) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(label2, x, y);
    }
    ctx.restore();
  } else if (watermarkText || (logoImage && logoImage.naturalWidth)) {
    ctx.save();
    ctx.direction = "ltr";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${wmFontSize}px system-ui, -apple-system, sans-serif`;
    const label = watermarkText || "";
    ctx.textAlign = "left";
    const textW = label ? ctx.measureText(label).width : 0;
    const logoSize = logoImage && logoImage.naturalWidth ? Math.round(wmFontSize * 2.2) : 0;
    const gap = logoSize && label ? Math.round(wmFontSize * 0.5) : 0;
    const totalW = logoSize + gap + textW;
    const startX = centerX - totalW / 2;
    const y = height - Math.round(height * 0.08);
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    if (logoSize) {
      ctx.drawImage(logoImage, startX, y - logoSize / 2, logoSize, logoSize);
    }
    if (label) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(label, startX + logoSize + gap, y);
    }
    ctx.restore();
  }

  const badgeText = reciterName ? `سورة ${chapterName} • ${reciterName}` : `سورة ${chapterName}`;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${Math.round(height * 0.018)}px system-ui, -apple-system, sans-serif`;

  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = badgeMetrics.width + 60;
  const badgeH = Math.round(height * 0.032);
  const badgeX = centerX - badgeW / 2;
  const badgeY = height - Math.round(height * 0.035) - badgeH;

  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  } else {
    
    const r = badgeH / 2;
    ctx.moveTo(badgeX + r, badgeY);
    ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, r);
    ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX, badgeY + badgeH, r);
    ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY, r);
    ctx.arcTo(badgeX, badgeY, badgeX + badgeW, badgeY, r);
    ctx.closePath();
  }
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText(badgeText, centerX, badgeY + badgeH / 2);

  ctx.restore();
}

export function useCanvasRenderer() {
  const bgImageRef = useRef(null);  
  const bgVideoRef = useRef(null);  

  const loadBgImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      if (!src || src === "custom") { resolve(null); return; }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        bgImageRef.current = img;
        resolve(img);
      };
      img.onerror = (e) => {
        console.warn("⚠️ [CanvasRenderer] فشل تحميل الخلفية:", src);
        reject(e);
      };
      img.src = src;
    });
  }, []);

  return {
    renderFrame,
    bgImageRef,
    bgVideoRef,
    loadBgImage,
  };
}
