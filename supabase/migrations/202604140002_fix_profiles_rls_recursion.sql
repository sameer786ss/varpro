-- Fix recursive RLS evaluation on public.profiles.
-- The previous policy referenced public.profiles in a subquery, which causes
-- "infinite recursion detected in policy for relation \"profiles\"".

-- Keep helper executable for authenticated users.
grant execute on function public.is_admin_or_staff(uuid) to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  public.is_admin_or_staff(id)
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  public.is_admin_or_staff(id)
)
with check (
  public.is_admin_or_staff(id)
);
