import { useQuery } from "@tanstack/react-query";
import { listContacts } from "@/api/contacts";

export default function ContactsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["contacts"],
    queryFn: listContacts,
  });

  if (isLoading) return <div className="p-6">Loading contacts...</div>;
  if (error) return <div className="p-6">Failed to load contacts.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Contacts</h1>
      {data?.map((contact) => (
        <div key={contact.id} className="border rounded-lg p-4">
          <div className="font-medium">{contact.full_name}</div>
          <div className="text-sm text-muted-foreground">{contact.email || "No email"}</div>
        </div>
      ))}
    </div>
  );
}
