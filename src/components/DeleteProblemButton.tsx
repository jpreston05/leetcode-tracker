"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Two-step delete: removes storage photos first, then the question row
// (checkpoints + note_photos rows cascade in the database).
export default function DeleteProblemButton({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function destroy() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const { data: photos } = await supabase
      .from("note_photos")
      .select("path")
      .eq("question_id", questionId);
    if (photos?.length) {
      await supabase.storage.from("note-photos").remove(photos.map((p) => p.path));
    }

    const { error } = await supabase.from("questions").delete().eq("id", questionId);
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push("/problems");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="btn border border-danger/40 text-danger hover:bg-danger/10"
      >
        Delete problem
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted">Removes its ladder, history, and photos.</span>
      <button
        onClick={destroy}
        disabled={busy}
        className="btn bg-danger text-white hover:opacity-90"
      >
        {busy ? "Deleting…" : "Yes, delete"}
      </button>
      <button onClick={() => setConfirming(false)} disabled={busy} className="btn-ghost">
        Cancel
      </button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}
