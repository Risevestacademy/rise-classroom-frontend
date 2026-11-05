import { CurriculumDetailScreen } from "@/features/curriculum/screens/CurriculumDetailScreen";

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CurriculumDetailScreen id={id} />;
}
