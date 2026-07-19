"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PhotoRemoveButton({ photoId, path }: { photoId: string; path: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: storageError } = await supabase.storage.from("note-photos").remove([path]);
    const { error: rowError } = storageError
      ? { error: null }
      : await supabase.from("note_photos").delete().eq("id", photoId);
    const failure = storageError ?? rowError;
    if (failure) {
      setError(failure.message);
      setBusy(false);
      return;
    }
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-faint underline-offset-2 hover:text-ink hover:underline"
      >
        Remove
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <button
        onClick={remove}
        disabled={busy}
        className="text-danger underline-offset-2 hover:underline disabled:opacity-50"
      >
        {busy ? "Removing…" : "Really remove"}
      </button>
      <button onClick={() => setConfirming(false)} disabled={busy} className="text-muted hover:text-ink">
        Cancel
      </button>
      {error && <span className="text-danger">{error}</span>}
    </span>
  );
}
