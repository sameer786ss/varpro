import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, MessageThreadPreview } from "@/lib/types/domain";

export interface MessageComposerOptions {
  users: {
    id: string;
    label: string;
  }[];
  courses: {
    id: string;
    title: string;
  }[];
}

function shortUserLabel(id: string) {
  return `User ${id.slice(0, 8)}`;
}

function profileDisplayLabel(profile: { id: string; full_name: string | null; email: string | null }) {
  return profile.full_name?.trim() || profile.email?.trim() || shortUserLabel(profile.id);
}

export async function getMessagesForRole(userId: string, role: AppRole) {
  const supabase = await createSupabaseServerClient();

  const [directMessagesResult, enrollmentsResult, teachingResult] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", userId),
    supabase.from("courses").select("id").eq("teacher_id", userId),
  ]);

  const directMessages = directMessagesResult.data ?? [];
  const enrolledCourseIds = (enrollmentsResult.data ?? []).map((row) => row.course_id);
  const teachingCourseIds = (teachingResult.data ?? []).map((row) => row.id);

  const courseIds =
    role === "admin" || role === "staff"
      ? []
      : [...new Set([...enrolledCourseIds, ...teachingCourseIds])];

  const { data: courseMessages } =
    role === "admin" || role === "staff"
      ? await supabase
          .from("messages")
          .select("*")
          .not("course_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(50)
      : courseIds.length
        ? await supabase
            .from("messages")
            .select("*")
            .in("course_id", courseIds)
            .order("created_at", { ascending: false })
            .limit(50)
        : { data: [] };

  const allMessages = [...directMessages, ...(courseMessages ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  if (allMessages.length === 0) {
    return [];
  }

  const senderIds = [...new Set(allMessages.map((message) => message.sender_id))];
  const courseIdList = [
    ...new Set(
      allMessages
        .map((message) => message.course_id)
        .filter((courseId): courseId is string => typeof courseId === "string"),
    ),
  ];

  const [{ data: profiles }, { data: courses }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", senderIds),
    courseIdList.length
      ? supabase.from("courses").select("id, title").in("id", courseIdList)
      : Promise.resolve({ data: [] }),
  ]);

  const senderById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const courseById = new Map((courses ?? []).map((course) => [course.id, course.title]));

  return allMessages.map((message) => {
    return {
      id: message.id,
      courseTitle: message.course_id ? courseById.get(message.course_id) ?? "Direct Message" : "Direct Message",
      senderName: senderById.get(message.sender_id) ?? shortUserLabel(message.sender_id),
      body: message.body,
      sentAt: message.created_at,
    } satisfies MessageThreadPreview;
  });
}

export async function getMessageComposerOptions(
  userId: string,
  role: AppRole,
): Promise<MessageComposerOptions> {
  const supabase = await createSupabaseServerClient();
  const userLabelById = new Map<string, string>();

  const setUserLabel = (id: string, label?: string | null) => {
    if (id === userId) {
      return;
    }

    if (!userLabelById.has(id)) {
      userLabelById.set(id, label?.trim() || shortUserLabel(id));
    }
  };

  if (role === "admin" || role === "staff") {
    const [{ data: profiles }, { data: courses }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("created_at", { ascending: false })
        .limit(250),
      supabase.from("courses").select("id, title").order("created_at", { ascending: false }).limit(200),
    ]);

    for (const profile of profiles ?? []) {
      setUserLabel(profile.id, profileDisplayLabel(profile));
    }

    return {
      users: Array.from(userLabelById.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      courses: (courses ?? []).map((course) => ({ id: course.id, title: course.title })),
    };
  }

  if (role === "teacher") {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .eq("teacher_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    const courseIds = (courses ?? []).map((course) => course.id);

    const { data: enrollments } = courseIds.length
      ? await supabase
          .from("course_enrollments")
          .select("student_id")
          .in("course_id", courseIds)
          .limit(400)
      : { data: [] };

    const studentIds = [...new Set((enrollments ?? []).map((entry) => entry.student_id))];

    for (const studentId of studentIds) {
      setUserLabel(studentId);
    }

    const { data: profiles } = studentIds.length
      ? await supabase.from("profiles").select("id, full_name, email").in("id", studentIds)
      : { data: [] };

    for (const profile of profiles ?? []) {
      setUserLabel(profile.id, profileDisplayLabel(profile));
    }

    return {
      users: Array.from(userLabelById.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      courses: (courses ?? []).map((course) => ({ id: course.id, title: course.title })),
    };
  }

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("course_id")
    .eq("student_id", userId);

  const courseIds = (enrollments ?? []).map((entry) => entry.course_id);
  const { data: courses } = courseIds.length
    ? await supabase
        .from("courses")
        .select("id, title, teacher_id")
        .in("id", courseIds)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  const teacherIds = [...new Set((courses ?? []).map((course) => course.teacher_id))];
  for (const teacherId of teacherIds) {
    setUserLabel(teacherId);
  }

  const { data: profiles } = teacherIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", teacherIds)
    : { data: [] };

  for (const profile of profiles ?? []) {
    setUserLabel(profile.id, profileDisplayLabel(profile));
  }

  return {
    users: Array.from(userLabelById.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    courses: (courses ?? []).map((course) => ({ id: course.id, title: course.title })),
  };
}

export async function postMessage(params: {
  senderId: string;
  receiverId?: string;
  courseId?: string;
  body: string;
}) {
  const supabase = await createSupabaseServerClient();

  return supabase.from("messages").insert({
    sender_id: params.senderId,
    receiver_id: params.receiverId ?? null,
    course_id: params.courseId ?? null,
    body: params.body,
  });
}
