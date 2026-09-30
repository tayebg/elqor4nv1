import { toast } from 'sonner';

interface ActiveDownload {
  id: string;
  label: string;
  progress: number;
  abort: AbortController;
}

const activeDownloads = new Map<string, ActiveDownload>();

export function startDownload(opts: {
  id: string;
  label: string;
  generateBlob: (onProgress: (p: number) => void, signal: AbortSignal) => Promise<Blob>;
  filename: string;
}) {
  const abort = new AbortController();
  const download: ActiveDownload = {
    id: opts.id,
    label: opts.label,
    progress: 0,
    abort,
  };
  activeDownloads.set(opts.id, download);

  opts.generateBlob(
    (p) => {
      download.progress = p;
    },
    abort.signal,
  ).then((blob) => {
    activeDownloads.delete(opts.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = opts.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast.success(`${opts.label} — تم بنجاح`, { duration: 4000 });
  }).catch((err) => {
    activeDownloads.delete(opts.id);
    if (err?.name === 'AbortError' || err?.message === 'Aborted') {
      toast.info(`${opts.label} — تم إلغاء التحميل بنجاح`, { duration: 4000 });
      return;
    }
    toast.error(`${opts.label} — فشل: ${err?.message || 'خطأ'}`, { duration: 6000 });
  });

  return {
    cancel: () => abort.abort(),
  };
}

export function cancelAllDownloads() {
  activeDownloads.forEach(d => d.abort.abort());
  activeDownloads.clear();
}

export function getActiveDownloads(): ActiveDownload[] {
  return Array.from(activeDownloads.values());
}
