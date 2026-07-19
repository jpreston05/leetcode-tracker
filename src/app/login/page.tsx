"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function signInWithGitHub() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">LeetCode Tracker</h1>
      <p className="text-sm text-gray-500">Private spaced-repetition review log</p>
      <button
        onClick={signInWithGitHub}
        className="rounded-lg bg-gray-900 px-6 py-3 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
      >
        Sign in with GitHub
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
