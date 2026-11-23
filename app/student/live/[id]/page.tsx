import { LiveDeviceCheckPage, liveSessionMetadata } from "@/components/live-room/LivePages";

type Props = { params: Promise<{ id: string }> };

export const generateMetadata = ({ params }: Props) => liveSessionMetadata(params);

export default async function StudentDeviceCheckPage({ params }: Props) {
  return <LiveDeviceCheckPage id={(await params).id} basePath="/student" />;
}
