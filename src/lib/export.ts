import { toBlob } from "html-to-image";
import JSZip from "jszip";

interface ZipExportOptions {
  count: number;
  hizb: number;
  captureId: string;
  prepareSlide: (index: number) => Promise<void>;
  onProgress?: (progress: number) => void;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

async function nextPaint() {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}

export async function captureNodeToBlob(
  id: string,
  opts: { width: number; height: number; backgroundColor?: string },
): Promise<Blob> {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Slide ${id} not found`);
  if (document.fonts) await document.fonts.ready;
  await nextPaint();
  const blob = await toBlob(node, {
    width: opts.width,
    height: opts.height,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: opts.backgroundColor ?? "#ffffff",
  });
  if (!blob) throw new Error(`Slide ${id} could not be captured`);
  return blob;
}

export function triggerDownloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  triggerDownloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Capture every slide and download as a single ZIP archive. */
export async function exportAllPngZip({
  count,
  hizb,
  captureId,
  prepareSlide,
  onProgress,
  width = 1080,
  height = 1080,
  backgroundColor = "#fbf8f3",
}: ZipExportOptions) {
  const zip = new JSZip();
  const folder = zip.folder(`hizb-${String(hizb).padStart(2, "0")}`)!;
  for (let i = 0; i < count; i++) {
    await prepareSlide(i);
    const blob = await captureNodeToBlob(captureId, { width, height, backgroundColor });
    folder.file(
      `hizb-${String(hizb).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}.png`,
      blob,
    );
    onProgress?.(Math.round(((i + 1) / count) * 85));
    await nextPaint();
  }
  const archive = await zip.generateAsync(
    { type: "blob", compression: "STORE" },
    (metadata) => onProgress?.(85 + Math.round(metadata.percent * 0.15)),
  );
  return {
    blob: archive,
    filename: `hizb-${String(hizb).padStart(2, "0")}.zip`,
  };
}

/** Capture every slide and return it as an array of Files for native multi-image sharing. */
export async function exportAllPngFiles({
  count,
  captureId,
  prepareSlide,
  onProgress,
  width = 1080,
  height = 1080,
  backgroundColor = "#fbf8f3",
  filename,
}: {
  count: number;
  captureId: string;
  prepareSlide: (index: number) => Promise<void>;
  onProgress?: (progress: number) => void;
  width?: number;
  height?: number;
  backgroundColor?: string;
  filename?: (index: number) => string;
}): Promise<File[]> {
  const files: File[] = [];
  for (let i = 0; i < count; i++) {
    await prepareSlide(i);
    const blob = await captureNodeToBlob(captureId, { width, height, backgroundColor });
    files.push(
      new File(
        [blob],
        filename?.(i) ?? `slide-${String(i + 1).padStart(2, "0")}.png`,
        { type: "image/png" },
      ),
    );
    onProgress?.(Math.round(((i + 1) / count) * 100));
    await nextPaint();
  }
  return files;
}

