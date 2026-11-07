// Minimal PNG generator using Node zlib to generate valid PNG icons for PWA
import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, colorR, colorG, colorB) {
  const rowLength = width * 4 + 1;
  const rawBuffer = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawBuffer[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Draw a rounded emerald badge with white currency symbol
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isCorner = Math.abs(dx) > width * 0.42 && Math.abs(dy) > height * 0.42;

      if (dist < width * 0.46 && !isCorner) {
        // Icon center mark ($ symbol or arrow)
        const inCenterY = Math.abs(dy) < height * 0.28;
        const inCenterX = Math.abs(dx) < width * 0.08;
        const inBar = (Math.abs(dy) < height * 0.08 && Math.abs(dx) < width * 0.22) ||
                      (Math.abs(dy + height * 0.14) < height * 0.06 && Math.abs(dx) < width * 0.2) ||
                      (Math.abs(dy - height * 0.14) < height * 0.06 && Math.abs(dx) < width * 0.2);

        if (inBar || inCenterX) {
          rawBuffer[pixelOffset] = 255;
          rawBuffer[pixelOffset + 1] = 255;
          rawBuffer[pixelOffset + 2] = 255;
          rawBuffer[pixelOffset + 3] = 255;
        } else {
          rawBuffer[pixelOffset] = colorR;
          rawBuffer[pixelOffset + 1] = colorG;
          rawBuffer[pixelOffset + 2] = colorB;
          rawBuffer[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent
        rawBuffer[pixelOffset] = 0;
        rawBuffer[pixelOffset + 1] = 0;
        rawBuffer[pixelOffset + 2] = 0;
        rawBuffer[pixelOffset + 3] = 0;
      }
    }
  }

  const deflated = zlib.deflateSync(rawBuffer);

  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ -1) >>> 0;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, 5, 150, 105));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, 5, 150, 105));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, 5, 150, 105));

console.log('PWA icons created successfully');
