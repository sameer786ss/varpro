import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import type { AppRole } from "@/lib/types/domain";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type EnrollmentRow = Database["public"]["Tables"]["course_enrollments"]["Row"];

export interface CourseListItem extends CourseRow {
  teacher_name: string | null;
  progress_percent: number;
  enrollment_status: Database["public"]["Enums"]["enrollment_status"] | null;
}

export interface CourseWorkspace {
  course: CourseRow;
  enrollment: EnrollmentRow | null;
  materials: Database["public"]["Tables"]["learning_materials"]["Row"][];
  assignments: Database["public"]["Tables"]["assignments"]["Row"][];
  quizzes: Database["public"]["Tables"]["quizzes"]["Row"][];
  announcements: Database["public"]["Tables"]["announcements"]["Row"][];
}

export async function getCoursesForRole(userId: string, role: AppRole) {
  const supabase = await createSupabaseServerClient();

  let courses: CourseRow[] = [];
  let enrollments: EnrollmentRow[] = [];

  if (role === "student") {
    const [{ data: enrollmentData }, { data: publishedCourses }] = await Promise.all([
      supabase
        .from("course_enrollments")
        .select("*")
        .eq("student_id", userId)
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]);

    enrollments = enrollmentData ?? [];
    const enrolledCourseIds = enrollments.map((row) => row.course_id);

    const { data: enrolledCourses } = enrolledCourseIds.length
      ? await supabase.from("courses").select("*").in("id", enrolledCourseIds)
      : { data: [] };

    const merged = new Map<string, CourseRow>();

    for (const course of publishedCourses ?? []) {
      merged.set(course.id, course);
    }

    for (const course of enrolledCourses ?? []) {
      merged.set(course.id, course);
    }

    courses = Array.from(merged.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else if (role === "teacher") {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("teacher_id", userId)
      .order("created_at", { ascending: false });

    courses = data ?? [];
  } else {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    courses = data ?? [];
  }

  if (courses.length === 0) {
    return [];
  }

  const enrollmentByCourse = new Map(
    enrollments.map((enrollment) => [enrollment.course_id, enrollment]),
  );

  const teacherIds = [...new Set(courses.map((course) => course.teacher_id))];
  const { data: teacherProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", teacherIds);

  const teacherNameById = new Map(
    (teacherProfiles ?? []).map((profile) => [profile.id, profile.full_name]),
  );

  return courses.map((course) => {
    const enrollment = enrollmentByCourse.get(course.id);

    return {
      ...course,
      teacher_name: teacherNameById.get(course.teacher_id) ?? null,
      progress_percent: enrollment?.progress_percent ?? 0,
      enrollment_status: enrollment?.status ?? null,
    } satisfies CourseListItem;
  });
}

export async function getCourseWorkspace(
  courseId: string,
  userId: string,
  role: AppRole,
): Promise<CourseWorkspace | null> {
  const supabase = await createSupabaseServerClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) {
    return null;
  }

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("course_id", courseId)
    .eq("student_id", userId)
    .maybeSingle();

  const canView =
    role === "admin" ||
    role === "staff" ||
    (role === "teacher" && course.teacher_id === userId) ||
    (role === "student" && (Boolean(enrollment) || course.status === "published"));

  if (!canView) {
    return null;
  }

  const [{ data: materials }, { data: assignments }, { data: quizzes }, { data: announcements }] =
    await Promise.all([
      supabase
        .from("learning_materials")
        .select("*")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("assignments")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false }),
      supabase
        .from("quizzes")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false }),
      supabase
        .from("announcements")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  return {
    course,
    enrollment: enrollment ?? null,
    materials: materials ?? [],
    assignments: assignments ?? [],
    quizzes: quizzes ?? [],
    announcements: announcements ?? [],
  };
}
