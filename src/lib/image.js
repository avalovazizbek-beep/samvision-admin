/**
 * Suratni Sam-Vision kabineti bilan bir xil cheklovga keltiradi:
 * eng uzun tomoni 1280px gacha, JPEG. EXIF orientatsiyasi hisobga olinadi,
 * EXIF metadata (GPS va h.k.) canvas orqali qayta chizishda tushib qoladi.
 */
export const MAX_SIDE = 1280;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* quyidagi usulga o‘tamiz */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function sourceSize(src) {
  return {
    width: src.videoWidth || src.naturalWidth || src.width,
    height: src.videoHeight || src.naturalHeight || src.height,
  };
}

/** Istalgan manbani (rasm, bitmap, video kadr) kichraytirilgan canvas'ga chizadi */
export function drawToCanvas(src, maxSide = MAX_SIDE) {
  const { width, height } = sourceSize(src);
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  return canvas;
}

export function canvasToJpeg(canvas, quality = 0.9) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Rasmni saqlab bo‘lmadi'))), 'image/jpeg', quality);
  });
}

/** Fayldan → { canvas, blob } */
export async function fileToNormalizedJpeg(file) {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Faqat rasm faylini tanlang');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Rasm hajmi juda katta (25 MB dan oshmasin)');
  }
  let src;
  try {
    src = await decode(file);
  } catch {
    throw new Error('Rasmni ochib bo‘lmadi. JPG yoki PNG formatidagi rasm tanlang');
  }
  const canvas = drawToCanvas(src);
  if (typeof src.close === 'function') src.close();
  const blob = await canvasToJpeg(canvas);
  return { canvas, blob };
}

/** Video kadridan → { canvas, blob } */
export async function videoFrameToJpeg(video) {
  const canvas = drawToCanvas(video);
  const blob = await canvasToJpeg(canvas);
  return { canvas, blob };
}
