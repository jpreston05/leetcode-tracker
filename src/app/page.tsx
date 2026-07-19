import AppNav from "@/components/AppNav";

// Landing page. Becomes the "due today" review list in M2.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      <AppNav title="Due today" />
      <p className="text-sm text-gray-500">
        The review queue lands in the next milestone.
      </p>
    </main>
  );
}
