import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { LiveDeviceCheckPage, liveSessionMetadata } from "@/components/live-room/LivePages";

type Props = { params: Promise<{ id: string }> };

export const generateMetadata = ({ params }: Props) => liveSessionMetadata(params);

export default async function InstructorDeviceCheckPage({ params }: Props) {
  return <LiveDeviceCheckPage id={(await params).id} basePath="/instructor" topNav={<InstructorNavbar breadcrumb={["Overview", { label: "Live sessions", href: "/instructor/live" }]} />} />;
}
