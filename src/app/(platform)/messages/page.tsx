import { formatDistanceToNow } from "date-fns";

import { sendMessageAction } from "@/app/(platform)/messages/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { requireSession } from "@/lib/auth/session";
import { getMessageComposerOptions, getMessagesForRole } from "@/lib/data/messages";

type MessagesPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  const { user, profile } = await requireSession();
  const [messages, composerOptions] = await Promise.all([
    getMessagesForRole(user.id, profile.role),
    getMessageComposerOptions(user.id, profile.role),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Messages</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Communicate with learners, instructors, and support staff through direct and course channels.
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

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription className="mt-1">Latest direct and course-linked threads.</CardDescription>

          <div className="mt-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No messages yet.</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                    <span>{message.courseTitle}</span>
                    <span>
                      {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {message.senderName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{message.body}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Send Message</CardTitle>
          <CardDescription className="mt-1">
            Choose a direct recipient and/or course channel context.
          </CardDescription>

          <form action={sendMessageAction} className="mt-4 space-y-3">
            <div>
              <label htmlFor="body" className="mb-1 block text-sm text-[var(--text-secondary)]">
                Message
              </label>
              <Textarea id="body" name="body" required placeholder="Write your message" />
            </div>

            <div>
              <label
                htmlFor="receiver_id"
                className="mb-1 block text-sm text-[var(--text-secondary)]"
              >
                Recipient (optional)
              </label>
              <select
                id="receiver_id"
                name="receiver_id"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none"
              >
                <option value="">No direct recipient</option>
                {composerOptions.users.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="course_id" className="mb-1 block text-sm text-[var(--text-secondary)]">
                Course Channel (optional)
              </label>
              <select
                id="course_id"
                name="course_id"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none"
              >
                <option value="">No course context</option>
                {composerOptions.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {composerOptions.users.length === 0 && composerOptions.courses.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                You currently have no scoped recipients or course channels available.
              </p>
            ) : null}

            <Button type="submit">Send</Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
