-- Core extension
create extension if not exists pgcrypto;

-- Enumerations
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'dropped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Utility trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Profile table sourced from auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role public.app_role not null default 'student',
  avatar_url text,
  institution_name text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Core academic domain tables
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  code text not null unique,
  description text,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  status public.course_status not null default 'draft',
  thumbnail_url text,
  schedule_text text,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  progress_percent integer not null default 0,
  status public.enrollment_status not null default 'active',
  enrolled_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(course_id, student_id)
);

create table if not exists public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content_type text not null check (content_type in ('link', 'file', 'note', 'video')),
  content_url text,
  content_text text,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  max_score integer not null default 100,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submission_text text,
  submission_url text,
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  score integer,
  feedback text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  unique(assignment_id, student_id)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  instructions text,
  time_limit_minutes integer,
  max_attempts integer not null default 1,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score integer,
  started_at timestamptz not null default timezone('utc'::text, now()),
  submitted_at timestamptz
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.staff_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.ai_tutor_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  prompt text not null,
  response text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Indexes
create index if not exists courses_teacher_idx on public.courses(teacher_id);
create index if not exists courses_status_idx on public.courses(status);
create index if not exists enrollments_student_idx on public.course_enrollments(student_id);
create index if not exists enrollments_course_idx on public.course_enrollments(course_id);
create index if not exists assignments_course_idx on public.assignments(course_id);
create index if not exists submissions_assignment_idx on public.assignment_submissions(assignment_id);
create index if not exists submissions_student_idx on public.assignment_submissions(student_id);
create index if not exists quizzes_course_idx on public.quizzes(course_id);
create index if not exists quiz_attempts_quiz_idx on public.quiz_attempts(quiz_id);
create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists messages_receiver_idx on public.messages(receiver_id);
create index if not exists messages_course_idx on public.messages(course_id);
create index if not exists schedules_staff_idx on public.staff_schedules(staff_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS courses_set_updated_at ON public.courses;
CREATE TRIGGER courses_set_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS enrollments_set_updated_at ON public.course_enrollments;
CREATE TRIGGER enrollments_set_updated_at
BEFORE UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Role helper functions
create or replace function public.current_role()
returns public.app_role
language sql
stable
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'student'::public.app_role
  );
$$;

create or replace function public.is_admin_or_staff(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'staff')
    )
    or auth.uid() = target_user_id
  );
$$;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin_or_staff(uuid) to authenticated;

