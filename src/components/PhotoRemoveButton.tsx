"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PhotoRemoveButton({ photoId, path }: { photoId: string; path: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const supabase = createClient();
    await supabase.storage.from("note-photos").remove([path]);
    await supabase.from("note_photos").delete().eq("id", photoId);
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
    </span>
  );
}
