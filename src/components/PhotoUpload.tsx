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
    <div className="flex flex-col gap-2">
      <label className="cursor-pointer text-sm underline">
        {busy ? "Uploading…" : hasPhoto ? "Replace notes photo" : "Attach notes photo"}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={busy}
          className="hidden"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
