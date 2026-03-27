/**
 * Draws a timestamp watermark on an image file using HTML Canvas.
 * Returns a new File with the timestamp burned in.
 *
 * Shows two pieces of info:
 *  1. Current date & time in IST (when the player is uploading)
 *  2. A note reminding admin the in-game clock should also be visible
 */
export const addTimestampToImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // ── Dimensions ──────────────────────────────────
      const w = canvas.width;
      const h = canvas.height;
      const fontSize = Math.max(16, Math.round(w * 0.025)); // ~2.5% of width
      const padding = Math.round(fontSize * 0.7);
      const lineH = Math.round(fontSize * 1.5);

      // ── Timestamp text ───────────────────────────────
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
      });
      const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true, timeZone: 'Asia/Kolkata'
      });
      const line1 = `Uploaded: ${dateStr}  ${timeStr} IST`;
      const line2 = `Room: ${file.name.replace(/\.[^.]+$/, '')}`;

      // ── Background strip ─────────────────────────────
      const stripH = lineH * 2 + padding * 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillRect(0, h - stripH, w, stripH);

      // ── Text ─────────────────────────────────────────
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = '#FFD700'; // gold
      ctx.textBaseline = 'middle';

      ctx.fillText(line1, padding, h - stripH + padding + lineH * 0.5);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.round(fontSize * 0.8)}px monospace`;
      ctx.fillText(line2, padding, h - stripH + padding + lineH * 1.5);

      // ── Convert back to File ─────────────────────────
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          const watermarked = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(watermarked);
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};
