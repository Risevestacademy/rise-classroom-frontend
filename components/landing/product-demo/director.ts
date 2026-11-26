import { gsap } from "@/components/landing/motion/gsap";

export type Point = { x: number; y: number };

const ACTIVE = "#080d38";
const IDLE = "#475355";

/**
 * Builds one role's walkthrough. The camera eases in on whatever the pointer
 * is about to use, then pulls back out.
 */
export function createDirector(appEl: HTMLElement, cameraEl: HTMLElement, wake: boolean) {
  const root = appEl.firstElementChild as HTMLElement;
  const phone = root.dataset.layout === "phone";
  const W = root.offsetWidth;
  const H = root.offsetHeight;

  const q = (name: string) => {
    const el = root.querySelector<HTMLElement>(`[data-demo="${name}"]`);
    if (!el) throw new Error(`Missing demo element: ${name}`);
    return el;
  };
  const scene = (name: string) => root.querySelector<HTMLElement>(`[data-scene="${name}"]`)!;

  // Layout offsets, so the lid's tilt and the camera don't skew the numbers.
  const at = (name: string, dx = 0, dy = 0): Point => {
    let el: HTMLElement | null = q(name);
    let x = el.offsetWidth / 2 + dx;
    let y = el.offsetHeight / 2 + dy;
    while (el && el !== root) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }
    return { x, y };
  };

  const cursor = q("cursor");
  const arrow = cursor.querySelector("svg")!;
  const ripple = q("ripple");

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power3.inOut", immediateRender: false },
  });

  const camera = (target: Point | null, zoom: number, position: gsap.Position, duration = 1.1) => {
    // A phone's screen is already close up, so it zooms in less.
    const scale = phone ? 1 + (zoom - 1) * 0.55 : zoom;
    const p = target ?? { x: W / 2, y: H / 2 };
    const clamp = (v: number, size: number) => gsap.utils.clamp(size - size * scale, 0, v);
    tl.to(
      cameraEl,
      {
        scale,
        x: clamp(W / 2 - p.x * scale, W),
        y: clamp(H / 2 - p.y * scale, H),
        duration,
        ease: "expo.inOut",
      },
      position,
    );
  };

  // Kept on screen, so resting spots worked out for the desktop still fit a phone.
  const move = (p: Point, position: gsap.Position = ">", duration = 0.9) =>
    tl.to(
      cursor,
      { x: gsap.utils.clamp(24, W - 24, p.x), y: gsap.utils.clamp(24, H - 24, p.y), duration },
      position,
    );

  const press = (position: gsap.Position = ">") =>
    tl.to(arrow, { scale: 0.82, duration: 0.09, ease: "power2.out", transformOrigin: phone ? "50% 50%" : "2px 2px" }, position);
  const release = (position: gsap.Position = ">") =>
    tl.to(arrow, { scale: 1, duration: 0.25, ease: "back.out(3)" }, position);

  const click = (target?: string, position: gsap.Position = ">") => {
    press(position);
    tl.fromTo(
      ripple,
      { scale: 0, autoAlpha: 0.9 },
      { scale: 2.4, autoAlpha: 0, duration: 0.5, ease: "power2.out" },
      "<",
    );
    release("<0.09");
    if (target) {
      tl.to(q(target), { scale: 0.95, duration: 0.09, ease: "power2.out", yoyo: true, repeat: 1 }, "<-0.09");
    }
  };

  const swap = (from: string, to: string, position: gsap.Position = ">") => {
    tl.to(scene(from), { autoAlpha: 0, y: -10, duration: 0.3, ease: "power2.in" }, position).fromTo(
      scene(to),
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out" },
      ">-0.05",
    );
  };

  const nav = (from: string, to: string, position: gsap.Position = "<") => {
    const pill = q("nav-pill");
    const item = q(`nav-${to}`);
    // The phone's bar runs along the bottom, so its pill slides sideways.
    const slide = pill.dataset.axis === "x" ? { x: item.offsetLeft } : { y: item.offsetTop };
    tl.to(pill, { ...slide, duration: 0.6, ease: "expo.out" }, position)
      .to(q(`nav-${from}`), { color: IDLE, duration: 0.3 }, "<")
      .to(q(`nav-${to}`), { color: ACTIVE, duration: 0.3 }, "<")
      .to(q(`crumb-${from}`), { autoAlpha: 0, duration: 0.25 }, "<")
      .to(q(`crumb-${to}`), { autoAlpha: 1, duration: 0.4 }, "<0.15");
  };

  /** Types into an element that starts empty. */
  const type = (name: string, text: string, position: gsap.Position = ">", perChar = 0.04) => {
    const el = q(name);
    const typed = { count: 0 };
    tl.to(
      typed,
      {
        count: text.length,
        duration: text.length * perChar,
        ease: "none",
        onUpdate: () => {
          el.textContent = text.slice(0, Math.round(typed.count));
        },
      },
      position,
    );
  };

  const count = (
    name: string,
    from: number,
    to: number,
    position: gsap.Position = ">",
    duration = 1.2,
  ) => {
    const el = q(name);
    const value = { n: from };
    tl.to(
      value,
      {
        n: to,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = String(Math.round(value.n));
        },
      },
      position,
    );
  };

  const show = (name: string, position: gsap.Position = ">", duration = 0.5) =>
    tl.fromTo(
      q(name),
      { autoAlpha: 0, y: 12, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration, ease: "expo.out" },
      position,
    );
  const hide = (name: string, position: gsap.Position = ">", duration = 0.3) =>
    tl.to(q(name), { autoAlpha: 0, y: 8, duration, ease: "power2.in" }, position);

  /** Trades a BadgeSwap's first badge for its second. */
  const badge = (id: string, position: gsap.Position = ">") => {
    tl.to(q(`${id}-from`), { autoAlpha: 0, scale: 0.9, duration: 0.2 }, position).fromTo(
      q(`${id}-to`),
      { autoAlpha: 0, scale: 0.6 },
      { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.5)" },
      ">-0.05",
    );
  };

  const openDialog = (id: string, position: gsap.Position = ">") => {
    tl.to(q(`${id}-backdrop`), { autoAlpha: 1, duration: 0.35, ease: "power1.out" }, position).fromTo(
      q(id),
      { autoAlpha: 0, scale: 0.92, y: 24 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" },
      "<0.05",
    );
  };
  const closeDialog = (id: string, position: gsap.Position = ">") => {
    tl.to(q(id), { autoAlpha: 0, scale: 0.96, duration: 0.25, ease: "power2.in" }, position).to(
      q(`${id}-backdrop`),
      { autoAlpha: 0, duration: 0.3 },
      "<0.05",
    );
  };

  /** Shows a toast that hides itself; the next step chains from when it lands. */
  const toast = (id: string, position: gsap.Position = ">", hold = 1.8) => {
    const shown = gsap.fromTo(
      q(id),
      { autoAlpha: 0, y: 24, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.8)", immediateRender: false },
    );
    tl.add(shown, position);
    const landed = shown.endTime();
    tl.to(q(id), { autoAlpha: 0, y: 12, duration: 0.3, ease: "power2.in" }, landed + hold).set(
      {},
      {},
      landed,
    );
  };

  /** Drags the Shell's file in from the right edge and drops it on `zone`. */
  const dropFile = (zone: string, scale: number) => {
    const file = q("file");
    const zoneEl = q(zone);
    const drop = at(zone);
    tl.to(cursor, { x: W + 40, y: drop.y + 40, duration: 0.6, ease: "power2.in" }, ">").set(
      file,
      { x: W + 52, y: drop.y + 52, autoAlpha: 1, rotate: 6 },
    );
    camera(drop, scale, "<", 1.2);
    move({ x: drop.x - 40, y: drop.y - 10 }, "<0.2", 1.2);
    tl.to(file, { x: drop.x - 28, y: drop.y + 2, rotate: -2, duration: 1.2 }, "<")
      .to(zoneEl, { borderColor: "#6c77e6", backgroundColor: "#f5f6ff", duration: 0.3 }, "<0.8")
      .to(file, { scale: 0.6, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, ">0.1")
      .to(zoneEl, { borderColor: "#cbd5d6", backgroundColor: "#f8fafa", duration: 0.4 }, "<0.2");
  };

  gsap.set(cursor, { x: 1000, y: 720 });
  gsap.set(cameraEl, { x: 0, y: 0, scale: 1 });
  // A new role starts on a dark screen and wakes up.
  if (wake) gsap.set(appEl, { autoAlpha: 0 });

  const intro = () => {
    if (wake) {
      tl.fromTo(appEl, { autoAlpha: 0, scale: 1.03 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power2.out" }, 0);
    }
    tl.to(cursor, { autoAlpha: 1, duration: 0.3 }, 0.3);
  };

  /** Pulls back and lets the screen go dark before the next role. */
  const outro = () => {
    camera(null, 1, ">0.4", 1.1);
    tl.to(cursor, { autoAlpha: 0, duration: 0.3 }, "<0.4").to(
      appEl,
      { autoAlpha: 0, duration: 0.6, ease: "power1.in" },
      ">1.2",
    );
  };

  return {
    tl,
    phone,
    width: W,
    height: H,
    q,
    at,
    cursor,
    camera,
    move,
    press,
    release,
    click,
    swap,
    nav,
    type,
    count,
    show,
    hide,
    badge,
    openDialog,
    closeDialog,
    toast,
    dropFile,
    intro,
    outro,
  };
}

export type Director = ReturnType<typeof createDirector>;
