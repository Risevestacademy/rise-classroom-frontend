import { NewAssignmentScreen } from "@/features/curriculum/screens/NewAssignmentScreen";

export default async function NewAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NewAssignmentScreen id={id} />;
}
