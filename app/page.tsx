import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Rise Classroom · Rise Academy by Risevest",
  description:
    "Rise Academy is a free, year-long virtual programme for designers and engineers by Risevest: live classes, a mentor and a stipend, all in Rise Classroom.",
};

export default function HomePage() {
  return <LandingPage />;
}
