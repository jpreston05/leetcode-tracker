import ActivityHeatmap from "@/components/ActivityHeatmap";
import AppNav from "@/components/AppNav";
import UpcomingAgenda from "@/components/UpcomingAgenda";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      <AppNav title="Dashboard" />
      <div className="flex flex-col gap-10">
        <UpcomingAgenda />
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-500">Activity</h2>
          <ActivityHeatmap />
        </section>
      </div>
    </main>
  );
}
