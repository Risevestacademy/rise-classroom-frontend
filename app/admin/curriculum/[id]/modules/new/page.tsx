import { NewModuleScreen } from "@/features/curriculum/screens/NewModuleScreen";

export default async function NewModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NewModuleScreen id={id} />;
}
