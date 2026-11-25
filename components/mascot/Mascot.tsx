import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import styles from "./mascot.module.css";
import { BLOOM, type MascotStage } from "./growth";
import type { Scene } from "./life";

export type MascotMood =
  | "happy"
  | "thinking"
  | "celebrate"
  | "sleepy"
  | "worried"
  | "proud";

export type MascotPalette = {
  pot: string;
  logo: string;
  body: string;
  stem: string;
  leaf: string;
  leafAlt: string;
  ink: string;
  eyeWhite: string;
  cheek: string;
  petal: string;
  petalCenter: string;
  accent: string;
};

/** Draft palette from the teal design tokens. */
export const TEAL_PALETTE: MascotPalette = {
  pot: "#080D38",
  logo: "#FFFFFF",
  body: "#0D6D78",
  stem: "#094D55",
  leaf: "#3FA6AD",
  leafAlt: "#2E8F96",
  ink: "#080D38",
  eyeWhite: "#FFFFFF",
  cheek: "#F2B8B8",
  petal: "#F0D58A",
  petalCenter: "#8A6100",
  accent: "#0D6D78",
};

/** Same character on the navy/periwinkle scale currently in globals.css. */
export const BRAND_PALETTE: MascotPalette = {
  pot: "#080D38",
  logo: "#FFFFFF",
  body: "#4F59C7",
  stem: "#20286F",
  leaf: "#929BFF",
  leafAlt: "#6C77E6",
  ink: "#080D38",
  eyeWhite: "#FFFFFF",
  cheek: "#F2B8B8",
  petal: "#F0D58A",
  petalCenter: "#8A6100",
  accent: "#4F59C7",
};

const BODY_HEIGHT = [78, 82, 86, 90, 94, 96, 98];
const STEM_HEIGHT = [0, 22, 34, 52, 72, 76, 76];
const CX = 120;

type Leaf = { up: number; length: number; angle: number };

/** Leaf pairs per stage, top pair first, so a pair keeps its place as the plant grows. */
const LEAVES: Leaf[][] = [
  [],
  [{ up: 20, length: 30, angle: -30 }],
  [{ up: 32, length: 42, angle: -28 }],
  [
    { up: 50, length: 40, angle: -34 },
    { up: 14, length: 40, angle: -14 },
  ],
  [
    { up: 66, length: 32, angle: -42 },
    { up: 38, length: 42, angle: -26 },
    { up: 12, length: 44, angle: -10 },
  ],
  [
    { up: 64, length: 32, angle: -42 },
    { up: 38, length: 42, angle: -26 },
    { up: 12, length: 44, angle: -10 },
  ],
  [
    { up: 62, length: 32, angle: -42 },
    { up: 38, length: 42, angle: -26 },
    { up: 12, length: 44, angle: -10 },
  ],
];
/** A leaf still too small to draw cleanly. */
const MIN_LEAF = 8;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Splits growth (0–6) into its stage and how far it is towards the next. */
function splitGrowth(growth: number) {
  const clamped = Math.min(BLOOM, Math.max(0, growth));
  const stage = Math.min(BLOOM, Math.floor(clamped)) as MascotStage;
  return { stage, next: Math.min(BLOOM, stage + 1), t: clamped - stage };
}

function leafPath(length: number) {
  const L = length;
  const n = (v: number) => v.toFixed(1);
  return (
    `M0 0 C${n(0.3 * L)} ${n(-0.42 * L)} ${n(0.72 * L)} ${n(-0.52 * L)} ${n(L)} ${n(-0.44 * L)} ` +
    `C${n(0.93 * L)} ${n(-0.22 * L)} ${n(0.58 * L)} ${n(-0.06 * L)} 0 0Z`
  );
}

