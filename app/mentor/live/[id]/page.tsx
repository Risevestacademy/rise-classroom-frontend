import { AppTopNav } from "@/components/AppTopNav";
import { LiveDeviceCheckPage, liveSessionMetadata } from "@/components/live-room/LivePages";

type Props = { params: Promise<{ id: string }> };

export const generateMetadata = ({ params }: Props) => liveSessionMetadata(params);

export default async function MentorDeviceCheckPage({ params }: Props) {
  return <LiveDeviceCheckPage id={(await params).id} basePath="/mentor" topNav={<AppTopNav basePath="/mentor" breadcrumb={["Overview", { label: "Live sessions", href: "/mentor/live-sessions" }]} />} />;
}
