"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressPhoto } from "@/lib/images";

interface Props {
  questionId: string;
  hasPhoto: boolean;
}

// Select a photo -> compress client-side -> upload to the private
// note-photos bucket at {user_id}/{question_id}.jpg -> save the path.
export default function PhotoUpload({ questionId, hasPhoto }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const compressed = await compressPhoto(file);
      const path = `${user.id}/${questionId}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("note-photos")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("questions")
        .update({ photo_path: path })
        .eq("id", questionId);
      if (updateError) throw updateError;

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <label className={`btn-secondary cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
        <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1.75" y="3.75" width="12.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="8.5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 3.5 6.5 2h3l1 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        {busy ? "Uploading…" : hasPhoto ? "Replace photo" : "Attach photo"}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={busy}
          className="hidden"
        />
      </label>
      <p className="text-xs text-faint">Compressed on-device before upload.</p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
