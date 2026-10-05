/**
 * The landing page story, one chapter per scroll beat. The canvas draws what
 * happens to the student in each chapter; this file holds what the page says
 * alongside it, and how much scrolling each chapter gets.
 */

export type ChapterId =
  | "hero"
  | "join"
  | "track"
  | "design"
  | "frontend"
  | "backend"
  | "mobile"
  | "taught"
  | "mentor"
  | "stipend"
  | "together"
  | "next"
  | "rise"
  | "partner"
  | "own"
  | "home"
  | "end";

/**
 * Where the copy sits. The canvas puts the student on the opposite side, so
 * "left" copy means the object sits right of centre. "top" and "bottom" copy
 * leave the object in the middle. On phones the copy always sits at the bottom.
 */
export type CopyAlign = "left" | "right" | "top" | "bottom";

export type Chapter = {
  id: ChapterId;
  /** Screens of scrolling this chapter gets. */
  screens: number;
  align: CopyAlign;
  /** Short label for the progress rail. */
  rail: string;
  kicker?: string;
  title: string;
  body?: string;
  /** The canvas goes dark behind this chapter, so the copy turns white. */
  dark?: boolean;
};

/** Placeholders until the real waitlist and application links are ready. */
export const WAITLIST_HREF = "#waitlist";
export const APPLY_HREF = "#apply";

export type SeatAnswers = { name: string; email: string; track: string };

/**
 * Where the sentence on the last screen sends people: the application when a
 * cohort is open, the waitlist when not. Placeholder: once the real flows
 * exist, pass the answers along (most form tools take them as prefill query
 * params) or post them to an API instead. Nothing is stored yet.
 */
export function seatUrl(open: boolean, answers: SeatAnswers) {
  void answers;
  return open ? APPLY_HREF : WAITLIST_HREF;
}

/*
 * Never put the stipend amount anywhere on this page: students only find out
 * what it is when it arrives.
 */
export const CHAPTERS: readonly Chapter[] = [
  {
    id: "hero",
    screens: 2,
    align: "left",
    rail: "Rise",
    kicker: "A 12-month program for designers and engineers",
    title: "We build the best designers and engineers.",
  },
  {
    id: "track",
    screens: 1,
    align: "right",
    rail: "Apply",
    kicker: "When you apply · Choose your craft",
    title: "Design. Frontend. Backend. Mobile.",
    body: "You pick your track when you apply. Go deep in yours, and learn how the other three think.",
  },
  {
    id: "join",
    screens: 1,
    align: "bottom",
    rail: "Week 01",
    kicker: "Week 01 · Onboarding",
    title: "Sixty people. Twelve months. One requirement: grit.",
    body: "Week one is onboarding: meet your cohort, your tools and the people teaching you. A virtual program for 18 to 28 year olds across Africa.",
  },
  {
    id: "design",
    screens: 1,
    align: "left",
    rail: "Design",
    kicker: "Design track",
    title: "It starts as a sketch.",
    body: "Research, wireframes and design systems in Figma and Adobe XD. Design things people actually want to use.",
  },
  {
    id: "frontend",
    screens: 1,
    align: "right",
    rail: "Frontend",
    kicker: "Frontend track",
    title: "Then it comes alive in the browser.",
    body: "HTML, CSS, JavaScript and React. Pixel-perfect, accessible and fast.",
  },
  {
    id: "backend",
    screens: 1,
    align: "left",
    rail: "Backend",
    kicker: "Backend track",
    title: "Underneath, everything has to work.",
    body: "Python, Node and SQL. APIs, databases, auth and caching that hold up when real users arrive.",
  },
  {
    id: "mobile",
    screens: 1,
    align: "top",
    rail: "Mobile",
    kicker: "Mobile track",
    title: "And it fits in your pocket.",
    body: "Swift, Kotlin and Flutter. Apps that feel at home on every phone.",
  },
  {
    id: "taught",
    screens: 1,
    align: "right",
    rail: "Classes",
    kicker: "Every week · Live",
    title: "Taught live, by people who ship.",
    body: "Real classes with real instructors. Ask anything, get unstuck the same day.",
  },
  {
    id: "mentor",
    screens: 1,
    align: "left",
    rail: "Mentor",
    kicker: "All year · 1:1",
    title: "A mentor who walks it with you.",
    body: "One person in your corner from week one: code reviews, career advice and the odd pep talk.",
  },
  {
    id: "stipend",
    screens: 1,
    align: "top",
    rail: "Stipend",
    kicker: "Yes, really",
    title: "You get paid to learn.",
    body: "Every student gets a stipend. How much? That part stays a surprise.",
    dark: true,
  },
  {
    id: "together",
    screens: 2,
    align: "right",
    rail: "Build",
    kicker: "The build",
    title: "Four crafts. One product.",
    body: "Designers and engineers from every track ship real products together, the way real teams do.",
  },
  {
    id: "next",
    screens: 1,
    align: "bottom",
    rail: "Week 52",
    kicker: "Week 52 · Graduation",
    title: "Then three doors open.",
    body: "Twelve months of shipped work gets you somewhere. Where you go next is up to you.",
  },
  {
    id: "rise",
    screens: 1,
    align: "bottom",
    rail: "Risevest",
    kicker: "Door 01 · Risevest",
    title: "Join the team that trained you.",
    body: "Top graduates can be offered a role at Risevest, building real products alongside the people who taught them.",
  },
  {
    id: "partner",
    screens: 1,
    align: "bottom",
    rail: "Partners",
    kicker: "Door 02 · Hiring partners",
    title: "Get hired by our partners.",
    body: "We introduce graduates to partner companies looking for exactly what you've learned to build.",
  },
  {
    id: "own",
    screens: 1,
    align: "bottom",
    rail: "Your path",
    kicker: "Door 03 · Your own path",
    title: "Or build something of your own.",
    body: "Leave with the skills, a portfolio and a network that has watched you ship. Plenty of good things start right after Rise.",
  },
  {
    id: "home",
    screens: 2,
    align: "bottom",
    rail: "Rise",
    kicker: "Whichever door you pick",
    title: "Wherever you go, you go as Rise.",
  },
  {
    id: "end",
    screens: 1.5,
    align: "left",
    rail: "Apply",
    kicker: "Applications open soon",
    title: "Save your seat.",
  },
];

export const TOTAL_SCREENS = CHAPTERS.reduce((sum, chapter) => sum + chapter.screens, 0);
