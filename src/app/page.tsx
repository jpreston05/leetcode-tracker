import AppNav from "@/components/AppNav";
import UpcomingAgenda from "@/components/UpcomingAgenda";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      <AppNav title="Dashboard" />
      <UpcomingAgenda />
    </main>
  );
}
