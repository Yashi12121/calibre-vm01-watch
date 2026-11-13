import * as THREE from 'three';

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context');
  }
  return [canvas, ctx];
}

export function createDialTextures(): {
  colorMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 1024;
  const cx = size / 2;
  const cy = size / 2;

  const [colorCanvas, ctx] = makeCanvas(size, size);

  // Deep obsidian galvanic sunburst background
  const baseGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, size * 0.5);
  baseGrad.addColorStop(0, '#1e1d22');
  baseGrad.addColorStop(0.55, '#101014');
  baseGrad.addColorStop(1, '#070709');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Fine radial guilloche lines
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 360; i++) {
    const angle = (i * Math.PI) / 180;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.024)' : 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 28, Math.sin(angle) * 28);
    ctx.lineTo(Math.cos(angle) * 485, Math.sin(angle) * 485);
    ctx.stroke();
  }
  ctx.restore();

  // Outer champagne railway track
  const trackOuter = 446;
  const trackInner = 420;
  ctx.strokeStyle = 'rgba(214, 187, 134, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, trackOuter, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, trackInner, 0, Math.PI * 2);
  ctx.stroke();

  // 60 minute ticks
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    ctx.strokeStyle = isMajor ? 'rgba(235, 220, 184, 0.92)' : 'rgba(214, 187, 134, 0.45)';
    ctx.lineWidth = isMajor ? 3 : 1.3;
    const r0 = isMajor ? trackInner - 2 : trackInner + 4;
    const r1 = trackOuter;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }

  // Dial typography
  ctx.fillStyle = '#E8D8B5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '400 28px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('MAISON VALMONT', cx, cy - 160);

  ctx.fillStyle = 'rgba(214, 187, 134, 0.72)';
  ctx.font = '300 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('G E N È V E', cx, cy - 128);

  // Subtle recessed sub-ring at 6 o'clock
  const subY = cy + 195;
  ctx.strokeStyle = 'rgba(214, 187, 134, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, subY, 82, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(244, 240, 232, 0.52)';
  ctx.font = '300 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CALIBRE VM-01', cx, subY - 14);
  ctx.fillStyle = 'rgba(214, 187, 134, 0.65)';
  ctx.font = '300 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CHRONOMÈTRE', cx, subY + 14);

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 8;

  // Radial anisotropy roughness map
  const [roughCanvas, rCtx] = makeCanvas(512, 512);
  rCtx.fillStyle = '#555555';
  rCtx.fillRect(0, 0, 512, 512);
  rCtx.save();
  rCtx.translate(256, 256);
  for (let i = 0; i < 480; i++) {
    const a = (i / 480) * Math.PI * 2;
    const shade = 70 + Math.floor(Math.abs(Math.sin(a * 12)) * 50);
    rCtx.strokeStyle = `rgb(${shade},${shade},${shade})`;
    rCtx.lineWidth = 1.4;
    rCtx.beginPath();
    rCtx.moveTo(0, 0);
    rCtx.lineTo(Math.cos(a) * 260, Math.sin(a) * 260);
    rCtx.stroke();
  }
  rCtx.restore();

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = 4;

  return { colorMap, roughnessMap };
}

export function createGenevaStripesMap(): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const stripeCount = 14;
  const stripeW = size / stripeCount;
  for (let s = 0; s < stripeCount; s++) {
    const x0 = s * stripeW;
    const grad = ctx.createLinearGradient(x0, 0, x0 + stripeW, 0);
    grad.addColorStop(0, '#444444');
    grad.addColorStop(0.25, '#9d9d9d');
    grad.addColorStop(0.5, '#d2d2d2');
    grad.addColorStop(0.75, '#9a9a9a');
    grad.addColorStop(1, '#3f3f3f');
    ctx.fillStyle = grad;
    ctx.fillRect(x0, 0, stripeW, size);

    // Fine vertical brush scratches inside each stripe
    for (let k = 0; k < 24; k++) {
      const lx = x0 + (k / 24) * stripeW;
      ctx.strokeStyle = k % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, size);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createPerlageMap(): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#757575';
  ctx.fillRect(0, 0, size, size);

  const step = 36;
  for (let y = -step; y <= size + step; y += step * 0.72) {
    const offset = Math.round(y / (step * 0.72)) % 2 === 0 ? 0 : step * 0.5;
    for (let x = -step; x <= size + step; x += step) {
      for (let r = 22; r >= 6; r -= 4) {
        ctx.strokeStyle = r % 8 === 0 ? 'rgba(220,220,220,0.22)' : 'rgba(40,40,40,0.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x + offset, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createRadialBrushMap(): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#707070';
  ctx.fillRect(0, 0, size, size);

  for (let r = 8; r < 252; r += 3) {
    ctx.strokeStyle = r % 6 === 0 ? 'rgba(235,235,235,0.16)' : 'rgba(35,35,35,0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

export function createLeatherTextures(): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 512;
  const [cCanvas, cCtx] = makeCanvas(w, h);
  const [bCanvas, bCtx] = makeCanvas(w, h);

  cCtx.fillStyle = '#121113';
  cCtx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#606060';
  bCtx.fillRect(0, 0, w, h);

  // Subtle alligator-like rectangular scale cells
  const rows = 14;
  const cols = 8;
  const cellW = w / cols;
  const cellH = h / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jitterX = Math.sin(r * 4.1 + c * 2.3) * 4;
      const jitterY = Math.cos(r * 2.7 + c * 5.1) * 3;
      const x = c * cellW + 3 + jitterX;
      const y = r * cellH + 3 + jitterY;
      const cw = cellW - 6;
      const ch = cellH - 6;

      cCtx.fillStyle = (r + c) % 2 === 0 ? '#161417' : '#131215';
      cCtx.fillRect(x, y, cw, ch);
      cCtx.strokeStyle = '#09090a';
      cCtx.lineWidth = 2;
      cCtx.strokeRect(x, y, cw, ch);

      bCtx.fillStyle = '#9a9a9a';
      bCtx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
      bCtx.strokeStyle = '#202020';
      bCtx.lineWidth = 3;
      bCtx.strokeRect(x, y, cw, ch);
    }
  }

  // Champagne-ecru edge saddle stitching
  const stitchOffsets = [28, w - 28];
  for (const sx of stitchOffsets) {
    for (let sy = 14; sy < h - 14; sy += 24) {
      cCtx.fillStyle = '#b99f6d';
      cCtx.fillRect(sx - 2, sy, 4, 12);
      bCtx.fillStyle = '#e5e5e5';
      bCtx.fillRect(sx - 2, sy, 4, 12);
    }
  }

  const colorMap = new THREE.CanvasTexture(cCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(1, 2);

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(1, 2);

  return { colorMap, bumpMap };
}
