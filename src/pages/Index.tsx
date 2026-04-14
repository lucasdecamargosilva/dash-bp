import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const Index = () => {
  return (
    <div className="min-h-screen bg-background bp-scroll">
      <DashboardHeader />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        <DashboardOverview />
      </main>
    </div>
  );
};
export default Index;
