import { updateUserRoleAction } from "@/app/(platform)/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { getAdminUsers } from "@/lib/data/admin";

type AdminUsersPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  await requireRole(["admin"]);
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Admin: Users</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Manage account roles, governance, and user-level permissions.
        </p>
      </section>

      {params.error ? (
        <div className="rounded-xl border border-[rgba(179,38,30,0.4)] bg-[rgba(179,38,30,0.15)] px-3 py-2 text-sm text-[#ffb3ae]">
          {params.error}
        </div>
      ) : null}

      {params.success ? (
        <div className="rounded-xl border border-[rgba(37,160,79,0.4)] bg-[rgba(37,160,79,0.15)] px-3 py-2 text-sm text-[#9df0b9]">
          {params.success}
        </div>
      ) : null}

      <section className="space-y-3">
        {users.map((account) => (
          <Card key={account.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{account.full_name ?? "Unnamed user"}</CardTitle>
                <CardDescription className="mt-1">
                  {account.email ?? "No email"} • Current role: {account.role}
                </CardDescription>
              </div>

              <form action={updateUserRoleAction} className="flex items-center gap-2">
                <input type="hidden" name="user_id" value={account.id} />
                <select
                  name="role"
                  defaultValue={account.role}
                  className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none"
                >
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                </select>
                <Button type="submit" variant="secondary">
                  Update
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
