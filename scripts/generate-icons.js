/**
 * 纯 JS PNG 图标生成器
 * 为 TabBar 生成 4 组图标（常态 + 选中态），无需任何第三方依赖
 *
 * 用法：node scripts/generate-icons.js
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 81;       // 画布尺寸
const R = 38;          // 圆形背景半径
const CX = 40, CY = 40; // 圆心

// ---------- PNG 编码 ----------

function crc32(buf) {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcIn = Buffer.concat([t, data]);
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(crcIn));
  return Buffer.concat([len, t, data, crcVal]);
}

function encodePNG(pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA

  const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (1 + SIZE * 4)] = 0; // filter: None
    for (let x = 0; x < SIZE; x++) {
      const off = y * (1 + SIZE * 4) + 1 + x * 4;
      const [r, g, b, a] = pixels[y][x];
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = a;
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ---------- 绘图工具 ----------

function grid() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => [0, 0, 0, 0]));
}

function fillCircle(g, cx, cy, r, color) {
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) g[y][x] = [...color];
}

function fillRect(g, rx, ry, rw, rh, color) {
  for (let y = Math.max(0, ry); y < Math.min(SIZE, ry + rh); y++)
    for (let x = Math.max(0, rx); x < Math.min(SIZE, rx + rw); x++)
      g[y][x] = [...color];
}

function fillPoly(g, points, color) {
  // 简单多边形填充（扫描线法）
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(SIZE - 1, Math.max(...ys));
  for (let y = minY; y <= maxY; y++) {
    const intersections = [];
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const y1 = points[i][1], y2 = points[j][1];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        const x1 = points[i][0], x2 = points[j][0];
        intersections.push(x1 + (y - y1) / (y2 - y1) * (x2 - x1));
      }
    }
    intersections.sort((a, b) => a - b);
    for (let k = 0; k < intersections.length - 1; k += 2) {
      const x0 = Math.max(0, Math.round(intersections[k]));
      const x1 = Math.min(SIZE - 1, Math.round(intersections[k + 1]));
      for (let x = x0; x <= x1; x++) g[y][x] = [...color];
    }
  }
}

// ---------- 图标定义 ----------

const WHITE = [255, 255, 255, 255];
const WHITE_SOFT = [255, 255, 255, 240];

/**
 * 每个图标返回一个 pixel grid
 * config: { bg, shape(g) }
 */

// 首页 — 房子
function drawHome(g) {
  // 三角形屋顶
  fillPoly(g, [[40, 10], [16, 38], [64, 38]], WHITE);
  // 矩形墙体
  fillRect(g, 22, 38, 36, 28, WHITE);
  // 门
  fillRect(g, 32, 46, 16, 20, [0, 0, 0, 0]); // 用透明挖空 → 改为画底色
}

function drawHomeAlt(g, bgColor) {
  fillPoly(g, [[40, 10], [16, 38], [64, 38]], WHITE);
  fillRect(g, 22, 38, 36, 28, WHITE);
  // 用背景色画门（镂空效果）
  fillRect(g, 34, 48, 12, 18, bgColor);
}

// 记录 — 文档/列表
function drawRecord(g) {
  fillRect(g, 22, 14, 36, 46, WHITE);
  // 三行横线
  fillRect(g, 28, 24, 24, 5, [180, 180, 180, 255]);
  fillRect(g, 28, 34, 24, 5, [180, 180, 180, 255]);
  fillRect(g, 28, 44, 16, 5, [180, 180, 180, 255]);
}

function drawRecordAlt(g) {
  fillRect(g, 22, 14, 36, 46, WHITE);
  fillRect(g, 28, 24, 24, 5, [180, 180, 180, 255]);
  fillRect(g, 28, 34, 24, 5, [180, 180, 180, 255]);
  fillRect(g, 28, 44, 16, 5, [180, 180, 180, 255]);
}

// 添加 — 加号
function drawAdd(g) {
  // 横条
  fillRect(g, 22, 36, 36, 9, WHITE);
  // 竖条
  fillRect(g, 36, 22, 9, 36, WHITE);
}

function drawAddAlt(g, bgColor) {
  fillRect(g, 22, 36, 36, 9, WHITE);
  fillRect(g, 36, 22, 9, 36, WHITE);
}

