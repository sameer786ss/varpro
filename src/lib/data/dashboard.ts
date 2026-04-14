import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardKpi } from "@/lib/types/domain";
import type { AppRole } from "@/lib/types/domain";

export interface DashboardPayload {
  kpis: DashboardKpi[];
  upcomingAssignments: {
    id: string;
    title: string;
    courseId: string;
    dueAt: string | null;
  }[];
  recentAnnouncements: {
    id: string;
    title: string;
    body: string;
    createdAt: string;
  }[];
}

export async function getDashboardPayload(userId: string, role: AppRole): Promise<DashboardPayload> {
  const supabase = await createSupabaseServerClient();

  const [coursesResult, announcementsResult] = await Promise.all([
    role === "teacher"
      ? supabase.from("courses").select("id", { count: "exact", head: true }).eq("teacher_id", userId)
      : role === "student"
        ? supabase
            .from("course_enrollments")
            .select("id", { count: "exact", head: true })
            .eq("student_id", userId)
        : supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
  ]);

  let pendingAssignmentsCount = 0;
  let upcomingAssignments: DashboardPayload["upcomingAssignments"] = [];

  if (role === "student") {
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", userId);

    const courseIds = (enrollments ?? []).map((item) => item.course_id);

    if (courseIds.length) {
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, title, course_id, due_at")
        .in("course_id", courseIds)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(8);

      const assignmentIds = (assignments ?? []).map((entry) => entry.id);
      const { data: submissions } = assignmentIds.length
        ? await supabase
            .from("assignment_submissions")
            .select("assignment_id")
            .eq("student_id", userId)
            .in("assignment_id", assignmentIds)
        : { data: [] };

      const submitted = new Set((submissions ?? []).map((entry) => entry.assignment_id));
      upcomingAssignments = (assignments ?? [])
        .filter((item) => !submitted.has(item.id))
        .map((item) => ({
          id: item.id,
          title: item.title,
          courseId: item.course_id,
          dueAt: item.due_at,
        }));
      pendingAssignmentsCount = upcomingAssignments.length;
    }
  } else if (role === "teacher") {
    const { data: ownCourses } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", userId);

    const ownCourseIds = (ownCourses ?? []).map((item) => item.id);
    if (ownCourseIds.length) {
      const { data: assignmentRows } = await supabase
        .from("assignments")
        .select("id")
        .in("course_id", ownCourseIds);

      const assignmentIds = (assignmentRows ?? []).map((item) => item.id);

      if (assignmentIds.length) {
        const { count } = await supabase
          .from("assignment_submissions")
          .select("id", { count: "exact", head: true })
          .is("score", null)
          .in("assignment_id", assignmentIds);

        pendingAssignmentsCount = count ?? 0;
      }
    }
  }

  const [{ data: recentAnnouncements }, usersResult] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    role === "admin" || role === "staff"
      ? supabase.from("profiles").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
  ]);

  const kpis: DashboardKpi[] = [
    {
      label: role === "student" ? "Active Enrollments" : "Courses",
      value: String(coursesResult.count ?? 0),
      hint: "Across your workspace",
    },
    {
      label: role === "teacher" ? "Needs Grading" : "Pending Assignments",
      value: String(pendingAssignmentsCount),
      hint: "Requires attention",
    },
    {
      label: "Announcements",
      value: String(announcementsResult.count ?? 0),
      hint: "Latest institutional updates",
    },
  ];

  if (role === "admin" || role === "staff") {
    kpis.push({
      label: "Total Users",
      value: String(usersResult.count ?? 0),
      hint: "Provisioned accounts",
    });
  }

  return {
    kpis,
    upcomingAssignments,
    recentAnnouncements: (recentAnnouncements ?? []).map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      createdAt: announcement.created_at,
    })),
  };
}