function LeafPair({
  y,
  length,
  angle,
  palette,
}: {
  y: number;
  length: number;
  angle: number;
  palette: MascotPalette;
}) {
  const d = leafPath(length);
  return (
    <>
      {[
        { flip: 1, color: palette.leaf },
        { flip: -1, color: palette.leafAlt },
      ].map(({ flip, color }) => (
        <path
          key={flip}
          d={d}
          fill={color}
          stroke={color}
          strokeWidth={5}
          strokeLinejoin="round"
          transform={`translate(${CX} ${y}) scale(${flip} 1) rotate(${angle})`}
        />
      ))}
    </>
  );
}

function Plant({
  growth,
  top,
  palette,
}: {
  growth: number;
  top: number;
  palette: MascotPalette;
}) {
  const { stage, next, t } = splitGrowth(growth);
  const stem = lerp(STEM_HEIGHT[stage], STEM_HEIGHT[next], t);
  // Pairs the next stage adds grow in from nothing; the rest ease into place.
  const leaves = LEAVES[next].map((to, index) => {
    const from = LEAVES[stage][index] ?? { ...to, up: to.up * 0.6, length: 0 };
    return {
      up: lerp(from.up, to.up, t),
      length: lerp(from.length, to.length, t),
      angle: lerp(from.angle, to.angle, t),
    };
  });
  const flowerY = top - stem - 8;

  return (
    <g>
      {stem > 0 && (
        <rect
          x={CX - 3}
          y={top - stem}
          width={6}
          height={stem + 8}
          rx={3}
          fill={palette.stem}
        />
      )}
      {stage === 0 && t < 0.5 && (
        <path
          d={`M${CX} ${top + 2} Q${CX + 2} ${top - 10} ${CX + 10} ${top - 12} Q${CX + 8} ${top - 3} ${CX} ${top + 2}Z`}
          fill={palette.leaf}
        />
      )}
      {leaves.map(
        (leaf, index) =>
          leaf.length >= MIN_LEAF && (
            <LeafPair
              key={index}
              y={top - leaf.up}
              length={leaf.length}
              angle={leaf.angle}
              palette={palette}
            />
          ),
      )}
      {stage === 5 && (
        <g transform={`translate(${CX} ${flowerY}) scale(${lerp(0.8, 1.25, t)})`}>
          <ellipse cx={0} cy={-3} rx={9} ry={12} fill={palette.petal} />
          <path d="M-9 2 Q0 12 9 2 Q4 -2 0 4 Q-4 -2 -9 2Z" fill={palette.leafAlt} />
        </g>
      )}
      {stage === BLOOM && (
        <g>
          {[0, 1, 2, 3, 4].map((k) => {
            const a = ((k * 72 - 90) * Math.PI) / 180;
            return (
              <circle
                key={k}
                cx={CX + 13 * Math.cos(a)}
                cy={flowerY + 13 * Math.sin(a)}
                r={11}
                fill={palette.petal}
              />
            );
          })}
          <circle cx={CX} cy={flowerY} r={8} fill={palette.petalCenter} />
        </g>
      )}
    </g>
  );
}

