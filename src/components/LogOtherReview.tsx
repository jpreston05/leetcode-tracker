"use client";

import { useState } from "react";
import LogAttemptForm from "@/components/LogAttemptForm";
import type { Question } from "@/lib/types";
import { statusChip } from "@/lib/ui";

export type PickableProblem = Pick<Question, "id" | "leetcode_number" | "title" | "retired_on">;

const MAX_MATCHES = 6;

/**
 * Log a review of any problem, not just the ones the queue suggested:
 * search by number or title, pick one, and the usual attempt form opens.
 */
export default function LogOtherReview({ problems }: { problems: PickableProblem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<PickableProblem | null>(null);

  function close() {
    setOpen(false);
    setQuery("");
    setPicked(null);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost mt-2 -ml-1 text-brand-ink">
        + Log a different review
      </button>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = (
    q
      ? problems.filter((p) => String(p.leetcode_number).startsWith(q) || p.title.toLowerCase().includes(q))
      : problems
  ).slice(0, MAX_MATCHES);

  return (
    <div className="card mt-3 p-4 transition-[opacity,transform] duration-200 ease-strong starting:translate-y-1 starting:opacity-0">
      {picked ? (
        <>
          <p className="mb-4 font-bold">
            <span className="data mr-2 font-normal text-faint">{picked.leetcode_number}</span>
            {picked.title}
            {picked.retired_on && (
              <span className={`${statusChip.retired} ml-2 align-middle`}>retired · logging brings it back</span>
            )}
          </p>
          <LogAttemptForm questionId={picked.id} title={picked.title} onDone={close} />
        </>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
            Which problem did you review?
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Number or title…"
              className="field"
            />
          </label>
          {matches.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No problems match.</p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setPicked(p)}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-colors duration-150 hover:bg-raised"
                  >
                    <span className="data w-10 shrink-0 text-faint">{p.leetcode_number}</span>
                    <span className="truncate font-semibold">{p.title}</span>
                    {p.retired_on && <span className={`${statusChip.retired} ml-auto`}>retired</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={close} className="btn-ghost mt-2 -ml-1">
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
