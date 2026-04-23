import { useMutation } from "@tanstack/react-query";
import { validateIntegration } from "@/api/integrations";

export default function IntegrationsPage() {
  const mutation = useMutation({
    mutationFn: validateIntegration,
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Integrations</h1>
      <button
        className="px-4 py-2 rounded bg-black text-white"
        onClick={() => mutation.mutate({ providerKey: "example", credentials: {}, settings: {} })}
      >
        Validate Example Integration
      </button>
      {mutation.data && <pre className="text-xs border rounded p-3 overflow-auto">{JSON.stringify(mutation.data, null, 2)}</pre>}
    </div>
  );
}
