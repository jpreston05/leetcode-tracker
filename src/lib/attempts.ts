import type { SupabaseClient } from "@supabase/supabase-js";
import { buildHistory, computeSchedule, type Schedule } from "./schedule";
import type { Attempt, Grade, ScheduleEvent } from "./types";

// Data access for attempts + schedule events. Every write ends with
// recomputeQuestion, which replays the full history: the schedule columns on
// questions are a cache of computeSchedule and are never edited directly.

export interface AttemptValues {
  attempted_on: string;
  minutes: number | null;
  grade: Grade | null;
  solution_url: string | null;
  notes: string | null;
}

/** Replays a question's history, writes the derived schedule back, and returns it. */
export async function recomputeQuestion(supabase: SupabaseClient, questionId: string): Promise<Schedule | null> {
  const [questionRes, attemptsRes, eventsRes] = await Promise.all([
    supabase.from("questions").select("confidence").eq("id", questionId).single<{ confidence: number }>(),
    supabase
      .from("attempts")
      .select("attempted_on, grade, minutes, created_at")
      .eq("question_id", questionId)
      .overrideTypes<Pick<Attempt, "attempted_on" | "grade" | "minutes" | "created_at">[]>(),
    supabase
      .from("schedule_events")
      .select("kind, event_date, created_at")
      .eq("question_id", questionId)
      .overrideTypes<Pick<ScheduleEvent, "kind" | "event_date" | "created_at">[]>(),
  ]);
  const error = questionRes.error ?? attemptsRes.error ?? eventsRes.error;
  if (error) throw error;

  const history = buildHistory(attemptsRes.data ?? [], eventsRes.data ?? []);
  const schedule = computeSchedule(history, questionRes.data!.confidence);
  if (!schedule) return null; // no attempts: nothing to schedule

  const firstSolve = history.find((h) => h.type === "attempt")!.date;
  const { error: updateError } = await supabase
    .from("questions")
    .update({
      interval_days: schedule.intervalDays,
      next_due: schedule.nextDue,
      retired_on: schedule.retiredOn,
      date_solved: firstSolve, // keep in sync if the first attempt's date is edited
    })
    .eq("id", questionId);
  if (updateError) throw updateError;
  return schedule;
}

/** Logs an attempt; returns the new schedule (so the UI can celebrate a retirement). */
export async function logAttempt(supabase: SupabaseClient, questionId: string, values: AttemptValues) {
  const { error } = await supabase.from("attempts").insert({ question_id: questionId, ...values });
  if (error) throw error;
  return recomputeQuestion(supabase, questionId);
}

export async function updateAttempt(
  supabase: SupabaseClient,
  attempt: Pick<Attempt, "id" | "question_id">,
  values: AttemptValues
) {
  const { error } = await supabase.from("attempts").update(values).eq("id", attempt.id);
  if (error) throw error;
  await recomputeQuestion(supabase, attempt.question_id);
}

export async function deleteAttempt(supabase: SupabaseClient, attempt: Pick<Attempt, "id" | "question_id">) {
  const { error } = await supabase.from("attempts").delete().eq("id", attempt.id);
  if (error) throw error;
  await recomputeQuestion(supabase, attempt.question_id);
}

export async function addScheduleEvent(
  supabase: SupabaseClient,
  questionId: string,
  kind: ScheduleEvent["kind"],
  eventDate: string
) {
  const { error } = await supabase
    .from("schedule_events")
    .insert({ question_id: questionId, kind, event_date: eventDate });
  if (error) throw error;
  await recomputeQuestion(supabase, questionId);
}
