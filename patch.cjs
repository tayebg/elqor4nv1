const fs = require('fs');
let code = fs.readFileSync('src/features/quran-video/hooks/useCanvasRenderer.js', 'utf8');

code = code.replace(/if \(logoImage && logoImage\.naturalWidth\) \{\s*ctx\.drawImage\(logoImage, x, y - logoSize \/ 2, logoSize, logoSize\);\s*x \+= logoSize \+ gap;\s*\}/,
  'if (dim1.w) {\n      ctx.drawImage(logoImage, x, y - dim1.h / 2, dim1.w, dim1.h);\n      x += dim1.w + gap;\n    }');

code = code.replace(/if \(hasSecondaryLogo\) \{\s*ctx\.drawImage\(secondaryLogoImage, x, y - logoSize \/ 2, logoSize, logoSize\);\s*x \+= logoSize \+ gap;\s*\}/,
  'if (dim2.w) {\n      ctx.drawImage(secondaryLogoImage, x, y - dim2.h / 2, dim2.w, dim2.h);\n      x += dim2.w + gap;\n    }');

code = code.replace(/const logoSize = logoImage && logoImage\.naturalWidth \? Math\.round\(wmFontSize \* 2\.2\) : 0;\s*const gap = logoSize && label \? Math\.round\(wmFontSize \* 0\.5\) : 0;\s*const totalW = logoSize \+ gap \+ textW;/,
  `const maxLogoSize = Math.round(wmFontSize * 2.2);
    let drawW = 0, drawH = 0;
    if (logoImage && logoImage.naturalWidth) {
      const aspect = logoImage.naturalWidth / logoImage.naturalHeight;
      if (aspect > 1) { drawW = maxLogoSize; drawH = maxLogoSize / aspect; }
      else { drawW = maxLogoSize * aspect; drawH = maxLogoSize; }
    }
    const gap = drawW && label ? Math.round(wmFontSize * 0.5) : 0;
    const totalW = drawW + gap + textW;`);

code = code.replace(/if \(logoSize\) \{\s*ctx\.drawImage\(logoImage, startX, y - logoSize \/ 2, logoSize, logoSize\);\s*\}/,
  'if (drawW) {\n      ctx.drawImage(logoImage, startX, y - drawH / 2, drawW, drawH);\n    }');

code = code.replace(/ctx\.fillText\(label, startX \+ logoSize \+ gap, y\);/,
  'ctx.fillText(label, startX + drawW + gap, y);');

fs.writeFileSync('src/features/quran-video/hooks/useCanvasRenderer.js', code);
