import { useQuery } from "@tanstack/react-query";
import { listColumnConfigs } from "@/api/columnConfigs";

export function useModuleColumns(module) {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["column-configs", module],
    queryFn: () => listColumnConfigs(module),
  });

  const tableColumns = data
    .filter((c) => c.visible_in_table && c.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const formColumns = data
    .filter((c) => c.visible_in_form && c.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return {
    allColumns: data,
    tableColumns,
    formColumns,
    isLoading,
    error,
  };
}