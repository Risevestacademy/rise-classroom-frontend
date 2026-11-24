import type { Metadata } from "next";
import { MascotPlayground } from "@/components/mascot/MascotPlayground";

export const metadata: Metadata = {
  title: "Mascot preview",
  robots: { index: false, follow: false },
};

export default function MascotPreviewPage() {
  return <MascotPlayground />;
}
