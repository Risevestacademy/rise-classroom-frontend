import {
  CurriculumDetailScreen,
  type CurriculumDetailSearchParams,
} from "@/features/curriculum/screens/CurriculumDetailScreen";

export default async function CurriculumDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<CurriculumDetailSearchParams>;
}) {
  const { id } = await params;
  return <CurriculumDetailScreen id={id} searchParams={await searchParams} />;
}
