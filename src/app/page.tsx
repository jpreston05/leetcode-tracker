import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

// Landing page. Becomes the "due today" review list in M2 —
// for now it just proves auth works end to end.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Due today</h1>
        <SignOutButton />
      </header>
      <p className="text-sm text-gray-500">
        Signed in as {user?.email ?? user?.user_metadata?.user_name}. Nothing to
        review yet — problem tracking lands in the next milestone.
      </p>
    </main>
  );
}
