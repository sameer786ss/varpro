export const APP_ROLES = ["student", "teacher", "admin", "staff"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const COURSE_STATUSES = ["draft", "published", "archived"] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const ENROLLMENT_STATUSES = ["active", "completed", "dropped"] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface DashboardKpi {
  label: string;
  value: string;
  hint: string;
}

export interface MessageThreadPreview {
  id: string;
  courseTitle: string;
  senderName: string;
  body: string;
  sentAt: string;
}

export interface ProgressSnapshot {
  courseId: string;
  courseTitle: string;
  completionPercent: number;
  status: EnrollmentStatus;
}
