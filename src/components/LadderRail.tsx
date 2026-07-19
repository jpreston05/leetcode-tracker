import type { Checkpoint } from "@/lib/types";

type RailCheckpoint = Pick<Checkpoint, "sequence" | "is_catchup" | "status" | "due_date">;

// The signature motif: a question's 7-rung ladder as a segmented rail.
// Filled = done, breathing outline = due now, dated outline = scheduled,
// hollow = locked. Catch-ups don't get segments; they surface in the
// full ladder view.
export default function LadderRail({
  checkpoints,
  today,
  size = "sm",
}: {
  checkpoints: RailCheckpoint[];
  today: string;
  size?: "sm" | "lg";
}) {
  const rungs = checkpoints
    .filter((c) => !c.is_catchup)
    .sort((a, b) => a.sequence - b.sequence);

  const h = size === "lg" ? "h-2" : "h-1.5";
  const doneCount = rungs.filter((r) => r.status === "done").length;

  return (
    <div
      className={`flex items-center ${size === "lg" ? "gap-1.5" : "gap-1"}`}
      role="img"
      aria-label={`${doneCount} of ${rungs.length} reviews done`}
    >
      {rungs.map((r) => {
        const due = r.status !== "done" && r.due_date !== null && r.due_date <= today;
        const scheduled = r.status !== "done" && r.due_date !== null && !due;
        return (
          <span
            key={r.sequence}
            className={`${h} w-full flex-1 rounded-full transition-colors duration-200 ${
              r.status === "done"
                ? "bg-olive"
                : due
                  ? "rail-due bg-olive/25 ring-1 ring-olive ring-inset"
                  : scheduled
                    ? "bg-raised ring-1 ring-line-strong ring-inset"
                    : "bg-raised"
            }`}
          />
        );
      })}
    </div>
  );
}
