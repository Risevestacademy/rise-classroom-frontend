#!/usr/bin/env node
/**
 * Finds the `focus` for a landing page photo: where the eyes are and how wide
 * the face is, as used in lib/people.ts.
 *
 *   pnpm focus public/landing/people/chijioke.webp
 *
 * Opens a page in your browser. Click the left eye, then the right eye, and
 * nudge the face-width slider until the preview looks right. The preview
 * frames the photo inside the Rise mark exactly as the hero does. Copy the
 * line it gives you into the person's entry in lib/people.ts.
 *
 * Pass --no-open to print the address without opening a browser.
 * Node built-ins only. Stop it with Ctrl+C.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const noOpen = args.includes("--no-open");
const imageArg = args.find((arg) => !arg.startsWith("--"));
const imagePath = imageArg && resolve(process.cwd(), imageArg);

if (!imagePath || !existsSync(imagePath)) {
  console.error("Usage: pnpm focus <path to image>\n  e.g. pnpm focus public/landing/people/chijioke.webp");
  process.exit(1);
}

// The mark's three band outlines, read straight from the source of truth.
const bandsSource = readFileSync(resolve(root, "components/home/logo-bands.ts"), "utf8");
const bands = [...bandsSource.matchAll(/"(M18\.4[^"]+Z)"/g)].map((match) => match[1]);
if (bands.length !== 3) {
  console.error("Couldn't read the three logo bands from components/home/logo-bands.ts.");
  process.exit(1);
}

const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };

const page = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Focus picker</title>
<style>
  body { margin: 0; font: 14px/1.5 system-ui, sans-serif; background: #111819; color: #fff; display: grid; grid-template-columns: 1fr 420px; height: 100vh; }
  #stage { position: relative; display: grid; place-items: center; overflow: hidden; padding: 24px; }
  #photo { max-width: 100%; max-height: calc(100vh - 48px); cursor: crosshair; display: block; }
  .dot { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; border: 2px solid #fff; background: #0D6D78; pointer-events: none; }
  .face { position: absolute; border: 1px dashed #9AD3D8; pointer-events: none; }
  aside { background: #1F292B; padding: 24px; display: flex; flex-direction: column; gap: 16px; overflow: auto; }
  h1 { font-size: 18px; margin: 0; }
  ol { margin: 0; padding-left: 18px; color: #CBD5D6; }
  canvas { width: 100%; background: #0D6D78; border-radius: 8px; }
  label { display: grid; gap: 6px; color: #CBD5D6; }
  input[type=range] { width: 100%; }
  pre { margin: 0; padding: 12px; background: #111819; border-radius: 8px; font-size: 15px; white-space: pre-wrap; }
  button { font: inherit; font-weight: 600; padding: 10px 16px; border: 0; border-radius: 999px; background: #fff; color: #0D6D78; cursor: pointer; }
  .muted { color: #9AA6A8; font-size: 13px; }
</style>
</head>
<body>
  <div id="stage"><img id="photo" src="/image" alt=""></div>
  <aside>
    <h1>Focus picker</h1>
    <ol>
      <li>Click the <b>left eye</b> (on the left of the photo).</li>
      <li>Click the <b>right eye</b>.</li>
      <li>Adjust face width until the dashed box spans ear to ear.</li>
    </ol>
    <label>Face width <span id="wv"></span>
      <input id="w" type="range" min="0.05" max="0.9" step="0.005" value="0.3">
    </label>
    <canvas id="preview" width="740" height="620"></canvas>
    <p class="muted">Preview: framed inside the Rise mark exactly as the hero does it.</p>
    <pre id="out">Click both eyes to start.</pre>
    <button id="copy" disabled>Copy focus</button>
    <p class="muted">Click again to start over.</p>
  </aside>
<script>
const BANDS = ${JSON.stringify(bands)};
// Keep in step with paintSprites() in components/landing/scene.ts.
const MARK = { w: 37, h: 31 };
const FACE_SHARE = 0.44;
const AT = { x: 0.5, y: 0.35 };

const photo = document.getElementById("photo");
const stage = document.getElementById("stage");
const slider = document.getElementById("w");
const out = document.getElementById("out");
const copy = document.getElementById("copy");
const preview = document.getElementById("preview");
let eyes = [];
let focus = null;

const round = (v) => Math.round(v * 1000) / 1000;

photo.addEventListener("click", (event) => {
  const box = photo.getBoundingClientRect();
  const point = { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  if (eyes.length >= 2) eyes = [];
  eyes.push(point);
  if (eyes.length === 2) {
    // A face is roughly 2.4 times as wide as the distance between the eyes.
    const apart = Math.abs(eyes[1].x - eyes[0].x);
    slider.value = String(Math.min(0.9, Math.max(0.05, apart * 2.4)));
  }
  update();
});
slider.addEventListener("input", update);
window.addEventListener("resize", update);
copy.addEventListener("click", () => navigator.clipboard.writeText(out.textContent));

function update() {
  stage.querySelectorAll(".dot, .face").forEach((el) => el.remove());
  const box = photo.getBoundingClientRect();
  const stageBox = stage.getBoundingClientRect();
  for (const eye of eyes) {
    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.left = box.left - stageBox.left + eye.x * box.width + "px";
    dot.style.top = box.top - stageBox.top + eye.y * box.height + "px";
    stage.appendChild(dot);
  }
  document.getElementById("wv").textContent = Number(slider.value).toFixed(3);
  if (eyes.length < 2) {
    focus = null;
    out.textContent = eyes.length ? "Now click the right eye." : "Click both eyes to start.";
    copy.disabled = true;
    drawPreview();
    return;
  }
  const w = Number(slider.value);
  focus = { x: (eyes[0].x + eyes[1].x) / 2, y: (eyes[0].y + eyes[1].y) / 2, w };

  // The face box the slider describes, so you can check it spans ear to ear.
  const face = document.createElement("div");
  face.className = "face";
  const fw = w * box.width;
  const fh = fw * 1.3;
  face.style.left = box.left - stageBox.left + focus.x * box.width - fw / 2 + "px";
  face.style.top = box.top - stageBox.top + focus.y * box.height - fh * 0.42 + "px";
  face.style.width = fw + "px";
  face.style.height = fh + "px";
  stage.appendChild(face);

  out.textContent = "{ x: " + round(focus.x) + ", y: " + round(focus.y) + ", w: " + round(focus.w) + " }";
  copy.disabled = false;
  drawPreview();
}

function drawPreview() {
  const c = preview.getContext("2d");
  const k = preview.width / MARK.w;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#0D6D78";
  c.fillRect(0, 0, preview.width, preview.height);
  if (!photo.naturalWidth) return;
  c.setTransform(k, 0, 0, k, 0, (preview.height - MARK.h * k) / 2);
  c.save();
  const clip = new Path2D();
  for (const d of BANDS) clip.addPath(new Path2D(d));
  c.clip(clip);

  // The same cover-and-zoom framing as the hero.
  const f = focus || { x: 0.5, y: 0.4, w: Number(slider.value) };
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const fit = Math.max(MARK.w / iw, MARK.h / ih);
  const zoom = Math.max(1, (MARK.w * FACE_SHARE) / (f.w * iw * fit));
  const scale = fit * zoom;
  const w = iw * scale;
  const h = ih * scale;
  const x = Math.min(0, Math.max(MARK.w - w, AT.x * MARK.w - f.x * w));
  const y = Math.min(0, Math.max(MARK.h - h, AT.y * MARK.h - f.y * h));
  c.filter = "grayscale(1) contrast(1.22) brightness(1.08)";
  c.drawImage(photo, x, y, w, h);
  c.filter = "none";
  c.globalCompositeOperation = "multiply";
  c.fillStyle = "#C2E7EA";
  c.fillRect(0, 0, MARK.w, MARK.h);
  c.globalCompositeOperation = "screen";
  c.fillStyle = "#03292E";
  c.fillRect(0, 0, MARK.w, MARK.h);
  c.restore();
  c.globalCompositeOperation = "source-over";
}

photo.addEventListener("load", update);
if (photo.complete) update();
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  if (req.url === "/image") {
    res.writeHead(200, { "Content-Type": TYPES[extname(imagePath).toLowerCase()] ?? "application/octet-stream" });
    res.end(readFileSync(imagePath));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(page);
});

server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}`;
  console.log(`Focus picker for ${imagePath}\n  ${url}\nCtrl+C to stop.`);
  const open = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
  if (!noOpen) exec(open);
});
