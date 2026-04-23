import { pageHeroConfig } from "@/lib/pageHeroConfig";
import { useLocation } from "react-router-dom";

export default function PageHeroHeader({ right = null, override = null }) {
  const location = useLocation();
  const config = override || pageHeroConfig[location.pathname];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {config.eyebrow}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {config.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {config.description}
            </p>
          </div>
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}