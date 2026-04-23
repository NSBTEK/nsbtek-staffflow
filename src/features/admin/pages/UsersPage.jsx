import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/api/users";

export default function UsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  if (isLoading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6">Failed to load users.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      {data?.map((user) => (
        <div key={user.id} className="border rounded-lg p-4">
          <div className="font-medium">{user.full_name || user.email}</div>
          <div className="text-sm text-muted-foreground">{user.role || "No role"}</div>
        </div>
      ))}
    </div>
  );
}
