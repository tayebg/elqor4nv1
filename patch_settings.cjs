const fs = require('fs');
let code = fs.readFileSync('src/routes/settings.tsx', 'utf8');

const validationFn = `
async function validateLogoTransparency(file: File): Promise<{ isValid: boolean; error?: string }> {
  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const rects = doc.querySelectorAll('rect');
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      const width = rect.getAttribute('width');
      const height = rect.getAttribute('height');
      const fill = rect.getAttribute('fill') || rect.style.fill;
      if ((width === '100%' && height === '100%') || (rect.hasAttribute('width') && rect.hasAttribute('height') && !rect.hasAttribute('rx'))) {
        if (fill && fill !== 'none' && fill !== 'transparent') {
           if (width === '100%' && height === '100%') {
             return { isValid: false, error: 'الشعار يحتوي على خلفية صلبة غير شفافة (SVG). يرجى إزالة الخلفية.' };
           }
        }
      }
    }
    const svg = doc.querySelector('svg');
    if (svg) {
       const bg = svg.style.background || svg.style.backgroundColor;
       if (bg && bg !== 'none' && bg !== 'transparent') {
         return { isValid: false, error: 'الشعار يحتوي على خلفية صلبة غير شفافة (SVG). يرجى إزالة الخلفية.' };
       }
    }
    return { isValid: true };
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 200;
        let w = img.width, h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve({ isValid: true });
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const imageData = ctx.getImageData(0, 0, w, h).data;
          let hasTransparent = false;
          for (let i = 3; i < imageData.length; i += 4) {
            if (imageData[i] < 250) { hasTransparent = true; break; }
          }
          if (hasTransparent) resolve({ isValid: true });
          else resolve({ isValid: false, error: 'الشعار لا يحتوي على أي خلفية شفافة. يرجى استخدام صورة مفرغة حقاً بدون خلفية بيضاء أو سوداء.' });
        } catch (err) { resolve({ isValid: true }); }
      };
      img.onerror = () => resolve({ isValid: false, error: 'تعذر قراءة الصورة.' });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve({ isValid: false, error: 'تعذر قراءة الملف.' });
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/settings")({`;

code = code.replace(/export const Route = createFileRoute\("\/settings"\)\(\{/, validationFn);

code = code.replace(/const readAsDataURL = \(f: File, cb: \(v: string\) => void\) => \{/, `const readAsDataURL = async (f: File, cb: (v: string) => void) => {
    const validation = await validateLogoTransparency(f);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }`);

fs.writeFileSync('src/routes/settings.tsx', code);