// 药小福 — 狐狸头像
function drawFox(g) {
  const FOX_ORANGE = [255, 140, 60, 255]
  const WHITE = [255, 255, 255, 255]
  const DARK = [50, 30, 20, 255]
  const MUZZLE = [255, 240, 230, 255]

  // 左耳
  fillPoly(g, [[16, 28], [30, 4], [32, 26]], FOX_ORANGE)
  // 右耳
  fillPoly(g, [[64, 28], [50, 4], [48, 26]], FOX_ORANGE)
  // 左耳内白
  fillPoly(g, [[20, 26], [28, 10], [29, 25]], WHITE)
  // 右耳内白
  fillPoly(g, [[60, 26], [52, 10], [51, 25]], WHITE)
  // 脸部
  fillCircle(g, 40, 44, 22, FOX_ORANGE)
  // 吻部白色区域
  fillCircle(g, 40, 52, 10, MUZZLE)
  // 眼睛
  fillCircle(g, 31, 41, 3, DARK)
  fillCircle(g, 49, 41, 3, DARK)
  // 鼻头
  fillCircle(g, 40, 49, 2.5, DARK)
}

function drawFoxAlt(g) {
  const FOX = [255, 120, 30, 255]
  const WHITE = [255, 255, 255, 255]
  const DARK = [40, 20, 10, 255]
  const MUZZLE = [255, 235, 220, 255]

  fillPoly(g, [[16, 28], [30, 4], [32, 26]], FOX)
  fillPoly(g, [[64, 28], [50, 4], [48, 26]], FOX)
  fillPoly(g, [[20, 26], [28, 10], [29, 25]], WHITE)
  fillPoly(g, [[60, 26], [52, 10], [51, 25]], WHITE)
  fillCircle(g, 40, 44, 22, FOX)
  fillCircle(g, 40, 52, 10, MUZZLE)
  fillCircle(g, 31, 41, 3, DARK)
  fillCircle(g, 49, 41, 3, DARK)
  fillCircle(g, 40, 49, 2.5, DARK)
}

// 我的 — 人形
function drawProfile(g) {
  // 头
  fillCircle(g, 40, 24, 12, WHITE);
  // 身
  fillPoly(g, [[18, 66], [62, 66], [56, 40], [24, 40]], WHITE);
}

function drawProfileAlt(g, bgColor) {
  fillCircle(g, 40, 24, 12, WHITE);
  fillPoly(g, [[18, 66], [62, 66], [56, 40], [24, 40]], WHITE);
}

// ---------- 组装 ----------

const ICONS = {
  'home':        { bg: [76, 175, 80, 255],  draw: (g, bg) => { fillCircle(g, CX, CY, R, bg); drawHome(g); } },
  'home-active': { bg: [56, 142, 60, 255],   draw: (g, bg) => { fillCircle(g, CX, CY, R, bg); drawHomeAlt(g, bg); } },
  'record':      { bg: [255, 152, 0, 255],   draw: (g, bg) => { fillCircle(g, CX, CY, R, bg); drawRecord(g); } },
  'record-active': { bg: [239, 108, 0, 255], draw: (g, bg) => { fillCircle(g, CX, CY, R, bg); drawRecordAlt(g); } },
  'add':         { bg: [33, 150, 243, 255],  draw: (g, bg) => { fillCircle(g, CX, CY, R, bg); drawAdd(g); } },
  'add-active':  { bg: [25, 118, 210, 255],  draw: (g, bg) => { fillCircle(g, CX, CY, R, bg); drawAddAlt(g, bg); } },
  'profile':     { bg: [156, 39, 176, 255],  draw: (g, bg) => { fillCircle(g, CX, CY, R, bg); drawProfile(g); } },
  'profile-active': { bg: [123, 31, 162, 255], draw: (g, bg) => { fillCircle(g, CX, CY, R, bg); drawProfileAlt(g, bg); } },
  'ai':          { bg: [255, 111, 60, 255],  draw: (g, bg) => { fillCircle(g, CX, CY, R, [255, 180, 120, 255]); drawFox(g); } },
  'ai-active':   { bg: [255, 90, 30, 255],   draw: (g, bg) => { fillCircle(g, CX, CY, R, [255, 160, 90, 255]); drawFoxAlt(g); } },
};

const OUT_DIR = path.join(__dirname, '..', 'static', 'tabbar');

Object.entries(ICONS).forEach(([name, { bg, draw }]) => {
  const g = grid();
  draw(g, bg);
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), encodePNG(g));
  console.log(`  ✓ ${name}.png`);
});

console.log(`\nDone — ${Object.keys(ICONS).length} icons written to static/tabbar/`);
