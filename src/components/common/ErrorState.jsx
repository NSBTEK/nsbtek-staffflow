export default function ErrorState({ message = "Something went wrong" }) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
