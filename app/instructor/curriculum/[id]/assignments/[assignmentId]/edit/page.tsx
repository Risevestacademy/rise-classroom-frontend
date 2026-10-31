import { EditAssignmentScreen } from "@/features/curriculum/screens/NewAssignmentScreen";

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  return <EditAssignmentScreen id={id} assignmentId={assignmentId} />;
}
