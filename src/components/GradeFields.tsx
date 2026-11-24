"use client";

import { CLEAN_MAX_MINUTES } from "@/lib/schedule";
import { GRADES, type Grade } from "@/lib/types";

const gradeButton: Record<Grade, string> = {
  clean: "border-olive/50 text-olive hover:bg-olive/10 aria-pressed:bg-olive/15",
  shaky: "border-terra/50 text-terra hover:bg-terra/10 aria-pressed:bg-terra/15",
  failed: "border-danger/50 text-danger hover:bg-danger/10 aria-pressed:bg-danger/15",
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
      <label className="flex max-w-40 flex-col gap-1.5 text-sm text-muted">
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
        <legend className="mb-1.5 text-sm text-muted">Grade</legend>
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
                className={`btn border ${gradeButton[value]} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {grade === value ? "✓ " : ""}
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-faint">
          {tooSlow
            ? `Over ${CLEAN_MAX_MINUTES} min can't be Clean.`
            : GRADES.find((g) => g.value === grade)?.hint ?? "Pick how it went."}
        </p>
      </fieldset>
    </div>
  );
}
