import { useQuery } from "@tanstack/react-query";
import { listExpenses } from "@/api/expenses";

export default function ExpensesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: listExpenses,
  });

  if (isLoading) return <div className="p-6">Loading expenses...</div>;
  if (error) return <div className="p-6">Failed to load expenses.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Expenses</h1>
      {data?.map((expense) => (
        <div key={expense.id} className="border rounded-lg p-4">
          <div className="font-medium">{expense.category}</div>
          <div className="text-sm text-muted-foreground">${expense.amount}</div>
        </div>
      ))}
    </div>
  );
}
