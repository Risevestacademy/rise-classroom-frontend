import { NewResourceScreen } from "@/features/curriculum/screens/NewResourceScreen";

export default async function NewResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NewResourceScreen id={id} />;
}
