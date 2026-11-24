import { AdminTopNav } from "@/components/AdminTopNav";
import { LiveDeviceCheckPage, liveSessionMetadata } from "@/components/live-room/LivePages";

type Props = { params: Promise<{ id: string }> };

export const generateMetadata = ({ params }: Props) => liveSessionMetadata(params);

export default async function AdminDeviceCheckPage({ params }: Props) {
  return <LiveDeviceCheckPage id={(await params).id} basePath="/admin" topNav={<AdminTopNav breadcrumb={["Overview", { label: "Live sessions", href: "/admin/live-sessions" }]} />} />;
}
