import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, MessageThreadPreview } from "@/lib/types/domain";

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
      senderName: senderById.get(message.sender_id) ?? "Unknown Sender",
      body: message.body,
      sentAt: message.created_at,
    } satisfies MessageThreadPreview;
  });
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
