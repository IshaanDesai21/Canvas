/**
 * Generates the extension's PNG icons (no external deps — a tiny RGBA PNG
 * encoder). Run with `node extension/icons/_generate.mjs`. Replace the output
 * with your own art any time; this just guarantees valid icons exist.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// --- CRC32 (for PNG chunks) ---
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

// Diagonal-gradient rounded square with a soft white disc — the app mark.
function render(size) {
  const [a, b] = [hexToRgb('#5ac8fa'), hexToRgb('#0a7aff')];
  const r = size * 0.225; // corner radius
  const cx = size / 2;
  const cy = size / 2;
  const discR = size * 0.27;
  const row = size * 4 + 1;
  const raw = Buffer.alloc(row * size);

  const inRounded = (x, y) => {
    const dx = Math.min(x - r, size - r - 1 - x, 0);
    const dy = Math.min(y - r, size - r - 1 - y, 0);
    return dx * dx + dy * dy <= r * r;
  };

  for (let y = 0; y < size; y++) {
    raw[y * row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const o = y * row + 1 + x * 4;
      if (!inRounded(x, y)) {
        raw[o] = raw[o + 1] = raw[o + 2] = raw[o + 3] = 0;
        continue;
      }
      const t = (x + y) / (2 * size);
      let R = Math.round(a[0] + (b[0] - a[0]) * t);
      let G = Math.round(a[1] + (b[1] - a[1]) * t);
      let B = Math.round(a[2] + (b[2] - a[2]) * t);
      const d = Math.hypot(x - cx, y - cy);
      if (d < discR) {
        const m = Math.min(1, (discR - d) / (size * 0.05)); // soft edge
        R = Math.round(R + (255 - R) * m);
        G = Math.round(G + (255 - G) * m);
        B = Math.round(B + (255 - B) * m);
      }
      raw[o] = R;
      raw[o + 1] = G;
      raw[o + 2] = B;
      raw[o + 3] = 255;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [48, 128, 256, 512]) {
  writeFileSync(join(here, `icon-${size}.png`), render(size));
  console.log(`icon-${size}.png`);
}
