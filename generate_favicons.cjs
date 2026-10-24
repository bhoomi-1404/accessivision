const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create PNG buffer from RGBA pixel callback
function createPng(width, height, getPixel) {
  const rowBytes = width * 4;
  const buffer = Buffer.alloc(height * (rowBytes + 1));
  for (let y = 0; y < height; y++) {
    buffer[y * (rowBytes + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const offset = y * (rowBytes + 1) + 1 + x * 4;
      buffer[offset] = r;
      buffer[offset + 1] = g;
      buffer[offset + 2] = b;
      buffer[offset + 3] = a;
    }
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((-((crc ^ (byte >> j)) & 1)) & 0xEDB88320);
      }
    }
    return (crc ^ -1) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(buffer);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Render icon at high supersampled grid (SS x SS) then box filter down to (W x H)
function renderIcon(W, H) {
  const SS = 4;
  const sW = W * SS;
  const sH = H * SS;
  const grid = new Float32Array(sW * sH * 4);

  // Helper to blend color into pixel
  function plot(x, y, r, g, b, a) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= sW || y < 0 || y >= sH) return;
    const idx = (y * sW + x) * 4;
    const bgA = grid[idx + 3] / 255;
    const srcA = a / 255;
    const outA = srcA + bgA * (1 - srcA);
    if (outA > 0) {
      grid[idx] = (r * srcA + grid[idx] * bgA * (1 - srcA)) / outA;
      grid[idx + 1] = (g * srcA + grid[idx + 1] * bgA * (1 - srcA)) / outA;
      grid[idx + 2] = (b * srcA + grid[idx + 2] * bgA * (1 - srcA)) / outA;
      grid[idx + 3] = outA * 255;
    }
  }

  // Draw rounded squircle
  const radius = sW * 0.25;
  for (let y = 0; y < sH; y++) {
    for (let x = 0; x < sW; x++) {
      let dx = 0;
      let dy = 0;
      if (x < radius) dx = radius - x;
      else if (x > sW - 1 - radius) dx = x - (sW - 1 - radius);
      if (y < radius) dy = radius - y;
      else if (y > sH - 1 - radius) dy = y - (sH - 1 - radius);

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        // Border vs Background
        const isBorder = (x <= SS || x >= sW - 1 - SS || y <= SS || y >= sH - 1 - SS || dist >= radius - SS * 1.2);
        if (isBorder) {
          plot(x, y, 39, 39, 42, 255); // #27272A
        } else {
          plot(x, y, 9, 10, 15, 255); // #090A0F
        }
      }
    }
  }

  // Helper to draw anti-aliased thick lines
  function drawLine(x0, y0, x1, y1, thickness, r, g, b, a) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const steps = Math.ceil(len * 2);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = x0 + dx * t;
      const cy = y0 + dy * t;
      const rad = thickness / 2;
      for (let ox = -rad; ox <= rad; ox += 0.5) {
        for (let oy = -rad; oy <= rad; oy += 0.5) {
          if (ox * ox + oy * oy <= rad * rad) {
            plot(cx + ox, cy + oy, r, g, b, a);
          }
        }
      }
    }
  }

  // Helper to draw filled circle
  function drawCircle(cx, cy, radius, r, g, b, a) {
    for (let y = cy - radius - 1; y <= cy + radius + 1; y++) {
      for (let x = cx - radius - 1; x <= cx + radius + 1; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= radius) {
          plot(x, y, r, g, b, a);
        }
      }
    }
  }

  // Draw Lucide ScanEye geometry (white #F4F4F5)
  const fg = [244, 244, 245, 255];
  const th = sW * 0.065; // line thickness

  // Scale factor: inside container with padding
  const pad = sW * 0.16;
  const innerSize = sW - 2 * pad;
  const scale = (val) => pad + (val / 24) * innerSize;

  // Corner brackets:
  // Top-Left: M3 7 V5 a2 2 0 0 1 2-2 h2
  drawLine(scale(3), scale(7), scale(3), scale(5), th, ...fg);
  drawLine(scale(3), scale(5), scale(5), scale(3), th, ...fg);
  drawLine(scale(5), scale(3), scale(7), scale(3), th, ...fg);

  // Top-Right: M17 3 h2 a2 2 0 0 1 2 2 v2
  drawLine(scale(17), scale(3), scale(19), scale(3), th, ...fg);
  drawLine(scale(19), scale(3), scale(21), scale(5), th, ...fg);
  drawLine(scale(21), scale(5), scale(21), scale(7), th, ...fg);

  // Bottom-Right: M21 17 v2 a2 2 0 0 1-2 2 h-2
  drawLine(scale(21), scale(17), scale(21), scale(19), th, ...fg);
  drawLine(scale(21), scale(19), scale(19), scale(21), th, ...fg);
  drawLine(scale(19), scale(21), scale(17), scale(21), th, ...fg);

  // Bottom-Left: M7 21 H5 a2 2 0 0 1-2-2 v-2
  drawLine(scale(7), scale(21), scale(5), scale(21), th, ...fg);
  drawLine(scale(5), scale(21), scale(3), scale(19), th, ...fg);
  drawLine(scale(3), scale(19), scale(3), scale(17), th, ...fg);

  // Eye Contour Arc:
  // Approximate arc from x=5 to x=19, y=12
  for (let t = 0; t <= 1; t += 0.01) {
    const ex = scale(5 + 14 * t);
    // parabola or sine arc
    const arch = Math.sin(t * Math.PI);
    const eyUpper = scale(12 - 4.2 * arch);
    const eyLower = scale(12 + 4.2 * arch);
    drawCircle(ex, eyUpper, th * 0.45, ...fg);
    drawCircle(ex, eyLower, th * 0.45, ...fg);
  }

  // Center Pupil (filled circle at (12, 12))
  drawCircle(scale(12), scale(12), sW * 0.05, ...fg);

  // Downsample to W x H
  return createPng(W, H, (x, y) => {
    let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
    const startX = x * SS;
    const startY = y * SS;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const idx = ((startY + sy) * sW + (startX + sx)) * 4;
        rSum += grid[idx];
        gSum += grid[idx + 1];
        bSum += grid[idx + 2];
        aSum += grid[idx + 3];
      }
    }
    const count = SS * SS;
    return [
      Math.round(rSum / count),
      Math.round(gSum / count),
      Math.round(bSum / count),
      Math.round(aSum / count)
    ];
  });
}

