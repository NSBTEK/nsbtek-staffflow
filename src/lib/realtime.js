import { supabase } from "@/lib/supabaseClient";

export function subscribeToTableChanges({
  channelName,
  schema = "public",
  table,
  event = "*",
  filter,
  onChange,
}) {
  let channel = supabase.channel(channelName);

  channel = channel.on(
    "postgres_changes",
    {
      event,
      schema,
      table,
      ...(filter ? { filter } : {}),
    },
    (payload) => {
      onChange?.(payload);
    }
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}