import { ModuleDetailScreen } from "@/features/curriculum/screens/ModuleDetailScreen";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id, moduleId } = await params;
  return <ModuleDetailScreen id={id} moduleId={moduleId} />;
}
