import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const text = readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index <= 0) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^['\"]|['\"]$/g, "");
    env[key] = value;
  }

  return env;
}

function requireEnv(env, name) {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function daysFromNow(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function hoursFromNow(hours) {
  const date = new Date();
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return date.toISOString();
}

async function listAllUsers(supabase) {
  const users = [];
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    users.push(...(data?.users ?? []));

    if (!data?.users || data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureSeedUsers(supabase, users) {
  const existingUsers = await listAllUsers(supabase);
  const existingByEmail = new Map(
    existingUsers
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user]),
  );

  const created = [];
  const ensured = [];

  for (const account of users) {
    const existing = existingByEmail.get(account.email.toLowerCase());

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        user_metadata: {
          full_name: account.fullName,
          role: account.role,
        },
      });

      if (error) {
        throw new Error(`Failed to update auth user ${account.email}: ${error.message}`);
      }

      ensured.push({ ...account, id: existing.id });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.fullName,
        role: account.role,
      },
    });

    if (error || !data?.user) {
      throw new Error(`Failed to create auth user ${account.email}: ${error?.message ?? "Unknown error"}`);
    }

    created.push(account.email);
    ensured.push({ ...account, id: data.user.id });
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    ensured.map((account) => ({
      id: account.id,
      full_name: account.fullName,
      email: account.email,
      role: account.role,
      institution_name: "Vardhan Pro Academy",
    })),
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    throw new Error(`Failed to upsert profiles: ${profileError.message}`);
  }

  return {
    created,
    ensured,
    byKey: new Map(ensured.map((account) => [account.key, account])),
  };
}

async function seedCourses(supabase, courseBlueprints, userByKey) {
  const rows = courseBlueprints.map((course, index) => {
    const teacher = userByKey.get(course.teacherKey);
    if (!teacher) {
      throw new Error(`Missing teacher account for key: ${course.teacherKey}`);
    }

    return {
      title: course.title,
      code: course.code,
      description: course.description,
      teacher_id: teacher.id,
      status: course.status,
      schedule_text: course.scheduleText,
      price_cents: 0,
      currency: "usd",
      thumbnail_url: `https://picsum.photos/seed/${course.code.toLowerCase()}/1200/720`,
      updated_at: new Date(Date.now() - index * 60000).toISOString(),
    };
  });

  const { error } = await supabase.from("courses").upsert(rows, {
    onConflict: "code",
  });

  if (error) {
    throw new Error(`Failed to upsert courses: ${error.message}`);
  }

  const codes = courseBlueprints.map((course) => course.code);
  const { data: courses, error: fetchError } = await supabase
    .from("courses")
    .select("id, title, code, teacher_id")
    .in("code", codes);

  if (fetchError) {
    throw new Error(`Failed to fetch seeded courses: ${fetchError.message}`);
  }

  return courses ?? [];
}

async function cleanupSeededRows(supabase, courseIds, studentIds, staffIds) {
  const remove = async (query, label) => {
    const { error } = await query;
    if (error) {
      throw new Error(`Failed to cleanup ${label}: ${error.message}`);
    }
  };

  await remove(supabase.from("messages").delete().like("body", "[SEED]%"), "messages");
  await remove(
    supabase.from("notifications").delete().in("user_id", studentIds).like("title", "SEED | %"),
    "notifications",
  );
  await remove(
    supabase.from("staff_schedules").delete().in("staff_id", staffIds).like("title", "SEED | %"),
    "staff schedules",
  );
  await remove(
    supabase.from("ai_tutor_logs").delete().in("user_id", studentIds).like("prompt", "SEED | %"),
    "ai logs",
  );
  await remove(
    supabase.from("announcements").delete().like("title", "SEED | %"),
    "announcements",
  );
  await remove(
    supabase.from("announcements").delete().like("body", "[SEED]%"),
    "seed announcements by body",
  );

  if (courseIds.length === 0) {
    return;
  }

  await remove(
    supabase
      .from("learning_materials")
      .delete()
      .in("course_id", courseIds)
      .like("title", "SEED | %"),
    "learning materials",
  );
  await remove(
    supabase.from("assignments").delete().in("course_id", courseIds).like("title", "SEED | %"),
    "assignments",
  );
  await remove(
    supabase.from("quizzes").delete().in("course_id", courseIds).like("title", "SEED | %"),
    "quizzes",
  );
  await remove(
    supabase.from("course_enrollments").delete().in("course_id", courseIds).in("student_id", studentIds),
    "course enrollments",
  );
}

