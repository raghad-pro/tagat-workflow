import { TasksManagementPage } from "@/modules/tasks/components/TasksManagementPage";
import RoleGuard from "@/guards/RoleGuard";

export default function TasksPage() {
  return (
    <RoleGuard allowedRoles={["super_admin", "company", "employee"]}>
      <TasksManagementPage />
    </RoleGuard>
  );
}