function Face({
  top,
  mood,
  palette,
  look,
}: {
  top: number;
  mood: MascotMood;
  palette: MascotPalette;
  look?: { x: number; y: number };
}) {
  const ey = top + 36;
  const my = ey + 19;
  const eyeX = [102, 138];
  const ink = palette.ink;

  let eyes;
  if (mood === "sleepy" || mood === "celebrate" || mood === "proud") {
    const yBase = mood === "sleepy" ? ey : ey + 4;
    const yCtrl = mood === "sleepy" ? ey + 8 : ey - 10;
    eyes = eyeX.map((x) => (
      <path
        key={x}
        d={`M${x - 11} ${yBase} Q${x} ${yCtrl} ${x + 11} ${yBase}`}
        stroke={ink}
        strokeWidth={4.5}
        fill="none"
        strokeLinecap="round"
      />
    ));
  } else {
    const rest =
      mood === "thinking"
        ? { dx: 3, dy: -5 }
        : mood === "worried"
          ? { dx: 0, dy: 4 }
          : { dx: 1, dy: 2 };
    const gaze = look ? { dx: look.x * 4.5, dy: look.y * 5 } : rest;
    eyes = (
      <g className={styles.eyes}>
        {eyeX.map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={ey} rx={13} ry={15} fill={palette.eyeWhite} />
            <g
              style={{
                transform: `translate(${gaze.dx}px, ${gaze.dy}px)`,
                transition: "transform 0.15s ease-out",
              }}
            >
              <circle cx={x} cy={ey} r={7.5} fill={ink} />
              <circle
                cx={x + 2.5}
                cy={ey - 3}
                r={2.6}
                fill={palette.eyeWhite}
              />
            </g>
          </g>
        ))}
      </g>
    );
  }

  let mouth;
  if (mood === "celebrate") {
    mouth = (
      <path
        d={`M108 ${my - 2} H132 Q130 ${my + 14} 120 ${my + 14} Q110 ${my + 14} 108 ${my - 2}Z`}
        fill={ink}
      />
    );
  } else if (mood === "thinking") {
    mouth = (
      <path
        d={`M112 ${my + 4} L128 ${my}`}
        stroke={ink}
        strokeWidth={4}
        strokeLinecap="round"
      />
    );
  } else if (mood === "worried") {
    mouth = (
      <path
        d={`M112 ${my + 7} Q120 ${my} 128 ${my + 7}`}
        stroke={ink}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    );
  } else if (mood === "sleepy") {
    mouth = <ellipse cx={120} cy={my + 3} rx={4} ry={5} fill={ink} />;
  } else {
    mouth = (
      <path
        d={`M111 ${my} Q120 ${my + 10} 129 ${my}`}
        stroke={ink}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  return (
    <g>
      {eyes}
      {mood === "worried" &&
        [-1, 1].map((side) => (
          <path
            key={side}
            d={`M${120 + side * 28} ${ey - 20} L${120 + side * 10} ${ey - 25}`}
            stroke={ink}
            strokeWidth={4}
            strokeLinecap="round"
          />
        ))}
      <ellipse cx={86} cy={ey + 17} rx={8} ry={5} fill={palette.cheek} />
      <ellipse cx={154} cy={ey + 17} rx={8} ry={5} fill={palette.cheek} />
      {mouth}
    </g>
  );
}

const LOGO_PATHS = [
  "M18.434 4.78412C19.282 4.05418 20.1933 3.40053 21.1567 2.83066C25.9884 -0.0731586 31.4036 -0.654091 36.8194 0.703049L36.8164 11.1319C35.5021 10.7486 34.1121 10.5519 32.7493 10.4515C32.5244 10.4213 32.2469 10.4285 32.0173 10.4215C27.9631 10.2974 23.9036 11.4433 20.5052 13.6562C19.7643 14.1389 19.1145 14.6435 18.4299 15.2006C13.0016 10.87 6.79908 9.3551 0.0190027 11.1296C-0.0211185 7.67166 0.0164016 4.16046 0.00610495 0.696125C1.5342 0.337283 2.50285 0.156027 4.05445 0.0357817C9.64077 -0.263944 14.1022 1.31937 18.434 4.78412Z",
  "M18.4354 17.6895C19.1964 17.042 20.0041 16.452 20.8521 15.9245C24.4926 13.6724 28.7545 12.6353 33.0222 12.9631C34.4744 13.0785 35.42 13.2791 36.8166 13.6003C36.8302 15.7721 36.8249 17.944 36.8018 20.1158C35.7266 19.7065 33.8098 19.4706 32.6577 19.4074C27.4922 18.964 22.4055 20.9283 18.43 24.1554C17.5513 23.5257 17.0897 23.0799 16.1041 22.4652C12.226 20.0224 7.63073 18.9756 3.07738 19.4978C2.00837 19.6192 1.06232 19.8313 0.0207036 20.0714L0.00952148 13.6151C1.67633 13.2175 2.49426 13.0734 4.2077 12.9364C5.06468 12.8561 6.41993 12.9064 7.27875 12.9921C11.6798 13.4311 15.0184 14.9778 18.4354 17.6895Z",
  "M18.4365 26.654C19.1726 26.0163 19.9585 25.4387 20.7869 24.9267C24.6712 22.495 29.2692 21.4605 33.821 21.9939C34.8856 22.1182 35.7845 22.3274 36.8218 22.5696L36.8206 26.0498C35.4679 25.6563 33.8181 25.4625 32.4191 25.3509C26.9377 25.212 22.6977 26.7159 18.4353 30.1175C17.5547 29.4955 16.9304 28.9334 15.9603 28.354C10.7616 25.2498 5.80934 24.6845 0.0301577 26.0513L0.00317383 22.5855C1.70241 22.123 2.88634 21.971 4.63398 21.8728C9.95337 21.6744 14.3205 23.3926 18.4365 26.654Z",
];

function Extras({
  mood,
  top,
  palette,
}: {
  mood: MascotMood;
  top: number;
  palette: MascotPalette;
}) {
  if (mood === "thinking") {
    return (
      <g>
        {[
          [172, top + 8, 4],
          [184, top - 6, 6],
          [200, top - 24, 9],
        ].map(([x, y, r], i) => (
          <circle
            key={i}
            className={styles.dot}
            style={{ animationDelay: `${i * 0.2}s` }}
            cx={x}
            cy={y}
            r={r}
            fill={palette.accent}
          />
        ))}
      </g>
    );
  }
  if (mood === "sleepy") {
    return (
      <g
        fontFamily="var(--font-lato), Arial, sans-serif"
        fontWeight={700}
        fill={palette.ink}
      >
        {[
          { x: 176, y: top + 10, size: 20, delay: 0 },
          { x: 192, y: top - 8, size: 14, delay: 1.3 },
        ].map((z) => (
          <text
            key={z.delay}
            className={styles.z}
            style={{ animationDelay: `${z.delay}s` }}
            x={z.x}
            y={z.y}
            fontSize={z.size}
          >
            z
          </text>
        ))}
      </g>
    );
  }
  if (mood === "celebrate") {
    const bits: [number, number, string, number][] = [
      [52, 70, palette.petal, 0],
      [190, 50, palette.leaf, 0.4],
      [205, 110, palette.petal, 0.9],
      [36, 130, palette.leaf, 1.2],
      [150, 30, palette.petal, 0.6],
      [80, 40, palette.leafAlt, 1.5],
    ];
    return (
      <g>
        {bits.map(([x, y, c, delay], i) => (
          <rect
            key={i}
            className={styles.confetti}
            style={{ animationDelay: `${delay}s` }}
            x={x}
            y={y}
            width={9}
            height={9}
            rx={2}
            fill={c}
          />
        ))}
      </g>
    );
  }
  return null;
}

function SceneArt({
  scene,
  top,
  palette,
}: {
  scene: Scene;
  top: number;
  palette: MascotPalette;
}) {
  if (scene === "sun") {
    return (
      <g className={styles.sun} transform={`translate(202 ${top - 34})`}>
        <g className={styles.rays} stroke={palette.petal} strokeWidth={4} strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path key={angle} d="M0 -17 V-23" transform={`rotate(${angle})`} />
          ))}
        </g>
        <circle r={11} fill={palette.petal} />
      </g>
    );
  }
  if (scene === "moon") {
    return (
      <path
        transform={`translate(44 ${top - 30})`}
        d="M12 -14 A16 16 0 1 0 16 12 A12 12 0 1 1 12 -14Z"
        fill={palette.petal}
      />
    );
  }
  return (
    <g fill={palette.leaf}>
      {[
        [96, 0],
        [122, 0.5],
        [146, 1],
      ].map(([x, delay]) => (
        <path
          key={x}
          className={styles.drop}
          style={{ animationDelay: `${delay}s` }}
          transform={`translate(${x} ${top - 112})`}
          d="M0 -8 Q6 2 0 6 Q-6 2 0 -8Z"
        />
      ))}
    </g>
  );
}

