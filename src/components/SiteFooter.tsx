import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { createClient } from "@/lib/supabase/server";

// Site-wide footer. Doubles as the ownership signal: this is Jeff's personal
// tracker, and the only door in is the owner sign-in — shown just to visitors
// who aren't already signed in.
export default async function SiteFooter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-faint sm:px-6">
        <span className="flex items-center gap-2">
          <BrandMark /> Personal tracker · J. Preston
        </span>
        {!user && (
          <Link
            href="/login"
            className="text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink"
          >
            Owner sign-in →
          </Link>
        )}
      </div>
    </footer>
  );
}
