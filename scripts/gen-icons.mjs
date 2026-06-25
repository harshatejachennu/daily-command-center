// Generates placeholder PWA icons with zero dependencies (raw PNG + zlib).
// A solid brand-blue tile with a white rounded-square mark. Replace these with
// real artwork whenever you like — just keep the same filenames.
//
// Run with:  npm run gen:icons

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ---- minimal PNG encoder (RGBA, 8-bit) ----
const CRC_TABLE = (() => {
  const t = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Signed-distance test for a rounded rectangle. */
function insideRoundedRect(px, py, x, y, w, h, r) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  const qx = Math.abs(px - cx) - hw;
  const qy = Math.abs(py - cy) - hh;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r <= 0;
}

function makeIcon(size, { bg = "#0071e3", fg = "#ffffff", markScale = 0.5 }) {
  const rgba = Buffer.alloc(size * size * 4);
  const [br, bgg, bb] = hexToRgb(bg);
  const [fr, fgg, fb] = hexToRgb(fg);

  const mw = size * markScale;
  const mx = (size - mw) / 2;
  const radius = mw * 0.24;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const isMark = insideRoundedRect(x + 0.5, y + 0.5, mx, mx, mw, mw, radius);
      rgba[i] = isMark ? fr : br;
      rgba[i + 1] = isMark ? fgg : bgg;
      rgba[i + 2] = isMark ? fb : bb;
      rgba[i + 3] = 255;
    }
  }
  return encodePNG(size, rgba);
}

const targets = [
  { path: "public/icon-192.png", size: 192, opts: { markScale: 0.5 } },
  { path: "public/icon-512.png", size: 512, opts: { markScale: 0.5 } },
  { path: "public/icon-maskable-512.png", size: 512, opts: { markScale: 0.42 } },
  { path: "public/apple-touch-icon.png", size: 180, opts: { markScale: 0.5 } },
  { path: "app/icon.png", size: 256, opts: { markScale: 0.5 } },
];

for (const t of targets) {
  const out = join(root, t.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, makeIcon(t.size, t.opts));
  console.log(`wrote ${t.path} (${t.size}x${t.size})`);
}
console.log("done.");
