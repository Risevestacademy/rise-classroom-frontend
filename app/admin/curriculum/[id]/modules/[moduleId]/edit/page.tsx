import { EditModuleScreen } from "@/features/curriculum/screens/EditModuleScreen";

export default async function EditModulePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id, moduleId } = await params;
  return <EditModuleScreen id={id} moduleId={moduleId} />;
}
