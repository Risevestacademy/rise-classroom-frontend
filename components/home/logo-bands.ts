/**
 * The three bands of the Rise mark, straight from public/classroom-logo-teal.svg
 * (viewBox 0 0 37 31), top to bottom. Each one dips in the middle and lifts at
 * the edges, and they thin out as they go down.
 */
export const LOGO_VIEWBOX = { width: 37, height: 31 } as const;

export const LOGO_BANDS = [
  "M18.434 4.78412C19.282 4.05418 20.1933 3.40053 21.1567 2.83066C25.9884 -0.0731586 31.4036 -0.654091 36.8194 0.703049L36.8164 11.1319C35.5021 10.7486 34.1121 10.5519 32.7493 10.4515C32.5244 10.4213 32.2469 10.4285 32.0173 10.4215C27.9631 10.2974 23.9036 11.4433 20.5052 13.6562C19.7643 14.1389 19.1145 14.6435 18.4299 15.2006C13.0016 10.87 6.79908 9.3551 0.0190027 11.1296C-0.0211185 7.67166 0.0164016 4.16046 0.00610495 0.696125C1.5342 0.337283 2.50285 0.156027 4.05445 0.0357817C9.64077 -0.263944 14.1022 1.31937 18.434 4.78412Z",
  "M18.4354 17.6895C19.1964 17.042 20.0041 16.452 20.8521 15.9245C24.4926 13.6724 28.7545 12.6353 33.0222 12.9631C34.4744 13.0785 35.42 13.2791 36.8166 13.6003C36.8302 15.7721 36.8249 17.944 36.8018 20.1158C35.7266 19.7065 33.8098 19.4706 32.6577 19.4074C27.4922 18.964 22.4055 20.9283 18.43 24.1554C17.5513 23.5257 17.0897 23.0799 16.1041 22.4652C12.226 20.0224 7.63073 18.9756 3.07738 19.4978C2.00837 19.6192 1.06232 19.8313 0.0207036 20.0714L0.00952148 13.6151C1.67633 13.2175 2.49426 13.0734 4.2077 12.9364C5.06468 12.8561 6.41993 12.9064 7.27875 12.9921C11.6798 13.4311 15.0184 14.9778 18.4354 17.6895Z",
  "M18.4365 26.654C19.1726 26.0163 19.9585 25.4387 20.7869 24.9267C24.6712 22.495 29.2692 21.4605 33.821 21.9939C34.8856 22.1182 35.7845 22.3274 36.8218 22.5696L36.8206 26.0498C35.4679 25.6563 33.8181 25.4625 32.4191 25.3509C26.9377 25.212 22.6977 26.7159 18.4353 30.1175C17.5547 29.4955 16.9304 28.9334 15.9603 28.354C10.7616 25.2498 5.80934 24.6845 0.0301577 26.0513L0.00317383 22.5855C1.70241 22.123 2.88634 21.971 4.63398 21.8728C9.95337 21.6744 14.3205 23.3926 18.4365 26.654Z",
] as const;

/** A slot along one band, in logo viewBox units. */
export type BandSegment = {
  x: number;
  y: number;
  band: number;
  /** Direction the band runs here, in radians. */
  angle: number;
  /** Band thickness across its direction of travel. */
  thickness: number;
  /** Distance along the band to the next segment. */
  length: number;
};

/**
 * Cuts each band into `counts[i]` equal segments along its centre line, and
 * reports how thick and which way the band runs at each — enough to rebuild
 * the mark, taper and all, out of short pills. Works by rasterising each band
 * and reading every filled pixel column. Browser only (canvas + Path2D).
 */
export function sampleBandSegments(counts: readonly number[]): BandSegment[] {
  const scale = 8;
  const width = LOGO_VIEWBOX.width * scale;
  const height = LOGO_VIEWBOX.height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const segments: BandSegment[] = [];

  LOGO_BANDS.forEach((d, band) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fill(new Path2D(d));

    const pixels = ctx.getImageData(0, 0, width, height).data;
    const columns: { x: number; y: number; span: number }[] = [];

    for (let x = 0; x < width; x++) {
      let top = -1;
      let bottom = -1;
      for (let y = 0; y < height; y++) {
        if (pixels[(y * width + x) * 4 + 3] > 128) {
          if (top < 0) top = y;
          bottom = y;
        }
      }
      if (top >= 0) columns.push({ x, y: (top + bottom) / 2, span: bottom - top + 1 });
    }
    if (columns.length < 2) return;

    // Distance along the centre line, so segments are evenly spaced on the
    // curve rather than bunching up on the flat ends.
    const along = [0];
    for (let i = 1; i < columns.length; i++) {
      along.push(
        along[i - 1] +
          Math.hypot(columns[i].x - columns[i - 1].x, columns[i].y - columns[i - 1].y)
      );
    }
    const total = along[along.length - 1];

    const count = counts[band] ?? 0;
    let cursor = 0;
    for (let k = 0; k < count; k++) {
      const distance = ((k + 0.5) / count) * total;
      while (cursor < columns.length - 1 && along[cursor] < distance) cursor++;

      const here = columns[cursor];
      const before = columns[Math.max(cursor - 6, 0)];
      const after = columns[Math.min(cursor + 6, columns.length - 1)];
      const angle = Math.atan2(after.y - before.y, after.x - before.x);

      segments.push({
        x: here.x / scale,
        y: here.y / scale,
        band,
        angle,
        // Columns measure thickness straight down; across the band is less
        // wherever it slopes.
        thickness: (here.span * Math.cos(angle)) / scale,
        length: total / count / scale,
      });
    }
  });

  return segments;
}
