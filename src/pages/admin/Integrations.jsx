import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const initialIntegrations = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Send and manage recruiting communication.",
    status: "Not Connected",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Schedule interviews and sync events.",
    status: "Not Connected",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Push hiring and workflow notifications.",
    status: "Not Connected",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Launch and manage interview meetings.",
    status: "Not Connected",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Coordinate meetings and collaboration.",
    status: "Not Connected",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Source and track candidate outreach.",
    status: "Not Connected",
  },
];

export default function Integrations() {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  const toggleConnection = (id) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status:
                item.status === "Connected" ? "Not Connected" : "Connected",
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external tools and communication platforms.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => {
          const connected = integration.status === "Connected";

          return (
            <div
              key={integration.id}
              className="rounded-2xl border bg-card p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{integration.name}</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      connected
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {integration.status}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-6">
                  {integration.description}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant={connected ? "outline" : "default"}
                  onClick={() => toggleConnection(integration.id)}
                >
                  {connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}