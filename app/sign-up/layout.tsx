import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start for free",
  description:
    "Tell us about yourself and your learning space to start using Rise Classroom.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