function makeIco(png16, png32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1=icon)
  header.writeUInt16LE(2, 4); // 2 images

  const dir16 = Buffer.alloc(16);
  dir16[0] = 16;
  dir16[1] = 16;
  dir16[2] = 0;
  dir16[3] = 0;
  dir16.writeUInt16LE(1, 4);
  dir16.writeUInt16LE(32, 6);
  dir16.writeUInt32LE(png16.length, 8);
  dir16.writeUInt32LE(6 + 32, 12);

  const dir32 = Buffer.alloc(16);
  dir32[0] = 32;
  dir32[1] = 32;
  dir32[2] = 0;
  dir32[3] = 0;
  dir32.writeUInt16LE(1, 4);
  dir32.writeUInt16LE(32, 6);
  dir32.writeUInt32LE(png32.length, 8);
  dir32.writeUInt32LE(6 + 32 + png16.length, 12);

  return Buffer.concat([header, dir16, dir32, png16, png32]);
}

const pubDir = path.join(__dirname, 'public');
const png16 = renderIcon(16, 16);
const png32 = renderIcon(32, 32);
const png48 = renderIcon(48, 48);
const ico = makeIco(png16, png32);

fs.writeFileSync(path.join(pubDir, 'favicon-16x16.png'), png16);
fs.writeFileSync(path.join(pubDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(pubDir, 'favicon.png'), png32);
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), ico);

console.log('Successfully generated:');
console.log(' - favicon-16x16.png (' + png16.length + ' bytes)');
console.log(' - favicon-32x32.png (' + png32.length + ' bytes)');
console.log(' - favicon.png (' + png32.length + ' bytes)');
console.log(' - favicon.ico (' + ico.length + ' bytes)');
