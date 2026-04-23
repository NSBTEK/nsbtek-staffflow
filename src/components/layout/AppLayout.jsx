import PageHeroHeader from "@/components/layout/PageHeroHeader";

export default function AppLayout({ children, heroRight = null, heroOverride = null }) {
  return (
    <div className="space-y-6">
      <PageHeroHeader right={heroRight} override={heroOverride} />
      <div>{children}</div>
    </div>
  );
}