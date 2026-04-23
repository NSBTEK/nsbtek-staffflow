export default function EmptyState({ title = "No data found", description = "There is nothing to show yet." }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