function buildEnrollmentRows(studentIds, courses) {
  const rows = [];

  for (let i = 0; i < studentIds.length; i += 1) {
    const studentId = studentIds[i];
    const slotA = courses[i % courses.length];
    const slotB = courses[(i + 2) % courses.length];
    const slotC = courses[(i + 4) % courses.length];

    const picked = [slotA, slotB, slotC];

    for (let j = 0; j < picked.length; j += 1) {
      const course = picked[j];
      const progress = (i * 17 + j * 23) % 101;

      rows.push({
        course_id: course.id,
        student_id: studentId,
        progress_percent: progress,
        status: progress > 90 ? "completed" : "active",
      });
    }
  }

  return rows;
}

async function insertRows(supabase, table, rows, options = undefined) {
  if (!rows.length) {
    return;
  }

  const query = options
    ? supabase.from(table).upsert(rows, options)
    : supabase.from(table).insert(rows);

  const { error } = await query;
  if (error) {
    throw new Error(`Failed to insert rows into ${table}: ${error.message}`);
  }
}

async function run() {
  const envPath = resolve(process.cwd(), ".env.local");
  const fileEnv = loadEnvFile(envPath);
  const mergedEnv = {
    ...fileEnv,
    ...process.env,
  };

  const supabaseUrl = requireEnv(mergedEnv, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv(mergedEnv, "SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const seedUsers = [
    {
      key: "admin",
      email: "seed.admin@vardhanpro.local",
      password: "SeedPass123",
      fullName: "Ariana Chief Admin",
      role: "admin",
    },
    {
      key: "staff_1",
      email: "seed.staff.ops@vardhanpro.local",
      password: "SeedPass123",
      fullName: "Noah Operations",
      role: "staff",
    },
    {
      key: "staff_2",
      email: "seed.staff.support@vardhanpro.local",
      password: "SeedPass123",
      fullName: "Maya Support",
      role: "staff",
    },
    {
      key: "teacher_1",
      email: "seed.teacher.cs@vardhanpro.local",
      password: "SeedPass123",
      fullName: "Dr. Ethan Clark",
      role: "teacher",
    },
    {
      key: "teacher_2",
      email: "seed.teacher.ai@vardhanpro.local",
      password: "SeedPass123",
      fullName: "Prof. Sofia Reed",
      role: "teacher",
    },
    {
      key: "teacher_3",
      email: "seed.teacher.design@vardhanpro.local",
      password: "SeedPass123",
      fullName: "Ivy Morgan",
      role: "teacher",
    },
    {
      key: "teacher_4",
      email: "seed.teacher.math@vardhanpro.local",
      password: "SeedPass123",
      fullName: "Liam Bennett",
      role: "teacher",
    },
    ...Array.from({ length: 20 }).map((_, index) => ({
      key: `student_${index + 1}`,
      email: `seed.student${String(index + 1).padStart(2, "0")}@vardhanpro.local`,
      password: "SeedPass123",
      fullName: `Student ${String(index + 1).padStart(2, "0")}`,
      role: "student",
    })),
  ];

  const courseBlueprints = [
    {
      code: "SEED-CS101",
      title: "Programming Fundamentals",
      teacherKey: "teacher_1",
      status: "published",
      scheduleText: "Mon/Wed 09:00-10:30",
      description: "Core programming concepts, control flow, and debugging fundamentals.",
    },
    {
      code: "SEED-DB201",
      title: "Databases and SQL",
      teacherKey: "teacher_1",
      status: "published",
      scheduleText: "Tue/Thu 11:00-12:30",
      description: "Relational modeling, SQL querying, and practical schema design.",
    },
    {
      code: "SEED-AI301",
      title: "Applied AI Systems",
      teacherKey: "teacher_2",
      status: "published",
      scheduleText: "Mon/Fri 14:00-15:30",
      description: "Prompt workflows, retrieval foundations, and evaluation of AI systems.",
    },
    {
      code: "SEED-ML240",
      title: "Machine Learning Studio",
      teacherKey: "teacher_2",
      status: "published",
      scheduleText: "Wed/Fri 10:00-11:30",
      description: "Supervised learning, model iteration, and experiment tracking.",
    },
    {
      code: "SEED-UX110",
      title: "UX Foundations",
      teacherKey: "teacher_3",
      status: "published",
      scheduleText: "Tue/Thu 09:00-10:30",
      description: "Research, prototyping, and usability testing for product teams.",
    },
    {
      code: "SEED-PRD210",
      title: "Product Strategy",
      teacherKey: "teacher_3",
      status: "published",
      scheduleText: "Tue 16:00-18:00",
      description: "Roadmapping, prioritization, stakeholder communication, and metrics.",
    },
    {
      code: "SEED-MTH120",
      title: "Discrete Mathematics",
      teacherKey: "teacher_4",
      status: "published",
      scheduleText: "Mon/Wed 12:30-14:00",
      description: "Logic, sets, proofs, counting principles, and graph theory basics.",
    },
    {
      code: "SEED-STA220",
      title: "Statistics for Analytics",
      teacherKey: "teacher_4",
      status: "published",
      scheduleText: "Thu 14:30-17:30",
      description: "Descriptive stats, hypothesis testing, and practical data interpretation.",
    },
  ];

  const seededUsers = await ensureSeedUsers(supabase, seedUsers);

  const courses = await seedCourses(supabase, courseBlueprints, seededUsers.byKey);
  const courseIds = courses.map((course) => course.id);

  const studentIds = seededUsers.ensured.filter((user) => user.role === "student").map((user) => user.id);
  const staffIds = seededUsers.ensured.filter((user) => user.role === "staff").map((user) => user.id);

  await cleanupSeededRows(supabase, courseIds, studentIds, staffIds);

  const enrollmentRows = buildEnrollmentRows(studentIds, courses);
  await insertRows(supabase, "course_enrollments", enrollmentRows, {
    onConflict: "course_id,student_id",
  });

  const enrollmentsByCourse = new Map();
  for (const enrollment of enrollmentRows) {
    const bucket = enrollmentsByCourse.get(enrollment.course_id) ?? [];
    bucket.push(enrollment.student_id);
    enrollmentsByCourse.set(enrollment.course_id, bucket);
  }

  const materialRows = [];
  for (const course of courses) {
    materialRows.push(
      {
        course_id: course.id,
        title: `SEED | ${course.code} Week 1 Notes`,
        content_type: "note",
        content_text:
          "Kickoff concepts, weekly expectations, and foundational definitions for this module.",
        content_url: null,
        sort_order: 1,
        published_at: daysFromNow(-7),
      },
      {
        course_id: course.id,
        title: `SEED | ${course.code} Reading Packet`,
        content_type: "link",
        content_url: "https://developer.mozilla.org/",
        content_text: "Supplementary reading and implementation references.",
        sort_order: 2,
        published_at: daysFromNow(-6),
      },
      {
        course_id: course.id,
        title: `SEED | ${course.code} Lecture Video`,
        content_type: "video",
        content_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        content_text: "Recorded walkthrough with examples and revision notes.",
        sort_order: 3,
        published_at: daysFromNow(-5),
      },
      {
        course_id: course.id,
        title: `SEED | ${course.code} Worksheet`,
        content_type: "file",
        content_url: "https://example.com/seed-worksheet.pdf",
        content_text: "Practice worksheet with guided tasks.",
        sort_order: 4,
        published_at: daysFromNow(-4),
      },
    );
  }
  await insertRows(supabase, "learning_materials", materialRows);

  const assignmentRows = [];
  for (const course of courses) {
    for (let week = 1; week <= 3; week += 1) {
      assignmentRows.push({
        course_id: course.id,
        title: `SEED | ${course.code} Assignment ${week}`,
        description:
          `Complete the practical task set for ${course.code} week ${week}. Include rationale, assumptions, and final result summary.`,
        due_at: daysFromNow(week * 7),
        max_score: 100,
        created_by: course.teacher_id,
      });
    }
  }
  await insertRows(supabase, "assignments", assignmentRows);

  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("id, course_id, title, max_score")
    .in("course_id", courseIds)
    .like("title", "SEED | %");

  if (assignmentsError) {
    throw new Error(`Failed to fetch seeded assignments: ${assignmentsError.message}`);
  }

  const submissionRows = [];
  for (const assignment of assignments ?? []) {
    const students = (enrollmentsByCourse.get(assignment.course_id) ?? []).slice(0, 8);

    students.forEach((studentId, index) => {
      const score = index % 4 === 0 ? null : 62 + ((index * 9) % 35);

      submissionRows.push({
        assignment_id: assignment.id,
        student_id: studentId,
        submission_text:
          `SEED submission for ${assignment.title}. Includes summary, implementation notes, and outcome checks by learner ${studentId.slice(
            0,
            8,
          )}.`,
        submission_url: "https://example.com/submission-link",
        submitted_at: daysFromNow(-(index + 1)),
        score,
        feedback:
          score === null
            ? null
            : "Solid structure. Next step: tighten edge-case handling and add one benchmark comparison.",
      });
    });
  }
  await insertRows(supabase, "assignment_submissions", submissionRows, {
    onConflict: "assignment_id,student_id",
  });

  const quizRows = [];
  for (const course of courses) {
    for (let unit = 1; unit <= 2; unit += 1) {
      quizRows.push({
        course_id: course.id,
        title: `SEED | ${course.code} Quiz ${unit}`,
        instructions:
          "Answer the conceptual prompts with concise reasoning and one practical example.",
        time_limit_minutes: 25,
        max_attempts: 2,
        created_by: course.teacher_id,
      });
    }
  }
  await insertRows(supabase, "quizzes", quizRows);

  const { data: quizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("id, course_id, title")
    .in("course_id", courseIds)
    .like("title", "SEED | %");

  if (quizzesError) {
    throw new Error(`Failed to fetch seeded quizzes: ${quizzesError.message}`);
  }

  const attemptRows = [];
  for (const quiz of quizzes ?? []) {
    const students = (enrollmentsByCourse.get(quiz.course_id) ?? []).slice(0, 7);

    students.forEach((studentId, index) => {
      const score = index % 3 === 0 ? null : 58 + ((index * 11) % 40);

      attemptRows.push({
        quiz_id: quiz.id,
        student_id: studentId,
        answers: {
          responseText: `SEED response for ${quiz.title}. Learner compared two approaches and justified the final selection with constraints.`,
        },
        score,
        started_at: daysFromNow(-(index + 2)),
        submitted_at: daysFromNow(-(index + 2)),
      });
    });
  }
  await insertRows(supabase, "quiz_attempts", attemptRows);

  const admin = seededUsers.byKey.get("admin");
  const announcementRows = [
    {
      course_id: null,
      author_id: admin.id,
      title: "SEED | Platform Kickoff Notice",
      body: "[SEED] Welcome to the seeded workspace. Review dashboard modules and run through role workflows.",
    },
  ];

  for (const course of courses) {
    announcementRows.push(
      {
        course_id: course.id,
        author_id: course.teacher_id,
        title: `SEED | ${course.code} Week Plan`,
        body: `[SEED] Weekly focus for ${course.code}: lecture, worksheet, quiz prep, and feedback cycle.`,
      },
      {
        course_id: course.id,
        author_id: course.teacher_id,
        title: `SEED | ${course.code} Assessment Reminder`,
        body: `[SEED] Assignment and quiz windows are active. Submit before the posted deadlines.`,
      },
    );
  }
  await insertRows(supabase, "announcements", announcementRows);

  const messageRows = [];
  for (const course of courses) {
    const students = (enrollmentsByCourse.get(course.id) ?? []).slice(0, 4);

    for (const studentId of students) {
      messageRows.push(
        {
          course_id: course.id,
          sender_id: course.teacher_id,
          receiver_id: studentId,
          body: `[SEED] Please review module notes and confirm your assignment plan for ${course.code}.`,
        },
        {
          course_id: course.id,
          sender_id: studentId,
          receiver_id: course.teacher_id,
          body: `[SEED] I reviewed the resources and will submit a draft before the deadline.`,
        },
      );
    }
  }
  await insertRows(supabase, "messages", messageRows);

  const notificationRows = [];
  for (let i = 0; i < studentIds.length; i += 1) {
    const studentId = studentIds[i];

    notificationRows.push(
      {
        user_id: studentId,
        title: "SEED | Assignment Queue Updated",
        body: "Two new assignments were published in your enrolled modules.",
        category: "assignment",
      },
      {
        user_id: studentId,
        title: "SEED | Quiz Reminder",
        body: "One quiz attempt is pending grading and one new quiz is now available.",
        category: "quiz",
      },
    );
  }
  await insertRows(supabase, "notifications", notificationRows);

  const staffScheduleRows = [];
  for (let i = 0; i < staffIds.length; i += 1) {
    const staffId = staffIds[i];

    for (let slot = 1; slot <= 3; slot += 1) {
      staffScheduleRows.push({
        staff_id: staffId,
        title: `SEED | Support Desk Block ${slot}`,
        notes: "Seeded operational window for escalation and onboarding support.",
        starts_at: hoursFromNow(slot * 24),
        ends_at: hoursFromNow(slot * 24 + 2),
      });
    }
  }
  await insertRows(supabase, "staff_schedules", staffScheduleRows);

  const aiLogRows = [];
  for (let i = 0; i < studentIds.slice(0, 12).length; i += 1) {
    const studentId = studentIds[i];
    const pickedCourse = courses[i % courses.length];

    aiLogRows.push({
      user_id: studentId,
      course_id: pickedCourse.id,
      prompt: `SEED | Explain the core concept and one common mistake in ${pickedCourse.code}.`,
      response:
        "### Core Idea\n\nThe concept is about structuring decisions clearly.\n\n### Common Mistake\n\nJumping to implementation before validating assumptions.",
    });
  }
  await insertRows(supabase, "ai_tutor_logs", aiLogRows);

  const sampleAccounts = seededUsers.ensured.map((user) => ({
    role: user.role,
    email: user.email,
    password: user.password,
  }));

  console.log("Seed complete.");
  console.log(
    JSON.stringify(
      {
        usersCreated: seededUsers.created.length,
        usersEnsured: seededUsers.ensured.length,
        courses: courses.length,
        enrollments: enrollmentRows.length,
        materials: materialRows.length,
        assignments: assignmentRows.length,
        submissions: submissionRows.length,
        quizzes: quizRows.length,
        quizAttempts: attemptRows.length,
        announcements: announcementRows.length,
        messages: messageRows.length,
        notifications: notificationRows.length,
        staffSchedules: staffScheduleRows.length,
        aiTutorLogs: aiLogRows.length,
      },
      null,
      2,
    ),
  );

  console.log("Sample login accounts:");
  for (const account of sampleAccounts.slice(0, 8)) {
    console.log(`- ${account.role} | ${account.email} | ${account.password}`);
  }
  console.log("(All seeded accounts use the same password: SeedPass123)");
}

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