-- Auto-create profile rows from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  incoming_role public.app_role;
begin
  incoming_role := case
    when (new.raw_user_meta_data ->> 'role') in ('student', 'teacher', 'admin', 'staff')
      then (new.raw_user_meta_data ->> 'role')::public.app_role
    else 'student'::public.app_role
  end;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    incoming_role
  )
  on conflict (id)
  do update set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Row level security
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.learning_materials enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.announcements enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.staff_schedules enable row level security;
alter table public.ai_tutor_logs enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "profiles_insert_self_or_service" on public.profiles;
create policy "profiles_insert_self_or_service"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id or auth.role() = 'service_role'
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- courses
drop policy if exists "courses_select_visible" on public.courses;
create policy "courses_select_visible"
on public.courses
for select
to authenticated
using (
  status = 'published'
  or teacher_id = auth.uid()
  or exists (
    select 1
    from public.course_enrollments ce
    where ce.course_id = id
      and ce.student_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "courses_insert_teacher_or_admin" on public.courses;
create policy "courses_insert_teacher_or_admin"
on public.courses
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "courses_update_teacher_or_admin" on public.courses;
create policy "courses_update_teacher_or_admin"
on public.courses
for update
to authenticated
using (
  teacher_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
)
with check (
  teacher_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

-- course_enrollments
drop policy if exists "enrollments_select_scoped" on public.course_enrollments;
create policy "enrollments_select_scoped"
on public.course_enrollments
for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1 from public.courses c
    where c.id = course_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "enrollments_insert_self_or_admin" on public.course_enrollments;
create policy "enrollments_insert_self_or_admin"
on public.course_enrollments
for insert
to authenticated
with check (
  student_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "enrollments_update_teacher_or_admin" on public.course_enrollments;
create policy "enrollments_update_teacher_or_admin"
on public.course_enrollments
for update
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

-- learning_materials
drop policy if exists "materials_select_visible" on public.learning_materials;
create policy "materials_select_visible"
on public.learning_materials
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.status = 'published'
        or c.teacher_id = auth.uid()
        or exists (
          select 1 from public.course_enrollments ce
          where ce.course_id = c.id
            and ce.student_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
);

drop policy if exists "materials_manage_teacher_or_admin" on public.learning_materials;
create policy "materials_manage_teacher_or_admin"
on public.learning_materials
for all
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.teacher_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.teacher_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
);

-- assignments
drop policy if exists "assignments_select_visible" on public.assignments;
create policy "assignments_select_visible"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.teacher_id = auth.uid()
        or c.status = 'published'
        or exists (
          select 1 from public.course_enrollments ce
          where ce.course_id = c.id
            and ce.student_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
);

drop policy if exists "assignments_manage_teacher_or_admin" on public.assignments;
create policy "assignments_manage_teacher_or_admin"
on public.assignments
for all
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.teacher_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.teacher_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
);

-- assignment_submissions
drop policy if exists "submissions_select_scoped" on public.assignment_submissions;
create policy "submissions_select_scoped"
on public.assignment_submissions
for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "submissions_insert_student" on public.assignment_submissions;
create policy "submissions_insert_student"
on public.assignment_submissions
for insert
to authenticated
with check (
  student_id = auth.uid()
);

drop policy if exists "submissions_update_student_teacher_admin" on public.assignment_submissions;
create policy "submissions_update_student_teacher_admin"
on public.assignment_submissions
for update
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
)
with check (
  student_id = auth.uid()
  or exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

-- quizzes
drop policy if exists "quizzes_select_visible" on public.quizzes;
create policy "quizzes_select_visible"
on public.quizzes
for select
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.teacher_id = auth.uid()
        or c.status = 'published'
        or exists (
          select 1 from public.course_enrollments ce
          where ce.course_id = c.id
            and ce.student_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
);

drop policy if exists "quizzes_manage_teacher_or_admin" on public.quizzes;
create policy "quizzes_manage_teacher_or_admin"
on public.quizzes
for all
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.teacher_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.teacher_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
);

-- quiz_attempts
drop policy if exists "quiz_attempts_select_scoped" on public.quiz_attempts;
create policy "quiz_attempts_select_scoped"
on public.quiz_attempts
for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.quizzes q
    join public.courses c on c.id = q.course_id
    where q.id = quiz_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "quiz_attempts_insert_student" on public.quiz_attempts;
create policy "quiz_attempts_insert_student"
on public.quiz_attempts
for insert
to authenticated
with check (
  student_id = auth.uid()
);

drop policy if exists "quiz_attempts_update_student_teacher_admin" on public.quiz_attempts;
create policy "quiz_attempts_update_student_teacher_admin"
on public.quiz_attempts
for update
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.quizzes q
    join public.courses c on c.id = q.course_id
    where q.id = quiz_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
)
with check (
  student_id = auth.uid()
  or exists (
    select 1
    from public.quizzes q
    join public.courses c on c.id = q.course_id
    where q.id = quiz_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

-- announcements
drop policy if exists "announcements_select_visible" on public.announcements;
create policy "announcements_select_visible"
on public.announcements
for select
to authenticated
using (
  course_id is null
  or exists (
    select 1 from public.courses c
    where c.id = course_id
      and (
        c.status = 'published'
        or c.teacher_id = auth.uid()
        or exists (
          select 1 from public.course_enrollments ce
          where ce.course_id = c.id
            and ce.student_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'staff')
        )
      )
  )
);

drop policy if exists "announcements_insert_teacher_admin" on public.announcements;
create policy "announcements_insert_teacher_admin"
on public.announcements
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('teacher', 'admin')
  )
);

drop policy if exists "announcements_update_author_admin" on public.announcements;
create policy "announcements_update_author_admin"
on public.announcements
for update
to authenticated
using (
  author_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  author_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- messages
drop policy if exists "messages_select_scoped" on public.messages;
create policy "messages_select_scoped"
on public.messages
for select
to authenticated
using (
  sender_id = auth.uid()
  or receiver_id = auth.uid()
  or exists (
    select 1 from public.courses c
    where c.id = course_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.course_enrollments ce
    where ce.course_id = course_id
      and ce.student_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
);

-- notifications
drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin"
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "notifications_insert_authenticated" on public.notifications;
create policy "notifications_insert_authenticated"
on public.notifications
for insert
to authenticated
with check (true);

drop policy if exists "notifications_update_own_or_admin" on public.notifications;
create policy "notifications_update_own_or_admin"
on public.notifications
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

-- staff_schedules
drop policy if exists "schedules_select_own_or_admin" on public.staff_schedules;
create policy "schedules_select_own_or_admin"
on public.staff_schedules
for select
to authenticated
using (
  staff_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "schedules_insert_own_or_admin" on public.staff_schedules;
create policy "schedules_insert_own_or_admin"
on public.staff_schedules
for insert
to authenticated
with check (
  staff_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "schedules_update_own_or_admin" on public.staff_schedules;
create policy "schedules_update_own_or_admin"
on public.staff_schedules
for update
to authenticated
using (
  staff_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
)
with check (
  staff_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

-- ai_tutor_logs
drop policy if exists "ai_logs_select_own_or_admin" on public.ai_tutor_logs;
create policy "ai_logs_select_own_or_admin"
on public.ai_tutor_logs
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  )
);

drop policy if exists "ai_logs_insert_own" on public.ai_tutor_logs;
create policy "ai_logs_insert_own"
on public.ai_tutor_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
);