export type MascotProps = {
  stage?: MascotStage;
  /** Growth from 0 to 6, fractions included; takes over from `stage` for in-between sizes. */
  growth?: number;
  mood?: MascotMood;
  /** What's going on around it; left out for the busier moods. */
  scene?: Scene;
  palette?: MascotPalette;
  size?: number;
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
  /** Pupil direction, each axis -1 to 1. */
  look?: { x: number; y: number };
  /** Increment to replay the poke (squish) animation. */
  pokeKey?: number;
  /** Freeze looping animations in place (e.g. while off screen). */
  paused?: boolean;
  /** False shows the empty pot, before the seed goes in. */
  planted?: boolean;
  /** Frames just the face in a square, for sizes too small for the whole plant. */
  closeUp?: boolean;
  /** Track finished: a ribbon on the pot that only finishing earns. */
  complete?: boolean;
};

export function Mascot({
  stage: stageProp = 3,
  growth = stageProp,
  mood = "happy",
  scene,
  palette = TEAL_PALETTE,
  size = 160,
  animated = true,
  className,
  style,
  label = "Leafy",
  look,
  pokeKey = 0,
  paused = false,
  planted = true,
  closeUp = false,
  complete = false,
}: MascotProps) {
  const { stage, next, t } = splitGrowth(growth);
  const top = 200 - lerp(BODY_HEIGHT[stage], BODY_HEIGHT[next], t);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={closeUp ? `58 ${top - 22} 124 124` : "0 -10 240 310"}
      width={size}
      height={closeUp ? size : (size * 310) / 240}
      className={cn(
        styles.root,
        animated && mood === "celebrate" && styles.celebrate,
        animated && mood === "sleepy" && styles.sleepy,
        animated && scene === "sun" && styles.sunny,
        !animated && styles.static,
        paused && styles.paused,
        className,
      )}
      style={style}
    >
      {animated && planted && <Extras mood={mood} top={top} palette={palette} />}
      {scene && <SceneArt scene={scene} top={top} palette={palette} />}
      <g
        key={pokeKey}
        className={animated && pokeKey > 0 ? styles.poke : undefined}
      >
        <g className={animated ? styles.hop : undefined}>
          {planted ? (
            <>
              <g key={stage} className={animated ? styles.grow : undefined}>
                <g className={animated ? styles.plant : undefined}>
                  <Plant growth={growth} top={top} palette={palette} />
                </g>
              </g>
              <g className={animated ? styles.body : undefined}>
                <path
                  d={`M70 210 V${top + 50} A50 50 0 0 1 170 ${top + 50} V210Z`}
                  fill={palette.body}
                />
                <Face top={top} mood={mood} palette={palette} look={look} />
              </g>
            </>
          ) : (
            <ellipse cx={CX} cy={198} rx={56} ry={9} fill={palette.stem} />
          )}
          <path
            d="M58 210 H182 L172 278 Q170 288 160 288 H80 Q70 288 68 278Z"
            fill={palette.pot}
          />
          <rect
            x={48}
            y={196}
            width={144}
            height={24}
            rx={12}
            fill={palette.pot}
          />
          <g fill={palette.logo} transform="translate(104 236) scale(.86)">
            {LOGO_PATHS.map((d) => (
              <path key={d.slice(0, 12)} d={d} />
            ))}
          </g>
          {complete && (
            <g className={animated ? styles.grow : undefined}>
              <path d="M170 214 L162 246 L170 240 L175 249 Z" fill={palette.accent} />
              <path d="M178 214 L186 246 L178 240 L173 249 Z" fill={palette.accent} />
              <circle cx={174} cy={210} r={12} fill={palette.petal} />
              <circle cx={174} cy={210} r={6} fill={palette.petalCenter} />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
