import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Rise Classroom to continue learning, teaching or managing your cohorts.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
