export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Enums: {
      app_role: "student" | "teacher" | "admin" | "staff";
      course_status: "draft" | "published" | "archived";
      enrollment_status: "active" | "completed" | "dropped";
    };
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: Database["public"]["Enums"]["app_role"];
          avatar_url: string | null;
          institution_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          avatar_url?: string | null;
          institution_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          avatar_url?: string | null;
          institution_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          code: string;
          description: string | null;
          teacher_id: string;
          status: Database["public"]["Enums"]["course_status"];
          thumbnail_url: string | null;
          schedule_text: string | null;
          price_cents: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          code: string;
          description?: string | null;
          teacher_id: string;
          status?: Database["public"]["Enums"]["course_status"];
          thumbnail_url?: string | null;
          schedule_text?: string | null;
          price_cents?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          code?: string;
          description?: string | null;
          teacher_id?: string;
          status?: Database["public"]["Enums"]["course_status"];
          thumbnail_url?: string | null;
          schedule_text?: string | null;
          price_cents?: number;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_enrollments: {
        Row: {
          id: string;
          course_id: string;
          student_id: string;
          progress_percent: number;
          status: Database["public"]["Enums"]["enrollment_status"];
          enrolled_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          student_id: string;
          progress_percent?: number;
          status?: Database["public"]["Enums"]["enrollment_status"];
          enrolled_at?: string;
          updated_at?: string;
        };
        Update: {
          progress_percent?: number;
          status?: Database["public"]["Enums"]["enrollment_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_materials: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          content_type: "link" | "file" | "note" | "video";
          content_url: string | null;
          content_text: string | null;
          sort_order: number;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          content_type: "link" | "file" | "note" | "video";
          content_url?: string | null;
          content_text?: string | null;
          sort_order?: number;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          content_type?: "link" | "file" | "note" | "video";
          content_url?: string | null;
          content_text?: string | null;
          sort_order?: number;
          published_at?: string | null;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          due_at: string | null;
          max_score: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          due_at?: string | null;
          max_score?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          due_at?: string | null;
          max_score?: number;
        };
        Relationships: [];
      };
      assignment_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          submission_text: string | null;
          submission_url: string | null;
          submitted_at: string;
          score: number | null;
          feedback: string | null;
          graded_by: string | null;
          graded_at: string | null;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          submission_text?: string | null;
          submission_url?: string | null;
          submitted_at?: string;
          score?: number | null;
          feedback?: string | null;
          graded_by?: string | null;
          graded_at?: string | null;
        };
        Update: {
          submission_text?: string | null;
          submission_url?: string | null;
          score?: number | null;
          feedback?: string | null;
          graded_by?: string | null;
          graded_at?: string | null;
        };
        Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          instructions: string | null;
          time_limit_minutes: number | null;
          max_attempts: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          instructions?: string | null;
          time_limit_minutes?: number | null;
          max_attempts?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          instructions?: string | null;
          time_limit_minutes?: number | null;
          max_attempts?: number;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          student_id: string;
          answers: Json;
          score: number | null;
          started_at: string;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          student_id: string;
          answers?: Json;
          score?: number | null;
          started_at?: string;
          submitted_at?: string | null;
        };
        Update: {
          answers?: Json;
          score?: number | null;
          submitted_at?: string | null;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          course_id: string | null;
          author_id: string;
          title: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id?: string | null;
          author_id: string;
          title: string;
          body: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          course_id: string | null;
          sender_id: string;
          receiver_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id?: string | null;
          sender_id: string;
          receiver_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          category: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          category?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
          category?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      staff_schedules: {
        Row: {
          id: string;
          staff_id: string;
          title: string;
          notes: string | null;
          starts_at: string;
          ends_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          title: string;
          notes?: string | null;
          starts_at: string;
          ends_at: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          notes?: string | null;
          starts_at?: string;
          ends_at?: string;
        };
        Relationships: [];
      };
      ai_tutor_logs: {
        Row: {
          id: string;
          user_id: string;
          course_id: string | null;
          prompt: string;
          response: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          prompt: string;
          response: string;
          created_at?: string;
        };
        Update: {
          prompt?: string;
          response?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin_or_staff: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
    };
  };
}
