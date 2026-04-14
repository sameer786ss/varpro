import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import type { AppRole } from "@/lib/types/domain";

export interface AssignmentInboxItem {
  assignment: Database["public"]["Tables"]["assignments"]["Row"];
  courseTitle: string;
  submitted: boolean;
  score: number | null;
  dueSoon: boolean;
}

export async function getAssignmentsForRole(userId: string, role: AppRole) {
  const supabase = await createSupabaseServerClient();

  if (role === "student") {
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", userId);

    const courseIds = (enrollments ?? []).map((entry) => entry.course_id);
    if (courseIds.length === 0) {
      return [];
    }

    const [{ data: assignments }, { data: courses }] = await Promise.all([
      supabase
        .from("assignments")
        .select("*")
        .in("course_id", courseIds)
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase.from("courses").select("id, title").in("id", courseIds),
    ]);

    const assignmentIds = (assignments ?? []).map((item) => item.id);

    const { data: submissions } = assignmentIds.length
      ? await supabase
          .from("assignment_submissions")
          .select("assignment_id, score")
          .eq("student_id", userId)
          .in("assignment_id", assignmentIds)
      : { data: [] };

    const courseTitleById = new Map((courses ?? []).map((course) => [course.id, course.title]));
    const submissionsByAssignment = new Map(
      (submissions ?? []).map((submission) => [submission.assignment_id, submission]),
    );

    const now = Date.now();

    return (assignments ?? []).map((assignment) => {
      const submission = submissionsByAssignment.get(assignment.id);
      const dueTime = assignment.due_at ? new Date(assignment.due_at).getTime() : null;
      const dueSoon = dueTime !== null && dueTime > now && dueTime - now < 1000 * 60 * 60 * 72;

      return {
        assignment,
        courseTitle: courseTitleById.get(assignment.course_id) ?? "Unknown Course",
        submitted: Boolean(submission),
        score: submission?.score ?? null,
        dueSoon,
      } satisfies AssignmentInboxItem;
    });
  }

  if (role === "teacher") {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .eq("teacher_id", userId);

    const courseIds = (courses ?? []).map((course) => course.id);
    if (courseIds.length === 0) {
      return [];
    }

    const { data: assignments } = await supabase
      .from("assignments")
      .select("*")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false });

    const assignmentIds = (assignments ?? []).map((assignment) => assignment.id);
    const { data: submissions } = assignmentIds.length
      ? await supabase
          .from("assignment_submissions")
          .select("assignment_id, score")
          .in("assignment_id", assignmentIds)
      : { data: [] };

    const submissionsByAssignment = new Map<string, { total: number; graded: number }>();

    for (const submission of submissions ?? []) {
      const current = submissionsByAssignment.get(submission.assignment_id) ?? {
        total: 0,
        graded: 0,
      };

      current.total += 1;
      if (submission.score !== null) {
        current.graded += 1;
      }

      submissionsByAssignment.set(submission.assignment_id, current);
    }

    const courseTitleById = new Map((courses ?? []).map((course) => [course.id, course.title]));

    return (assignments ?? []).map((assignment) => {
      const bucket = submissionsByAssignment.get(assignment.id);
      const gradedHint = bucket ? `${bucket.graded}/${bucket.total} graded` : "No submissions yet";

      return {
        assignment,
        courseTitle: courseTitleById.get(assignment.course_id) ?? "Unknown Course",
        submitted: false,
        score: null,
        dueSoon: false,
        gradedHint,
      };
    });
  }

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return assignments ?? [];
}

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  submissionText: string,
  submissionUrl?: string,
) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("assignment_submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: studentId,
      submission_text: submissionText,
      submission_url: submissionUrl ?? null,
      submitted_at: new Date().toISOString(),
    },
    {
      onConflict: "assignment_id,student_id",
    },
  );

  return { error };
}
