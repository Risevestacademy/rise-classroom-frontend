import { queryOptions } from "@tanstack/react-query";

export type Track = "Design" | "Frontend" | "Backend" | "Mobile";

/** Someone at Rise the landing page shows. */
export type Person = {
  name: string;
  role: "Student" | "Mentor" | "Instructor";
  track: Track;
  photo: string;
  /**
   * Where the eyes are in the photo (0..1 across and down), and how much of
   * the photo's width the face takes up, so it can be framed at a set size.
   */
  focus: { x: number; y: number; w?: number };
  /**
   * One line in their own words, shown under their name on the opening
   * screen. Must be what they actually said: never write it for them.
   */
  quote?: string;
};

/** A line from someone at Rise, shown in a chapter of the story. */
export type Testimonial = {
  person: Person;
  quote: string;
  /** Which chapter it belongs to (see components/landing/story.ts). */
  chapter: string;
};

export type LandingPeople = {
  /** Whose Rise Classroom the story opens near the end. */
  student: Person;
  /** The people the Rise mark shows on the opening screen, one at a time. */
  hero: Person[];
  /** Faces in the week-one cohort. */
  cohort: string[];
  /** Who teaches the live class and who mentors, in the story. */
  instructor: Person;
  mentor: Person;
  testimonials: Testimonial[];
};

/*
 * Mock until the backend serves this. Names are real Rise students and
 * staff; the photos are stand-in stock photos (Unsplash) in
 * public/landing/people, to be replaced with their own pictures under the
 * same file names. Quotes are drafts for them to rewrite in their own words.
 * Find a photo's focus with `pnpm focus public/landing/people/<file>`.
 */
const person = (
  name: string,
  role: Person["role"],
  track: Track,
  file: string,
  focus: Person["focus"] = { x: 0.5, y: 0.35 },
  fileFormat: "jpg" | "png" | "webp" | "jpeg" = "jpg"
): Person => ({ name, role, track, photo: `/landing/people/${file}.${fileFormat}`, focus });

const CHIJIOKE = person("Chijioke", "Student", "Frontend", "chijioke", { x: 0.529, y: 0.358, w: 0.515 }, "webp");
const PEACE = person("Peace", "Mentor", "Frontend", "peace", { x: 0.433, y: 0.517, w: 0.415 });
const CHINYERE = person("Chinyere", "Student", "Backend", "chinyere", { x: 0.462, y: 0.348, w: 0.535 }, "jpeg");
const GABRIEL = person("Gabriel", "Student", "Mobile", "gabriel", { x: 0.481, y: 0.599, w: 0.47 });
const MICHEAL = person("Micheal", "Student", "Design", "micheal", { x: 0.498, y: 0.515, w: 0.54 });
const IYOBOSA = person("Iyobosa", "Student", "Frontend", "iyobosa", { x: 0.45, y: 0.32 });
const MAC_DAVID = person("Mac David", "Instructor", "Backend", "mac-david", { x: 0.506, y: 0.244, w: 0.175 });

const MOCK_PEOPLE: LandingPeople = {
  student: MICHEAL,
  hero: [CHIJIOKE, PEACE, MICHEAL, GABRIEL, IYOBOSA, CHINYERE, MAC_DAVID],
  cohort: [
    GABRIEL.photo,
    MICHEAL.photo,
    IYOBOSA.photo,
    CHINYERE.photo,
    CHIJIOKE.photo,
    ...[1, 2, 3, 4, 5, 6].map((n) => `/landing/people/cohort-${n}.jpg`),
  ],
  instructor: MAC_DAVID,
  mentor: PEACE,
  testimonials: [
    {
      chapter: "join",
      person: GABRIEL,
      quote: "Week one, I didn't know anyone. By week three we had a group chat that never sleeps.",
    },
    {
      chapter: "taught",
      person: CHINYERE,
      quote: "I asked the same question three ways and Mac David answered all three. Live classes hit different.",
    },
    {
      chapter: "mentor",
      person: CHIJIOKE,
      quote: "Peace reviews my code like it's going to production. That's exactly why I'm getting better.",
    },
    // For the stipend chapter, which is off the landing page for now.
    // {
    //   chapter: "stipend",
    //   person: IYOBOSA,
    //   quote: "I didn't believe the stipend was real until it landed. It let me focus on learning.",
    // },
    {
      chapter: "together",
      person: MICHEAL,
      quote: "Designing next to engineers changed how I design. Now I know what's hard to build.",
    },
    // For the after-graduation chapters, which are off the landing page for now.
    // {
    //   chapter: "rise",
    //   person: CHIJIOKE,
    //   quote: "Door one is the dream. Shipping at the company that taught you.",
    // },
    // {
    //   chapter: "partner",
    //   person: CHINYERE,
    //   quote: "I want a backend role where real users depend on my code. That's what we practise here.",
    // },
    // {
    //   chapter: "own",
    //   person: GABRIEL,
    //   quote: "I'm already sketching the app I'll build when this is done.",
    // },
  ],
};

async function getLandingPeople(): Promise<LandingPeople> {
  // Later: const { data } = await api.get<Envelope<LandingPeople>>("/landing/people");
  return MOCK_PEOPLE;
}

export const landingPeopleQuery = () =>
  queryOptions({
    queryKey: ["landing", "people"] as const,
    queryFn: getLandingPeople,
    staleTime: 5 * 60_000,
  });
