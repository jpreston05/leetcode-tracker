"use client";

import { CLEAN_MAX_MINUTES } from "@/lib/schedule";
import { GRADES, type Grade } from "@/lib/types";

// Unselected: soft tint + ink. Selected: the solid fill, dark text, and for
// Clean a little sparkle burst.
const gradeButton: Record<Grade, { idle: string; picked: string; emoji: string }> = {
  clean: { idle: "bg-mint-soft text-mint-ink hover:brightness-[0.97]", picked: "bg-mint text-on-fill animate-sparkle", emoji: "✨" },
  shaky: { idle: "bg-amber-soft text-amber-ink hover:brightness-[0.97]", picked: "bg-amber text-on-fill", emoji: "😅" },
  failed: { idle: "bg-coral-soft text-coral-ink hover:brightness-[0.97]", picked: "bg-coral text-on-fill", emoji: "🧩" },
};

/**
 * Minutes + grade, controlled by the parent. Enforces the one hard rule in
 * the UI: over 15 minutes can't be Clean (the scheduler downgrades it anyway).
 */
export default function GradeFields({
  minutes,
  grade,
  onMinutesChange,
  onGradeChange,
  minutesRequired = true,
}: {
  minutes: string;
  grade: Grade | null;
  onMinutesChange: (minutes: string) => void;
  onGradeChange: (grade: Grade) => void;
  minutesRequired?: boolean;
}) {
  const tooSlow = Number(minutes) > CLEAN_MAX_MINUTES;

  function changeMinutes(value: string) {
    onMinutesChange(value);
    if (grade === "clean" && Number(value) > CLEAN_MAX_MINUTES) onGradeChange("shaky");
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex max-w-40 flex-col gap-1.5 text-sm font-semibold text-muted">
        Time taken (min)
        <input
          name="minutes"
          type="number"
          min={1}
          required={minutesRequired}
          value={minutes}
          onChange={(e) => changeMinutes(e.target.value)}
          className="field data"
        />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-muted">How did it go?</legend>
        <div className="flex flex-wrap gap-2">
          {GRADES.map(({ value, label, hint }) => {
            const disabled = value === "clean" && tooSlow;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={grade === value}
                disabled={disabled}
                title={hint}
                onClick={() => onGradeChange(value)}
                className={`btn ${grade === value ? gradeButton[value].picked : gradeButton[value].idle} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <span aria-hidden>{grade === value ? "✓" : gradeButton[value].emoji}</span>
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">
          {tooSlow
            ? `Over ${CLEAN_MAX_MINUTES} min can't be Clean.`
            : GRADES.find((g) => g.value === grade)?.hint ?? "Pick how it went."}
        </p>
      </fieldset>
    </div>
  );
}
